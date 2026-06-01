"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Download,
  Upload,
  Bell,
  Settings,
  Search,
  ChevronDown,
  TrendingUp,
} from "lucide-react";
import WorkflowTabs from "./WorkflowTabs";
import StaffScorecard from "./StaffScorecard";
import DailyTracker from "./DailyTracker";
import { mockDailyMetrics, mockStaff } from "@/lib/mock-data";

export default function DashboardShell() {
  const [activeView, setActiveView] = useState<"workflows" | "staff" | "tracker">(
    "workflows"
  );
  const [showImportModal, setShowImportModal] = useState(false);

  const totalRevenue = mockDailyMetrics.revenueRecovered;

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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Revenue pill */}
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
          <TrendingUp className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-semibold text-green-700">
            ${totalRevenue.toLocaleString()} recovered today
          </span>
        </div>

        {/* Action buttons */}
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          Import Open Dental CSV
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all">
          <Download className="w-3.5 h-3.5" />
          Export Daily Report
        </button>

        {/* Icons */}
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
          {activeView === "tracker" && (
            <DailyTracker metrics={mockDailyMetrics} />
          )}
        </motion.div>
      </main>

      {/* ── IMPORT MODAL ─────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-96"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Import Open Dental CSV
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              Upload a CSV export from Open Dental to populate the work queue
              with real patient data.
            </p>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center mb-4">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                Drag & drop CSV or{" "}
                <span className="text-blue-600 font-medium cursor-pointer">
                  browse files
                </span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Recall, Treatment Plan, or Aging Report export
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Upload CSV
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
