import { HoldingEntry, ParsedStatement, AssetClass } from "./types";

// Known ticker -> asset class mappings
const ASSET_CLASS_MAP: Record<string, AssetClass> = {
  // Broad market ETFs
  VTI: "US Stocks", VTSAX: "US Stocks", SPY: "US Stocks", VOO: "US Stocks",
  QQQ: "US Stocks", IVV: "US Stocks", FXAIX: "US Stocks", FSKAX: "US Stocks",
  SCHB: "US Stocks", ITOT: "US Stocks", VUG: "US Stocks", VTV: "US Stocks",
  // International
  VXUS: "International Stocks", VTIAX: "International Stocks", EFA: "International Stocks",
  VEA: "International Stocks", VWO: "International Stocks", IXUS: "International Stocks",
  FSPSX: "International Stocks",
  // Bonds
  BND: "Bonds", VBTLX: "Bonds", AGG: "Bonds", TLT: "Bonds", SHY: "Bonds",
  VGIT: "Bonds", VCIT: "Bonds", BNDX: "Bonds", FBNDX: "Bonds",
  // REITs
  VNQ: "Real Estate", VGSLX: "Real Estate", SCHH: "Real Estate",
  // Crypto
  BTC: "Crypto", ETH: "Crypto", GBTC: "Crypto",
};

function classifyTicker(ticker: string, name: string): AssetClass {
  const t = ticker.toUpperCase();
  if (ASSET_CLASS_MAP[t]) return ASSET_CLASS_MAP[t];
  const n = name.toLowerCase();
  if (n.includes("bond") || n.includes("fixed income") || n.includes("treasury")) return "Bonds";
  if (n.includes("real estate") || n.includes("reit")) return "Real Estate";
  if (n.includes("international") || n.includes("emerging") || n.includes("foreign")) return "International Stocks";
  if (n.includes("crypto") || n.includes("bitcoin") || n.includes("ethereum")) return "Crypto";
  if (n.includes("money market") || n.includes("cash") || n.includes("settlement")) return "Cash";
  if (n.includes("stock") || n.includes("equity") || n.includes("fund")) return "US Stocks";
  return "Other";
}

function parseNumber(s: string): number {
  if (!s) return 0;
  return parseFloat(s.replace(/[$,%]/g, "").replace(/,/g, "").trim()) || 0;
}

// Detect institution from filename or content
function detectInstitution(filename: string, content: string): string {
  const lower = filename.toLowerCase() + " " + content.toLowerCase().substring(0, 500);
  if (lower.includes("fidelity")) return "Fidelity";
  if (lower.includes("vanguard")) return "Vanguard";
  if (lower.includes("schwab")) return "Schwab";
  if (lower.includes("merrill")) return "Merrill Lynch";
  if (lower.includes("td ameritrade") || lower.includes("tdameritrade")) return "TD Ameritrade";
  if (lower.includes("etrade") || lower.includes("e*trade")) return "E*Trade";
  if (lower.includes("robinhood")) return "Robinhood";
  if (lower.includes("betterment")) return "Betterment";
  if (lower.includes("wealthfront")) return "Wealthfront";
  if (lower.includes("tiaa")) return "TIAA";
  if (lower.includes("empower")) return "Empower";
  return "Unknown";
}

function detectAccountType(content: string, name: string): string {
  const lower = (content + " " + name).toLowerCase();
  if (lower.includes("roth ira") || lower.includes("roth")) return "Roth IRA";
  if (lower.includes("traditional ira") || lower.includes(" ira")) return "Traditional IRA";
  if (lower.includes("401k") || lower.includes("401(k)")) return "401(k)";
  if (lower.includes("403b") || lower.includes("403(b)")) return "403(b)";
  if (lower.includes("hsa")) return "HSA";
  if (lower.includes("529")) return "529";
  if (lower.includes("brokerage") || lower.includes("individual")) return "Brokerage";
  return "Investment";
}

