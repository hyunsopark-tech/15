import React, { useState } from 'react';
import './App.css';

// ── Types ────────────────────────────────────────────────────────────────────

type ContactStatus = 'new' | 'called' | 'texted' | 'left-vm' | 'scheduled' | 'declined' | 'no-answer';
type ClaimStatus   = 'filed' | 'pending' | 'partial' | 'needs-appeal' | 'resolved' | 'write-off';

interface RecallPatient {
  id: number;
  name: string;
  phone: string;
  lastVisit: string;   // e.g. "Dec 2024"
  daysOverdue: number;
  provider: string;
  status: ContactStatus;
  attempts: number;
  lastContact: string;
  notes: string;
}

interface TxPatient {
  id: number;
  name: string;
  phone: string;
  treatmentValue: number;
  procedures: string;
  planDate: string;
  daysSincePlan: number;
  status: ContactStatus;
  attempts: number;
  lastContact: string;
  notes: string;
}

interface ArClaim {
  id: number;
  name: string;
  claimAmount: number;
  patientPortion: number;
  insurancePortion: number;
  insuranceName: string;
  dateFiled: string;
  daysOutstanding: number;
  status: ClaimStatus;
  lastAction: string;
  notes: string;
}

// ── Seed data ────────────────────────────────────────────────────────────────

const seedRecall: RecallPatient[] = [
  { id:1,  name:'Margaret Collins',  phone:'(312) 555-0142', lastVisit:'Nov 2024', daysOverdue:211, provider:'Dr. Kim',    status:'left-vm',  attempts:2, lastContact:'May 28', notes:'' },
  { id:2,  name:'David Thornton',    phone:'(312) 555-0287', lastVisit:'Dec 2024', daysOverdue:183, provider:'Dr. Kim',    status:'new',      attempts:0, lastContact:'—',      notes:'' },
  { id:3,  name:'Sandra Wu',         phone:'(773) 555-0319', lastVisit:'Jan 2025', daysOverdue:152, provider:'Dr. Lee',    status:'called',   attempts:1, lastContact:'May 30', notes:'' },
  { id:4,  name:'Robert Alvarez',    phone:'(312) 555-0455', lastVisit:'Jan 2025', daysOverdue:148, provider:'Dr. Kim',    status:'new',      attempts:0, lastContact:'—',      notes:'' },
  { id:5,  name:'Patricia Nguyen',   phone:'(773) 555-0521', lastVisit:'Feb 2025', daysOverdue:121, provider:'Dr. Lee',    status:'texted',   attempts:1, lastContact:'May 29', notes:'' },
  { id:6,  name:'James Harrison',    phone:'(312) 555-0688', lastVisit:'Feb 2025', daysOverdue:118, provider:'Dr. Kim',    status:'no-answer',attempts:3, lastContact:'May 27', notes:'' },
  { id:7,  name:'Linda Patel',       phone:'(708) 555-0734', lastVisit:'Mar 2025', daysOverdue:93,  provider:'Dr. Lee',    status:'new',      attempts:0, lastContact:'—',      notes:'' },
  { id:8,  name:'Thomas Brennan',    phone:'(312) 555-0812', lastVisit:'Mar 2025', daysOverdue:87,  provider:'Dr. Kim',    status:'called',   attempts:1, lastContact:'May 31', notes:'Prefers calls after 5pm' },
  { id:9,  name:'Angela Foster',     phone:'(773) 555-0967', lastVisit:'Apr 2025', daysOverdue:62,  provider:'Dr. Lee',    status:'new',      attempts:0, lastContact:'—',      notes:'' },
  { id:10, name:'Kevin Martinez',    phone:'(312) 555-1043', lastVisit:'Apr 2025', daysOverdue:58,  provider:'Dr. Kim',    status:'texted',   attempts:1, lastContact:'May 31', notes:'' },
];

