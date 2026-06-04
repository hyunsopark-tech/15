"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, Square, MessageSquare, Send,
  Phone, Calendar, Users, Trophy, TrendingUp,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DailyTask {
  id: string;
  label: string;
  group: string;
}

interface StaffEntry {
  staffId: string;
  staffName: string;
  color: string;
  initials: string;
  completedTasks: string[];
  callsMade: number;
  textsSent: number;
  appointmentsScheduled: number;
  notes: { text: string; time: string }[];
}

// ─── Config ──────────────────────────────────────────────────────────────────

const DAILY_TASKS: DailyTask[] = [
  { id: "t1", label: "Reviewed recall queue",                  group: "Morning" },
  { id: "t2", label: "Made morning outreach calls",            group: "Morning" },
  { id: "t3", label: "Sent follow-up texts",                   group: "Morning" },
  { id: "t4", label: "Documented contacts in Open Dental",     group: "Midday"  },
  { id: "t5", label: "Checked insurance aging report",         group: "Midday"  },
  { id: "t6", label: "Followed up on pending claims",          group: "Midday"  },
  { id: "t7", label: "Offered appointment slots to families",  group: "Afternoon"},
  { id: "t8", label: "Escalated unresolved items to manager",  group: "Afternoon"},
  { id: "t9", label: "End-of-day queue review complete",       group: "Afternoon"},
];

const TASK_GROUPS = ["Morning", "Midday", "Afternoon"];

const STAFF_CONFIG = [
  { id: "vanessa", name: "Vanessa", role: "Office Manager", color: "#7C3AED", initials: "V" },
  { id: "lesley",  name: "Lesley",  role: "Front Desk",     color: "#2563EB", initials: "L" },
  { id: "jen",     name: "Jen",     role: "Front Desk",     color: "#0891B2", initials: "J" },
  { id: "idalia",  name: "Idalia",  role: "Front Desk",     color: "#16A34A", initials: "I" },
];

const STORAGE_KEY = "dentbooks-staff-progress";

