"use client";

import { useState } from "react";
import { Search, Phone, Clock, Users, ChevronDown, ChevronRight } from "lucide-react";
import { Patient, WorkflowType, Priority } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

const PRIORITY_CONFIG: Record<Priority, { label: string; cls: string; dot: string }> = {
  critical: { label: "Critical", cls: "bg-red-50 text-red-700 border border-red-200",    dot: "bg-red-500"    },
  high:     { label: "High",     cls: "bg-orange-50 text-orange-700 border border-orange-200", dot: "bg-orange-500" },
  medium:   { label: "Medium",   cls: "bg-amber-50 text-amber-700 border border-amber-200",  dot: "bg-amber-400"  },
  low:      { label: "Low",      cls: "bg-slate-50 text-slate-600 border border-slate-200",   dot: "bg-slate-400"  },
};

const STATUS_LABELS: Record<string, string> = {
  new: "New", "in-progress": "In Progress", attempted: "Attempted",
  scheduled: "Scheduled", resolved: "Resolved", escalated: "Escalated",
};

const STATUS_COLOR: Record<string, string> = {
  new: "bg-slate-100 text-slate-600",
  "in-progress": "bg-blue-100 text-blue-700",
  attempted: "bg-amber-100 text-amber-700",
  scheduled: "bg-green-100 text-green-700",
  resolved: "bg-green-200 text-green-800",
  escalated: "bg-red-100 text-red-700",
};

// Extract last name from "FirstName LastName" or "LastName Family"
function getFamilyKey(patient: Patient): string {
  // guardianName is "Smith Family" for imported patients
  if (patient.guardianName.endsWith(" Family")) {
    return patient.guardianName.replace(" Family", "").trim();
  }
  // For mock data, use last word of patient name
  const parts = patient.patientName.trim().split(" ");
  return parts[parts.length - 1];
}

interface FamilyGroup {
  familyKey: string;
  phone: string;
  patients: Patient[];
  topPriority: Priority;
  maxDaysOverdue: number;
}

interface Props {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelect: (p: Patient) => void;
  workflow: WorkflowType;
}

export default function WorkQueue({ patients, selectedPatient, onSelect, workflow }: Props) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());

  const filtered = patients.filter((p) => {
    const matchSearch =
      p.patientName.toLowerCase().includes(search.toLowerCase()) ||
      p.guardianName.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);
    const matchPriority = priorityFilter === "all" || p.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  // Group by family
  const familyMap = new Map<string, Patient[]>();
  for (const p of filtered) {
    const key = getFamilyKey(p);
    if (!familyMap.has(key)) familyMap.set(key, []);
    familyMap.get(key)!.push(p);
  }

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const groups: FamilyGroup[] = Array.from(familyMap.entries()).map(([key, pts]) => {
    const sorted = [...pts].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return {
      familyKey: key,
      phone: pts[0].phone,
      patients: sorted,
      topPriority: sorted[0].priority,
      maxDaysOverdue: Math.max(...pts.map((p) => p.daysOverdue)),
    };
  });

  // Sort groups by top priority then days overdue
  groups.sort((a, b) => {
    if (priorityOrder[a.topPriority] !== priorityOrder[b.topPriority])
      return priorityOrder[a.topPriority] - priorityOrder[b.topPriority];
    return b.maxDaysOverdue - a.maxDaysOverdue;
  });

  const toggleFamily = (key: string) => {
    setExpandedFamilies((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Auto-expand family of selected patient
  if (selectedPatient) {
    const key = getFamilyKey(selectedPatient);
    if (!expandedFamilies.has(key)) {
      setExpandedFamilies((prev) => { const s = new Set(prev); s.add(key); return s; });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Work Queue</span>
          <span className="text-xs text-slate-400">
            {groups.length} families · {filtered.length} patients
          </span>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients or family..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>

        <div className="flex gap-1 flex-wrap">
          {(["all", "critical", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all ${
                priorityFilter === p
                  ? p === "all" ? "bg-slate-800 text-white" : PRIORITY_CONFIG[p as Priority]?.cls
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {p === "all" ? "All" : PRIORITY_CONFIG[p as Priority]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Family groups */}
      <div className="flex-1 overflow-y-auto py-1">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <Search className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No patients found</p>
          </div>
        ) : (
          groups.map((group, gi) => {
            const isExpanded = expandedFamilies.has(group.familyKey);
            const pc = PRIORITY_CONFIG[group.topPriority];
            const hasMultiple = group.patients.length > 1;
            const hasSelected = group.patients.some((p) => p.id === selectedPatient?.id);

            return (
              <motion.div
                key={group.familyKey}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: gi * 0.02 }}
                className="border-b border-slate-100"
              >
                {/* Family header row */}
                <button
                  onClick={() => hasMultiple ? toggleFamily(group.familyKey) : onSelect(group.patients[0])}
                  className={`w-full text-left px-4 py-3 transition-all border-l-2 ${
                    hasSelected
                      ? "bg-blue-50 border-l-blue-500"
                      : "hover:bg-slate-50 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pc.dot}`} />
                        <span className="font-semibold text-slate-900 text-sm truncate">
                          {group.familyKey} Family
                        </span>
                        {hasMultiple && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            <Users className="w-2.5 h-2.5" />
                            {group.patients.length}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1.5">
                        <Phone className="w-3 h-3" />
                        <span>{group.phone}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${pc.cls}`}>
                          {pc.label}
                        </span>
                        {group.maxDaysOverdue > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            {group.maxDaysOverdue}d overdue
                          </span>
                        )}
                      </div>
                    </div>

                    {hasMultiple && (
                      <div className="text-slate-400 flex-shrink-0">
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4" />
                          : <ChevronRight className="w-4 h-4" />}
                      </div>
                    )}
                  </div>
                </button>

                {/* Individual patients within family */}
                <AnimatePresence>
                  {(isExpanded || !hasMultiple) && hasMultiple && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden bg-slate-50"
                    >
                      {group.patients.map((patient) => {
                        const isSelected = selectedPatient?.id === patient.id;
                        const ppc = PRIORITY_CONFIG[patient.priority];

                        return (
                          <button
                            key={patient.id}
                            onClick={() => onSelect(patient)}
                            className={`w-full text-left pl-8 pr-4 py-2.5 border-b border-slate-100 last:border-0 transition-all border-l-2 ${
                              isSelected
                                ? "bg-blue-100 border-l-blue-500"
                                : "hover:bg-slate-100 border-l-transparent"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ppc.dot}`} />
                                  <span className="text-sm font-medium text-slate-800 truncate">
                                    {patient.patientName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ppc.cls}`}>
                                    {ppc.label}
                                  </span>
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLOR[patient.status]}`}>
                                    {STATUS_LABELS[patient.status]}
                                  </span>
                                  {patient.daysOverdue > 0 && (
                                    <span className="text-[10px] text-slate-400">
                                      {patient.daysOverdue}d
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
