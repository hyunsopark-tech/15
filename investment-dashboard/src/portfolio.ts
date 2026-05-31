import { HoldingEntry, AccountSummary, PortfolioSnapshot, AssetClass, ParsedStatement } from "./types";

export function buildSnapshot(statements: ParsedStatement[]): PortfolioSnapshot {
  const accountMap = new Map<string, AccountSummary>();

  for (const stmt of statements) {
    const key = `${stmt.institution}::${stmt.accountName}`;
    if (!accountMap.has(key)) {
      accountMap.set(key, {
        institution: stmt.institution,
        accountName: stmt.accountName,
        accountType: stmt.accountType,
        totalValue: 0,
        holdings: [],
      });
    }
    const acct = accountMap.get(key)!;
    acct.holdings.push(...stmt.holdings);
    acct.totalValue = acct.holdings.reduce((s, h) => s + h.value, 0);
  }

  const accounts = Array.from(accountMap.values());
  const allHoldings = accounts.flatMap((a) => a.holdings);
  const totalValue = accounts.reduce((s, a) => s + a.totalValue, 0);
  const totalCostBasis = allHoldings.reduce((s, h) => s + (h.costBasis ?? h.value), 0);
  const totalGainLoss = totalValue - totalCostBasis;
  const totalGainLossPct = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  const assetAllocation: Record<AssetClass, number> = {
    "US Stocks": 0,
    "International Stocks": 0,
    Bonds: 0,
    "Real Estate": 0,
    Cash: 0,
    Crypto: 0,
    Other: 0,
  };

  for (const h of allHoldings) {
    assetAllocation[h.assetClass] = (assetAllocation[h.assetClass] || 0) + h.value;
  }

  const asOf = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return { asOf, totalValue, totalCostBasis, totalGainLoss, totalGainLossPct, accounts, allHoldings, assetAllocation };
}

export function groupByTicker(holdings: HoldingEntry[]): HoldingEntry[] {
  const map = new Map<string, HoldingEntry>();
  for (const h of holdings) {
    if (map.has(h.ticker)) {
      const existing = map.get(h.ticker)!;
      existing.shares += h.shares;
      existing.value += h.value;
      if (existing.costBasis !== undefined && h.costBasis !== undefined) {
        existing.costBasis += h.costBasis;
      }
      if (existing.gainLoss !== undefined && h.gainLoss !== undefined) {
        existing.gainLoss += h.gainLoss;
      }
    } else {
      map.set(h.ticker, { ...h });
    }
  }
  // Recompute pcts
  for (const h of Array.from(map.values())) {
    if (h.costBasis && h.costBasis > 0 && h.gainLoss !== undefined) {
      h.gainLossPct = (h.gainLoss / h.costBasis) * 100;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}
