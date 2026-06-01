import React, { useCallback, useState } from 'react';
import { useDashboard, ReportKey, UploadedReport } from './DashboardContext';

interface ReportDef {
  key: ReportKey;
  label: string;
  icon: string;
  shortcut: string;
  odPath: string;
  odSteps: string[];
  description: string;
  columns: string;
  feeds: string;
  accent: string;
}

const REPORTS: ReportDef[] = [
  {
    key: 'appointments',
    label: 'Appointment List',
    icon: '📅',
    shortcut: '⌘1',
    odPath: 'Reports > Daily > Appointments',
    odSteps: ['Open Reports menu', 'Click Daily → Appointments', 'Set date range to Today', 'Click Export → Save as CSV'],
    description: 'All scheduled appointments for the selected date.',
    columns: 'AptDateTime, PatientName, ProcDescript, ProvAbbr, AptStatus, PatNum',
    feeds: "Today's Appointments panel + appointment count KPI",
    accent: '#2563eb',
  },
  {
    key: 'production',
    label: 'Daily Production',
    icon: '💰',
    shortcut: '⌘2',
    odPath: 'Reports > Daily > Production',
    odSteps: ['Open Reports menu', 'Click Daily → Production', 'Set date range', 'Click Export → Save as CSV'],
    description: 'Production and net totals by provider and date.',
    columns: 'Date, ProvAbbr, Production, Adjustments, Net Production',
    feeds: 'Revenue KPI card + revenue chart',
    accent: '#16a34a',
  },
  {
    key: 'aging',
    label: 'A/R Aging',
    icon: '⚠️',
    shortcut: '⌘3',
    odPath: 'Reports > Lists > Aging of A/R',
    odSteps: ['Open Reports menu', 'Click Lists → Aging of A/R', 'Click OK to run', 'Click Export → Save as CSV'],
    description: 'Outstanding balances by patient, bucketed 0-30, 31-60, 61-90, 90+ days.',
    columns: 'PatNum, PatientName, 0-30, 31-60, 61-90, Over 90, Total',
    feeds: 'Outstanding A/R KPI + patient balance table',
    accent: '#d97706',
  },
  {
    key: 'newPatients',
    label: 'New Patients',
    icon: '👤',
    shortcut: '⌘4',
    odPath: 'Reports > Lists > New Patients',
    odSteps: ['Open Reports menu', 'Click Lists → New Patients', 'Set date range', 'Click Export → Save as CSV'],
    description: 'Patients first seen within the date range, with referral source.',
    columns: 'PatNum, PatientName, DateFirstVisit, ReferralSource, HmPhone',
    feeds: 'New Patients KPI card',
    accent: '#7c3aed',
  },
  {
    key: 'payments',
    label: 'Payment Report',
    icon: '💳',
    shortcut: '⌘5',
    odPath: 'Reports > Daily > Payments',
    odSteps: ['Open Reports menu', 'Click Daily → Payments', 'Set date range', 'Click Export → Save as CSV'],
    description: 'All payments collected by date, patient, amount, and type.',
    columns: 'PayDate, PatientName, PayAmt, PayType, PayNote',
    feeds: 'Activity feed + collections total',
    accent: '#0891b2',
  },
];

function humanTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function UploadCard({ def, upload }: { def: ReportDef; upload: UploadedReport | undefined }) {
  const { ingest, isElectron } = useDashboard();
  const [dragging, setDragging]     = useState(false);
  const [error, setError]           = useState('');
  const [showSteps, setShowSteps]   = useState(false);

  const handleFile = useCallback((file: File) => {
    setError('');
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Please select a CSV file exported from Open Dental.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      try { ingest(def.key, file.name, text); }
      catch { setError('Could not parse — make sure this is the correct Open Dental export.'); }
    };
    reader.readAsText(file);
  }, [def.key, ingest]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const loaded = !!upload;

  const handlePickClick = () => {
    if (isElectron) {
      window.electronAPI!.pickFile(def.key);
    }
    // browser fallback: label click opens the hidden <input type="file">
  };

  return (
    <div className="upload-card" style={{ borderColor: loaded ? def.accent : undefined }}>
      {/* Header */}
      <div className="upload-card-header">
        <div className="upload-icon" style={{ background: def.accent + '1a', color: def.accent }}>
          {def.icon}
        </div>
        <div className="upload-meta">
          <div className="upload-label">{def.label}</div>
          <div className="upload-od-path">📂 {def.odPath}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
          {loaded && <div className="upload-badge-done">✓ Loaded</div>}
          <div className="shortcut-chip">{def.shortcut}</div>
        </div>
      </div>

      {/* Description + feeds */}
      <div className="upload-desc">{def.description}</div>
      <div className="upload-feeds">→ Feeds: <em>{def.feeds}</em></div>

      {/* How-to steps (collapsible) */}
      <button className="steps-toggle" onClick={() => setShowSteps(s => !s)}>
        {showSteps ? '▾' : '▸'} How to export from Open Dental
      </button>
      {showSteps && (
        <ol className="od-steps">
          {def.odSteps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}

      {/* Drop zone / pick button */}
      {isElectron ? (
        /* Desktop: big "Open File" button — no drag needed */
        <div className="desktop-pick-area">
          {loaded ? (
            <div className="dz-loaded">
              <span style={{ fontSize:22 }}>✅</span>
              <div className="dz-filename">{upload!.filename}</div>
              <div className="dz-rowcount">{upload!.rowCount} rows · {humanTime(upload!.uploadedAt)}</div>
            </div>
          ) : null}
          <button
            className="btn-pick"
            style={{ borderColor: def.accent, color: def.accent }}
            onClick={handlePickClick}
          >
            📂 {loaded ? 'Replace file…' : 'Open file…'}
          </button>
        </div>
      ) : (
        /* Browser: drag-and-drop zone */
        <label
          className={`drop-zone ${dragging?'dragging':''} ${loaded?'loaded':''}`}
          onDragOver={e=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={onDrop}
        >
          <input type="file" accept=".csv,.txt" onChange={onInput} style={{display:'none'}} />
          {loaded ? (
            <div className="dz-loaded">
              <span style={{fontSize:20}}>✅</span>
              <div className="dz-filename">{upload!.filename}</div>
              <div className="dz-rowcount">{upload!.rowCount} rows · {humanTime(upload!.uploadedAt)}</div>
              <div className="dz-reupload">Drop or click to replace</div>
            </div>
          ) : (
            <div className="dz-empty">
              <span style={{fontSize:24}}>📤</span>
              <div className="dz-prompt">Drop CSV here or <span className="dz-browse">browse</span></div>
              <div className="dz-hint">Export CSV from Open Dental, then upload here</div>
            </div>
          )}
        </label>
      )}

      {error && <div className="upload-error">{error}</div>}
    </div>
  );
}

export default function UploadPage() {
  const { uploads, isElectron } = useDashboard();
  const uploadMap: Partial<Record<ReportKey, UploadedReport>> = {};
  for (const u of uploads) uploadMap[u.key] = u;
  const done = uploads.length;
  const total = REPORTS.length;

  return (
    <div className="upload-page">
      <div className="upload-page-header">
        <div>
          <div className="page-title">Upload Open Dental Reports</div>
          <div className="page-date">
            {isElectron
              ? 'Use the Reports menu or click Open file on each card below — no database connection needed.'
              : 'Export CSVs from Open Dental and drop them on each card below.'}
          </div>
        </div>
        <div className="upload-progress-pill">
          <div className="up-pill-bar">
            <div className="up-pill-fill" style={{width:`${(done/total)*100}%`}} />
          </div>
          <span>{done} / {total} loaded</span>
        </div>
      </div>

      {isElectron && (
        <div className="upload-how-to">
          <div className="how-title">⌨️ Keyboard shortcuts</div>
          <div style={{display:'flex', gap:24, flexWrap:'wrap', marginTop:6}}>
            {REPORTS.map(r => (
              <span key={r.key} style={{fontSize:13, color:'var(--gray-700)'}}>
                <strong>{r.shortcut}</strong> — {r.label}
              </span>
            ))}
            <span style={{fontSize:13, color:'var(--gray-700)'}}>
              <strong>⌘⇧U</strong> — Open this page
            </span>
          </div>
        </div>
      )}

      {!isElectron && (
        <div className="upload-how-to">
          <div className="how-title">📋 How to export from Open Dental</div>
          <ol className="how-list">
            <li>In Open Dental, go to the report path shown on each card.</li>
            <li>Set your date range (today or the period you need).</li>
            <li>Click <strong>Export</strong> or <strong>File › Export</strong> and choose <strong>CSV</strong>.</li>
            <li>Drop the saved file onto the matching card below.</li>
          </ol>
        </div>
      )}

      <div className="upload-grid">
        {REPORTS.map(def => (
          <UploadCard key={def.key} def={def} upload={uploadMap[def.key]} />
        ))}
      </div>
    </div>
  );
}
