"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  MessageSquare,
  CheckSquare,
  Square,
  Save,
  CheckCircle,
  AlertTriangle,
  User,
  Shield,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  ChevronRight,
  Clipboard,
} from "lucide-react";
import { Patient, WorkflowType, ChecklistItem } from "@/lib/types";
import {
  recallChecklist,
  treatmentChecklist,
  claimsChecklist,
} from "@/lib/mock-data";

interface Props {
  patient: Patient | null;
  workflow: WorkflowType;
}

const PRIORITY_COLOR = {
  critical: "text-red-600 bg-red-50 border-red-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  low: "text-slate-600 bg-slate-50 border-slate-200",
};

export default function TaskDetail({ patient, workflow }: Props) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    workflow === "recall"
      ? recallChecklist
      : workflow === "treatment"
      ? treatmentChecklist
      : claimsChecklist
  );
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [completed, setCompleted] = useState(false);

  const baseChecklist =
    workflow === "recall"
      ? recallChecklist
      : workflow === "treatment"
      ? treatmentChecklist
      : claimsChecklist;

  // Reset checklist and notes when patient or workflow changes
  useEffect(() => {
    setChecklist(baseChecklist.map((item) => ({ ...item, completed: false })));
    setNote("");
    setNoteSaved(false);
    setCompleted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id, workflow]);

  const completedCount = checklist.filter((i) => i.completed).length;
  const progress = Math.round((completedCount / checklist.length) * 100);

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleSaveNote = () => {
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Clipboard className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-base font-medium text-slate-400">
          Select a patient from the queue
        </p>
        <p className="text-sm text-slate-300 mt-1">
          Click any patient to view their workflow details
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={patient.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="h-full overflow-y-auto p-5"
      >
        {/* ── PATIENT HEADER ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {patient.patientName}
                </h2>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    PRIORITY_COLOR[patient.priority]
                  }`}
                >
                  {patient.priority.charAt(0).toUpperCase() + patient.priority.slice(1)} Priority
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Guardian: <span className="font-medium text-slate-700">{patient.guardianName}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-700">
                ${patient.estimatedValue.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400">estimated value</div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-3 gap-3">
            <InfoCard icon={Phone} label="Phone" value={patient.phone} />
            <InfoCard icon={Shield} label="Insurance" value={patient.insurance} />
            <InfoCard icon={User} label="Provider" value={patient.provider} />
            <InfoCard
              icon={Clock}
              label="Days Overdue"
              value={`${patient.daysOverdue} days`}
              valueClass="text-red-600 font-bold"
            />
            <InfoCard icon={Calendar} label="Last Visit" value={new Date(patient.lastVisit).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
            <InfoCard icon={User} label="Assigned To" value={patient.assignedStaff} />
          </div>

          {/* Workflow-specific details */}
          {workflow === "treatment" && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-800 mb-1">Treatment Plan</p>
              <p className="text-sm text-amber-900">{patient.treatmentPlan}</p>
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-amber-700">
                  Insurance est: <strong>${patient.insuranceEstimate?.toLocaleString()}</strong>
                </span>
                <span className="text-xs text-amber-700">
                  OOP: <strong>${((patient.estimatedValue) - (patient.insuranceEstimate ?? 0)).toLocaleString()}</strong>
                </span>
                <span className="text-xs">
                  Pre-auth:{" "}
                  <span
                    className={`font-semibold ${
                      patient.preAuthStatus === "approved"
                        ? "text-green-700"
                        : patient.preAuthStatus === "pending"
                        ? "text-amber-700"
                        : "text-slate-600"
                    }`}
                  >
                    {patient.preAuthStatus === "approved"
                      ? "✓ Approved"
                      : patient.preAuthStatus === "pending"
                      ? "⏳ Pending"
                      : "Not Required"}
                  </span>
                </span>
              </div>
            </div>
          )}

          {workflow === "claims" && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-semibold text-red-800 mb-1">Claim Details</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-xs text-red-700">Claim #: <strong>{patient.claimNumber}</strong></span>
                <span className="text-xs text-red-700">Payer: <strong>{patient.payerName}</strong></span>
                <span className="text-xs text-red-700">Submitted: <strong>{patient.claimDate}</strong></span>
                <span className="text-xs text-red-700">Amount: <strong>${patient.claimAmount?.toLocaleString()}</strong></span>
              </div>
              {patient.denialReason && (
                <div className="mt-2 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-red-700">{patient.denialReason}</span>
                </div>
              )}
            </div>
          )}

          {/* Next step */}
          <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-0.5">Next Step</p>
              <p className="text-sm text-blue-900">{patient.nextStep}</p>
            </div>
          </div>
        </div>

        {/* ── TWO COLUMNS: Checklist + Notes ─────────────────────── */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Workflow Checklist</h3>
              <span className="text-xs font-medium text-slate-500">
                {completedCount}/{checklist.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
              <motion.div
                className="h-full bg-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Items */}
            <div className="space-y-2">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className="flex items-start gap-2 w-full text-left group"
                >
                  {item.completed ? (
                    <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5 group-hover:text-slate-500" />
                  )}
                  <span
                    className={`text-xs leading-relaxed ${
                      item.completed
                        ? "line-through text-slate-400"
                        : "text-slate-700"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Staff Notes</h3>
            {patient.notes && (
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2 mb-2 italic border border-slate-100">
                Previous: "{patient.notes}"
              </div>
            )}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Document your communication here — what happened, what was said, next steps..."
              className="flex-1 resize-none text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-slate-700 placeholder:text-slate-300 min-h-[120px]"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">{note.length} chars</span>
              <button
                onClick={handleSaveNote}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  noteSaved
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {noteSaved ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Note
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Actions
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all">
              <Phone className="w-3.5 h-3.5" />
              Log Call
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all">
              <MessageSquare className="w-3.5 h-3.5" />
              Send Text
            </button>
            <button
              onClick={() => setCompleted(true)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all border ${
                completed
                  ? "bg-green-50 text-green-700 border-green-300"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <CheckCircle className={`w-3.5 h-3.5 ${completed ? "text-green-600" : ""}`} />
              {completed ? "Marked Complete" : "Mark Complete"}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg transition-all border border-red-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              Escalate to Manager
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  valueClass = "text-slate-800",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3 h-3 text-slate-400" />
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className={`text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