// Parse Fidelity CSV format
function parseFidelityCSV(rows: string[][], filename: string): ParsedStatement | null {
  const institution = "Fidelity";
  const holdings: HoldingEntry[] = [];
  let accountName = "Fidelity Account";
  let totalValue = 0;
  const asOf = new Date().toLocaleDateString();

  // Fidelity exports have a header section then data rows
  // Try to find account name
  for (const row of rows.slice(0, 10)) {
    const line = row.join(",");
    if (line.includes("Account Name") && row[1]) accountName = row[1].trim();
    if (line.includes("Balance") && !line.includes("Beginning")) {
      const val = parseNumber(row[row.length - 1] || row[1] || "");
      if (val > 0) totalValue = val;
    }
  }

  // Find data header row
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i].map((c) => c.toLowerCase().trim());
    if (r.includes("symbol") || r.includes("ticker")) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return null;

  const headers = rows[headerIdx].map((h) => h.toLowerCase().trim());
  const symIdx = headers.indexOf("symbol");
  const descIdx = headers.indexOf("description");
  const sharesIdx = headers.findIndex((h) => h.includes("quantity") || h.includes("shares"));
  const priceIdx = headers.findIndex((h) => h.includes("last price") || h === "price");
  const valueIdx = headers.findIndex((h) => h.includes("current value") || h.includes("total value") || h === "value");
  const costIdx = headers.findIndex((h) => h.includes("cost basis total") || h.includes("cost basis"));
  const glIdx = headers.findIndex((h) => h.includes("gain/loss") || h.includes("total gain"));

  for (const row of rows.slice(headerIdx + 1)) {
    if (!row[symIdx] || row[symIdx].trim() === "" || row[symIdx].trim().startsWith("*")) continue;
    const ticker = row[symIdx]?.trim() || "";
    const name = descIdx >= 0 ? row[descIdx]?.trim() || ticker : ticker;
    const shares = parseNumber(row[sharesIdx] || "0");
    const price = parseNumber(row[priceIdx] || "0");
    const value = parseNumber(row[valueIdx] || "0") || shares * price;
    if (value === 0 && shares === 0) continue;

    const costBasis = costIdx >= 0 ? parseNumber(row[costIdx] || "0") : undefined;
    const gainLoss = glIdx >= 0 ? parseNumber(row[glIdx] || "0") : costBasis ? value - costBasis : undefined;
    const gainLossPct = costBasis && costBasis > 0 && gainLoss !== undefined ? (gainLoss / costBasis) * 100 : undefined;

    holdings.push({
      ticker,
      name,
      shares,
      price,
      value,
      costBasis,
      gainLoss,
      gainLossPct,
      assetClass: classifyTicker(ticker, name),
      account: accountName,
      institution,
    });
  }

  totalValue = totalValue || holdings.reduce((s, h) => s + h.value, 0);

  return { institution, accountName, accountType: detectAccountType(rows.flat().join(" "), accountName), asOf, holdings, totalValue };
}

