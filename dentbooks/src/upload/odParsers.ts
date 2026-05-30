/**
 * Open Dental CSV parsers.
 * Each function accepts the raw string from Papa.parse and returns
 * typed records the dashboard can consume.
 *
 * Open Dental export paths:
 *   Appointments : Reports > Daily > Appointments  (File > Export > CSV)
 *   Production   : Reports > Daily > Production
 *   Aging        : Reports > Lists > Aging of A/R
 *   New Patients : Reports > Lists > New Patients
 *   Payments     : Reports > Daily > Payments
 */

import Papa from 'papaparse';

export interface OdAppointment {
  time: string;      // "09:00"
  name: string;
  type: string;
  provider: string;
  status: 'confirmed' | 'pending' | 'arrived' | 'cancelled' | 'completed';
  patientId: string;
}

export interface OdProduction {
  date: string;      // "YYYY-MM-DD"
  provider: string;
  production: number;
  adjustments: number;
  net: number;
}

export interface OdAgingRow {
  patientId: string;
  name: string;
  balance0_30: number;
  balance31_60: number;
  balance61_90: number;
  balance90plus: number;
  total: number;
}

export interface OdNewPatient {
  patientId: string;
  name: string;
  dateAdded: string;
  referral: string;
  phone: string;
}

export interface OdPayment {
  date: string;
  patientName: string;
  amount: number;
  type: string;      // "Check", "Credit Card", "Cash", etc.
  note: string;
}

function parseRows(csv: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
  });
  return result.data;
}

/** Normalise an Open Dental appointment status string → our union */
function normaliseStatus(raw: string): OdAppointment['status'] {
  const s = (raw || '').toLowerCase().trim();
  if (s.includes('complete')) return 'completed';
  if (s.includes('arrive') || s.includes('in chair')) return 'arrived';
  if (s.includes('cancel') || s.includes('broken')) return 'cancelled';
  if (s.includes('unscheduled') || s.includes('asap') || s.includes('need')) return 'pending';
  return 'confirmed';
}

/**
 * Open Dental Appointment List CSV columns (common):
 *   AptDateTime, PatientName, ProcDescript, ProvAbbr, AptStatus, PatNum
 */
export function parseAppointments(csv: string): OdAppointment[] {
  return parseRows(csv).map(r => {
    const dt = r['AptDateTime'] || r['Date/Time'] || r['DateTime'] || '';
    const timePart = dt.includes(' ') ? dt.split(' ')[1] : dt;
    const hhmm = timePart.substring(0, 5);
    return {
      time: hhmm || '00:00',
      name: r['PatientName'] || r['Patient Name'] || r['Patient'] || '',
      type: r['ProcDescript'] || r['Procedure'] || r['Description'] || '',
      provider: r['ProvAbbr'] || r['Provider'] || '',
      status: normaliseStatus(r['AptStatus'] || r['Status'] || ''),
      patientId: r['PatNum'] || r['PatientID'] || '',
    };
  }).filter(a => a.name);
}

/**
 * Open Dental Daily Production CSV columns:
 *   Date, ProvAbbr, Production, Adjustments, Net Production
 */
export function parseProduction(csv: string): OdProduction[] {
  return parseRows(csv).map(r => ({
    date: r['Date'] || '',
    provider: r['ProvAbbr'] || r['Provider'] || '',
    production: parseFloat((r['Production'] || '0').replace(/[$,]/g, '')),
    adjustments: parseFloat((r['Adjustments'] || '0').replace(/[$,]/g, '')),
    net: parseFloat((r['Net Production'] || r['NetProduction'] || '0').replace(/[$,]/g, '')),
  })).filter(p => p.date);
}

/**
 * Open Dental A/R Aging CSV columns:
 *   PatNum, PatientName, 0-30, 31-60, 61-90, Over 90, Total
 */
export function parseAging(csv: string): OdAgingRow[] {
  return parseRows(csv).map(r => ({
    patientId: r['PatNum'] || r['PatientID'] || '',
    name: r['PatientName'] || r['Patient Name'] || r['Patient'] || '',
    balance0_30:  parseFloat((r['0-30']  || r['0_30']  || '0').replace(/[$,]/g, '')),
    balance31_60: parseFloat((r['31-60'] || r['31_60'] || '0').replace(/[$,]/g, '')),
    balance61_90: parseFloat((r['61-90'] || r['61_90'] || '0').replace(/[$,]/g, '')),
    balance90plus: parseFloat((r['Over 90'] || r['90+'] || r['Over90'] || '0').replace(/[$,]/g, '')),
    total: parseFloat((r['Total'] || '0').replace(/[$,]/g, '')),
  })).filter(p => p.name);
}

/**
 * Open Dental New Patients CSV columns:
 *   PatNum, PatientName, DateFirstVisit, ReferralSource, HmPhone
 */
export function parseNewPatients(csv: string): OdNewPatient[] {
  return parseRows(csv).map(r => ({
    patientId: r['PatNum'] || r['PatientID'] || '',
    name: r['PatientName'] || r['Patient Name'] || r['Patient'] || '',
    dateAdded: r['DateFirstVisit'] || r['Date'] || '',
    referral: r['ReferralSource'] || r['Referral'] || '',
    phone: r['HmPhone'] || r['Phone'] || '',
  })).filter(p => p.name);
}

/**
 * Open Dental Payments CSV columns:
 *   PayDate, PatientName, PayAmt, PayType, PayNote
 */
export function parsePayments(csv: string): OdPayment[] {
  return parseRows(csv).map(r => ({
    date: r['PayDate'] || r['Date'] || '',
    patientName: r['PatientName'] || r['Patient Name'] || r['Patient'] || '',
    amount: parseFloat((r['PayAmt'] || r['Amount'] || '0').replace(/[$,]/g, '')),
    type: r['PayType'] || r['Type'] || '',
    note: r['PayNote'] || r['Note'] || '',
  })).filter(p => p.patientName);
}
