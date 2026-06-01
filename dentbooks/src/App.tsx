import React, { useState } from 'react';
import './App.css';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardProvider, useDashboard } from './upload/DashboardContext';
import UploadPage from './upload/UploadPage';

// ── Static seed data (shown when no report uploaded yet) ────────────────────

const seedAppointments = [
  { id:1, time:'08:30', name:'Sarah Mitchell', type:'Teeth Cleaning',  status:'arrived',   initials:'SM', color:'#2563eb' },
  { id:2, time:'09:00', name:'James Okafor',   type:'Root Canal',      status:'confirmed', initials:'JO', color:'#7c3aed' },
  { id:3, time:'09:45', name:'Priya Sharma',   type:'Orthodontics',    status:'confirmed', initials:'PS', color:'#db2777' },
  { id:4, time:'10:30', name:'David Chen',     type:'Tooth Extraction',status:'pending',   initials:'DC', color:'#ea580c' },
  { id:5, time:'11:00', name:'Maria Lopez',    type:'Dental Implant',  status:'confirmed', initials:'ML', color:'#16a34a' },
  { id:6, time:'11:30', name:'Tom Brewer',     type:'Whitening',       status:'cancelled', initials:'TB', color:'#0891b2' },
  { id:7, time:'13:00', name:'Anna Nguyen',    type:'X-Ray + Exam',    status:'confirmed', initials:'AN', color:'#854d0e' },
  { id:8, time:'14:00', name:'Robert Stone',   type:'Filling',         status:'pending',   initials:'RS', color:'#1d4ed8' },
];

const seedRevenueData = [
  { month:'Jan', revenue:18400, target:20000 },{ month:'Feb', revenue:21200, target:20000 },
  { month:'Mar', revenue:19800, target:22000 },{ month:'Apr', revenue:24600, target:22000 },
  { month:'May', revenue:26100, target:24000 },{ month:'Jun', revenue:23400, target:24000 },
  { month:'Jul', revenue:28900, target:26000 },{ month:'Aug', revenue:31200, target:28000 },
  { month:'Sep', revenue:29800, target:28000 },{ month:'Oct', revenue:33400, target:30000 },
  { month:'Nov', revenue:35100, target:32000 },{ month:'Dec', revenue:38200, target:34000 },
];

const seedPatients = [
  { id:1, name:'Sarah Mitchell', initials:'SM', color:'#2563eb', lastVisit:'May 30, 2026', treatment:'Cleaning',        balance:'$0',   status:'Active'  },
  { id:2, name:'James Okafor',   initials:'JO', color:'#7c3aed', lastVisit:'May 28, 2026', treatment:'Root Canal #2',   balance:'$450', status:'Active'  },
  { id:3, name:'Priya Sharma',   initials:'PS', color:'#db2777', lastVisit:'May 27, 2026', treatment:'Retainer Check',  balance:'$0',   status:'Active'  },
  { id:4, name:'David Chen',     initials:'DC', color:'#ea580c', lastVisit:'May 25, 2026', treatment:'Extraction',      balance:'$180', status:'Overdue' },
  { id:5, name:'Maria Lopez',    initials:'ML', color:'#16a34a', lastVisit:'May 22, 2026', treatment:'Implant Consult', balance:'$0',   status:'Active'  },
];

const seedTasks = [
  { id:1, text:'Call back Tom Brewer re: cancellation', meta:'High priority', defaultDone:false },
  { id:2, text:'Order composite resin (shade A3)',       meta:'Inventory',     defaultDone:false },
  { id:3, text:'Send recall reminders — June batch',    meta:'48 patients',   defaultDone:true  },
  { id:4, text:'Review insurance claims — May',          meta:'12 pending',    defaultDone:false },
  { id:5, text:'Update sterilization log',              meta:'Compliance',    defaultDone:true  },
];