// Generic CSV parser - tries to find columns intelligently
function parseGenericCSV(rows: string[][], filename: string, content: string): ParsedStatement | null {
  const institution = detectInstitution(filename, content);
  const holdings: HoldingEntry[] = [];
  let accountName = institution + " Account";

  // Find header row
  let headerIdx = -1;
  const keywordSets = [
    ["symbol", "ticker", "cusip"],
    ["description", "security", "name"],
    ["value", "market value", "amount"],
  ];

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const r = rows[i].map((c) => c.toLowerCase().trim());
    let matches = 0;
    for (const kws of keywordSets) {
      if (kws.some((kw) => r.some((cell) => cell.includes(kw)))) matches++;
    }
    if (matches >= 2) {
      headerIdx = i;
      break;
    }
  }

  // Try to find account name in preamble
  for (const row of rows.slice(0, Math.min(headerIdx, 15))) {
    const line = row.join(" ");
    if (/account\s*(name|number|type)?[:=\s]/i.test(line) && row.length >= 2) {
      const val = row.find((c, i) => i > 0 && c.trim() && !/account/i.test(c));
      if (val) accountName = val.trim();
    }
  }

  if (headerIdx === -1) {
    // Try treating first row as header
    headerIdx = 0;
  }

  const headers = rows[headerIdx].map((h) => h.toLowerCase().trim());

  const symIdx = headers.findIndex((h) => h === "symbol" || h === "ticker" || h === "cusip" || h === "security id");
  const descIdx = headers.findIndex((h) => h.includes("description") || h.includes("security name") || h === "name" || h === "security");
  const sharesIdx = headers.findIndex((h) => h.includes("quantity") || h.includes("shares") || h === "units");
  const priceIdx = headers.findIndex((h) => h.includes("price") && !h.includes("average") || h === "nav");
  const valueIdx = headers.findIndex((h) => h.includes("market value") || h.includes("current value") || h === "value" || h.includes("total value"));
  const costIdx = headers.findIndex((h) => h.includes("cost basis") || h.includes("average cost") || h.includes("cost per share"));
  const glIdx = headers.findIndex((h) => (h.includes("gain") || h.includes("loss")) && !h.includes("%"));
  const glPctIdx = headers.findIndex((h) => (h.includes("gain") || h.includes("loss")) && h.includes("%"));

  if (symIdx === -1 && descIdx === -1) return null;

  for (const row of rows.slice(headerIdx + 1)) {
    if (row.every((c) => !c.trim())) continue;
    const ticker = symIdx >= 0 ? row[symIdx]?.trim() || "" : "";
    const name = descIdx >= 0 ? row[descIdx]?.trim() || ticker : ticker;
    if (!ticker && !name) continue;
    if (ticker.startsWith("*") || name.toLowerCase().includes("total")) continue;

    const shares = sharesIdx >= 0 ? parseNumber(row[sharesIdx] || "0") : 0;
    const price = priceIdx >= 0 ? parseNumber(row[priceIdx] || "0") : 0;
    const value = valueIdx >= 0 ? parseNumber(row[valueIdx] || "0") : shares * price;
    if (value === 0 && shares === 0) continue;

    const costBasis = costIdx >= 0 ? parseNumber(row[costIdx] || "0") : undefined;
    const gainLoss = glIdx >= 0 ? parseNumber(row[glIdx] || "0") : costBasis ? value - costBasis : undefined;
    const gainLossPct = glPctIdx >= 0 ? parseNumber(row[glPctIdx] || "0") :
      costBasis && costBasis > 0 && gainLoss !== undefined ? (gainLoss / costBasis) * 100 : undefined;

    holdings.push({
      ticker: ticker || name.substring(0, 6).toUpperCase(),
      name: name || ticker,
      shares,
      price,
      value,
      costBasis,
      gainLoss,
      gainLossPct,
      assetClass: classifyTicker(ticker, name),
      account: accountName,
      institution,
    });
  }

  if (holdings.length === 0) return null;
  const totalValue = holdings.reduce((s, h) => s + h.value, 0);
  return {
    institution,
    accountName,
    accountType: detectAccountType(content, accountName),
    asOf: new Date().toLocaleDateString(),
    holdings,
    totalValue,
  };
}

export function parseCSV(csvText: string, filename: string): ParsedStatement | null {
  const lines = csvText.split(/\r?\n/);
  const rows: string[][] = lines.map((line) => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { result.push(cur); cur = ""; }
      else cur += ch;
    }
    result.push(cur);
    return result;
  });

  const institution = detectInstitution(filename, csvText);
  if (institution === "Fidelity") {
    const result = parseFidelityCSV(rows, filename);
    if (result) return result;
  }

  return parseGenericCSV(rows, filename, csvText);
}

export function parseJSON(jsonText: string, filename: string): ParsedStatement | null {
  try {
    const data = JSON.parse(jsonText);
    // Support our own export format
    if (data.holdings && Array.isArray(data.holdings)) {
      return {
        institution: data.institution || detectInstitution(filename, jsonText),
        accountName: data.accountName || data.account || "Imported Account",
        accountType: data.accountType || "Investment",
        asOf: data.asOf || new Date().toLocaleDateString(),
        holdings: data.holdings,
        totalValue: data.totalValue || data.holdings.reduce((s: number, h: any) => s + (h.value || 0), 0),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Manual entry helper — returns a template
export function createManualEntry(
  institution: string,
  accountName: string,
  accountType: string,
  entries: { ticker: string; name: string; shares: number; price: number; costBasis?: number }[]
): ParsedStatement {
  const holdings: HoldingEntry[] = entries.map((e) => {
    const value = e.shares * e.price;
    const gainLoss = e.costBasis !== undefined ? value - e.costBasis : undefined;
    const gainLossPct = e.costBasis && e.costBasis > 0 && gainLoss !== undefined ? (gainLoss / e.costBasis) * 100 : undefined;
    return {
      ...e,
      value,
      gainLoss,
      gainLossPct,
      assetClass: classifyTicker(e.ticker, e.name),
      account: accountName,
      institution,
    };
  });
  return {
    institution,
    accountName,
    accountType,
    asOf: new Date().toLocaleDateString(),
    holdings,
    totalValue: holdings.reduce((s, h) => s + h.value, 0),
  };
}
