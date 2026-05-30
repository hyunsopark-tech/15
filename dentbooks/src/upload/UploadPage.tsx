import React, { useCallback, useState } from 'react';
import { useDashboard, ReportKey, UploadedReport } from './DashboardContext';

interface ReportDef {
  key: ReportKey;
  label: string;
  icon: string;
  odPath: string;
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
    odPath: 'Reports > Daily > Appointments → File > Export > CSV',
    description: 'All scheduled appointments for the selected date range.',
    columns: 'AptDateTime, PatientName, ProcDescript, ProvAbbr, AptStatus, PatNum',
    feeds: "Today's Appointments panel",
    accent: '#2563eb',
  },
  {
    key: 'production',
    label: 'Daily Production',
    icon: '💰',
    odPath: 'Reports > Daily > Production → Export',
    description: 'Production and adjustment totals by provider and date.',
    columns: 'Date, ProvAbbr, Production, Adjustments, Net Production',
    feeds: 'Revenue KPI card + revenue chart',
    accent: '#16a34a',
  },
  {
    key: 'aging',
    label: 'A/R Aging',
    icon: '⚠️',
    odPath: 'Reports > Lists > Aging of A/R → Export',
    description: 'Outstanding balances bucketed by age (0-30, 31-60, 61-90, 90+).',
    columns: 'PatNum, PatientName, 0-30, 31-60, 61-90, Over 90, Total',
    feeds: 'Outstanding balance KPI + patient balance column',
    accent: '#d97706',
  },
  {
    key: 'newPatients',
    label: 'New Patients',
    icon: '👤',
    odPath: 'Reports > Lists > New Patients → Export',
    description: 'Patients added within the date range, with referral source.',
    columns: 'PatNum, PatientName, DateFirstVisit, ReferralSource, HmPhone',
    feeds: 'New Patients KPI card',
    accent: '#7c3aed',
  },
  {
    key: 'payments',
    label: 'Payment Report',
    icon: '💳',
    odPath: 'Reports > Daily > Payments → Export',
    description: 'Payments collected by date, patient, amount, and type.',
    columns: 'PayDate, PatientName, PayAmt, PayType, PayNote',
    feeds: 'Activity feed + collections total',
    accent: '#0891b2',
  },
];

function humanTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function UploadZone({ def, upload }: { def: ReportDef; upload: UploadedReport | undefined }) {
  const { ingest } = useDashboard();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const handle = useCallback((file: File) => {
    setError('');
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Please upload a CSV file exported from Open Dental.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      try {
        ingest(def.key, file.name, text);
      } catch (err) {
        setError('Could not parse file. Make sure you exported as CSV from Open Dental.');
      }
    };
    reader.readAsText(file);
  }, [def.key, ingest]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handle(file);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handle(file);
    e.target.value = '';
  };

  const loaded = !!upload;

  return (
    <div className="upload-card" style={{ borderColor: loaded ? def.accent : undefined }}>
      <div className="upload-card-header">
        <div className="upload-icon" style={{ background: def.accent + '18', color: def.accent }}>
          {def.icon}
        </div>
        <div className="upload-meta">
          <div className="upload-label">{def.label}</div>
          <div className="upload-od-path">📂 {def.odPath}</div>
        </div>
        {loaded && (
          <div className="upload-badge-done">✓ Uploaded</div>
        )}
      </div>

      <div className="upload-desc">{def.description}</div>
      <div className="upload-columns"><strong>Expected columns:</strong> <code>{def.columns}</code></div>
      <div className="upload-feeds">Feeds: <em>{def.feeds}</em></div>

      <label
        className={`drop-zone ${dragging ? 'dragging' : ''} ${loaded ? 'loaded' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input type="file" accept=".csv,.txt" onChange={onInput} style={{ display: 'none' }} />
        {loaded ? (
          <div className="dz-loaded">
            <span style={{ fontSize: 20 }}>✅</span>
            <div className="dz-filename">{upload!.filename}</div>
            <div className="dz-rowcount">{upload!.rowCount} rows · uploaded at {humanTime(upload!.uploadedAt)}</div>
            <div className="dz-reupload">Drop or click to replace</div>
          </div>
        ) : (
          <div className="dz-empty">
            <span style={{ fontSize: 24 }}>📤</span>
            <div className="dz-prompt">Drop CSV here or <span className="dz-browse">browse</span></div>
            <div className="dz-hint">Export from Open Dental, then upload</div>
          </div>
        )}
      </label>

      {error && <div className="upload-error">{error}</div>}
    </div>
  );
}

export default function UploadPage() {
  const { uploads } = useDashboard();
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
            Staff export CSVs from Open Dental — no database connection needed.
          </div>
        </div>
        <div className="upload-progress-pill">
          <div className="up-pill-bar">
            <div className="up-pill-fill" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <span>{done} / {total} reports loaded</span>
        </div>
      </div>

      <div className="upload-how-to">
        <div className="how-title">📋 How to export from Open Dental</div>
        <ol className="how-list">
          <li>Open Open Dental and navigate to the report path shown on each card below.</li>
          <li>Set your date range (today or the period you want).</li>
          <li>Click <strong>Export</strong> or <strong>File &gt; Export</strong> and choose <strong>CSV</strong>.</li>
          <li>Upload the saved CSV file using the corresponding card.</li>
        </ol>
      </div>

      <div className="upload-grid">
        {REPORTS.map(def => (
          <UploadZone key={def.key} def={def} upload={uploadMap[def.key]} />
        ))}
      </div>
    </div>
  );
}
