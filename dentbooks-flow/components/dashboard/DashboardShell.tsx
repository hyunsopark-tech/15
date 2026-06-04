"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Activity, Download, Upload, Bell, Settings,
  FileSpreadsheet, CheckCircle,
  XCircle, AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import WorkflowTabs from "./WorkflowTabs";
import StaffProgress from "./StaffProgress";
import CallCenter from "./CallCenter";
import LoginScreen from "./LoginScreen";
import { mockDailyMetrics, mockPatients } from "@/lib/mock-data";
import { Patient } from "@/lib/types";

interface ImportResult {
  success: boolean;
  rowCount: number;
  sheetName: string;
  preview: string[][];
  parsed: Patient[];
  error?: string;
}

// Convert Excel serial date number to ISO string (handles Open Dental .xls exports)
function excelSerialToISO(serial: number | string): string {
  const n = typeof serial === "string" ? parseFloat(serial) : serial;
  if (!n || isNaN(n)) return "";
  // Excel epoch: Jan 1 1900 = serial 1 (with leap-year-1900 bug so subtract 1 extra)
  const date = new Date((n - 25569) * 86400 * 1000);
  return date.toISOString().split("T")[0];
}

// Map an Open Dental Recall List Excel row to a Patient object
function rowToPatient(row: Record<string, unknown>, index: number): Patient {
  const str = (v: unknown) => (v !== undefined && v !== null && v !== "" ? String(v).trim() : "");

  // Name — Open Dental exports LName, FName, Preferred separately
  const lname = str(row["LName"]);
  const fname = str(row["Preferred"]) || str(row["FName"]);
  const patientName = fname && lname ? `${fname} ${lname}` : lname || fname || `Patient ${index + 1}`;

  // Guardian — not in recall export; use last name family as placeholder
  const guardianName = lname ? `${lname} Family` : "See Open Dental";

  // Phone — prefer home, fall back to wireless, then work
  const phone =
    str(row["HmPhone"]) ||
    str(row["WirelessPhone"]) ||
    str(row["WkPhone"]) ||
    "—";

  // Dates stored as Excel serial numbers
  const dateDueSerial = Number(row["DateDue"]) || 0;
  const birthdateSerial = Number(row["Birthdate"]) || 0;

  const dateDueISO = excelSerialToISO(dateDueSerial);
  const dobISO = excelSerialToISO(birthdateSerial);

  // Days overdue = today minus due date (in days)
  let daysOverdue = 0;
  if (dateDueSerial > 0) {
    const todaySerial = Math.floor(Date.now() / 86400000) + 25569;
    daysOverdue = Math.max(0, todaySerial - dateDueSerial);
  }

  const priority =
    daysOverdue >= 180 ? "critical"
    : daysOverdue >= 120 ? "high"
    : daysOverdue >= 60  ? "medium"
    : "low";

  return {
    id: `import-${index}-${Date.now()}`,
    patientName,
    guardianName,
    phone,
    insurance: "See Open Dental",
    dob: dobISO,
    lastVisit: dateDueISO,
    provider: "See Open Dental",
    assignedStaff: "Lesley",
    priority,
    status: "new",
    daysOverdue,
    estimatedValue: 285,
    attemptCount: 0,
    nextStep: daysOverdue > 0
      ? `Recall due ${daysOverdue} days ago — first outreach call`
      : "Upcoming recall — monitor",
    notes: `City: ${str(row["City"])}, ${str(row["State"])} ${str(row["Zip"])}`.trim(),
    workflow: "recall",
    recallType: "Prophy + Exam",
  };
}