const seedTx: TxPatient[] = [
  { id:1,  name:'David Thornton',    phone:'(312) 555-0287', treatmentValue:4200, procedures:'Crown #19, Crown #30',           planDate:'Mar 15', daysSincePlan:77, status:'left-vm',  attempts:2, lastContact:'May 29', notes:'' },
  { id:2,  name:'Angela Foster',     phone:'(773) 555-0967', treatmentValue:3850, procedures:'Implant #14',                    planDate:'Apr 2',  daysSincePlan:59, status:'new',      attempts:0, lastContact:'—',      notes:'' },
  { id:3,  name:'Robert Alvarez',    phone:'(312) 555-0455', treatmentValue:2900, procedures:'Root Canal #3, Build-up, Crown', planDate:'Feb 20', daysSincePlan:100,status:'called',   attempts:3, lastContact:'May 28', notes:'Insurance pre-auth pending' },
  { id:4,  name:'Sandra Wu',         phone:'(773) 555-0319', treatmentValue:2100, procedures:'Veneers #8, #9, #10',            planDate:'Apr 18', daysSincePlan:43, status:'new',      attempts:0, lastContact:'—',      notes:'' },
  { id:5,  name:'Patricia Nguyen',   phone:'(773) 555-0521', treatmentValue:1600, procedures:'Fillings x4 (quadrant)',         planDate:'May 5',  daysSincePlan:26, status:'texted',   attempts:1, lastContact:'May 30', notes:'' },
  { id:6,  name:'Kevin Martinez',    phone:'(312) 555-1043', treatmentValue:1400, procedures:'Extraction #32, Partial denture',planDate:'May 12', daysSincePlan:19, status:'new',      attempts:0, lastContact:'—',      notes:'' },
  { id:7,  name:'Thomas Brennan',    phone:'(312) 555-0812', treatmentValue:950,  procedures:'Filling #18, Night guard',       planDate:'May 20', daysSincePlan:11, status:'called',   attempts:1, lastContact:'May 31', notes:'' },
];

const seedAr: ArClaim[] = [
  { id:1,  name:'James Harrison',    claimAmount:1840, patientPortion:368, insurancePortion:1472, insuranceName:'Delta Dental PPO',  dateFiled:'Mar 3',  daysOutstanding:89, status:'needs-appeal', lastAction:'Denied — missing X-ray', notes:'' },
  { id:2,  name:'Margaret Collins',  claimAmount:1250, patientPortion:250, insurancePortion:1000, insuranceName:'MetLife',           dateFiled:'Mar 18', daysOutstanding:74, status:'pending',      lastAction:'Filed, no response',     notes:'' },
  { id:3,  name:'Robert Alvarez',    claimAmount:980,  patientPortion:196, insurancePortion:784,  insuranceName:'Cigna DPPO',        dateFiled:'Apr 1',  daysOutstanding:60, status:'pending',      lastAction:'Called ins 5/20',        notes:'' },
  { id:4,  name:'Linda Patel',       claimAmount:760,  patientPortion:152, insurancePortion:608,  insuranceName:'Aetna DMO',         dateFiled:'Apr 14', daysOutstanding:47, status:'partial',      lastAction:'Partial $380 received',  notes:'Appealing remaining $380' },
  { id:5,  name:'Sandra Wu',         claimAmount:640,  patientPortion:128, insurancePortion:512,  insuranceName:'Blue Cross BCBS',   dateFiled:'Apr 22', daysOutstanding:39, status:'filed',        lastAction:'Submitted electronically',notes:'' },
  { id:6,  name:'Kevin Martinez',    claimAmount:520,  patientPortion:520, insurancePortion:0,    insuranceName:'Self-pay',          dateFiled:'May 1',  daysOutstanding:30, status:'pending',      lastAction:'Statement sent',         notes:'Payment plan agreed $100/mo' },
  { id:7,  name:'Patricia Nguyen',   claimAmount:390,  patientPortion:78,  insurancePortion:312,  insuranceName:'Guardian',          dateFiled:'May 10', daysOutstanding:21, status:'filed',        lastAction:'Submitted electronically',notes:'' },
  { id:8,  name:'Angela Foster',     claimAmount:280,  patientPortion:56,  insurancePortion:224,  insuranceName:'Delta Dental PPO',  dateFiled:'May 18', daysOutstanding:13, status:'filed',        lastAction:'Submitted electronically',notes:'' },
];

