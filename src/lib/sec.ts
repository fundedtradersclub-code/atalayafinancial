import "server-only";

// SEC EDGAR: free official filings and XBRL financials for US-listed companies.
// The SEC asks automated clients to identify themselves; set SEC_USER_AGENT
// in .env.local to "YourName your@email" if requests start returning 403.
const HEADERS = { "User-Agent": process.env.SEC_USER_AGENT || "AtalayaTerminal personal-research-app" };

async function j<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: HEADERS, next: { revalidate: 3600 } });
  if (!r.ok) throw new Error(`SEC ${r.status}`);
  return r.json() as Promise<T>;
}

async function cikFor(ticker: string): Promise<{ cik: string; name: string } | null> {
  const d = await j<{ hits: { hits: { _id: string; _source: { entity: string } }[] } }>(
    `https://efts.sec.gov/LATEST/search-index?keysTyped=${encodeURIComponent(ticker)}`,
  );
  const exact = d.hits.hits.find((h) => h._source.entity.toUpperCase().endsWith(`(${ticker.toUpperCase()})`));
  const hit = exact ?? null;
  return hit ? { cik: hit._id.padStart(10, "0"), name: hit._source.entity.replace(/\s*\([^)]*\)\s*$/, "") } : null;
}

type Fact = { end: string; val: number; frame?: string; form?: string };
type Facts = { facts: { "us-gaap"?: Record<string, { units: Record<string, Fact[]> }> } };

const LINES: { key: string; label: string; tags: string[]; instant?: boolean; unit?: string }[] = [
  { key: "rev", label: "Ingresos", tags: ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"] },
  { key: "op", label: "Utilidad operativa", tags: ["OperatingIncomeLoss"] },
  { key: "ni", label: "Utilidad neta", tags: ["NetIncomeLoss"] },
  { key: "eps", label: "UPA diluida", tags: ["EarningsPerShareDiluted"], unit: "USD/shares" },
  { key: "cash", label: "Caja y equivalentes", tags: ["CashAndCashEquivalentsAtCarryingValue"], instant: true },
  { key: "assets", label: "Activos totales", tags: ["Assets"], instant: true },
  { key: "liab", label: "Pasivos totales", tags: ["Liabilities"], instant: true },
  { key: "eq", label: "Patrimonio", tags: ["StockholdersEquity"], instant: true },
];

export type Fundamentals = {
  name: string;
  cik: string;
  years: number[];
  rows: { label: string; key: string; values: (number | null)[] }[];
  filings: { form: string; date: string; url: string; desc: string }[];
};

export async function getFundamentals(ticker: string): Promise<Fundamentals | null> {
  const id = await cikFor(ticker);
  if (!id) return null;
  const [facts, subs] = await Promise.all([
    j<Facts>(`https://data.sec.gov/api/xbrl/companyfacts/CIK${id.cik}.json`),
    j<{ filings: { recent: { form: string[]; filingDate: string[]; accessionNumber: string[]; primaryDocument: string[]; primaryDocDescription: string[] } } }>(
      `https://data.sec.gov/submissions/CIK${id.cik}.json`,
    ),
  ]);
  const gaap = facts.facts["us-gaap"] ?? {};
  // Calendar-year frames (CY2024 for flows, CY2024Q4I for balances) give one clean value per year.
  const byYear = LINES.map((line) => {
    // Companies switch XBRL tags over the years (e.g. Revenues → RevenueFromContract…),
    // so fill each year from the first tag that has it, in priority order.
    const map = new Map<number, number>();
    for (const tag of line.tags) {
      const arr = gaap[tag]?.units[line.unit ?? "USD"] ?? [];
      for (const f of arr) {
        const m = line.instant ? /^CY(\d{4})Q4I$/.exec(f.frame ?? "") : /^CY(\d{4})$/.exec(f.frame ?? "");
        if (m && !map.has(+m[1])) map.set(+m[1], f.val);
      }
    }
    return { line, map };
  });
  const allYears = [...new Set(byYear.flatMap((x) => [...x.map.keys()]))].sort((a, b) => b - a).slice(0, 4);
  const r = subs.filings.recent;
  const cikNum = String(Number(id.cik));
  const filings = r.form
    .map((form, i) => ({
      form,
      date: r.filingDate[i],
      desc: r.primaryDocDescription[i] || form,
      url: `https://www.sec.gov/Archives/edgar/data/${cikNum}/${r.accessionNumber[i].replace(/-/g, "")}/${r.primaryDocument[i]}`,
    }))
    .filter((f) => ["10-K", "10-Q", "8-K", "20-F", "6-K", "DEF 14A", "4"].includes(f.form))
    .slice(0, 14);
  return {
    name: id.name,
    cik: id.cik,
    years: allYears,
    rows: byYear.map(({ line, map }) => ({ label: line.label, key: line.key, values: allYears.map((y) => map.get(y) ?? null) })),
    filings,
  };
}
