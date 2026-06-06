"use client";

import { useState, useEffect, useRef } from "react";
import { apiGetStaff, apiGetActivityLog, apiAddActivity, apiDeleteActivity, type StaffLog, type ActivityEntry as ApiActivityEntry } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, MessageSquare, Calendar,
  Clock, Plus, FileText, CheckCircle,
  AlertCircle, Users, X, RefreshCw, Stethoscope,
  ChevronLeft, ChevronRight, LayoutList,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityType = "call" | "text" | "appointment" | "task" | "note" | "escalation" | "recall" | "treatment" | "claims";

// Re-export to avoid duplicate type — use api-client's canonical types
type ActivityEntry = ApiActivityEntry & { type: ActivityType };

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_STAFF_CONFIG = [
  { id: "vanessa", name: "Vanessa", role: "Office Manager", color: "#7C3AED", initials: "V" },
  { id: "lesley",  name: "Lesley",  role: "Front Desk",     color: "#2563EB", initials: "L" },
  { id: "jen",     name: "Jen",     role: "Front Desk",     color: "#0891B2", initials: "J" },
  { id: "idalia",  name: "Idalia",  role: "Front Desk",     color: "#16A34A", initials: "I" },
];

const ACTIVITY_TYPES: {
  id: ActivityType;
  label: string;
  icon: React.ElementType;
  badge: string;
  card: string;
}[] = [
  // Workflow types — auto-logged from checklist completions, color-coded by tab
  { id: "recall",    label: "Recall",    icon: RefreshCw,   badge: "bg-blue-100 text-blue-700",     card: "border-blue-500"   },
  { id: "treatment", label: "Treatment", icon: Stethoscope, badge: "bg-amber-100 text-amber-700",   card: "border-amber-500"  },
  { id: "claims",    label: "Claims",    icon: AlertCircle, badge: "bg-red-100 text-red-700",       card: "border-red-500"    },
  // Manual entry types
  { id: "call",        label: "Call",       icon: Phone,         badge: "bg-sky-100 text-sky-700",      card: "border-sky-400"    },
  { id: "text",        label: "Text",       icon: MessageSquare, badge: "bg-purple-100 text-purple-700",card: "border-purple-400" },
  { id: "appointment", label: "Appt",       icon: Calendar,      badge: "bg-green-100 text-green-700",  card: "border-green-400"  },
  { id: "task",        label: "Task",       icon: CheckCircle,   badge: "bg-teal-100 text-teal-700",    card: "border-teal-400"   },
  { id: "escalation",  label: "Escalation", icon: AlertCircle,   badge: "bg-rose-100 text-rose-700",    card: "border-rose-400"   },
  { id: "note",        label: "Note",       icon: FileText,      badge: "bg-slate-100 text-slate-600",  card: "border-slate-300"  },
];

const TODAY = new Date().toISOString().split("T")[0];

function logKey(id: string, date = TODAY) { return `${id}:${date}`; }
function emptyLog(staffId: string, date = TODAY): StaffLog { return { staffId, date, entries: [] }; }

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}
function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── Calendar View ────────────────────────────────────────────────────────────

interface CalendarProps {
  staffConfig: typeof DEFAULT_STAFF_CONFIG;
  logs: Record<string, StaffLog>;
}

