#region Using declarations
using System;
using System.Collections.Concurrent;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using NinjaTrader.Cbi;
using NinjaTrader.Data;
using NinjaTrader.NinjaScript;
#endregion

// ATALAYA Bridge: publica los precios de NinjaTrader SOLO dentro de esta PC
// (http://127.0.0.1:8777/quotes) para que la terminal ATALAYA los muestre en vivo.
// Solo lectura: no envía órdenes, no lee la cuenta, no acepta conexiones de otras computadoras.
// Uso: agrégalo a un gráfico (o a una columna del Market Analyzer) de cada instrumento: MNQ, NQ, ES...
namespace NinjaTrader.NinjaScript.Indicators
{
	public class AtalayaBridge : Indicator
	{
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
		private static int users;

		private Quote q;
		private bool registered;

		protected override void OnStateChange()
		{
			if (State == State.SetDefaults)
			{
				Name = "AtalayaBridge";
				Description = "Envía los precios en vivo a la terminal ATALAYA, solo dentro de esta PC. Solo lectura.";
				Calculate = Calculate.OnEachTick;
				IsOverlay = true;
				DisplayInDataBox = false;
				PaintPriceMarkers = false;
				IsSuspendedWhileInactive = false;
				Port = 8777;
			}
			else if (State == State.DataLoaded)
			{
				string key = Instrument.MasterInstrument.Name;
				q = Quotes.GetOrAdd(key, k => new Quote());
				q.Name = Instrument.FullName;
			}
			else if (State == State.Realtime)
			{
				lock (Gate)
				{
					users++;
					registered = true;
					if (listener == null)
						StartServer(Port);
				}
			}
			else if (State == State.Terminated)
			{
				if (!registered)
					return;
				lock (Gate)
				{
					registered = false;
					users--;
					if (users <= 0)
					{
						users = 0;
						StopServer();
					}
				}
			}
		}

		protected override void OnBarUpdate()
		{
			// Prices come from OnMarketData; nothing to plot.
		}

		protected override void OnMarketData(MarketDataEventArgs e)
		{
			if (q == null)
				return;
			switch (e.MarketDataType)
			{
				case MarketDataType.Last:
					q.Last = e.Price;
					q.Time = e.Time;
					break;
				case MarketDataType.Bid:
					q.Bid = e.Price;
					break;
				case MarketDataType.Ask:
					q.Ask = e.Price;
					break;
				case MarketDataType.DailyHigh:
					q.High = e.Price;
					break;
				case MarketDataType.DailyLow:
					q.Low = e.Price;
					break;
				case MarketDataType.DailyVolume:
					q.Volume = e.Volume;
					break;
				case MarketDataType.LastClose:
					q.PrevClose = e.Price;
					break;
			}
		}

		// ---------- tiny loopback-only HTTP server (no admin rights needed) ----------

		private void StartServer(int port)
		{
			try
			{
				listener = new TcpListener(IPAddress.Loopback, port);
				listener.Start();
				Thread t = new Thread(AcceptLoop);
				t.IsBackground = true;
				t.Name = "AtalayaBridge";
				t.Start(listener);
				Print(string.Format("AtalayaBridge: publicando precios en http://127.0.0.1:{0}/quotes", port));
			}
			catch (Exception ex)
			{
				listener = null;
				Print("AtalayaBridge: no pude abrir el puerto " + port + " (" + ex.Message + "). ¿Hay otra copia corriendo?");
			}
		}

		private static void StopServer()
		{
			try
			{
				if (listener != null)
					listener.Stop();
			}
			catch { }
			listener = null;
		}

		private static void AcceptLoop(object state)
		{
			TcpListener l = (TcpListener)state;
			while (true)
			{
				TcpClient c;
				try { c = l.AcceptTcpClient(); }
				catch { return; } // listener stopped
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
			foreach (var kv in Quotes)
			{
				Quote x = kv.Value;
				if (x.Last <= 0)
					continue;
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

		#region Properties
		[NinjaScriptProperty]
		[Range(1024, 65535)]
		[Display(Name = "Puerto", Description = "Puerto local donde ATALAYA lee los precios (por defecto 8777)", Order = 1, GroupName = "Parámetros")]
		public int Port { get; set; }
		#endregion
	}
}

#region NinjaScript generated code. Neither change nor remove.

namespace NinjaTrader.NinjaScript.Indicators
{
	public partial class Indicator : NinjaTrader.Gui.NinjaScript.IndicatorRenderBase
	{
		private AtalayaBridge[] cacheAtalayaBridge;
		public AtalayaBridge AtalayaBridge(int port)
		{
			return AtalayaBridge(Input, port);
		}

		public AtalayaBridge AtalayaBridge(ISeries<double> input, int port)
		{
			if (cacheAtalayaBridge != null)
				for (int idx = 0; idx < cacheAtalayaBridge.Length; idx++)
					if (cacheAtalayaBridge[idx] != null && cacheAtalayaBridge[idx].Port == port && cacheAtalayaBridge[idx].EqualsInput(input))
						return cacheAtalayaBridge[idx];
			return CacheIndicator<AtalayaBridge>(new AtalayaBridge(){ Port = port }, input, ref cacheAtalayaBridge);
		}
	}
}

namespace NinjaTrader.NinjaScript.MarketAnalyzerColumns
{
	public partial class MarketAnalyzerColumn : MarketAnalyzerColumnBase
	{
		public Indicators.AtalayaBridge AtalayaBridge(int port)
		{
			return indicator.AtalayaBridge(Input, port);
		}

		public Indicators.AtalayaBridge AtalayaBridge(ISeries<double> input , int port)
		{
			return indicator.AtalayaBridge(input, port);
		}
	}
}

namespace NinjaTrader.NinjaScript.Strategies
{
	public partial class Strategy : NinjaTrader.Gui.NinjaScript.StrategyRenderBase
	{
		public Indicators.AtalayaBridge AtalayaBridge(int port)
		{
			return indicator.AtalayaBridge(Input, port);
		}

		public Indicators.AtalayaBridge AtalayaBridge(ISeries<double> input , int port)
		{
			return indicator.AtalayaBridge(input, port);
		}
	}
}

#endregion
