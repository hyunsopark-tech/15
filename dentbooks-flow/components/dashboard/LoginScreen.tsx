"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";

const STAFF = [
  { id: "vanessa", name: "Vanessa", role: "Office Manager", color: "#7C3AED", initials: "V" },
  { id: "lesley",  name: "Lesley",  role: "Front Desk",     color: "#2563EB", initials: "L" },
  { id: "jen",     name: "Jen",     role: "Front Desk",     color: "#0891B2", initials: "J" },
  { id: "idalia",  name: "Idalia",  role: "Front Desk",     color: "#16A34A", initials: "I" },
];

interface Props {
  onLogin: (staffId: string, staffName: string) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 mb-10"
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">DentBooks</div>
          <div className="text-sm text-blue-600 font-semibold tracking-widest uppercase">Flow</div>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 w-full max-w-md"
      >
        <h1 className="text-xl font-bold text-slate-900 text-center mb-1">Who are you?</h1>
        <p className="text-sm text-slate-400 text-center mb-8">Tap your name to get started</p>

        <div className="space-y-3">
          {STAFF.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              onClick={() => onLogin(s.id, s.name)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
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
            </motion.button>
          ))}
        </div>
      </motion.div>

      <p className="text-xs text-slate-400 mt-6">No password required</p>
    </div>
  );
}
