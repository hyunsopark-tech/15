"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Download,
  Upload,
  Bell,
  Settings,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import WorkflowTabs from "./WorkflowTabs";
import StaffScorecard from "./StaffScorecard";
import DailyTracker from "./DailyTracker";
import { mockDailyMetrics, mockStaff } from "@/lib/mock-data";

interface ImportResult {
  success: boolean;
  rowCount: number;
  sheetName: string;
  preview: string[][];
  error?: string;
}

export default function DashboardShell() {
  const [activeView, setActiveView] = useState<"workflows" | "staff" | "tracker">(
    "workflows"
  );
  const [showImportModal, setShowImportModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalRevenue = mockDailyMetrics.revenueRecovered;

  const handleFile = (file: File) => {
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const validExts = [".xlsx", ".xls"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExts.includes(ext)) {
      setImportResult({
        success: false,
        rowCount: 0,
        sheetName: "",
        preview: [],
        error: `File type not supported. Please upload an Excel file (.xlsx or .xls) exported from Open Dental.`,
      });
      return;
    }

    setImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        }) as string[][];

        const dataRows = rows.filter((r) => r.some((c) => c !== ""));
        const preview = dataRows.slice(0, 6);

        setImportResult({
          success: true,
          rowCount: Math.max(0, dataRows.length - 1),
          sheetName,
          preview,
        });
      } catch (err) {
        setImportResult({
          success: false,
          rowCount: 0,
          sheetName: "",
          preview: [],
          error: "Could not read this file. Make sure it's a valid Excel export from Open Dental.",
        });
      } finally {
        setImporting(false);
      }
    };

    reader.readAsArrayBuffer(file);
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
      {/* ── TOP NAV ─────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-5 gap-4 z-20 shadow-sm flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div className="leading-none">
            <div className="font-bold text-slate-900 text-sm">DentBooks</div>
            <div className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase">
              Flow
            </div>
          </div>
        </div>

        {/* View switcher */}
        <nav className="flex items-center gap-1">
          {(
            [
              { id: "workflows", label: "Revenue Recovery" },
              { id: "staff", label: "Staff Scorecard" },
              { id: "tracker", label: "Daily Tracker" },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
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

        {/* Revenue pill */}
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
          <TrendingUp className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-semibold text-green-700">
            ${totalRevenue.toLocaleString()} recovered today
          </span>
        </div>

        {/* Import button */}
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
          Import Open Dental Excel
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
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center ml-1">
            <span className="text-white text-xs font-bold">VR</span>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {activeView === "workflows" && <WorkflowTabs />}
          {activeView === "staff" && <StaffScorecard staff={mockStaff} />}
          {activeView === "tracker" && <DailyTracker metrics={mockDailyMetrics} />}
        </motion.div>
      </main>

      {/* ── IMPORT MODAL ─────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Import Overdue Recall Report
                  </h3>
                  <p className="text-xs text-slate-400">Excel export from Open Dental</p>
                </div>
              </div>
              <button
                onClick={handleCloseImport}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-blue-800 mb-1">
                  How to export from Open Dental:
                </p>
                <ol className="text-xs text-blue-700 space-y-0.5 list-decimal list-inside">
                  <li>Reports → Standard → Patient Lists → Recall List</li>
                  <li>Filter by Status: Past Due</li>
                  <li>Click Export → Save as Excel (.xlsx)</li>
                  <li>Upload that file here</li>
                </ol>
              </div>

              {/* Drop zone */}
              {!importResult && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-green-400 bg-green-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <FileSpreadsheet className={`w-10 h-10 mx-auto mb-2 ${isDragging ? "text-green-500" : "text-slate-300"}`} />
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    {importing ? "Reading file..." : "Drop your Excel file here"}
                  </p>
                  <p className="text-xs text-slate-400">
                    or click to browse · .xlsx or .xls files only
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>
              )}

              {/* Success result */}
              {importResult?.success && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">
                      File read successfully — {importResult.rowCount} patient rows found
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    Sheet: <span className="font-medium text-slate-600">{importResult.sheetName}</span> · Preview (first 5 rows):
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs">
                      {importResult.preview.map((row, ri) => (
                        <tr key={ri} className={ri === 0 ? "bg-slate-100 font-semibold" : ri % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          {row.slice(0, 5).map((cell, ci) => (
                            <td key={ci} className="px-2 py-1.5 border-r border-slate-200 truncate max-w-[100px]">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </table>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Full database import coming in next version. For now, review the data above to confirm it matches your recall list.
                  </p>
                </div>
              )}

              {/* Error result */}
              {importResult && !importResult.success && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{importResult.error}</p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-2 justify-end px-5 pb-5">
              <button
                onClick={handleCloseImport}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                {importResult?.success ? "Close" : "Cancel"}
              </button>
              {importResult?.success && (
                <button
                  onClick={handleCloseImport}
                  className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Confirm Import
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
