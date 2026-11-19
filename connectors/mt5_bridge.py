"""
ATALAYA <- MetaTrader 5 bridge (personal use, read-only).

Reads prices and candles from the MetaTrader 5 terminal open on THIS computer, using
MetaQuotes' official Python package, and serves them only on http://127.0.0.1:8778.
It never sends orders, never reads balances or positions, and accepts no outside connections.

Run with INICIAR-METATRADER5.bat (installs the package the first time).
"""

import json
import threading
import re
import sys
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

try:
    import MetaTrader5 as mt5
except ImportError:
    print("Falta el paquete MetaTrader5. Ejecuta: python -m pip install MetaTrader5")
    sys.exit(1)

PORT = 8778

# ATALAYA symbol -> names brokers commonly use for it (first one found in Market Watch wins).
FX = ["EURUSD", "GBPUSD", "USDJPY", "USDMXN", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD", "USDBRL", "EURJPY", "GBPJPY"]
EXTRAS = [
    ("Oro", ["XAUUSD", "GOLD"]),
    ("Plata", ["XAGUSD", "SILVER"]),
    ("Petróleo WTI", ["USOIL", "XTIUSD", "WTIUSD", "CL-OIL", "CRUDE"], r"crude|wti oil|west texas"),
    ("Brent", ["UKOIL", "XBRUSD", "BRENT", "BRNUSD"], r"brent"),
    ("Nasdaq 100", ["US100", "USTEC", "NAS100", "NDX100", "US100Cash"]),
    ("S&P 500", ["US500", "SPX500", "US500Cash"]),
    ("Dow Jones", ["US30", "DJ30", "WS30", "US30Cash"]),
    ("DAX", ["GER40", "DE40", "GER30", "DAX40"]),
    ("Nikkei 225", ["JP225", "JPN225"]),
    ("Bitcoin (CFD)", ["BTCUSD"]),
]

TF = {
    "M1": mt5.TIMEFRAME_M1, "M5": mt5.TIMEFRAME_M5, "M15": mt5.TIMEFRAME_M15, "M30": mt5.TIMEFRAME_M30,
    "H1": mt5.TIMEFRAME_H1, "H4": mt5.TIMEFRAME_H4, "D1": mt5.TIMEFRAME_D1, "W1": mt5.TIMEFRAME_W1, "MN1": mt5.TIMEFRAME_MN1,
}

state = {"map": {}, "names": {}, "offset": 0, "account": ""}

# The MetaTrader5 package is not thread-safe: serve one MT5 call at a time.
MT5_LOCK = threading.Lock()


def resolve(candidates, describe=None):
    """First candidate (or a broker-suffixed variant like EURUSD.m) that exists; adds it to Market Watch.
    Stocks and ETFs are skipped so a ticker like "WTI" (a company) or OILK (a fund) is never shown as oil."""
    skip = ("stock", "share", "etf", "fund")
    every = [s for s in (mt5.symbols_get() or [])
             if not any(k in (s.path or "").lower() for k in skip) and not (s.path or "").lower().startswith(("nasdaq", "nyse"))]
    names = [s.name for s in every]
    for c in candidates:
        for n in names:
            if n == c or (n.startswith(c) and len(n) - len(c) <= 4 and not n[len(c)].isupper()):
                mt5.symbol_select(n, True)
                return n
    if describe:
        for s in every:
            if re.search(describe, f"{s.description} {s.path}", re.I):
                mt5.symbol_select(s.name, True)
                return s.name
    return None


def connect():
    if not mt5.initialize():
        print("No pude conectar con MetaTrader 5. ¿Está abierto y con sesión iniciada?", mt5.last_error())
        return False
    info = mt5.account_info()
    state["account"] = f"{info.server}" if info else ""
    mapping, names = {}, {}
    for pair in FX:
        real = resolve([pair])
        if real:
            mapping[f"{pair}=X"] = real
    for item in EXTRAS:
        label, cands = item[0], item[1]
        real = resolve(cands, item[2] if len(item) > 2 else None)
        if real:
            mapping[f"MT5:{real}"] = real
            names[f"MT5:{real}"] = label
    state["map"], state["names"] = mapping, names
    # MT5 candle times are broker-server time; measure the offset to UTC from a fresh tick.
    for real in mapping.values():
        tick = mt5.symbol_info_tick(real)
        if tick and tick.time:
            state["offset"] = round((tick.time - time.time()) / 3600) * 3600
            break
    print(f"MetaTrader 5 conectado ({state['account']}). Instrumentos: {len(mapping)}. Desfase horario del servidor: {state['offset'] // 3600:+d} h")
    return True


_daily = {}


def daily(real):
    """Yesterday + today D1 bars, cached for 10 s (keeps /quotes fast with many symbols)."""
    hit = _daily.get(real)
    if hit and time.time() - hit[0] < 10:
        return hit[1]
    rows = mt5.copy_rates_from_pos(real, mt5.TIMEFRAME_D1, 0, 2)
    _daily[real] = (time.time(), rows)
    return rows


def quote(atalaya_sym):
    real = state["map"].get(atalaya_sym)
    if not real:
        return None
    tick = mt5.symbol_info_tick(real)
    if not tick:
        return None
    price = tick.last if tick.last else (tick.bid + tick.ask) / 2 if tick.ask else tick.bid
    day = daily(real)
    prev = float(day[0]["close"]) if day is not None and len(day) == 2 else None
    today = day[-1] if day is not None and len(day) else None
    return {
        "name": state["names"].get(atalaya_sym, atalaya_sym.replace("=X", "")),
        "broker": real,
        "last": float(price), "bid": float(tick.bid), "ask": float(tick.ask),
        "high": float(today["high"]) if today is not None else None,
        "low": float(today["low"]) if today is not None else None,
        "prevClose": prev,
        "time": int((tick.time - state["offset"]) * 1000),
    }


def bars(atalaya_sym, tf, count):
    real = state["map"].get(atalaya_sym)
    if not real or tf not in TF:
        return None
    rates = mt5.copy_rates_from_pos(real, TF[tf], 0, max(10, min(count, 5000)))
    if rates is None:
        return None
    return [
        {"time": int(r["time"]) - state["offset"], "open": float(r["open"]), "high": float(r["high"]),
         "low": float(r["low"]), "close": float(r["close"]), "volume": float(r["tick_volume"])}
        for r in rates
    ]


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body):
        data = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        try:
            self.wfile.write(data)
        except (ConnectionAbortedError, BrokenPipeError, ConnectionResetError):
            pass  # the page gave up waiting; nothing to do

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.end_headers()

    def do_GET(self):
        with MT5_LOCK:
            self._get()

    def _get(self):
        url = urlparse(self.path)
        q = parse_qs(url.query)
        if not mt5.terminal_info() and not connect():
            return self._send(503, {"ok": False, "error": "MetaTrader 5 no está abierto"})
        if url.path == "/quotes":
            out = {s: quote(s) for s in state["map"]}
            return self._send(200, {"ok": True, "source": "MetaTrader 5", "server": state["account"],
                                    "quotes": {k: v for k, v in out.items() if v}})
        if url.path == "/bars":
            sym = (q.get("symbol") or [""])[0]
            rows = bars(sym, (q.get("tf") or ["D1"])[0], int((q.get("count") or ["500"])[0]))
            return self._send(200 if rows else 404, {"ok": bool(rows), "bars": rows or []})
        return self._send(404, {"ok": False})

    def log_message(self, *args):
        pass  # quiet console


if __name__ == "__main__":
    print("ATALAYA · puente MetaTrader 5 (solo lectura)")
    connect()
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Publicando en http://127.0.0.1:{PORT}/quotes  ·  deja esta ventana abierta  ·  Ctrl+C para cerrar")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        mt5.shutdown()
