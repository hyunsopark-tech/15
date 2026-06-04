"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare, Square, MessageSquare, Send,
  Phone, Calendar, FileCheck, Users, Clock,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DailyTask {
  id: string;
  label: string;
}

interface StaffEntry {
  staffId: string;
  staffName: string;
  color: string;
  initials: string;
  completedTasks: string[];   // task IDs checked off
  callsMade: number;
  textsSent: number;
  appointmentsScheduled: number;
  notes: { text: string; time: string }[];
}

// ─── Config ──────────────────────────────────────────────────────────────────

const DAILY_TASKS: DailyTask[] = [
  { id: "t1", label: "Reviewed recall queue" },
  { id: "t2", label: "Made morning outreach calls" },
  { id: "t3", label: "Sent follow-up texts" },
  { id: "t4", label: "Documented contacts in Open Dental" },
  { id: "t5", label: "Checked insurance aging report" },
  { id: "t6", label: "Followed up on pending claims" },
  { id: "t7", label: "Offered appointment slots to families" },
  { id: "t8", label: "Escalated unresolved items to manager" },
  { id: "t9", label: "End-of-day queue review complete" },
];

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
    staffId,
    staffName: cfg.name,
    color: cfg.color,
    initials: cfg.initials,
    completedTasks: [],
    callsMade: 0,
    textsSent: 0,
    appointmentsScheduled: 0,
    notes: [],
  };
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
    // Ensure an entry exists for every staff member
    const merged: Record<string, StaffEntry> = {};
    for (const s of STAFF_CONFIG) {
      merged[s.id] = loaded[s.id] ?? defaultEntry(s.id);
    }
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
    const note = {
      text: noteInput.trim(),
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
    const entry = progress[currentStaffId] ?? defaultEntry(currentStaffId);
    save({ ...progress, [currentStaffId]: { ...entry, notes: [note, ...entry.notes] } });
    setNoteInput("");
  };

  const completedCount = (entry: StaffEntry) => entry.completedTasks.length;
  const progressPct = (entry: StaffEntry) =>
    Math.round((entry.completedTasks.length / DAILY_TASKS.length) * 100);

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* ── TEAM OVERVIEW STRIP ────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Team Progress — Today
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {STAFF_CONFIG.map((s) => {
            const entry = progress[s.id] ?? defaultEntry(s.id);
            const pct = progressPct(entry);
            const isMe = s.id === currentStaffId;
            const isViewing = s.id === viewingId;

            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setViewingId(s.id)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  isViewing
                    ? "border-2 shadow-md"
                    : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                }`}
                style={isViewing ? { borderColor: s.color, backgroundColor: `${s.color}08` } : {}}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{s.name}</div>
                    <div className="text-[10px] text-slate-400">{isMe ? "You" : s.role}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: s.color }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{completedCount(entry)}/{DAILY_TASKS.length} tasks</span>
                  <span className="font-semibold" style={{ color: s.color }}>{pct}%</span>
                </div>

                {/* Quick stats */}
                <div className="mt-2 flex gap-2 text-[10px] text-slate-500">
                  <span>📞 {entry.callsMade}</span>
                  <span>💬 {entry.textsSent}</span>
                  <span>📅 {entry.appointmentsScheduled}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── DETAIL: VIEWING STAFF ──────────────────────────────── */}
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
            <span className="text-xs text-slate-400">
              {completedCount(viewEntry)}/{DAILY_TASKS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: STAFF_CONFIG.find(s => s.id === viewingId)?.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct(viewEntry)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            {DAILY_TASKS.map((task) => {
              const done = viewEntry.completedTasks.includes(task.id);
              return (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  disabled={!isOwnView}
                  className={`flex items-center gap-2.5 w-full text-left group ${
                    !isOwnView ? "cursor-default" : "cursor-pointer"
                  }`}
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

          {/* Counters (editable only for self) */}
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            {[
              { label: "Calls Made",              field: "callsMade" as const,             icon: Phone },
              { label: "Texts Sent",              field: "textsSent" as const,             icon: MessageSquare },
              { label: "Appointments Scheduled",  field: "appointmentsScheduled" as const, icon: Calendar },
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

          {/* Note input (own only) */}
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

          {/* Notes list */}
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
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                      style={{ backgroundColor: STAFF_CONFIG.find(s => s.id === viewingId)?.color }}
                    >
                      {viewEntry.initials}
                    </div>
                    <span className="text-[10px] text-slate-400">{viewEntry.staffName} · {note.time}</span>
                  </div>
                  <p className="text-sm text-slate-700">{note.text}</p>
                </motion.div>
              ))
            )}
          </div>

          {/* View others' notes hint */}
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