// ── Protocol definitions ─────────────────────────────────────────────────────

const RECALL_PROTOCOL = [
  { day: 0,  label: 'Day 1',  action: 'Send text + email reminder with online booking link' },
  { day: 3,  label: 'Day 3',  action: 'Phone call if no response to text/email' },
  { day: 7,  label: 'Day 7',  action: 'Second call — leave voicemail with callback number' },
  { day: 14, label: 'Day 14', action: 'Final call + mailed postcard reminder' },
  { day: 30, label: 'Day 30', action: 'Mark as non-responsive, schedule for next recall cycle' },
];

const TX_PROTOCOL = [
  { day: 0,  label: 'Day 1',  action: 'Call patient — review treatment and answer questions' },
  { day: 3,  label: 'Day 3',  action: 'Follow-up call or text if no response' },
  { day: 7,  label: 'Day 7',  action: 'Send written treatment summary with cost breakdown' },
  { day: 14, label: 'Day 14', action: 'Third contact — offer flexible scheduling or payment plan' },
  { day: 30, label: 'Day 30', action: 'Final outreach — confirm patient intent, update chart notes' },
];

const AR_PROTOCOL = [
  { days: '1–30',  label: '0–30 days',  action: 'Verify claim was received by insurance — confirm claim number' },
  { days: '31–60', label: '31–60 days', action: 'Call insurance to check status — document rep name and reference #' },
  { days: '61–90', label: '61–90 days', action: 'File appeal if denied. Re-submit with supporting records' },
  { days: '90+',   label: '90+ days',   action: 'Escalate to billing manager — consider collections or write-off review' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const avatarColors = ['#2563eb','#7c3aed','#db2777','#ea580c','#16a34a','#0891b2','#854d0e','#1d4ed8','#9333ea','#0f766e'];

function avatarColor(name: string) {
  let h = 0; for (const c of name) h = c.charCodeAt(0) + h * 31;
  return avatarColors[Math.abs(h) % avatarColors.length];
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
}

function fmt(n: number) {
  return '$' + n.toLocaleString();
}

function urgencyColor(days: number, type: 'recall' | 'tx' | 'ar') {
  if (type === 'recall') {
    if (days >= 180) return '#dc2626';
    if (days >= 90)  return '#d97706';
    return '#16a34a';
  }
  if (type === 'tx') {
    if (days >= 60) return '#dc2626';
    if (days >= 21) return '#d97706';
    return '#16a34a';
  }
  // ar
  if (days >= 90) return '#dc2626';
  if (days >= 60) return '#d97706';
  if (days >= 30) return '#f59e0b';
  return '#16a34a';
}

const contactStatusLabel: Record<ContactStatus, string> = {
  'new':       'New',
  'called':    'Called',
  'texted':    'Texted',
  'left-vm':   'Left VM',
  'scheduled': 'Scheduled ✓',
  'declined':  'Declined',
  'no-answer': 'No Answer',
};
const contactStatusColor: Record<ContactStatus, string> = {
  'new':       '#6b7280',
  'called':    '#2563eb',
  'texted':    '#7c3aed',
  'left-vm':   '#0891b2',
  'scheduled': '#16a34a',
  'declined':  '#dc2626',
  'no-answer': '#d97706',
};

const claimStatusLabel: Record<ClaimStatus, string> = {
  'filed':        'Filed',
  'pending':      'Pending',
  'partial':      'Partial Paid',
  'needs-appeal': 'Needs Appeal',
  'resolved':     'Resolved ✓',
  'write-off':    'Write-Off',
};
const claimStatusColor: Record<ClaimStatus, string> = {
  'filed':        '#2563eb',
  'pending':      '#d97706',
  'partial':      '#7c3aed',
  'needs-appeal': '#dc2626',
  'resolved':     '#16a34a',
  'write-off':    '#6b7280',
};

// ── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatarColor(name), color: '#fff',
      fontSize: size * 0.36, fontWeight: 700,
      display:'flex', alignItems:'center', justifyContent:'center',
      flexShrink: 0,
    }}>{initials(name)}</div>
  );
}

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 20,
      background: color + '18', color,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function NoteField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      className="note-input"
      placeholder="Add note…"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function ProtocolBox({ steps }: { steps: { label: string; action: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="protocol-box">
      <button className="protocol-toggle" onClick={() => setOpen(o => !o)}>
        {open ? '▾' : '▸'} Follow-up Protocol
      </button>
      {open && (
        <ol className="protocol-steps">
          {steps.map((s, i) => (
            <li key={i}><strong>{s.label}:</strong> {s.action}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── Recall tracker ───────────────────────────────────────────────────────────

function RecallTracker() {
  const [patients, setPatients] = useState(seedRecall);
  const [filter, setFilter]     = useState<'all' | ContactStatus>('all');

  const update = (id: number, patch: Partial<RecallPatient>) =>
    setPatients(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));

  const shown = filter === 'all' ? patients : patients.filter(p => p.status === filter);
  const totalOverdue = patients.filter(p => p.status !== 'scheduled' && p.status !== 'declined').length;

  return (
    <section className="tracker-section">
      <div className="tracker-header">
        <div>
          <h2 className="tracker-title">📋 Overdue Recall List</h2>
          <div className="tracker-sub">{totalOverdue} patients overdue · sorted by days since last visit</div>
        </div>
        <div className="tracker-pills">
          {(['all','new','called','texted','left-vm','no-answer','scheduled'] as const).map(s => (
            <button key={s} className={`filter-pill ${filter===s?'active':''}`} onClick={()=>setFilter(s)}>
              {s==='all' ? `All (${patients.length})` : contactStatusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      <ProtocolBox steps={RECALL_PROTOCOL} />

      <div className="tracker-table-wrap">
        <table className="tracker-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Phone</th>
              <th>Last Visit</th>
              <th>Days Overdue</th>
              <th>Provider</th>
              <th>Attempts</th>
              <th>Status</th>
              <th>Update Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(p => (
              <tr key={p.id} className={p.status === 'scheduled' ? 'row-done' : ''}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <Avatar name={p.name} size={30} />
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{p.name}</div>
                      <div style={{fontSize:11,color:'var(--gray-400)'}}>Last: {p.lastContact}</div>
                    </div>
                  </div>
                </td>
                <td><a href={`tel:${p.phone}`} className="phone-link">{p.phone}</a></td>
                <td style={{fontSize:13}}>{p.lastVisit}</td>
                <td>
                  <span style={{
                    fontWeight:800, fontSize:15,
                    color: urgencyColor(p.daysOverdue, 'recall'),
                  }}>{p.daysOverdue}d</span>
                </td>
                <td style={{fontSize:13,color:'var(--gray-500)'}}>{p.provider}</td>
                <td style={{textAlign:'center',fontWeight:700,color:p.attempts>=3?'#dc2626':'var(--gray-600)'}}>{p.attempts}</td>
                <td><StatusPill label={contactStatusLabel[p.status]} color={contactStatusColor[p.status]} /></td>
                <td>
                  <select
                    className="status-select"
                    value={p.status}
                    onChange={e => update(p.id, {
                      status: e.target.value as ContactStatus,
                      attempts: p.attempts + 1,
                      lastContact: 'Today',
                    })}
                  >
                    <option value="new">New</option>
                    <option value="called">Called</option>
                    <option value="texted">Texted</option>
                    <option value="left-vm">Left VM</option>
                    <option value="no-answer">No Answer</option>
                    <option value="scheduled">Scheduled ✓</option>
                    <option value="declined">Declined</option>
                  </select>
                </td>
                <td>
                  <NoteField value={p.notes} onChange={v => update(p.id, { notes: v })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Unscheduled TX tracker ───────────────────────────────────────────────────

function TxTracker() {
  const [patients, setPatients] = useState(seedTx);
  const [filter, setFilter]     = useState<'all' | ContactStatus>('all');

  const update = (id: number, patch: Partial<TxPatient>) =>
    setPatients(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));

  const shown = (filter === 'all' ? patients : patients.filter(p => p.status === filter))
    .slice().sort((a,b) => b.treatmentValue - a.treatmentValue);

  const totalValue = patients
    .filter(p => p.status !== 'scheduled' && p.status !== 'declined')
    .reduce((s,p) => s + p.treatmentValue, 0);

  return (
    <section className="tracker-section">
      <div className="tracker-header">
        <div>
          <h2 className="tracker-title">🦷 Unscheduled Treatment Plans</h2>
          <div className="tracker-sub">{fmt(totalValue)} in unscheduled production · sorted high → low value</div>
        </div>
        <div className="tracker-pills">
          {(['all','new','called','texted','left-vm','no-answer','scheduled'] as const).map(s => (
            <button key={s} className={`filter-pill ${filter===s?'active':''}`} onClick={()=>setFilter(s)}>
              {s==='all' ? `All (${patients.length})` : contactStatusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      <ProtocolBox steps={TX_PROTOCOL} />

      <div className="tracker-table-wrap">
        <table className="tracker-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Phone</th>
              <th>Treatment</th>
              <th>Value</th>
              <th>Plan Date</th>
              <th>Days Since</th>
              <th>Attempts</th>
              <th>Status</th>
              <th>Update Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(p => (
              <tr key={p.id} className={p.status === 'scheduled' ? 'row-done' : ''}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <Avatar name={p.name} size={30} />
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{p.name}</div>
                      <div style={{fontSize:11,color:'var(--gray-400)'}}>Last: {p.lastContact}</div>
                    </div>
                  </div>
                </td>
                <td><a href={`tel:${p.phone}`} className="phone-link">{p.phone}</a></td>
                <td style={{fontSize:12,color:'var(--gray-600)',maxWidth:180}}>{p.procedures}</td>
                <td>
                  <span style={{
                    fontWeight:800, fontSize:15,
                    color: p.treatmentValue >= 2000 ? '#16a34a' : p.treatmentValue >= 1000 ? '#2563eb' : 'var(--gray-700)',
                  }}>{fmt(p.treatmentValue)}</span>
                </td>
                <td style={{fontSize:13,color:'var(--gray-500)'}}>{p.planDate}</td>
                <td>
                  <span style={{fontWeight:700,color:urgencyColor(p.daysSincePlan,'tx')}}>{p.daysSincePlan}d</span>
                </td>
                <td style={{textAlign:'center',fontWeight:700,color:p.attempts>=3?'#dc2626':'var(--gray-600)'}}>{p.attempts}</td>
                <td><StatusPill label={contactStatusLabel[p.status]} color={contactStatusColor[p.status]} /></td>
                <td>
                  <select
                    className="status-select"
                    value={p.status}
                    onChange={e => update(p.id, {
                      status: e.target.value as ContactStatus,
                      attempts: p.attempts + 1,
                      lastContact: 'Today',
                    })}
                  >
                    <option value="new">New</option>
                    <option value="called">Called</option>
                    <option value="texted">Texted</option>
                    <option value="left-vm">Left VM</option>
                    <option value="no-answer">No Answer</option>
                    <option value="scheduled">Scheduled ✓</option>
                    <option value="declined">Declined</option>
                  </select>
                </td>
                <td>
                  <NoteField value={p.notes} onChange={v => update(p.id, { notes: v })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── AR tracker ───────────────────────────────────────────────────────────────

function ArTracker() {
  const [claims, setClaims] = useState(seedAr);
  const [filter, setFilter] = useState<'all' | ClaimStatus>('all');

  const update = (id: number, patch: Partial<ArClaim>) =>
    setClaims(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));

  const shown = filter === 'all' ? claims : claims.filter(c => c.status === filter);
  const totalAr = claims
    .filter(c => c.status !== 'resolved' && c.status !== 'write-off')
    .reduce((s,c) => s + c.claimAmount, 0);

  return (
    <section className="tracker-section">
      <div className="tracker-header">
        <div>
          <h2 className="tracker-title">💰 Accounts Receivable</h2>
          <div className="tracker-sub">{fmt(totalAr)} total outstanding · tracker per patient claim</div>
        </div>
        <div className="tracker-pills">
          {(['all','filed','pending','partial','needs-appeal','resolved'] as const).map(s => (
            <button key={s} className={`filter-pill ${filter===s?'active':''}`} onClick={()=>setFilter(s)}>
              {s==='all' ? `All (${claims.length})` : claimStatusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      <ProtocolBox steps={AR_PROTOCOL} />

      <div className="tracker-table-wrap">
        <table className="tracker-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Insurance</th>
              <th>Claim Total</th>
              <th>Ins. Portion</th>
              <th>Pt. Portion</th>
              <th>Filed</th>
              <th>Days Out</th>
              <th>Last Action</th>
              <th>Status</th>
              <th>Update</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(c => (
              <tr key={c.id} className={c.status === 'resolved' || c.status === 'write-off' ? 'row-done' : ''}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <Avatar name={c.name} size={30} />
                    <span style={{fontWeight:600,fontSize:13}}>{c.name}</span>
                  </div>
                </td>
                <td style={{fontSize:12,color:'var(--gray-600)'}}>{c.insuranceName}</td>
                <td style={{fontWeight:700,fontSize:13}}>{fmt(c.claimAmount)}</td>
                <td style={{fontSize:13,color:'#2563eb'}}>{fmt(c.insurancePortion)}</td>
                <td style={{fontSize:13,color:c.patientPortion>0?'#d97706':'var(--gray-400)'}}>{fmt(c.patientPortion)}</td>
                <td style={{fontSize:12,color:'var(--gray-500)'}}>{c.dateFiled}</td>
                <td>
                  <span style={{fontWeight:800,fontSize:15,color:urgencyColor(c.daysOutstanding,'ar')}}>{c.daysOutstanding}d</span>
                </td>
                <td style={{fontSize:11,color:'var(--gray-500)',maxWidth:140}}>{c.lastAction}</td>
                <td><StatusPill label={claimStatusLabel[c.status]} color={claimStatusColor[c.status]} /></td>
                <td>
                  <select
                    className="status-select"
                    value={c.status}
                    onChange={e => update(c.id, { status: e.target.value as ClaimStatus })}
                  >
                    <option value="filed">Filed</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial Paid</option>
                    <option value="needs-appeal">Needs Appeal</option>
                    <option value="resolved">Resolved ✓</option>
                    <option value="write-off">Write-Off</option>
                  </select>
                </td>
                <td>
                  <NoteField value={c.notes} onChange={v => update(c.id, { notes: v, lastAction: v || c.lastAction })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Summary bar ──────────────────────────────────────────────────────────────

function SummaryBar() {
  const recallUrgent = seedRecall.filter(p => p.daysOverdue >= 90 && p.status !== 'scheduled').length;
  const txValue      = seedTx.filter(p => p.status !== 'scheduled' && p.status !== 'declined').reduce((s,p)=>s+p.treatmentValue,0);
  const arUrgent     = seedAr.filter(c => c.daysOutstanding >= 60 && c.status !== 'resolved').length;

  return (
    <div className="summary-bar">
      <div className="summary-item">
        <div className="summary-num" style={{color:'#dc2626'}}>{recallUrgent}</div>
        <div className="summary-label">Recall patients 90+ days overdue</div>
      </div>
      <div className="summary-divider"/>
      <div className="summary-item">
        <div className="summary-num" style={{color:'#16a34a'}}>{fmt(txValue)}</div>
        <div className="summary-label">Unscheduled production value</div>
      </div>
      <div className="summary-divider"/>
      <div className="summary-item">
        <div className="summary-num" style={{color:'#d97706'}}>{arUrgent}</div>
        <div className="summary-label">AR claims 60+ days outstanding</div>
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-logo">
          <div className="logo-icon">D</div>
          <span className="logo-text">Dent<span>Books</span></span>
        </div>
        <div className="app-header-center">{today}</div>
        <div style={{width:140,textAlign:'right',fontSize:13,color:'var(--gray-400)'}}>Dr. Rachel Kim</div>
      </header>

      <SummaryBar />

      <main className="app-main">
        <RecallTracker />
        <TxTracker />
        <ArTracker />
      </main>
    </div>
  );
}
