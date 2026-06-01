"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, Phone, DollarSign, Clock, User } from "lucide-react";
import { Patient, WorkflowType, Priority } from "@/lib/types";
import { motion } from "framer-motion";

const PRIORITY_CONFIG: Record<Priority, { label: string; cls: string; dot: string }> = {
  critical: { label: "Critical", cls: "bg-red-50 text-red-700 border border-red-200", dot: "bg-red-500" },
  high: { label: "High", cls: "bg-orange-50 text-orange-700 border border-orange-200", dot: "bg-orange-500" },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400" },
  low: { label: "Low", cls: "bg-slate-50 text-slate-600 border border-slate-200", dot: "bg-slate-400" },
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  "in-progress": "In Progress",
  attempted: "Attempted",
  scheduled: "Scheduled",
  resolved: "Resolved",
  escalated: "Escalated",
};

const STATUS_COLOR: Record<string, string> = {
  new: "bg-slate-100 text-slate-600",
  "in-progress": "bg-blue-100 text-blue-700",
  attempted: "bg-amber-100 text-amber-700",
  scheduled: "bg-green-100 text-green-700",
  resolved: "bg-green-200 text-green-800",
  escalated: "bg-red-100 text-red-700",
};

interface Props {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelect: (p: Patient) => void;
  workflow: WorkflowType;
}

export default function WorkQueue({ patients, selectedPatient, onSelect, workflow }: Props) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");

  const filtered = patients.filter((p) => {
    const matchSearch =
      p.patientName.toLowerCase().includes(search.toLowerCase()) ||
      p.guardianName.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);
    const matchPriority = priorityFilter === "all" || p.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  // Sort: critical first, then by daysOverdue desc
  const sorted = [...filtered].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
    return b.daysOverdue - a.daysOverdue;
  });

  const totalValue = sorted.reduce((sum, p) => sum + p.estimatedValue, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Queue header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Work Queue
          </span>
          <span className="text-xs text-slate-400">{sorted.length} patients</span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>

        {/* Priority filter chips */}
        <div className="flex gap-1 flex-wrap">
          {(["all", "critical", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all ${
                priorityFilter === p
                  ? p === "all"
                    ? "bg-slate-800 text-white"
                    : PRIORITY_CONFIG[p as Priority]?.cls
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {p === "all" ? "All" : PRIORITY_CONFIG[p as Priority]?.label}
            </button>
          ))}
        </div>

        {/* Value summary */}
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <DollarSign className="w-3 h-3" />
          <span>
            <span className="font-semibold text-slate-700">
              ${totalValue.toLocaleString()}
            </span>{" "}
            at stake in this queue
          </span>
        </div>
      </div>

      {/* Queue items */}
      <div className="flex-1 overflow-y-auto py-1">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <Search className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No patients found</p>
          </div>
        ) : (
          sorted.map((patient, i) => {
            const isSelected = selectedPatient?.id === patient.id;
            const pc = PRIORITY_CONFIG[patient.priority];

            return (
              <motion.button
                key={patient.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelect(patient)}
                className={`queue-item w-full text-left px-4 py-3 border-b border-slate-100 transition-all ${
                  isSelected
                    ? "bg-blue-50 border-l-2 border-l-blue-500"
                    : "hover:bg-slate-50 border-l-2 border-l-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Name + priority */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pc.dot}`}
                      />
                      <span className="font-semibold text-slate-900 text-sm truncate">
                        {patient.patientName}
                      </span>
                    </div>
                    {/* Guardian */}
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <User className="w-3 h-3" />
                      <span className="truncate">{patient.guardianName}</span>
                    </div>
                    {/* Phone */}
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                      <Phone className="w-3 h-3" />
                      <span>{patient.phone}</span>
                    </div>
                    {/* Badges */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${pc.cls}`}>
                        {pc.label}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLOR[patient.status]}`}>
                        {STATUS_LABELS[patient.status]}
                      </span>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs font-bold text-green-700">
                      ${patient.estimatedValue.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-0.5 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{patient.daysOverdue}d</span>
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{
                        backgroundColor:
                          patient.assignedStaff === "Lesley"
                            ? "#2563EB"
                            : patient.assignedStaff === "Ashley"
                            ? "#16A34A"
                            : "#7C3AED",
                      }}
                    >
                      {patient.assignedStaff.charAt(0)}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
