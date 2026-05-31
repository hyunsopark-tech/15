export interface HoldingEntry {
  ticker: string;
  name: string;
  shares: number;
  price: number;
  value: number;
  costBasis?: number;
  gainLoss?: number;
  gainLossPct?: number;
  assetClass: AssetClass;
  account: string;
  institution: string;
}

export type AssetClass =
  | "US Stocks"
  | "International Stocks"
  | "Bonds"
  | "Real Estate"
  | "Cash"
  | "Crypto"
  | "Other";

export interface AccountSummary {
  institution: string;
  accountName: string;
  accountType: string;
  totalValue: number;
  holdings: HoldingEntry[];
}

export interface PortfolioSnapshot {
  asOf: string;
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPct: number;
  accounts: AccountSummary[];
  allHoldings: HoldingEntry[];
  assetAllocation: Record<AssetClass, number>;
}

export interface ParsedStatement {
  institution: string;
  accountName: string;
  accountType: string;
  asOf: string;
  holdings: HoldingEntry[];
  totalValue: number;
}
