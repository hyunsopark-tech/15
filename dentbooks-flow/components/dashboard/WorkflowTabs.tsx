"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Stethoscope, FileText } from "lucide-react";
import WorkQueue from "./WorkQueue";
import TaskDetail from "./TaskDetail";
import { Patient, WorkflowType } from "@/lib/types";
import { apiGetCompleted, apiMarkComplete } from "@/lib/api-client";

const TABS: { id: WorkflowType; label: string; icon: React.ElementType; color: string }[] = [
  { id: "recall",    label: "Overdue Recall",    icon: RefreshCw,   color: "rose"   },
  { id: "treatment", label: "Treatment Finder",  icon: Stethoscope, color: "violet" },
  { id: "claims",    label: "Aging Claims",      icon: FileText,    color: "orange" },
];

const COLOR_MAP = {
  rose:   { tab: "border-rose-500 text-rose-700 bg-rose-50",     inactive: "border-transparent text-slate-500 hover:text-slate-700 hover:border-pink-200",   badge: "bg-rose-100 text-rose-700"   },
  violet: { tab: "border-violet-500 text-violet-700 bg-violet-50", inactive: "border-transparent text-slate-500 hover:text-slate-700 hover:border-pink-200", badge: "bg-violet-100 text-violet-700" },
  orange: { tab: "border-orange-400 text-orange-700 bg-orange-50", inactive: "border-transparent text-slate-500 hover:text-slate-700 hover:border-pink-200", badge: "bg-orange-100 text-orange-700" },
};

interface Props {
  patients: Patient[];
  currentStaffId: string;
}

function getFamilyKey(patient: Patient): string {
  if (patient.guardianName.endsWith(" Family"))
    return patient.guardianName.replace(" Family", "").trim();
  const parts = patient.patientName.trim().split(" ");
  return parts[parts.length - 1];
}

export default function WorkflowTabs({ patients, currentStaffId }: Props) {
  const [activeTab, setActiveTab] = useState<WorkflowType>("recall");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => { apiGetCompleted().then(ids => setCompletedIds(new Set(ids))); }, []);

  const handleMarkComplete = (patientId: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.add(patientId);
      return next;
    });
    apiMarkComplete(patientId);
  };

  const tabPatients = patients.filter((p) => p.workflow === activeTab);

  // Siblings: all patients in the same tab with the same family key
  const selectedGroup: Patient[] = selectedPatient
    ? tabPatients.filter((p) => getFamilyKey(p) === getFamilyKey(selectedPatient))
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* ── TAB BAR ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-pink-100 px-5 flex-shrink-0">
        <div className="flex items-end gap-0">
          {TABS.map((tab) => {
            const count = patients.filter((p) => p.workflow === tab.id).length;
            const colors = COLOR_MAP[tab.color as keyof typeof COLOR_MAP];
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedPatient(null); }}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                  isActive ? colors.tab : colors.inactive
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${isActive ? colors.badge : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3-PANEL LAYOUT ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Work Queue */}
        <div className="w-80 flex-shrink-0 border-r border-pink-100 bg-white overflow-hidden flex flex-col">
          <WorkQueue
            patients={tabPatients}
            selectedPatient={selectedPatient}
            onSelect={setSelectedPatient}
            workflow={activeTab}
            completedIds={completedIds}
          />
        </div>

        {/* CENTER: Task Detail */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="flex-1 overflow-hidden bg-pink-50/40"
        >
          <TaskDetail patient={selectedPatient} siblings={selectedGroup} workflow={activeTab} currentStaffId={currentStaffId} onMarkComplete={handleMarkComplete} />
        </motion.div>

      </div>
    </div>
  );
}
