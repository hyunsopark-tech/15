"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, MessageSquare, Calendar, Send,
  Clock, ChevronDown, ChevronUp, Plus,
  FileText, CheckCircle, AlertCircle, Users,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityType = "call" | "text" | "appointment" | "task" | "note" | "escalation";

interface ActivityEntry {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string; // ISO string
  timeLabel: string; // e.g. "9:42 AM"
}

interface StaffLog {
  staffId: string;
  date: string; // YYYY-MM-DD
  entries: ActivityEntry[];
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STAFF_CONFIG = [
  { id: "vanessa", name: "Vanessa", role: "Office Manager", color: "#7C3AED", initials: "V" },
  { id: "lesley",  name: "Lesley",  role: "Front Desk",     color: "#2563EB", initials: "L" },
  { id: "jen",     name: "Jen",     role: "Front Desk",     color: "#0891B2", initials: "J" },
  { id: "idalia",  name: "Idalia",  role: "Front Desk",     color: "#16A34A", initials: "I" },
];

const ACTIVITY_TYPES: { id: ActivityType; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { id: "call",        label: "Call",        icon: Phone,         color: "text-blue-600",   bg: "bg-blue-50 border-blue-200"   },
  { id: "text",        label: "Text",        icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  { id: "appointment", label: "Appt",        icon: Calendar,      color: "text-green-600",  bg: "bg-green-50 border-green-200"  },
  { id: "task",        label: "Task",        icon: CheckCircle,   color: "text-teal-600",   bg: "bg-teal-50 border-teal-200"    },
  { id: "escalation",  label: "Escalation",  icon: AlertCircle,   color: "text-red-600",    bg: "bg-red-50 border-red-200"      },
  { id: "note",        label: "Note",        icon: FileText,      color: "text-slate-600",  bg: "bg-slate-50 border-slate-200"  },
];

const STORAGE_KEY = "dentbooks-activity-log";
const TODAY = new Date().toISOString().split("T")[0];

// ─── Storage ─────────────────────────────────────────────────────────────────

function loadLogs(): Record<string, StaffLog> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveLogs(data: Record<string, StaffLog>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function getLogKey(staffId: string) { return `${staffId}:${TODAY}`; }

function defaultLog(staffId: string): StaffLog {
  return { staffId, date: TODAY, entries: [] };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  currentStaffId: string;
  currentStaffName: string;
}

export default function StaffProgress({ currentStaffId }: Props) {
  const [logs, setLogs] = useState<Record<string, StaffLog>>({});
  const [expandedId, setExpandedId] = useState<string | null>(currentStaffId);
  const [inputText, setInputText] = useState<Record<string, string>>({});
  const [selectedType, setSelectedType] = useState<Record<string, ActivityType>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setLogs(loadLogs());
  }, []);

  const save = (updated: Record<string, StaffLog>) => {
    setLogs(updated);
    saveLogs(updated);
  };

  const getLog = (staffId: string): StaffLog =>
    logs[getLogKey(staffId)] ?? defaultLog(staffId);

  const addEntry = (staffId: string) => {
    const text = (inputText[staffId] ?? "").trim();
    if (!text) return;
    const type = selectedType[staffId] ?? "note";
    const now = new Date();
    const entry: ActivityEntry = {
      id: `${Date.now()}`,
      type,
      description: text,
      timestamp: now.toISOString(),
      timeLabel: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
    const log = getLog(staffId);
    const updated = {
      ...logs,
      [getLogKey(staffId)]: { ...log, entries: [entry, ...log.entries] },
    };
    save(updated);
    setInputText((p) => ({ ...p, [staffId]: "" }));
  };

  const totalEntries = (staffId: string) => getLog(staffId).entries.length;

  // Sort: current user first, then by entry count desc
  const sortedStaff = [...STAFF_CONFIG].sort((a, b) => {
    if (a.id === currentStaffId) return -1;
    if (b.id === currentStaffId) return 1;
    return totalEntries(b.id) - totalEntries(a.id);
  });

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Daily Activity Log
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">
            {STAFF_CONFIG.reduce((s, st) => s + totalEntries(st.id), 0)} entries today
          </span>
        </div>
      </div>

      {/* ── Staff Cards ──────────────────────────────────────────── */}
      <div className="space-y-3">
        {sortedStaff.map((s) => {
          const log = getLog(s.id);
          const isMe = s.id === currentStaffId;
          const isExpanded = expandedId === s.id;
          const count = log.entries.length;
          const typeText = selectedType[s.id] ?? "note";
          const typeCfg = ACTIVITY_TYPES.find((t) => t.id === typeText)!;

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Card header — click to expand */}
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{s.name}</span>
                      {isMe && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: s.color }}>You</span>}
                    </div>
                    <span className="text-xs text-slate-400">{s.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Activity type breakdown */}
                  <div className="flex items-center gap-1.5">
                    {ACTIVITY_TYPES.filter((t) => log.entries.some((e) => e.type === t.id)).map((t) => {
                      const Icon = t.icon;
                      const n = log.entries.filter((e) => e.type === t.id).length;
                      return (
                        <span key={t.id} className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${t.bg} ${t.color}`}>
                          <Icon className="w-2.5 h-2.5" />{n}
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-sm font-bold text-slate-700 min-w-[2rem] text-right">{count}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-100 px-5 pb-5 pt-4">

                      {/* Input — only for own card */}
                      {isMe && (
                        <div className="mb-4">
                          {/* Type selector */}
                          <div className="flex gap-1.5 mb-2 flex-wrap">
                            {ACTIVITY_TYPES.map((t) => {
                              const Icon = t.icon;
                              const active = (selectedType[s.id] ?? "note") === t.id;
                              return (
                                <button
                                  key={t.id}
                                  onClick={() => setSelectedType((p) => ({ ...p, [s.id]: t.id }))}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                                    active ? `${t.bg} ${t.color} border-current shadow-sm` : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <Icon className="w-3 h-3" />{t.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Text input */}
                          <div className="flex gap-2">
                            <input
                              ref={(el) => { inputRefs.current[s.id] = el; }}
                              type="text"
                              value={inputText[s.id] ?? ""}
                              onChange={(e) => setInputText((p) => ({ ...p, [s.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === "Enter" && addEntry(s.id)}
                              placeholder={`Log a ${typeCfg.label.toLowerCase()}... (e.g. "Called Smith family re: recall")`}
                              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                            />
                            <button
                              onClick={() => addEntry(s.id)}
                              disabled={!(inputText[s.id] ?? "").trim()}
                              className="px-3 py-2.5 text-white rounded-xl flex items-center gap-1 text-sm font-semibold transition-all disabled:opacity-40"
                              style={{ backgroundColor: s.color }}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Activity feed */}
                      {log.entries.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-6">No activity logged yet today</p>
                      ) : (
                        <div className="space-y-2">
                          {log.entries.map((entry, i) => {
                            const t = ACTIVITY_TYPES.find((t) => t.id === entry.type)!;
                            const Icon = t.icon;
                            return (
                              <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className={`flex items-start gap-3 p-3 rounded-xl border ${t.bg}`}
                              >
                                <div className={`mt-0.5 flex-shrink-0 ${t.color}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-slate-800 leading-snug">{entry.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-bold uppercase ${t.color}`}>{t.label}</span>
                                    <span className="text-[10px] text-slate-400">{entry.timeLabel}</span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
