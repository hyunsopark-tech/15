"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, MessageSquare, Calendar,
  Clock, Plus, FileText, CheckCircle,
  AlertCircle, Users, X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityType = "call" | "text" | "appointment" | "task" | "note" | "escalation";

interface ActivityEntry {
  id: string;
  type: ActivityType;
  description: string;
  timeLabel: string;
}

interface StaffLog {
  staffId: string;
  date: string;
  entries: ActivityEntry[];
}

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_STAFF_CONFIG = [
  { id: "vanessa", name: "Vanessa", role: "Office Manager", color: "#7C3AED", initials: "V" },
  { id: "lesley",  name: "Lesley",  role: "Front Desk",     color: "#2563EB", initials: "L" },
  { id: "jen",     name: "Jen",     role: "Front Desk",     color: "#0891B2", initials: "J" },
  { id: "idalia",  name: "Idalia",  role: "Front Desk",     color: "#16A34A", initials: "I" },
];

function loadStaffConfig() {
  if (typeof window === "undefined") return DEFAULT_STAFF_CONFIG;
  try {
    const raw = localStorage.getItem("dentbooks-staff-list");
    return raw ? JSON.parse(raw) : DEFAULT_STAFF_CONFIG;
  } catch { return DEFAULT_STAFF_CONFIG; }
}

const ACTIVITY_TYPES: {
  id: ActivityType;
  label: string;
  icon: React.ElementType;
  badge: string;    // pill colors
  card: string;     // card left-border color
}[] = [
  { id: "call",        label: "Call",       icon: Phone,         badge: "bg-blue-100 text-blue-700",    card: "border-blue-400"   },
  { id: "text",        label: "Text",       icon: MessageSquare, badge: "bg-purple-100 text-purple-700",card: "border-purple-400" },
  { id: "appointment", label: "Appt",       icon: Calendar,      badge: "bg-green-100 text-green-700",  card: "border-green-400"  },
  { id: "task",        label: "Task",       icon: CheckCircle,   badge: "bg-teal-100 text-teal-700",    card: "border-teal-400"   },
  { id: "escalation",  label: "Escalation", icon: AlertCircle,   badge: "bg-red-100 text-red-700",      card: "border-red-400"    },
  { id: "note",        label: "Note",       icon: FileText,      badge: "bg-slate-100 text-slate-600",  card: "border-slate-300"  },
];

const STORAGE_KEY  = "dentbooks-activity-log";
const TODAY = new Date().toISOString().split("T")[0];