const seedActivity = [
  { icon:'💳', bg:'#eff6ff', text:'Payment received from James Okafor — $850',          time:'2 min ago'  },
  { icon:'📅', bg:'#f0fdf4', text:'New appointment booked: Anna Nguyen, 1:00 PM today',  time:'18 min ago' },
  { icon:'⚠️', bg:'#fffbeb', text:'Tom Brewer cancelled his 11:30 AM slot',              time:'34 min ago' },
  { icon:'📋', bg:'#fef2f2', text:'Insurance claim submitted for Robert Stone',           time:'1 hr ago'   },
  { icon:'👤', bg:'#f5f3ff', text:'New patient registered: Olivia Park',                 time:'2 hr ago'   },
];

// ── Nav ──────────────────────────────────────────────────────────────────────

const navItems = [
  { icon:'🏠', label:'Dashboard',   section:'main',     badge: null },
  { icon:'📅', label:'Appointments',section:'main',     badge: '8' },
  { icon:'👥', label:'Patients',    section:'main',     badge: null },
  { icon:'💊', label:'Treatments',  section:'clinical', badge: null },
  { icon:'🦷', label:'Charting',    section:'clinical', badge: null },
  { icon:'💰', label:'Billing',     section:'billing',  badge: '3' },
  { icon:'📄', label:'Insurance',   section:'billing',  badge: null },
  { icon:'📊', label:'Reports',     section:'admin',    badge: null },
  { icon:'📤', label:'Upload Data', section:'admin',    badge: null },
  { icon:'⚙️', label:'Settings',   section:'admin',    badge: null },
];

const sectionLabels: Record<string,string> = { main:'Main', clinical:'Clinical', billing:'Billing', admin:'Admin' };

// ── Helpers ──────────────────────────────────────────────────────────────────

const avatarColors = ['#2563eb','#7c3aed','#db2777','#ea580c','#16a34a','#0891b2','#854d0e'];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
}
function colorFor(name: string) {
  let h = 0; for (const c of name) h = c.charCodeAt(0) + h * 31;
  return avatarColors[Math.abs(h) % avatarColors.length];
}
function fmt(n: number) { return '$' + Math.round(n).toLocaleString(); }
function StatusBadge({ status }: { status: string }) {
  return <span className={`appt-status status-${status}`}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>;
}

// ── Dashboard (data-aware) ───────────────────────────────────────────────────

