#region Using declarations
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using NinjaTrader.Cbi;
using NinjaTrader.Data;
#endregion

// ATALAYA Bridge (AddOn): starts by itself when NinjaTrader opens, subscribes to the front-month
// contract of common futures and publishes their prices ONLY inside this PC
// (http://127.0.0.1:8777/quotes) so the ATALAYA terminal shows them live.
// Read-only: it never sends orders, never reads the account and does not use the ATI.
// No chart needed. Install once: Tools > Import > NinjaScript Add-On.
namespace NinjaTrader.NinjaScript.AddOns
{
	public class AtalayaBridgeAddOn : NinjaTrader.NinjaScript.AddOnBase
	{
		private const int Port = 8777;
		private static readonly string[] Roots = { "MNQ", "NQ", "MES", "ES", "MYM", "YM", "M2K", "RTY", "MGC", "GC", "MCL", "CL" };

		private class Quote
		{
			public string Name;
			public double Last, Bid, Ask, High, Low, PrevClose;
			public long Volume;
			public DateTime Time;
		}

		private static readonly ConcurrentDictionary<string, Quote> Quotes = new ConcurrentDictionary<string, Quote>();
		private static readonly object Gate = new object();
		private static TcpListener listener;
		private static bool running;

		private readonly Dictionary<string, MarketData> subs = new Dictionary<string, MarketData>();
		private Timer refresh;

		protected override void OnStateChange()
		{
			if (State == State.SetDefaults)
			{
				Name = "AtalayaBridgeAddOn";
				Description = "Publica precios en vivo de futuros para ATALAYA, solo dentro de esta PC. Solo lectura.";
			}
			else if (State == State.Active)
			{
				lock (Gate)
				{
					if (running) return; // one bridge per NinjaTrader
					running = true;
				}
				StartServer();
				// Subscribe now and re-check every minute (connection may come up later; contracts roll over).
				refresh = new Timer(_ => Subscribe(), null, 0, 60000);
			}
			else if (State == State.Terminated)
			{
				if (refresh != null) { refresh.Dispose(); refresh = null; }
				lock (subs)
				{
					foreach (var md in subs.Values)
						md.Update -= OnMarketData;
					subs.Clear();
				}
				StopServer();
				lock (Gate) { running = false; }
			}
		}

		/// <summary>Front-month contract: the most recent rollover that has already happened.</summary>
		private static Instrument FrontMonth(string root)
		{
			try
			{
				MasterInstrument mi = MasterInstrument.DbGet(root, InstrumentType.Future, false);
				if (mi == null || mi.RolloverCollection == null) return null;
				DateTime now = DateTime.Now;
				Rollover current = null;
				foreach (Rollover r in mi.RolloverCollection)
				{
					if (r.IsRiskManagementOnly || r.Date > now) continue;
					if (current == null || r.Date > current.Date) current = r;
				}
				if (current == null) return null;
				string name = root + " " + current.ContractMonth.ToString("MM-yy", CultureInfo.InvariantCulture);
				return Instrument.GetInstrument(name, true);
			}
			catch
			{
				return null;
			}
		}

		private void Subscribe()
		{
			foreach (string root in Roots)
			{
				Instrument ins = FrontMonth(root);
				if (ins == null) continue;
				lock (subs)
				{
					MarketData existing;
					if (subs.TryGetValue(root, out existing))
					{
						if (existing.Instrument == ins) continue; // already on the current contract
						existing.Update -= OnMarketData;      // contract rolled over
						subs.Remove(root);
					}
					try
					{
						MarketData md = new MarketData(ins);
						md.Update += OnMarketData;
						subs[root] = md;
						Quotes.GetOrAdd(root, k => new Quote()).Name = ins.FullName;
					}
					catch { }
				}
			}
		}

		private void OnMarketData(object sender, MarketDataEventArgs e)
		{
			if (e.Instrument == null || e.Instrument.MasterInstrument == null) return;
			Quote q = Quotes.GetOrAdd(e.Instrument.MasterInstrument.Name, k => new Quote());
			q.Name = e.Instrument.FullName;
			switch (e.MarketDataType)
			{
				case MarketDataType.Last: q.Last = e.Price; q.Time = e.Time; break;
				case MarketDataType.Bid: q.Bid = e.Price; break;
				case MarketDataType.Ask: q.Ask = e.Price; break;
				case MarketDataType.DailyHigh: q.High = e.Price; break;
				case MarketDataType.DailyLow: q.Low = e.Price; break;
				case MarketDataType.DailyVolume: q.Volume = e.Volume; break;
				case MarketDataType.LastClose: q.PrevClose = e.Price; break;
			}
		}