function CalendarView({ staffConfig, logs }: CalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(TODAY);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month); // 0=Sun

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  // Staff entries for a given date
  const staffForDate = (date: string) =>
    staffConfig.map(s => ({
      ...s,
      entries: (logs[logKey(s.id, date)] ?? emptyLog(s.id, date)).entries,
    })).filter(s => s.entries.length > 0);

  const selectedStaff = staffForDate(selectedDate);
  const totalSelected = selectedStaff.reduce((n, s) => n + s.entries.length, 0);

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Calendar grid ── */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-200 transition-all">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="font-bold text-slate-800 text-base">
            {new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-200 transition-all">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const iso = toISO(year, month, day);
            const isToday = iso === TODAY;
            const isSelected = iso === selectedDate;
            const dayStaff = staffForDate(iso);
            const totalEntries = dayStaff.reduce((n, s) => n + s.entries.length, 0);

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(iso)}
                className={`relative rounded-xl p-2 min-h-[72px] text-left transition-all border ${
                  isSelected
                    ? "bg-gradient-to-br from-rose-500 to-pink-500 border-rose-500 shadow-md"
                    : isToday
                    ? "bg-rose-50 border-rose-200 hover:border-rose-300"
                    : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                {/* Day number */}
                <span className={`text-xs font-bold ${
                  isSelected ? "text-white" : isToday ? "text-blue-700" : "text-slate-700"
                }`}>
                  {day}
                </span>

                {/* Total badge */}
                {totalEntries > 0 && (
                  <span className={`absolute top-2 right-2 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    {totalEntries}
                  </span>
                )}

                {/* Staff dots */}
                {dayStaff.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-1.5">
                    {dayStaff.map(s => (
                      <div
                        key={s.id}
                        title={`${s.name}: ${s.entries.length} entries`}
                        className="flex items-center gap-0.5"
                      >
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shadow-sm"
                          style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.35)" : s.color }}
                        >
                          {s.initials}
                        </div>
                        <span className={`text-[9px] font-semibold ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                          {s.entries.length}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Day detail panel ── */}
      <div className="w-80 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
        {/* Panel header */}
        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <p className="text-xs text-slate-400">{totalSelected} total {totalSelected === 1 ? "entry" : "entries"}</p>
            </div>
            {selectedDate === TODAY && (
              <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">Today</span>
            )}
          </div>

          {/* Per-staff summary chips */}
          {selectedStaff.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedStaff.map(s => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.name} · {s.entries.length}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Activity list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {selectedStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <Calendar className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm text-slate-400">No activity this day</p>
            </div>
          ) : (
            selectedStaff.map(s => (
              <div key={s.id}>
                {/* Staff section header */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.initials}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{s.name}</span>
                  <span className="text-[10px] text-slate-400">{s.entries.length} {s.entries.length === 1 ? "entry" : "entries"}</span>
                </div>

                {/* Entry cards */}
                <div className="space-y-1.5 ml-1">
                  {s.entries.map(entry => {
                    const t = ACTIVITY_TYPES.find(a => a.id === entry.type) ?? ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
                    const Icon = t.icon;
                    return (
                      <div
                        key={entry.id}
                        className={`bg-slate-50 rounded-lg border-l-4 px-3 py-2 ${t.card}`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${t.badge}`}>
                            <Icon className="w-2 h-2" />{t.label}
                          </span>
                          <span className="text-[9px] text-slate-400 ml-auto">{entry.timeLabel}</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-snug">{entry.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { currentStaffId: string; currentStaffName: string; }

export default function StaffProgress({ currentStaffId }: Props) {
  const [view, setView]                = useState<"board" | "calendar">("board");
  const [staffConfig, setStaffConfig]  = useState(DEFAULT_STAFF_CONFIG);
  const [logs, setLogs]                = useState<Record<string, StaffLog>>({});
  const [addingTo, setAddingTo]        = useState<string | null>(null);
  const [draftText, setDraftText]      = useState("");
  const [draftType, setDraftType]      = useState<ActivityType>("call");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    apiGetStaff().then(data => { if (data.length > 0) setStaffConfig(data); });
    apiGetActivityLog().then((data) => setLogs(data));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      apiGetActivityLog().then((data) => setLogs(data));
    }, 10000);
    return () => clearInterval(interval);
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
    apiAddActivity(staffId, TODAY, entry);
    setDraftText("");
    setDraftType("call");
    setAddingTo(null);
  };

  const removeEntry = (staffId: string, entryId: string) => {
    const log = getLog(staffId);
    const updated = { ...logs, [logKey(staffId)]: { ...log, entries: log.entries.filter((e) => e.id !== entryId) } };
    setLogs(updated);
    apiDeleteActivity(entryId);
  };

  const totalToday = staffConfig.reduce((n, s) => n + getLog(s.id).entries.length, 0);

  // Manual add types only (workflow types are auto-logged)
  const manualTypes = ACTIVITY_TYPES.filter(t => !["recall", "treatment", "claims"].includes(t.id));

  return (
    <div className="h-full flex flex-col bg-pink-50">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-pink-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-rose-400" />
          <span className="font-bold text-slate-900 text-base">Team Activity</span>
          <span className="text-xs text-slate-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-rose-50 rounded-full px-3 py-1">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-xs font-semibold text-rose-600">{totalToday} entries today</span>
          </div>

          {/* View toggle */}
          <div className="flex p-0.5 bg-pink-100 rounded-lg border border-pink-200">
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === "board" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Board
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === "calendar" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>
        </div>
      </div>

      {/* ── Views ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {view === "calendar" ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-1 overflow-hidden"
          >
            <CalendarView staffConfig={staffConfig} logs={logs} />
          </motion.div>
        ) : (
          <motion.div
            key="board"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 overflow-x-auto overflow-y-hidden"
          >
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
                          const t = ACTIVITY_TYPES.find((a) => a.id === entry.type) ?? ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
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
                              {isMe && (
                                <button
                                  onClick={() => removeEntry(s.id, entry.id)}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.badge}`}>
                                  <Icon className="w-2.5 h-2.5" />{t.label}
                                </span>
                              </div>
                              <p className="text-sm text-slate-800 leading-snug pr-4">{entry.description}</p>
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
                            <div className="flex gap-1 mb-2 flex-wrap">
                              {manualTypes.map((t) => {
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

                    {/* Add card button */}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