function Dashboard() {
  const { appointments: odAppts, production, aging, newPatients, payments, uploads } = useDashboard();
  const [tasksDone, setTasksDone] = useState<Set<number>>(new Set([3,5]));

  const toggleTask = (id: number) =>
    setTasksDone(prev => { const s = new Set(prev); s.has(id)?s.delete(id):s.add(id); return s; });

  // Resolve appointment rows — prefer uploaded data
  const apptRows = odAppts.length
    ? odAppts.map((a,i) => ({
        id: i, time: a.time, name: a.name, type: a.type,
        status: a.status, initials: initials(a.name), color: colorFor(a.name),
      }))
    : seedAppointments;

  // Revenue chart — build from production upload or fall back to seed
  const revenueData = production.length
    ? (() => {
        const byMonth: Record<string,number> = {};
        for (const p of production) {
          const m = new Date(p.date).toLocaleString('en-US',{month:'short'});
          byMonth[m] = (byMonth[m]||0) + p.net;
        }
        return Object.entries(byMonth).map(([month,revenue]) => ({ month, revenue, target: revenue*0.9 }));
      })()
    : seedRevenueData;

  // KPI numbers
  const todayRevenue  = production.length ? production.reduce((s,p)=>s+p.net,0) : 3840;
  const outstandingAR = aging.length      ? aging.reduce((s,a)=>s+a.total,0)    : 6300;
  const newPtCount    = newPatients.length || 3;

  // Patients table — derive from aging if available, else seed
  const patientRows = aging.length
    ? aging.slice(0,8).map((a,i) => ({
        id: i, name: a.name, initials: initials(a.name), color: colorFor(a.name),
        lastVisit: '—', treatment: '—',
        balance: a.total > 0 ? fmt(a.total) : '$0',
        status: a.total > 90 ? 'Overdue' : 'Active',
      }))
    : seedPatients;

  // Activity — prepend payment uploads
  const activityRows = payments.slice(0,3).map(p => ({
    icon:'💳', bg:'#eff6ff',
    text: `Payment received from ${p.patientName} — ${fmt(p.amount)}`,
    time: 'uploaded',
  })).concat(seedActivity).slice(0,8);

  const hasData = uploads.length > 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Good morning, Dr. Kim 👋</div>
          <div className="page-date">
            {hasData
              ? `Live data from ${uploads.length} uploaded Open Dental report${uploads.length>1?'s':''}`
              : 'Showing sample data — upload Open Dental reports to see live data'}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-secondary">📥 Export Report</button>
          <button className="btn btn-secondary">📅 View Schedule</button>
        </div>
      </div>

      {/* Upload nudge */}
      {!hasData && (
        <div style={{
          background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10,
          padding:'12px 18px', marginBottom:20, display:'flex',
          alignItems:'center', gap:12, fontSize:13,
        }}>
          <span>📤</span>
          <span>
            <strong>Connect your data:</strong> Go to <strong>Upload Data</strong> in the sidebar and drop your Open Dental CSV exports to populate the dashboard with real numbers.
          </span>
        </div>
      )}

      {/* KPI row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">Today's Revenue</div>
            <div className="kpi-icon" style={{ background:'#eff6ff' }}>💰</div>
          </div>
          <div className="kpi-value">{fmt(todayRevenue)}</div>
          <div className="kpi-change up">↑ 12% <span>vs last Friday</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">Appointments</div>
            <div className="kpi-icon" style={{ background:'#f0fdf4' }}>📅</div>
          </div>
          <div className="kpi-value">{apptRows.length}</div>
          <div className="kpi-change up">↑ 2 <span>more than avg</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">New Patients</div>
            <div className="kpi-icon" style={{ background:'#f5f3ff' }}>👤</div>
          </div>
          <div className="kpi-value">{newPtCount}</div>
          <div className="kpi-change up">↑ 50% <span>vs last week</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">Outstanding A/R</div>
            <div className="kpi-icon" style={{ background:'#fef2f2' }}>⚠️</div>
          </div>
          <div className="kpi-value">{fmt(outstandingAR)}</div>
          <div className="kpi-change down">↑ $420 <span>since yesterday</span></div>
        </div>
      </div>

      {/* Appointments + Revenue */}
      <div className="section-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              Today's Appointments
              {odAppts.length > 0 && <span style={{ marginLeft:8, fontSize:11, color:'var(--success)', fontWeight:600 }}>● Live</span>}
            </div>
            <button className="card-action">View all →</button>
          </div>
          <div className="appt-list">
            {apptRows.slice(0,10).map(a => (
              <div className="appt-item" key={a.id}>
                <div className="appt-time">{a.time}</div>
                <div className="appt-avatar" style={{ background: a.color }}>{a.initials}</div>
                <div className="appt-info">
                  <div className="appt-name">{a.name}</div>
                  <div className="appt-type">{a.type}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              Revenue
              {production.length > 0 && <span style={{ marginLeft:8, fontSize:11, color:'var(--success)', fontWeight:600 }}>● Live</span>}
            </div>
            <button className="card-action">Monthly ▾</button>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v:any)=>['$'+v.toLocaleString()]} contentStyle={{ borderRadius:8, border:'1px solid #e5e7eb', fontSize:12 }} />
                <Area type="monotone" dataKey="target"  stroke="#16a34a" strokeWidth={1.5} strokeDasharray="4 2" fill="none" name="Target" />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#rev)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Patients */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header">
          <div className="card-title">
            {aging.length ? 'A/R Aging — Patient Balances' : 'Recent Patients'}
            {aging.length > 0 && <span style={{ marginLeft:8, fontSize:11, color:'var(--success)', fontWeight:600 }}>● Live</span>}
          </div>
          <button className="card-action">View all →</button>
        </div>
        <table className="patients-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Last Visit</th>
              <th>Treatment</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {patientRows.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="patient-name-cell">
                    <div className="table-avatar" style={{ background: p.color }}>{p.initials}</div>
                    {p.name}
                  </div>
                </td>
                <td>{p.lastVisit}</td>
                <td>{p.treatment}</td>
                <td style={{ fontWeight:600, color: p.balance==='$0'?'var(--success)':'var(--warning)' }}>{p.balance}</td>
                <td><span className={`appt-status ${p.status==='Active'?'status-confirmed':'status-cancelled'}`}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom grid */}
      <div className="bottom-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Today's Tasks</div>
            <button className="card-action">+ Add</button>
          </div>
          <div className="task-list">
            {seedTasks.map(t => {
              const done = tasksDone.has(t.id);
              return (
                <div className="task-item" key={t.id}>
                  <div className={`task-check ${done?'done':''}`} onClick={()=>toggleTask(t.id)}>{done?'✓':''}</div>
                  <div>
                    <div className={`task-text ${done?'done':''}`}>{t.text}</div>
                    <div className="task-meta">{t.meta}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Practice Health</div>
          </div>
          {[
            ['🧑‍🤝‍🧑 Active Patients', '842'],
            ['📅 Avg Daily Appts', apptRows.length > 0 ? apptRows.length.toString() : '6.4'],
            ['💰 MTD Revenue', production.length ? fmt(production.reduce((s,p)=>s+p.net,0)) : '$38,200'],
            ['⏱ Avg Wait Time', '7 min'],
          ].map(([label,val]) => (
            <div className="stat-row" key={label}>
              <div className="stat-label">{label}</div>
              <div className="stat-val">{val}</div>
            </div>
          ))}
          <div className="stat-bar-wrap">
            <div className="stat-bar-label"><span>Chair utilisation</span><span>81%</span></div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{ width:'81%', background:'var(--success)' }} /></div>
          </div>
          <div className="stat-bar-wrap">
            <div className="stat-bar-label"><span>Recall rate</span><span>74%</span></div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{ width:'74%' }} /></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
          </div>
          <div className="activity-list">
            {activityRows.map((a,i) => (
              <div className="activity-item" key={i}>
                <div className="activity-dot" style={{ background: a.bg }}>{a.icon}</div>
                <div>
                  <div className="activity-text">{a.text}</div>
                  <div className="activity-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

function AppInner() {
  const [activeNav, setActiveNav] = useState('Dashboard');
  return (
    <DashboardProvider onNavigate={setActiveNav}>
      <Shell2 activeNav={activeNav} setActiveNav={setActiveNav} />
    </DashboardProvider>
  );
}

function Shell2({ activeNav, setActiveNav }: { activeNav: string; setActiveNav: (p: string) => void }) {
  const { uploads } = useDashboard();

  const groupedNav: Record<string, typeof navItems> = {};
  for (const item of navItems) {
    if (!groupedNav[item.section]) groupedNav[item.section] = [];
    groupedNav[item.section].push(item);
  }

  const today = new Date().toLocaleDateString('en-US',{ weekday:'long', year:'numeric', month:'long', day:'numeric' });

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">D</div>
          <div className="sidebar-logo-text">Dent<span>Books</span></div>
        </div>
        <nav className="sidebar-nav">
          {Object.entries(groupedNav).map(([sec,items]) => (
            <div className="nav-section" key={sec}>
              <div className="nav-section-label">{sectionLabels[sec]}</div>
              {items.map(item => {
                const badge = item.label === 'Upload Data'
                  ? (uploads.length > 0 ? uploads.length.toString() : null)
                  : item.badge;
                return (
                  <button
                    key={item.label}
                    className={`nav-item ${activeNav===item.label?'active':''}`}
                    onClick={() => setActiveNav(item.label)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                    {badge && <span className="nav-badge">{badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">DR</div>
            <div>
              <div className="user-name">Dr. Rachel Kim</div>
              <div className="user-role">Practice Owner</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <div>
            <div className="header-title">{activeNav}</div>
            <div className="header-subtitle">{today}</div>
          </div>
          <div className="header-actions">
            <div className="search-wrap">
              <span>🔍</span>
              <input type="text" placeholder="Search patients…" />
            </div>
            <button className="icon-btn" title="Notifications">🔔<span className="notif-dot"/></button>
            <button className="icon-btn" title="Help">❓</button>
            <button className="btn btn-primary">+ New Appointment</button>
          </div>
        </header>

        {activeNav === 'Upload Data' ? <UploadPage /> : <Dashboard />}
      </div>
    </div>
  );
}

export default function App() {
  return <AppInner />;
}
