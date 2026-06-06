"use client";

import { useState } from "react";
import { Search, Phone, Clock, Users, ChevronDown, ChevronRight, Shield } from "lucide-react";
import { Patient, WorkflowType, Priority } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

const PRIORITY_CONFIG: Record<Priority, { label: string; cls: string; dot: string }> = {
  critical: { label: "Critical", cls: "bg-red-50 text-red-700 border border-red-200",         dot: "bg-red-500"    },
  high:     { label: "High",     cls: "bg-orange-50 text-orange-700 border border-orange-200", dot: "bg-orange-500" },
  medium:   { label: "Medium",   cls: "bg-amber-50 text-amber-700 border border-amber-200",    dot: "bg-amber-400"  },
  low:      { label: "Low",      cls: "bg-slate-50 text-slate-600 border border-slate-200",    dot: "bg-slate-400"  },
};

const STATUS_LABELS: Record<string, string> = {
  new: "New", "in-progress": "In Progress", attempted: "Attempted",
  scheduled: "Scheduled", resolved: "Resolved", escalated: "Escalated",
};

const STATUS_COLOR: Record<string, string> = {
  new: "bg-slate-100 text-slate-600",
  "in-progress": "bg-violet-100 text-violet-700",
  attempted: "bg-amber-100 text-amber-700",
  scheduled: "bg-green-100 text-green-700",
  resolved: "bg-green-200 text-green-800",
  escalated: "bg-red-100 text-red-700",
};

// ── Insurance categorisation ──────────────────────────────────────────────────
const MEDICAID_KEYWORDS = [
  "medicaid", "chip", "star", "superior", "molina", "unitedhealthcare community",
  "amerigroup", "centene", "wellcare", "aetna better health", "cigna healthspring",
  "uhc community", "texas medicaid",
];

function getInsuranceCategory(insurance: string): "Medicaid / CHIP" | "PPO" | "HMO / DHMO" | "Other" {
  const lower = insurance.toLowerCase();
  if (MEDICAID_KEYWORDS.some((k) => lower.includes(k))) return "Medicaid / CHIP";
  if (lower.includes("ppo"))  return "PPO";
  if (lower.includes("hmo") || lower.includes("dhmo")) return "HMO / DHMO";
  if (lower === "see open dental" || lower === "unknown insurance" || lower === "") return "Other";
  // Default imported patients whose plan isn't parsed yet
  return "Other";
}

