"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Plus, Trash2, X, UserPlus } from "lucide-react";
import { apiGetStaff, apiUpsertStaff, apiDeleteStaff } from "@/lib/api-client";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  color: string;
  initials: string;
}

const DEFAULT_STAFF: StaffMember[] = [
  { id: "vanessa", name: "Vanessa", role: "Office Manager", color: "#7C3AED", initials: "V" },
  { id: "lesley",  name: "Lesley",  role: "Front Desk",     color: "#2563EB", initials: "L" },
  { id: "jen",     name: "Jen",     role: "Front Desk",     color: "#0891B2", initials: "J" },
  { id: "idalia",  name: "Idalia",  role: "Front Desk",     color: "#16A34A", initials: "I" },
];

const COLORS = [
  "#7C3AED", "#2563EB", "#0891B2", "#16A34A",
  "#D97706", "#DC2626", "#DB2777", "#059669",
  "#7C3AED", "#1D4ED8", "#0E7490", "#15803D",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

function pickColor(existing: StaffMember[]): string {
  const used = new Set(existing.map((s) => s.color));
  return COLORS.find((c) => !used.has(c)) ?? COLORS[existing.length % COLORS.length];
}

interface Props {
  onLogin: (staffId: string, staffName: string) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>(DEFAULT_STAFF);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Front Desk");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    apiGetStaff().then(data => { if (data.length > 0) setStaff(data); });
  }, []);

  const addUser = () => {
    if (!newName.trim()) return;
    const name = newName.trim();
    const newMember: StaffMember = {
      id: `user-${Date.now()}`,
      name,
      role: newRole.trim() || "Front Desk",
      color: pickColor(staff),
      initials: getInitials(name),
    };
    const updated = [...staff, newMember];
    setStaff(updated);
    apiUpsertStaff(newMember);
    setNewName("");
    setNewRole("Front Desk");
    setShowAddModal(false);
  };

  const deleteUser = (id: string) => {
    const updated = staff.filter((s) => s.id !== id);
    setStaff(updated);
    apiDeleteStaff(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 mb-10"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">DentBooks</div>
          <div className="text-sm text-rose-500 font-semibold tracking-widest uppercase">Flow</div>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-3xl shadow-xl border border-pink-100 p-8 w-full max-w-md"
      >
        <h1 className="text-xl font-bold text-slate-900 text-center mb-1">Who are you?</h1>
        <p className="text-sm text-slate-400 text-center mb-8">Tap your name to get started</p>

        <div className="space-y-3">
          {staff.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => onLogin(s.id, s.name)}
                className="flex-1 flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-pink-200 hover:bg-pink-50 transition-all group"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: s.color }}
                >
                  {s.initials}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 text-base">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.role}</div>
                </div>
                <div className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors text-lg">→</div>
              </button>

              {showManage && (
                <button
                  onClick={() => setDeleteConfirmId(s.id)}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => { setShowAddModal(true); setShowManage(false); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-dashed border-slate-300 text-slate-500 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
          <button
            onClick={() => setShowManage(!showManage)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-medium transition-all ${
              showManage
                ? "border-red-200 text-red-600 bg-red-50"
                : "border-slate-200 text-slate-500 hover:border-pink-200 hover:bg-pink-50"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {showManage ? "Done" : "Manage"}
          </button>
        </div>
      </motion.div>

      <p className="text-xs text-slate-400 mt-6">No password required</p>

      {/* ── Add User Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-rose-500" />
                  </div>
                  <h2 className="font-bold text-slate-900">Add New User</h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addUser()}
                    placeholder="e.g. Maria"
                    autoFocus
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. Front Desk"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300"
                  />
                </div>

                {newName.trim() && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: pickColor(staff) }}
                    >
                      {getInitials(newName)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{newName.trim()}</div>
                      <div className="text-xs text-slate-400">{newRole || "Front Desk"}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addUser}
                  disabled={!newName.trim()}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            >
              {(() => {
                const member = staff.find((s) => s.id === deleteConfirmId);
                return (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: member?.color }}
                      >
                        {member?.initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Remove {member?.name}?</h3>
                        <p className="text-xs text-slate-400">{member?.role}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-5">This will remove them from the login screen. Their saved progress data will remain.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => deleteUser(deleteConfirmId)}
                        className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