function loadProgress(): Record<string, StaffEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveProgress(data: Record<string, StaffEntry>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function defaultEntry(staffId: string): StaffEntry {
  const cfg = STAFF_CONFIG.find((s) => s.id === staffId)!;
  return {
    staffId, staffName: cfg.name, color: cfg.color, initials: cfg.initials,
    completedTasks: [], callsMade: 0, textsSent: 0, appointmentsScheduled: 0, notes: [],
  };
}

function rankLabel(rank: number): { icon: string; color: string } {
  if (rank === 1) return { icon: "🥇", color: "text-amber-500" };
  if (rank === 2) return { icon: "🥈", color: "text-slate-400" };
  if (rank === 3) return { icon: "🥉", color: "text-amber-700" };
  return { icon: "", color: "" };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  currentStaffId: string;
  currentStaffName: string;
}

export default function StaffProgress({ currentStaffId, currentStaffName }: Props) {
  const [progress, setProgress] = useState<Record<string, StaffEntry>>({});
  const [noteInput, setNoteInput] = useState("");
  const [viewingId, setViewingId] = useState(currentStaffId);

  useEffect(() => {
    const loaded = loadProgress();
    const merged: Record<string, StaffEntry> = {};
    for (const s of STAFF_CONFIG) merged[s.id] = loaded[s.id] ?? defaultEntry(s.id);
    setProgress(merged);
  }, []);

  const save = (updated: Record<string, StaffEntry>) => {
    setProgress(updated);
    saveProgress(updated);
  };

  const myEntry = progress[currentStaffId] ?? defaultEntry(currentStaffId);
  const viewEntry = progress[viewingId] ?? defaultEntry(viewingId);
  const isOwnView = viewingId === currentStaffId;

  const toggleTask = (taskId: string) => {
    if (!isOwnView) return;
    const completed = myEntry.completedTasks.includes(taskId)
      ? myEntry.completedTasks.filter((t) => t !== taskId)
      : [...myEntry.completedTasks, taskId];
    save({ ...progress, [currentStaffId]: { ...myEntry, completedTasks: completed } });
  };

  const updateCount = (field: "callsMade" | "textsSent" | "appointmentsScheduled", delta: number) => {
    if (!isOwnView) return;
    const val = Math.max(0, (myEntry[field] as number) + delta);
    save({ ...progress, [currentStaffId]: { ...myEntry, [field]: val } });
  };

  const addNote = () => {
    if (!noteInput.trim()) return;
    const note = { text: noteInput.trim(), time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) };
    const entry = progress[currentStaffId] ?? defaultEntry(currentStaffId);
    save({ ...progress, [currentStaffId]: { ...entry, notes: [note, ...entry.notes] } });
    setNoteInput("");
  };

  const completedCount = (entry: StaffEntry) => entry.completedTasks.length;
  const progressPct = (entry: StaffEntry) => Math.round((entry.completedTasks.length / DAILY_TASKS.length) * 100);

  // Ranked list by completed tasks (desc), then calls+appts
  const ranked = [...STAFF_CONFIG].sort((a, b) => {
    const ea = progress[a.id] ?? defaultEntry(a.id);
    const eb = progress[b.id] ?? defaultEntry(b.id);
    const taskDiff = completedCount(eb) - completedCount(ea);
    if (taskDiff !== 0) return taskDiff;
    return (eb.callsMade + eb.appointmentsScheduled) - (ea.callsMade + ea.appointmentsScheduled);
  });

  const totalTeamTasks = STAFF_CONFIG.reduce((sum, s) => sum + completedCount(progress[s.id] ?? defaultEntry(s.id)), 0);
  const maxPossible = STAFF_CONFIG.length * DAILY_TASKS.length;

  return (
    <div className="h-full overflow-y-auto p-6">

      {/* ── TEAM SCOREBOARD ────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Team Progress — Today
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span><strong className="text-slate-800">{totalTeamTasks}</strong> / {maxPossible} team tasks done</span>
          </div>
        </div>

        {/* Team total bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round((totalTeamTasks / maxPossible) * 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Staff cards */}
        <div className="grid grid-cols-4 gap-3">
          {ranked.map((s, rankIdx) => {
            const entry = progress[s.id] ?? defaultEntry(s.id);
            const count = completedCount(entry);
            const isMe = s.id === currentStaffId;
            const isViewing = s.id === viewingId;
            const { icon: rankIcon } = rankLabel(rankIdx + 1);

            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rankIdx * 0.05 }}
                onClick={() => setViewingId(s.id)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  isViewing ? "border-2 shadow-md" : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                }`}
                style={isViewing ? { borderColor: s.color, backgroundColor: `${s.color}08` } : {}}
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: s.color }}>
                      {s.initials}
                    </div>
                    {rankIdx < 3 && (
                      <span className="absolute -top-1 -right-1 text-sm leading-none">{rankIcon}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{s.name}</div>
                    <div className="text-[10px] text-slate-400">{isMe ? "You" : s.role}</div>
                  </div>
                </div>

                {/* Checkpoint blocks — 9 squares, one per task */}
                <div className="flex gap-0.5 mb-2 flex-wrap">
                  {DAILY_TASKS.map((task) => {
                    const done = entry.completedTasks.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        className="w-4 h-4 rounded-sm transition-all"
                        style={{ backgroundColor: done ? s.color : "#e2e8f0" }}
                        title={task.label}
                      />
                    );
                  })}
                </div>

                {/* Count */}
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black" style={{ color: s.color }}>{count}</span>
                  <span className="text-[10px] text-slate-400">/ {DAILY_TASKS.length} tasks</span>
                </div>

                {/* Activity stats */}
                <div className="mt-1.5 flex gap-2 text-[10px] text-slate-500">
                  <span>📞 {entry.callsMade}</span>
                  <span>💬 {entry.textsSent}</span>
                  <span>📅 {entry.appointmentsScheduled}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── DETAIL VIEW ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-5">

        {/* LEFT: Task checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: STAFF_CONFIG.find(s => s.id === viewingId)?.color }}
              >
                {viewEntry.initials}
              </div>
              <h3 className="font-semibold text-slate-900">
                {isOwnView ? "My Daily Tasks" : `${viewEntry.staffName}'s Tasks`}
              </h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
              backgroundColor: `${STAFF_CONFIG.find(s => s.id === viewingId)?.color}18`,
              color: STAFF_CONFIG.find(s => s.id === viewingId)?.color,
            }}>
              {completedCount(viewEntry)}/{DAILY_TASKS.length}
            </span>
          </div>

          {/* Segmented progress bar — one segment per task */}
          <div className="flex gap-0.5 mb-5">
            {DAILY_TASKS.map((task) => {
              const done = viewEntry.completedTasks.includes(task.id);
              return (
                <motion.div
                  key={task.id}
                  className="flex-1 h-2.5 rounded-sm"
                  animate={{ backgroundColor: done ? STAFF_CONFIG.find(s => s.id === viewingId)?.color ?? "#94a3b8" : "#e2e8f0" }}
                  transition={{ duration: 0.25 }}
                  title={task.label}
                />
              );
            })}
          </div>

          {/* Tasks grouped by time of day */}
          <div className="space-y-4">
            {TASK_GROUPS.map((group) => {
              const groupTasks = DAILY_TASKS.filter((t) => t.group === group);
              const groupDone = groupTasks.filter((t) => viewEntry.completedTasks.includes(t.id)).length;
              return (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group}</span>
                    <span className="text-[10px] text-slate-300">{groupDone}/{groupTasks.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {groupTasks.map((task) => {
                      const done = viewEntry.completedTasks.includes(task.id);
                      return (
                        <button
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          disabled={!isOwnView}
                          className={`flex items-center gap-2.5 w-full text-left group rounded-lg px-2 py-1.5 transition-all ${
                            done ? "bg-slate-50" : isOwnView ? "hover:bg-slate-50" : ""
                          } ${!isOwnView ? "cursor-default" : "cursor-pointer"}`}
                        >
                          {done ? (
                            <CheckSquare className="w-4 h-4 flex-shrink-0" style={{ color: STAFF_CONFIG.find(s => s.id === viewingId)?.color }} />
                          ) : (
                            <Square className={`w-4 h-4 flex-shrink-0 text-slate-300 ${isOwnView ? "group-hover:text-slate-500" : ""}`} />
                          )}
                          <span className={`text-sm ${done ? "line-through text-slate-400" : "text-slate-700"}`}>
                            {task.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Counters */}
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            {[
              { label: "Calls Made",             field: "callsMade" as const,             icon: Phone },
              { label: "Texts Sent",             field: "textsSent" as const,             icon: MessageSquare },
              { label: "Appointments Scheduled", field: "appointmentsScheduled" as const, icon: Calendar },
            ].map(({ label, field, icon: Icon }) => (
              <div key={field} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  {label}
                </div>
                <div className="flex items-center gap-2">
                  {isOwnView && (
                    <button onClick={() => updateCount(field, -1)} className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-all">−</button>
                  )}
                  <span className="text-sm font-bold text-slate-900 w-5 text-center">{viewEntry[field]}</span>
                  {isOwnView && (
                    <button onClick={() => updateCount(field, 1)} className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all" style={{ backgroundColor: STAFF_CONFIG.find(s => s.id === currentStaffId)?.color }}>+</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Notes feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              {isOwnView ? "My Notes" : `${viewEntry.staffName}'s Notes`}
            </h3>
            <span className="text-xs text-slate-400">Visible to all staff</span>
          </div>

          {isOwnView && (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder="Add a note or update..."
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
              <button
                onClick={addNote}
                className="px-3 py-2 text-white rounded-lg flex items-center gap-1 text-sm font-medium transition-all"
                style={{ backgroundColor: STAFF_CONFIG.find(s => s.id === currentStaffId)?.color }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2">
            {viewEntry.notes.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center mt-8">No notes yet today</p>
            ) : (
              viewEntry.notes.map((note, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                      style={{ backgroundColor: STAFF_CONFIG.find(s => s.id === viewingId)?.color }}>
                      {viewEntry.initials}
                    </div>
                    <span className="text-[10px] text-slate-400">{viewEntry.staffName} · {note.time}</span>
                  </div>
                  <p className="text-sm text-slate-700">{note.text}</p>
                </motion.div>
              ))
            )}
          </div>

          {isOwnView && (
            <p className="text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
              Click any team member above to view their notes and progress
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