function loadLogs(): Record<string, StaffLog> {
  if (typeof window === "undefined") return {};
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveLogs(d: Record<string, StaffLog>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}
function logKey(id: string) { return `${id}:${TODAY}`; }
function emptyLog(staffId: string): StaffLog { return { staffId, date: TODAY, entries: [] }; }

// ─── Component ───────────────────────────────────────────────────────────────

interface Props { currentStaffId: string; currentStaffName: string; }

export default function StaffProgress({ currentStaffId }: Props) {
  const [staffConfig, setStaffConfig] = useState(DEFAULT_STAFF_CONFIG);
  const [logs, setLogs]               = useState<Record<string, StaffLog>>({});
  const [addingTo, setAddingTo]       = useState<string | null>(null);
  const [draftText, setDraftText]     = useState("");
  const [draftType, setDraftType]     = useState<ActivityType>("call");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setStaffConfig(loadStaffConfig());
    setLogs(loadLogs());
  }, []);

  useEffect(() => {
    if (addingTo && inputRef.current) inputRef.current.focus();
  }, [addingTo]);

  const getLog = (id: string) => logs[logKey(id)] ?? emptyLog(id);

  const openAdd = (staffId: string) => {
    setAddingTo(staffId);
    setDraftText("");
    setDraftType("call");
  };

  const cancelAdd = () => { setAddingTo(null); setDraftText(""); };

  const submitEntry = (staffId: string) => {
    if (!draftText.trim()) return;
    const now = new Date();
    const entry: ActivityEntry = {
      id: `${Date.now()}`,
      type: draftType,
      description: draftText.trim(),
      timeLabel: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
    const log = getLog(staffId);
    const updated = { ...logs, [logKey(staffId)]: { ...log, entries: [...log.entries, entry] } };
    setLogs(updated);
    saveLogs(updated);
    setDraftText("");
    setDraftType("call");
    setAddingTo(null);
  };

  const removeEntry = (staffId: string, entryId: string) => {
    const log = getLog(staffId);
    const updated = { ...logs, [logKey(staffId)]: { ...log, entries: log.entries.filter((e) => e.id !== entryId) } };
    setLogs(updated);
    saveLogs(updated);
  };

  const totalToday = staffConfig.reduce((n, s) => n + getLog(s.id).entries.length, 0);

  return (
    <div className="h-full flex flex-col bg-slate-100">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-900 text-base">Daily Activity Board</span>
          <span className="text-xs text-slate-400 ml-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 rounded-full px-3 py-1">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-semibold text-blue-700">{totalToday} entries today</span>
        </div>
      </div>

      {/* ── Board ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full p-5 min-w-max">
          {staffConfig.map((s) => {
            const log = getLog(s.id);
            const isMe = s.id === currentStaffId;
            const isAdding = addingTo === s.id;

            return (
              <div
                key={s.id}
                className="flex flex-col w-72 flex-shrink-0 rounded-2xl bg-slate-200/70"
              >
                {/* Column header */}
                <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                        {isMe && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: s.color }}>
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">{s.role}</span>
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: log.entries.length ? s.color : "#94a3b8" }}
                  >
                    {log.entries.length}
                  </span>
                </div>

                {/* Cards list */}
                <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-2">
                  <AnimatePresence initial={false}>
                    {log.entries.map((entry) => {
                      const t = ACTIVITY_TYPES.find((a) => a.id === entry.type)!;
                      const Icon = t.icon;
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className={`bg-white rounded-xl shadow-sm border-l-4 px-3 py-2.5 group relative ${t.card}`}
                        >
                          {/* Delete button — only for own cards */}
                          {isMe && (
                            <button
                              onClick={() => removeEntry(s.id, entry.id)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}

                          {/* Type badge */}
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.badge}`}>
                              <Icon className="w-2.5 h-2.5" />{t.label}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-slate-800 leading-snug pr-4">{entry.description}</p>

                          {/* Timestamp */}
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock className="w-2.5 h-2.5 text-slate-300" />
                            <span className="text-[10px] text-slate-400">{entry.timeLabel}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Inline add form */}
                  <AnimatePresence>
                    {isAdding && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="bg-white rounded-xl shadow-sm p-3"
                      >
                        {/* Type selector */}
                        <div className="flex gap-1 mb-2 flex-wrap">
                          {ACTIVITY_TYPES.map((t) => {
                            const Icon = t.icon;
                            return (
                              <button
                                key={t.id}
                                onClick={() => setDraftType(t.id)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                  draftType === t.id
                                    ? `${t.badge} border-current`
                                    : "bg-slate-50 text-slate-400 border-slate-200"
                                }`}
                              >
                                <Icon className="w-2.5 h-2.5" />{t.label}
                              </button>
                            );
                          })}
                        </div>

                        <textarea
                          ref={inputRef}
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEntry(s.id); }
                            if (e.key === "Escape") cancelAdd();
                          }}
                          placeholder="What did you do? (Enter to save)"
                          rows={2}
                          className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitEntry(s.id)}
                            disabled={!draftText.trim()}
                            className="flex-1 py-1.5 text-xs font-bold text-white rounded-lg transition-all disabled:opacity-40"
                            style={{ backgroundColor: s.color }}
                          >
                            Add Card
                          </button>
                          <button
                            onClick={cancelAdd}
                            className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Add card button — only for own column */}
                {isMe && !isAdding && (
                  <div className="px-3 pb-3 pt-1">
                    <button
                      onClick={() => openAdd(s.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-300/60 hover:text-slate-700 text-sm font-medium transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Add a card
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