const INS_COLOR: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "Medicaid / CHIP": { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-200", dot: "bg-green-500"  },
  "PPO":             { bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-200",  dot: "bg-blue-500"   },
  "HMO / DHMO":      { bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-200", dot: "bg-amber-500"  },
  "Other":           { bg: "bg-slate-50",  text: "text-slate-600",  border: "border-slate-200", dot: "bg-slate-400"  },
};

const INS_ORDER = ["Medicaid / CHIP", "PPO", "HMO / DHMO", "Other"];

// ── Family helpers ────────────────────────────────────────────────────────────
function getFamilyKey(patient: Patient): string {
  if (patient.guardianName.endsWith(" Family"))
    return patient.guardianName.replace(" Family", "").trim();
  const parts = patient.patientName.trim().split(" ");
  return parts[parts.length - 1];
}

interface Group {
  key: string;
  label: string;
  phone?: string;
  patients: Patient[];
  topPriority: Priority;
  maxDaysOverdue: number;
}

interface Props {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelect: (p: Patient) => void;
  workflow: WorkflowType;
  completedIds?: Set<string>;
}

export default function WorkQueue({ patients, selectedPatient, onSelect, workflow, completedIds = new Set() }: Props) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [groupBy, setGroupBy] = useState<"family" | "insurance">("family");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const filtered = patients.filter((p) => {
    const matchSearch =
      p.patientName.toLowerCase().includes(search.toLowerCase()) ||
      p.guardianName.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.insurance.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === "all" || p.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  // ── Build groups ─────────────────────────────────────────────────────────
  const makeGroups = (): Group[] => {
    const map = new Map<string, Patient[]>();

    if (groupBy === "family") {
      for (const p of filtered) {
        const key = getFamilyKey(p);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(p);
      }
      return Array.from(map.entries()).map(([key, pts]) => {
        const sorted = [...pts].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        return { key, label: `${key} Family`, phone: pts[0].phone, patients: sorted, topPriority: sorted[0].priority, maxDaysOverdue: Math.max(...pts.map((p) => p.daysOverdue)) };
      }).sort((a, b) => priorityOrder[a.topPriority] - priorityOrder[b.topPriority] || b.maxDaysOverdue - a.maxDaysOverdue);
    } else {
      for (const p of filtered) {
        const cat = getInsuranceCategory(p.insurance);
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat)!.push(p);
      }
      return INS_ORDER.filter((cat) => map.has(cat)).map((cat) => {
        const pts = map.get(cat)!.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || b.daysOverdue - a.daysOverdue);
        return { key: cat, label: cat, patients: pts, topPriority: pts[0].priority, maxDaysOverdue: Math.max(...pts.map((p) => p.daysOverdue)) };
      });
    }
  };

  const groups = makeGroups();

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  };

  // Auto-expand group containing selected patient
  if (selectedPatient) {
    const key = groupBy === "family"
      ? getFamilyKey(selectedPatient)
      : getInsuranceCategory(selectedPatient.insurance);
    if (!expandedGroups.has(key)) {
      setExpandedGroups((prev) => { const s = new Set(prev); s.add(key); return s; });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Work Queue</span>
          <span className="text-xs text-slate-400">{groups.length} groups · {filtered.length} patients</span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients, insurance..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300"
          />
        </div>

        {/* Group by toggle */}
        <div className="flex gap-1 mb-2 p-0.5 bg-slate-100 rounded-lg">
          <button
            onClick={() => setGroupBy("family")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium rounded-md transition-all ${groupBy === "family" ? "bg-white shadow-sm text-slate-800" : "text-slate-500"}`}
          >
            <Users className="w-3 h-3" /> Family
          </button>
          <button
            onClick={() => setGroupBy("insurance")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium rounded-md transition-all ${groupBy === "insurance" ? "bg-white shadow-sm text-slate-800" : "text-slate-500"}`}
          >
            <Shield className="w-3 h-3" /> Insurance
          </button>
        </div>

        {/* Priority filter */}
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

      {/* ── Groups ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-1">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <Search className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No patients found</p>
          </div>
        ) : (
          groups.map((group, gi) => {
            const isExpanded = expandedGroups.has(group.key);
            const hasMultiple = group.patients.length > 1;
            const hasSelected = group.patients.some((p) => p.id === selectedPatient?.id);
            const allDone = group.patients.every((p) => completedIds.has(p.id));
            const pc = PRIORITY_CONFIG[group.topPriority];
            const ic = INS_COLOR[group.key] ?? INS_COLOR["Other"];

            return (
              <motion.div
                key={group.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: gi * 0.02 }}
                className="border-b border-slate-100"
              >
                {/* Group header */}
                <button
                  onClick={() => hasMultiple ? toggleGroup(group.key) : onSelect(group.patients[0])}
                  className={`w-full text-left px-4 py-3 transition-all border-l-2 ${
                    allDone ? "opacity-40" : ""
                  } ${hasSelected ? "bg-rose-50 border-l-rose-500" : "hover:bg-pink-50 border-l-transparent"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {/* Insurance category dot / priority dot */}
                        {groupBy === "insurance"
                          ? <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ic.dot}`} />
                          : <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pc.dot}`} />
                        }
                        <span className={`font-semibold text-sm truncate ${allDone ? "line-through text-slate-400" : "text-slate-900"}`}>{group.label}</span>
                        {allDone && <span className="text-[10px] font-bold text-green-600 flex-shrink-0">✓ Done</span>}
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {groupBy === "family" ? <Users className="w-2.5 h-2.5" /> : <Shield className="w-2.5 h-2.5" />}
                          {group.patients.length}
                        </span>
                      </div>

                      {group.phone && groupBy === "family" && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1.5">
                          <Phone className="w-3 h-3" />
                          <span>{group.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {groupBy === "insurance" ? (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${ic.bg} ${ic.text} ${ic.border}`}>
                            {group.label}
                          </span>
                        ) : (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${pc.cls}`}>
                            {pc.label}
                          </span>
                        )}
                        {group.maxDaysOverdue > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />{group.maxDaysOverdue}d overdue
                          </span>
                        )}
                      </div>
                    </div>

                    {hasMultiple && (
                      <div className="text-slate-400 flex-shrink-0">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    )}
                  </div>
                </button>

                {/* Individual patients */}
                <AnimatePresence>
                  {(isExpanded || !hasMultiple) && hasMultiple && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden bg-pink-50/50"
                    >
                      {group.patients.map((patient) => {
                        const isSelected = selectedPatient?.id === patient.id;
                        const isDone = completedIds.has(patient.id);
                        const ppc = PRIORITY_CONFIG[patient.priority];

                        return (
                          <button
                            key={patient.id}
                            onClick={() => onSelect(patient)}
                            className={`w-full text-left pl-8 pr-4 py-2.5 border-b border-slate-100 last:border-0 transition-all border-l-2 ${
                              isDone ? "opacity-40" : ""
                            } ${isSelected ? "bg-rose-100 border-l-rose-500" : "hover:bg-pink-50 border-l-transparent"}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ppc.dot}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className={`text-sm font-medium truncate ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
                                    {patient.patientName}
                                  </span>
                                  {isDone && <span className="text-[10px] font-bold text-green-600 flex-shrink-0">✓ Done</span>}
                                </div>
                                {groupBy === "insurance" && (
                                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                    <Phone className="w-3 h-3" />{patient.phone}
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ppc.cls}`}>{ppc.label}</span>
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLOR[patient.status]}`}>{STATUS_LABELS[patient.status]}</span>
                                  {patient.daysOverdue > 0 && <span className="text-[10px] text-slate-400">{patient.daysOverdue}d</span>}
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

