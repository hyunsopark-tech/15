"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  CheckSquare,
  Square,
  AlertTriangle,
  Clock,
  DollarSign,
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
  siblings: Patient[];
  workflow: WorkflowType;
  currentStaffId: string;
  onMarkComplete?: (patientId: string) => void;
}

const ACTIVITY_LOG_KEY = "dentbooks-activity-log";

function logTaskCompletion(staffId: string, taskLabel: string, patientName: string) {
  const today = new Date().toISOString().split("T")[0];
  const key = `${staffId}:${today}`;
  try {
    const raw = localStorage.getItem(ACTIVITY_LOG_KEY);
    const logs = raw ? JSON.parse(raw) : {};
    const log = logs[key] ?? { staffId, date: today, entries: [] };
    const now = new Date();
    log.entries.push({
      id: `${Date.now()}`,
      type: "task",
      description: `✓ ${taskLabel} — ${patientName}`,
      timeLabel: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    });
    logs[key] = log;
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(logs));
  } catch {}
}

const PRIORITY_COLOR = {
  critical: "text-red-600 bg-red-50 border-red-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  low: "text-slate-600 bg-slate-50 border-slate-200",
};

// ── ChecklistRow ──────────────────────────────────────────────────────────────

function ChecklistRow({ item, onToggle }: { item: ChecklistItem; onToggle: () => void }) {
  return (
    <div className={`rounded-lg border transition-all ${item.completed ? "border-slate-100 bg-slate-50" : "border-transparent"}`}>
      <button onClick={onToggle} className="flex items-start gap-2 w-full text-left group px-1 py-1">
        {item.completed ? (
          <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <Square className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5 group-hover:text-slate-500" />
        )}
        <span className={`text-xs leading-relaxed font-medium ${item.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
          {item.label}
        </span>
      </button>

      {/* Sub-steps */}
      {item.steps && !item.completed && (
        <ul className="ml-7 mb-1 space-y-0.5">
          {item.steps.map((step, i) => (
            <li key={i} className="text-[11px] text-slate-500 flex items-start gap-1.5">
              <span className="mt-0.5 w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
              {step}
            </li>
          ))}
        </ul>
      )}

      {/* Script — always visible when item is not completed */}
      {item.script && !item.completed && (
        <div className="ml-7 mb-2">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 mb-1.5">
            <ChevronRight className="w-3 h-3" />
            Voicemail script
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-slate-700 leading-relaxed italic">
            {item.script}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TaskDetail({ patient, siblings, workflow, currentStaffId, onMarkComplete }: Props) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    workflow === "recall"
      ? recallChecklist
      : workflow === "treatment"
      ? treatmentChecklist
      : claimsChecklist
  );

  const baseChecklist =
    workflow === "recall"
      ? recallChecklist
      : workflow === "treatment"
      ? treatmentChecklist
      : claimsChecklist;

  // Reset checklist and notes when patient or workflow changes
  useEffect(() => {
    setChecklist(baseChecklist.map((item) => ({ ...item, completed: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id, workflow]);

  const completedCount = checklist.filter((i) => i.completed).length;
  const progress = Math.round((completedCount / checklist.length) * 100);

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nowCompleted = !item.completed;
        if (nowCompleted && patient) {
          logTaskCompletion(currentStaffId, item.label, patient.patientName);
        }
        return { ...item, completed: nowCompleted };
      })
    );
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
        {/* ── SIBLING TABS ──────────────────────────────────────────── */}
        {siblings.length > 1 && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {siblings.map((sib) => {
              const isActive = sib.id === patient.id;
              return (
                <a
                  key={sib.id}
                  href="#"
                  onClick={(e) => { e.preventDefault(); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-default ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-500 border-slate-200"
                  }`}
                >
                  {sib.patientName}
                </a>
              );
            })}
            <span className="text-[10px] text-slate-400 self-center ml-1">— click a sibling in the queue to switch</span>
          </div>
        )}

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
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-3 gap-3">
            <InfoCard icon={Phone} label="Phone" value={patient.phone} />
            {workflow === "treatment" ? (
              <InfoCard
                icon={DollarSign}
                label="Tx Value"
                value={`$${patient.estimatedValue.toLocaleString()}`}
                valueClass="text-amber-700 font-bold"
              />
            ) : workflow === "claims" ? (
              <InfoCard
                icon={DollarSign}
                label="Ins Balance"
                value={`$${(patient.claimAmount ?? patient.estimatedValue).toLocaleString()}`}
                valueClass="text-red-600 font-bold"
              />
            ) : (
              <InfoCard
                icon={Clock}
                label="Days Overdue"
                value={`${patient.daysOverdue} days`}
                valueClass="text-red-600 font-bold"
              />
            )}
          </div>

          {/* Workflow-specific details */}
          {workflow === "treatment" && patient.estimatedValue >= 1500 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-300 rounded-lg">
              <span className="text-base">⭐</span>
              <div>
                <span className="text-xs font-bold text-yellow-800">VIP Patient</span>
                <span className="text-xs text-yellow-700 ml-1.5">— high-value treatment plan. Prioritize a warm, personal call. Focus on care, not sales.</span>
              </div>
            </div>
          )}
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

        {/* ── CHECKLIST ───────────────────────────────────────────── */}
        <div className="mb-4">
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
                <ChecklistRow key={item.id} item={item} onToggle={() => toggleItem(item.id)} />
              ))}
            </div>
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
