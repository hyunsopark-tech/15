import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  OdAppointment, OdProduction, OdAgingRow, OdNewPatient, OdPayment,
  parseAppointments, parseProduction, parseAging, parseNewPatients, parsePayments,
} from './odParsers';

export type ReportKey = 'appointments' | 'production' | 'aging' | 'newPatients' | 'payments';

export interface UploadedReport {
  key: ReportKey;
  filename: string;
  uploadedAt: Date;
  rowCount: number;
}

interface DashboardData {
  appointments: OdAppointment[];
  production: OdProduction[];
  aging: OdAgingRow[];
  newPatients: OdNewPatient[];
  payments: OdPayment[];
  uploads: UploadedReport[];
  ingest: (key: ReportKey, filename: string, csv: string) => void;
}

const Ctx = createContext<DashboardData | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<OdAppointment[]>([]);
  const [production, setProduction]     = useState<OdProduction[]>([]);
  const [aging, setAging]               = useState<OdAgingRow[]>([]);
  const [newPatients, setNewPatients]   = useState<OdNewPatient[]>([]);
  const [payments, setPayments]         = useState<OdPayment[]>([]);
  const [uploads, setUploads]           = useState<UploadedReport[]>([]);

  const ingest = (key: ReportKey, filename: string, csv: string) => {
    let rowCount = 0;
    switch (key) {
      case 'appointments': { const rows = parseAppointments(csv); setAppointments(rows); rowCount = rows.length; break; }
      case 'production':   { const rows = parseProduction(csv);   setProduction(rows);   rowCount = rows.length; break; }
      case 'aging':        { const rows = parseAging(csv);        setAging(rows);        rowCount = rows.length; break; }
      case 'newPatients':  { const rows = parseNewPatients(csv);  setNewPatients(rows);  rowCount = rows.length; break; }
      case 'payments':     { const rows = parsePayments(csv);     setPayments(rows);     rowCount = rows.length; break; }
    }
    setUploads(prev => [
      { key, filename, uploadedAt: new Date(), rowCount },
      ...prev.filter(u => u.key !== key),
    ]);
  };

  return (
    <Ctx.Provider value={{ appointments, production, aging, newPatients, payments, uploads, ingest }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider');
  return ctx;
}