		// ---------- tiny loopback-only HTTP server (no admin rights needed) ----------

		private void StartServer()
		{
			try
			{
				listener = new TcpListener(IPAddress.Loopback, Port);
				listener.Start();
				Thread t = new Thread(AcceptLoop);
				t.IsBackground = true;
				t.Name = "AtalayaBridgeAddOn";
				t.Start(listener);
				Print("AtalayaBridgeAddOn: publicando precios en http://127.0.0.1:" + Port + "/quotes");
			}
			catch (Exception ex)
			{
				listener = null;
				Print("AtalayaBridgeAddOn: no pude abrir el puerto " + Port + " (" + ex.Message + "). ¿Hay otro puente abierto?");
			}
		}

		private static void StopServer()
		{
			try { if (listener != null) listener.Stop(); } catch { }
			listener = null;
		}

		private static void AcceptLoop(object state)
		{
			TcpListener l = (TcpListener)state;
			while (true)
			{
				TcpClient c;
				try { c = l.AcceptTcpClient(); }
				catch { return; }
				ThreadPool.QueueUserWorkItem(Handle, c);
			}
		}

		private static void Handle(object state)
		{
			TcpClient c = (TcpClient)state;
			try
			{
				using (c)
				using (NetworkStream s = c.GetStream())
				{
					s.ReadTimeout = 2000;
					byte[] buf = new byte[4096];
					int n = s.Read(buf, 0, buf.Length);
					string req = Encoding.ASCII.GetString(buf, 0, Math.Max(0, n));
					bool preflight = req.StartsWith("OPTIONS", StringComparison.Ordinal);
					string body = preflight ? "" : BuildJson();
					string head = (preflight ? "HTTP/1.1 204 No Content\r\n" : "HTTP/1.1 200 OK\r\nContent-Type: application/json; charset=utf-8\r\n")
						+ "Access-Control-Allow-Origin: *\r\n"
						+ "Access-Control-Allow-Methods: GET, OPTIONS\r\n"
						+ "Access-Control-Allow-Headers: *\r\n"
						+ "Access-Control-Allow-Private-Network: true\r\n"
						+ "Cache-Control: no-store\r\n"
						+ "Connection: close\r\n"
						+ "Content-Length: " + Encoding.UTF8.GetByteCount(body) + "\r\n\r\n";
					byte[] hb = Encoding.ASCII.GetBytes(head);
					s.Write(hb, 0, hb.Length);
					byte[] bb = Encoding.UTF8.GetBytes(body);
					s.Write(bb, 0, bb.Length);
				}
			}
			catch { }
		}

		private static string Num(double v)
		{
			return double.IsNaN(v) || double.IsInfinity(v) ? "null" : v.ToString("R", CultureInfo.InvariantCulture);
		}

		private static string BuildJson()
		{
			StringBuilder sb = new StringBuilder();
			sb.Append("{\"ok\":true,\"source\":\"NinjaTrader\",\"quotes\":{");
			bool first = true;
			foreach (var kv in Quotes.OrderBy(k => Array.IndexOf(Roots, k.Key)))
			{
				Quote x = kv.Value;
				if (x.Last <= 0) continue;
				long ms = x.Time == DateTime.MinValue ? 0 : new DateTimeOffset(DateTime.SpecifyKind(x.Time, DateTimeKind.Local)).ToUnixTimeMilliseconds();
				if (!first) sb.Append(',');
				first = false;
				sb.Append('"').Append(kv.Key.Replace("\"", "")).Append("\":{")
					.Append("\"name\":\"").Append((x.Name ?? kv.Key).Replace("\"", "")).Append("\",")
					.Append("\"last\":").Append(Num(x.Last)).Append(',')
					.Append("\"bid\":").Append(Num(x.Bid)).Append(',')
					.Append("\"ask\":").Append(Num(x.Ask)).Append(',')
					.Append("\"high\":").Append(Num(x.High)).Append(',')
					.Append("\"low\":").Append(Num(x.Low)).Append(',')
					.Append("\"prevClose\":").Append(Num(x.PrevClose)).Append(',')
					.Append("\"volume\":").Append(x.Volume.ToString(CultureInfo.InvariantCulture)).Append(',')
					.Append("\"time\":").Append(ms.ToString(CultureInfo.InvariantCulture))
					.Append('}');
			}
			sb.Append("}}");
			return sb.ToString();
		}
	}
}
