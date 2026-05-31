import React, { useState, useCallback, useRef } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Upload, TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Briefcase, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { ParsedStatement } from "./types";
import { parseCSV, parseJSON, createManualEntry } from "./parsers";
import { buildSnapshot, groupByTicker } from "./portfolio";
import "./App.css";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#9ca3af"];
const ASSET_COLORS: Record<string, string> = {
  "US Stocks": "#2563eb",
  "International Stocks": "#16a34a",
  Bonds: "#d97706",
  "Real Estate": "#7c3aed",
  Cash: "#0891b2",
  Crypto: "#dc2626",
  Other: "#9ca3af",
};

function fmt(n: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

function fmtUSD(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${fmt(n / 1_000_000, 2)}M`;
  if (Math.abs(n) >= 1_000) return `$${fmt(n / 1_000, 1)}K`;
  return `$${fmt(n, 2)}`;
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${fmt(n, 2)}%`;
}

function ManualEntryModal({ onAdd, onClose }: { onAdd: (stmt: ParsedStatement) => void; onClose: () => void }) {
  const [institution, setInstitution] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("Brokerage");
  const [rows, setRows] = useState([{ ticker: "", name: "", shares: "", price: "", costBasis: "" }]);

  function addRow() { setRows([...rows, { ticker: "", name: "", shares: "", price: "", costBasis: "" }]); }
  function removeRow(i: number) { setRows(rows.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, field: string, val: string) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  }

  function handleSubmit() {
    if (!institution || !accountName) { alert("Please fill in institution and account name."); return; }
    const entries = rows
      .filter((r) => r.ticker && parseFloat(r.shares) > 0 && parseFloat(r.price) > 0)
      .map((r) => ({
        ticker: r.ticker.toUpperCase(),
        name: r.name || r.ticker.toUpperCase(),
        shares: parseFloat(r.shares),
        price: parseFloat(r.price),
        costBasis: r.costBasis ? parseFloat(r.costBasis) : undefined,
      }));
    if (entries.length === 0) { alert("Please add at least one holding with ticker, shares, and price."); return; }
    onAdd(createManualEntry(institution, accountName, accountType, entries));
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Account Manually</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Institution</label>
              <input placeholder="e.g. Fidelity" value={institution} onChange={(e) => setInstitution(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Account Name</label>
              <input placeholder="e.g. Roth IRA" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Account Type</label>
              <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                {["Brokerage", "Roth IRA", "Traditional IRA", "401(k)", "403(b)", "HSA", "529", "Other"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="table-scroll">
            <table className="manual-table">
              <thead>
                <tr><th>Ticker</th><th>Name</th><th>Shares</th><th>Price ($)</th><th>Cost Basis ($)</th><th></th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td><input value={r.ticker} onChange={(e) => updateRow(i, "ticker", e.target.value)} placeholder="VTI" /></td>
                    <td><input value={r.name} onChange={(e) => updateRow(i, "name", e.target.value)} placeholder="Vanguard Total Market" /></td>
                    <td><input type="number" value={r.shares} onChange={(e) => updateRow(i, "shares", e.target.value)} placeholder="100" /></td>
                    <td><input type="number" value={r.price} onChange={(e) => updateRow(i, "price", e.target.value)} placeholder="220.00" /></td>
                    <td><input type="number" value={r.costBasis} onChange={(e) => updateRow(i, "costBasis", e.target.value)} placeholder="optional" /></td>
                    <td><button className="icon-btn danger" onClick={() => removeRow(i)}><X size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn-secondary mt8" onClick={addRow}><Plus size={14} /> Add Row</button>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit}>Add Account</button>
        </div>
      </div>
    </div>
  );
}

function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function App() {
  const [statements, setStatements] = useState<ParsedStatement[]>([]);
  const [dragging, setDragging] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [holdingsView, setHoldingsView] = useState<"consolidated" | "all">("consolidated");
  const [sortCol, setSortCol] = useState("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: File[]) => {
    const newErrors: string[] = [];
    const newStmts: ParsedStatement[] = [];
    for (const file of files) {
      try {
        const text = await file.text();
        let stmt: ParsedStatement | null = null;
        if (file.name.endsWith(".json")) stmt = parseJSON(text, file.name);
        else if (file.name.match(/\.(csv|txt)$/i)) stmt = parseCSV(text, file.name);
        else { newErrors.push(`${file.name}: Unsupported format — use CSV or JSON.`); continue; }
        if (!stmt || stmt.holdings.length === 0)
          newErrors.push(`${file.name}: No holdings found. Make sure it's a brokerage export with position data.`);
        else newStmts.push(stmt);
      } catch { newErrors.push(`${file.name}: Error reading file.`); }
    }
    setStatements((prev) => [...prev, ...newStmts]);
    setErrors(newErrors);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, [processFiles]);

  function handleSort(col: string) {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  function toggleAccount(key: string) {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const snapshot = statements.length > 0 ? buildSnapshot(statements) : null;
  const consolidated = snapshot ? groupByTicker(snapshot.allHoldings) : [];

  const baseHoldings = holdingsView === "consolidated" ? consolidated : (snapshot?.allHoldings ?? []);
  const sortedHoldings = [...baseHoldings].sort((a, b) => {
    const av = (a as any)[sortCol] ?? 0;
    const bv = (b as any)[sortCol] ?? 0;
    const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const allocationData = snapshot
    ? Object.entries(snapshot.assetAllocation).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    : [];

  const accountBarData = snapshot?.accounts.map((a, i) => ({
    name: a.accountName.length > 14 ? a.accountName.slice(0, 14) + "…" : a.accountName,
    value: a.totalValue,
    fill: COLORS[i % COLORS.length],
  })) ?? [];

  const SortArrow = ({ col }: { col: string }) =>
    sortCol === col ? (sortDir === "asc" ? <ChevronUp size={11} className="sort-icon" /> : <ChevronDown size={11} className="sort-icon" />) : null;

  const extraCols = holdingsView === "all" ? [{ key: "account", label: "Account" }, { key: "institution", label: "Institution" }] : [];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Jung Park Household</h1>
          <span className="subtitle">Investment Dashboard</span>
        </div>
        {snapshot && (
          <div className="header-total">
            <div className="total-label">Total Portfolio Value</div>
            <div className="total-value">{fmtUSD(snapshot.totalValue)}</div>
            <div className={`total-gl ${snapshot.totalGainLoss >= 0 ? "positive" : "negative"}`}>
              {snapshot.totalGainLoss >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              &nbsp;{fmtUSD(snapshot.totalGainLoss)} ({fmtPct(snapshot.totalGainLossPct)}) all-time
            </div>
          </div>
        )}
      </header>

      <main className="main">
        <section className="upload-section">
          <div
            className={`drop-zone ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={22} />
            <p><strong>Drop investment statements here</strong> or click to browse</p>
            <p className="upload-hint">CSV from Fidelity · Vanguard · Schwab · Merrill · TD Ameritrade · E*Trade · Robinhood and more</p>
            <input ref={fileInputRef} type="file" accept=".csv,.json,.txt" multiple onChange={(e) => { if (e.target.files) processFiles(Array.from(e.target.files)); e.target.value = ""; }} hidden />
          </div>
          <button className="btn-secondary manual-btn" onClick={() => setShowManual(true)}>
            <Plus size={14} /> Enter Manually
          </button>
        </section>

        {errors.length > 0 && (
          <div className="errors">
            {errors.map((e, i) => <div key={i} className="error-msg">⚠ {e}</div>)}
            <button className="icon-btn" onClick={() => setErrors([])}><X size={14} /></button>
          </div>
        )}

        {statements.length > 0 && (
          <section className="loaded-files">
            <h3>Loaded Statements ({statements.length})</h3>
            <div className="file-chips">
              {statements.map((s, i) => (
                <div key={i} className="file-chip">
                  <span className="chip-inst">{s.institution}</span>
                  <span className="chip-name">{s.accountName}</span>
                  <span className="chip-val">{fmtUSD(s.totalValue)}</span>
                  <button className="icon-btn danger" onClick={() => setStatements((prev) => prev.filter((_, j) => j !== i))}><X size={12} /></button>
                </div>
              ))}
            </div>
          </section>
        )}

        {snapshot && (
          <>
            <section className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon blue"><DollarSign size={20} /></div>
                <div>
                  <div className="kpi-label">Total Value</div>
                  <div className="kpi-value">{fmtUSD(snapshot.totalValue)}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon purple"><Briefcase size={20} /></div>
                <div>
                  <div className="kpi-label">Accounts</div>
                  <div className="kpi-value">{snapshot.accounts.length}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className={`kpi-icon ${snapshot.totalGainLoss >= 0 ? "green" : "red"}`}>
                  {snapshot.totalGainLoss >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div>
                  <div className="kpi-label">Total Gain / Loss</div>
                  <div className={`kpi-value ${snapshot.totalGainLoss >= 0 ? "positive" : "negative"}`}>{fmtUSD(snapshot.totalGainLoss)}</div>
                  <div className={`kpi-sub ${snapshot.totalGainLoss >= 0 ? "positive" : "negative"}`}>{fmtPct(snapshot.totalGainLossPct)}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon orange"><PieIcon size={20} /></div>
                <div>
                  <div className="kpi-label">Unique Positions</div>
                  <div className="kpi-value">{consolidated.length}</div>
                </div>
              </div>
            </section>

            <section className="charts-grid">
              <div className="chart-card">
                <h3>Asset Allocation</h3>
                <div className="chart-with-legend">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={allocationData} cx="50%" cy="50%" innerRadius={52} outerRadius={90} dataKey="value" labelLine={false} label={<CustomPieLabel />}>
                        {allocationData.map((entry) => <Cell key={entry.name} fill={ASSET_COLORS[entry.name] || "#9ca3af"} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [fmtUSD(v), ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend">
                    {allocationData.map((entry) => (
                      <div key={entry.name} className="legend-item">
                        <span className="legend-dot" style={{ background: ASSET_COLORS[entry.name] || "#9ca3af" }} />
                        <span className="legend-name">{entry.name}</span>
                        <span className="legend-val">{fmtUSD(entry.value)}</span>
                        <span className="legend-pct">{((entry.value / snapshot.totalValue) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <h3>Value by Account</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={accountBarData} margin={{ top: 4, right: 8, left: 0, bottom: 44 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tickFormatter={(v) => fmtUSD(v)} tick={{ fontSize: 11 }} width={72} />
                    <Tooltip formatter={(v: any) => [fmtUSD(v), "Value"]} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {accountBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="section-card">
              <h3>Accounts</h3>
              <div className="accounts-list">
                {snapshot.accounts.map((acct) => {
                  const key = `${acct.institution}::${acct.accountName}`;
                  const expanded = expandedAccounts.has(key);
                  const gl = acct.holdings.reduce((s, h) => s + (h.gainLoss ?? 0), 0);
                  const cb = acct.holdings.reduce((s, h) => s + (h.costBasis ?? h.value), 0);
                  const glPct = cb > 0 ? (gl / cb) * 100 : 0;
                  return (
                    <div key={key} className="account-row">
                      <div className="account-header" onClick={() => toggleAccount(key)}>
                        <div className="account-left">
                          <span className="account-badge">{acct.accountType}</span>
                          <span className="account-name">{acct.accountName}</span>
                          <span className="account-inst">@ {acct.institution}</span>
                        </div>
                        <div className="account-right">
                          <span className="account-value">{fmtUSD(acct.totalValue)}</span>
                          {gl !== 0 && <span className={`account-gl ${gl >= 0 ? "positive" : "negative"}`}>{fmtUSD(gl)} ({fmtPct(glPct)})</span>}
                          <span className="holdings-count">{acct.holdings.length} holdings</span>
                          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                      {expanded && (
                        <div className="account-holdings table-scroll">
                          <table className="holdings-table">
                            <thead>
                              <tr><th>Ticker</th><th>Name</th><th className="num">Shares</th><th className="num">Price</th><th className="num">Value</th><th className="num">Gain/Loss</th><th>Asset Class</th></tr>
                            </thead>
                            <tbody>
                              {acct.holdings.sort((a, b) => b.value - a.value).map((h, i) => (
                                <tr key={i}>
                                  <td><span className="ticker-badge">{h.ticker}</span></td>
                                  <td className="holding-name">{h.name}</td>
                                  <td className="num">{fmt(h.shares, 3)}</td>
                                  <td className="num">{h.price > 0 ? `$${fmt(h.price, 2)}` : "—"}</td>
                                  <td className="num bold">{fmtUSD(h.value)}</td>
                                  <td className={`num ${(h.gainLoss ?? 0) >= 0 ? "positive" : "negative"}`}>
                                    {h.gainLoss !== undefined ? <>{fmtUSD(h.gainLoss)}{h.gainLossPct !== undefined && <small> ({fmtPct(h.gainLossPct)})</small>}</> : "—"}
                                  </td>
                                  <td><span className="asset-badge" style={{ background: ASSET_COLORS[h.assetClass] + "22", color: ASSET_COLORS[h.assetClass] }}>{h.assetClass}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="section-card">
              <div className="section-header">
                <h3>All Holdings</h3>
                <div className="toggle-group">
                  <button className={holdingsView === "consolidated" ? "active" : ""} onClick={() => setHoldingsView("consolidated")}>Consolidated</button>
                  <button className={holdingsView === "all" ? "active" : ""} onClick={() => setHoldingsView("all")}>By Account</button>
                </div>
              </div>
              <div className="table-scroll">
                <table className="holdings-table full">
                  <thead>
                    <tr>
                      {[
                        { key: "ticker", label: "Ticker" }, { key: "name", label: "Name" }, { key: "assetClass", label: "Asset Class" },
                        ...extraCols,
                        { key: "shares", label: "Shares", num: true }, { key: "price", label: "Price", num: true },
                        { key: "value", label: "Value", num: true }, { key: "costBasis", label: "Cost Basis", num: true },
                        { key: "gainLoss", label: "Gain/Loss", num: true }, { key: "gainLossPct", label: "G/L %", num: true },
                      ].map(({ key, label, num }: any) => (
                        <th key={key} className={`${num ? "num" : ""} sortable`} onClick={() => handleSort(key)}>
                          {label}&nbsp;<SortArrow col={key} />
                        </th>
                      ))}
                      <th className="num">Port %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHoldings.map((h, i) => (
                      <tr key={i}>
                        <td><span className="ticker-badge">{h.ticker}</span></td>
                        <td className="holding-name">{h.name}</td>
                        <td><span className="asset-badge" style={{ background: ASSET_COLORS[h.assetClass] + "22", color: ASSET_COLORS[h.assetClass] }}>{h.assetClass}</span></td>
                        {holdingsView === "all" && <><td>{h.account}</td><td>{h.institution}</td></>}
                        <td className="num">{fmt(h.shares, 3)}</td>
                        <td className="num">{h.price > 0 ? `$${fmt(h.price, 2)}` : "—"}</td>
                        <td className="num bold">{fmtUSD(h.value)}</td>
                        <td className="num">{h.costBasis ? fmtUSD(h.costBasis) : "—"}</td>
                        <td className={`num ${(h.gainLoss ?? 0) >= 0 ? "positive" : "negative"}`}>{h.gainLoss !== undefined ? fmtUSD(h.gainLoss) : "—"}</td>
                        <td className={`num ${(h.gainLossPct ?? 0) >= 0 ? "positive" : "negative"}`}>{h.gainLossPct !== undefined ? fmtPct(h.gainLossPct) : "—"}</td>
                        <td className="num">{((h.value / snapshot.totalValue) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td colSpan={holdingsView === "all" ? 7 : 5} className="bold">Total</td>
                      <td className="num bold">{fmtUSD(snapshot.totalValue)}</td>
                      <td className="num">{fmtUSD(snapshot.totalCostBasis)}</td>
                      <td className={`num bold ${snapshot.totalGainLoss >= 0 ? "positive" : "negative"}`}>{fmtUSD(snapshot.totalGainLoss)}</td>
                      <td className={`num ${snapshot.totalGainLoss >= 0 ? "positive" : "negative"}`}>{fmtPct(snapshot.totalGainLossPct)}</td>
                      <td className="num">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <div className="as-of">As of {snapshot.asOf} · All data is stored locally — nothing leaves your browser</div>
          </>
        )}

        {statements.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h2>Jung Park Household Investment Dashboard</h2>
            <p>Upload CSV exports from your brokerages or add accounts manually to see a complete financial snapshot.</p>
            <div className="supported-list">Fidelity · Vanguard · Schwab · Merrill Lynch · TD Ameritrade · E*Trade · Robinhood · Betterment · Wealthfront · Empower</div>
            <p className="privacy-note">🔒 All data stays in your browser — nothing is sent to any server.</p>
          </div>
        )}
      </main>

      {showManual && <ManualEntryModal onAdd={(stmt) => setStatements((prev) => [...prev, stmt])} onClose={() => setShowManual(false)} />}
    </div>
  );
}