export default function DashboardShell() {
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [currentStaffName, setCurrentStaffName] = useState<string>("");
  const [activeView, setActiveView] = useState<"workflows" | "tracker" | "callcenter">("workflows");
  const [trackerMountKey, setTrackerMountKey] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [allPatients, setAllPatients] = useState<Patient[]>(mockPatients);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show login screen if not logged in
  if (!currentStaffId) {
    return (
      <LoginScreen
        onLogin={(id, name) => {
          setCurrentStaffId(id);
          setCurrentStaffName(name);
        }}
      />
    );
  }

  const handleFile = (file: File) => {
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".xlsx", ".xls"].includes(ext)) {
      setImportResult({
        success: false, rowCount: 0, sheetName: "", preview: [], parsed: [],
        error: "Please upload an Excel file (.xlsx or .xls) exported from Open Dental.",
      });
      return;
    }

    setImporting(true);
    const reader = new FileReader();
    const isLegacy = ext === ".xls";

    const parse = (raw: string | ArrayBuffer) => {
      try {
        const workbook = isLegacy
          ? XLSX.read(raw as string, { type: "binary" })
          : XLSX.read(new Uint8Array(raw as ArrayBuffer), { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Preview (raw rows for display)
        const rawRows: string[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1, defval: "",
        }) as string[][];
        const dataRows = rawRows.filter((r) => r.some((c) => c !== ""));
        const preview = dataRows.slice(0, 6);

        // Parsed objects (header row as keys) — keep raw types so serial dates stay numeric
        const objRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
        }) as Record<string, unknown>[];

        const parsed = objRows.map((row, i) => rowToPatient(row, i));

        setImportResult({
          success: true,
          rowCount: parsed.length,
          sheetName,
          preview,
          parsed,
        });
      } catch {
        setImportResult({
          success: false, rowCount: 0, sheetName: "", preview: [], parsed: [],
          error: "Could not read this file. Make sure it's a valid Excel export from Open Dental.",
        });
      } finally {
        setImporting(false);
      }
    };

    reader.onload = (e) => parse(e.target?.result as string | ArrayBuffer);
    isLegacy ? reader.readAsBinaryString(file) : reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (!importResult?.parsed.length) return;
    // Replace existing recall patients with imported ones, keep treatment + claims
    setAllPatients((prev) => [
      ...prev.filter((p) => p.workflow !== "recall"),
      ...importResult.parsed,
    ]);
    handleCloseImport();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleCloseImport = () => {
    setShowImportModal(false);
    setImportResult(null);
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* ── TOP NAV ──────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-5 gap-4 z-20 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2.5 mr-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div className="leading-none">
            <div className="font-bold text-slate-900 text-sm">DentBooks</div>
            <div className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase">Flow</div>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {([
            { id: "workflows", label: "Revenue Recovery" },
            { id: "callcenter", label: "📞 Call Center" },
            { id: "tracker", label: "Daily Tracker" },
          ] as const).map((v) => (
            <button
              key={v.id}
              onClick={() => { setActiveView(v.id); if (v.id === "tracker") setTrackerMountKey((k) => k + 1); }}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeView === v.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />


        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
          Import Recall List
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all">
          <Download className="w-3.5 h-3.5" />
          Export Daily Report
        </button>

        <div className="flex items-center gap-1 ml-1">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all">
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setCurrentStaffId(null); setCurrentStaffName(""); }}
            className="flex items-center gap-2 ml-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-all"
            title="Switch user"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{
                backgroundColor:
                  currentStaffId === "vanessa" ? "#7C3AED"
                  : currentStaffId === "lesley" ? "#2563EB"
                  : currentStaffId === "jen" ? "#0891B2"
                  : "#16A34A"
              }}
            >
              {currentStaffName.charAt(0)}
            </div>
            <span className="text-xs font-medium text-slate-600">{currentStaffName}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {activeView === "workflows" && <WorkflowTabs patients={allPatients} currentStaffId={currentStaffId!} />}
          {activeView === "callcenter" && <CallCenter />}
          {activeView === "tracker" && <StaffProgress key={trackerMountKey} currentStaffId={currentStaffId!} currentStaffName={currentStaffName} />}
        </motion.div>
      </main>

      {/* ── IMPORT MODAL ─────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Import Overdue Recall List</h3>
                  <p className="text-xs text-slate-400">Excel export from Open Dental (.xlsx or .xls)</p>
                </div>
              </div>
              <button onClick={handleCloseImport} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-blue-800 mb-1">How to export from Open Dental:</p>
                <ol className="text-xs text-blue-700 space-y-0.5 list-decimal list-inside">
                  <li>Reports → Standard → Patient Lists → Recall List</li>
                  <li>Filter by Status: Past Due</li>
                  <li>Click Export → Save as Excel (.xlsx or .xls)</li>
                  <li>Upload that file here</li>
                </ol>
              </div>

              {!importResult && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <FileSpreadsheet className={`w-10 h-10 mx-auto mb-2 ${isDragging ? "text-green-500" : "text-slate-300"}`} />
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    {importing ? "Reading file..." : "Drop your Excel file here"}
                  </p>
                  <p className="text-xs text-slate-400">or click to browse · .xlsx or .xls</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </div>
              )}

              {importResult?.success && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">
                      {importResult.rowCount} patients ready to load into Overdue Recall queue
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    Sheet: <span className="font-medium text-slate-600">{importResult.sheetName}</span> · Preview:
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 mb-3">
                    <table className="w-full text-xs">
                      {importResult.preview.map((row, ri) => (
                        <tr key={ri} className={ri === 0 ? "bg-slate-100 font-semibold" : ri % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          {row.slice(0, 5).map((cell, ci) => (
                            <td key={ci} className="px-2 py-1.5 border-r border-slate-100 truncate max-w-[110px]">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </table>
                  </div>
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    ⚠️ Confirming will replace the current Recall queue with these {importResult.rowCount} patients.
                  </p>
                </div>
              )}

              {importResult && !importResult.success && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{importResult.error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end px-5 pb-5">
              <button
                onClick={handleCloseImport}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              {importResult?.success && (
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Load {importResult.rowCount} Patients into Queue
                </button>
              )}
              {!importResult && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Browse Files
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
