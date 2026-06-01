"use client";

import { motion } from "framer-motion";
import {
  Phone,
  MessageSquare,
  Calendar,
  FileCheck,
  Stethoscope,
  DollarSign,
  TrendingUp,
  Target,
} from "lucide-react";
import { DailyMetrics } from "@/lib/types";

interface Props {
  metrics: DailyMetrics;
}

export default function DailyTracker({ metrics }: Props) {
  const overallProgress = Math.round(
    ((metrics.callsMade / metrics.callsGoal +
      metrics.textsSent / metrics.textsGoal +
      metrics.appointmentsScheduled / metrics.appointmentsGoal +
      metrics.claimsResolved / metrics.claimsGoal +
      metrics.treatmentScheduled / metrics.treatmentGoal +
      metrics.revenueRecovered / metrics.revenueGoal) /
      6) *
      100
  );

  const trackerItems = [
    {
      icon: Phone,
      label: "Calls Made",
      value: metrics.callsMade,
      goal: metrics.callsGoal,
      color: "blue",
      unit: "",
    },
    {
      icon: MessageSquare,
      label: "Texts Sent",
      value: metrics.textsSent,
      goal: metrics.textsGoal,
      color: "purple",
      unit: "",
    },
    {
      icon: Calendar,
      label: "Appointments Scheduled",
      value: metrics.appointmentsScheduled,
      goal: metrics.appointmentsGoal,
      color: "green",
      unit: "",
    },
    {
      icon: FileCheck,
      label: "Claims Resolved",
      value: metrics.claimsResolved,
      goal: metrics.claimsGoal,
      color: "red",
      unit: "",
    },
    {
      icon: Stethoscope,
      label: "Treatment Scheduled",
      value: metrics.treatmentScheduled,
      goal: metrics.treatmentGoal,
      color: "amber",
      unit: "",
    },
    {
      icon: DollarSign,
      label: "Revenue Recovered",
      value: metrics.revenueRecovered,
      goal: metrics.revenueGoal,
      color: "emerald",
      unit: "$",
      format: true,
    },
  ];

  const colorMap = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600", bar: "bg-blue-500", text: "text-blue-700", border: "border-blue-200" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", bar: "bg-purple-500", text: "text-purple-700", border: "border-purple-200" },
    green: { bg: "bg-green-50", icon: "text-green-600", bar: "bg-green-500", text: "text-green-700", border: "border-green-200" },
    red: { bg: "bg-red-50", icon: "text-red-600", bar: "bg-red-500", text: "text-red-700", border: "border-red-200" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", bar: "bg-amber-500", text: "text-amber-700", border: "border-amber-200" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", bar: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-200" },
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Overall progress card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-8 text-white shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Daily Progress</h2>
            <p className="text-blue-200 text-sm">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black">{overallProgress}%</div>
            <div className="text-blue-200 text-sm">of daily goals</div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Revenue highlight */}
        <div className="mt-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-300" />
          <span className="text-blue-100 text-sm">
            <span className="text-white font-bold">
              ${metrics.revenueRecovered.toLocaleString()}
            </span>{" "}
            recovered out of{" "}
            <span className="text-white font-bold">
              ${metrics.revenueGoal.toLocaleString()}
            </span>{" "}
            goal
          </span>
        </div>
      </motion.div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-3 gap-5">
        {trackerItems.map((item, i) => {
          const colors = colorMap[item.color as keyof typeof colorMap];
          const Icon = item.icon;
          const pct = Math.min(100, Math.round((item.value / item.goal) * 100));
          const displayValue = item.format
            ? `$${item.value.toLocaleString()}`
            : item.value;
          const displayGoal = item.format
            ? `$${item.goal.toLocaleString()}`
            : item.goal;

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={`bg-white rounded-2xl border ${colors.border} shadow-sm p-5 overflow-hidden relative`}
            >
              {/* Background decoration */}
              <div
                className={`absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-6 translate-x-6 ${colors.bar}`}
              />

              <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>

              <div className="flex items-end justify-between mb-1">
                <div className={`text-3xl font-black ${colors.text}`}>
                  {displayValue}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <Target className="w-3 h-3" />
                  <span>{displayGoal}</span>
                </div>
              </div>

              <p className="text-sm text-slate-600 font-medium mb-3">{item.label}</p>

              {/* Progress bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${colors.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.08 }}
                />
              </div>

              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-slate-400">{pct}% of goal</span>
                {pct >= 100 && (
                  <span className={`text-[10px] font-bold ${colors.text}`}>
                    ✓ Goal Met!
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Timeline section placeholder */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Activity Timeline — Today
        </h3>
        <div className="space-y-3">
          {[
            { time: "9:02 AM", action: "Lesley called Maria Rodriguez re: Emma (Recall) — Left VM", type: "call" },
            { time: "9:18 AM", action: "Ashley scheduled appointment for Liam Chen — June 14 at 3pm", type: "schedule" },
            { time: "10:05 AM", action: "Lesley sent recall text to Carlos Martinez (Sofia)", type: "text" },
            { time: "10:33 AM", action: "Claim #DDL-2024-8843 resubmitted with narrative — Mia Garcia", type: "claim" },
            { time: "11:14 AM", action: "Ashley called Linda Johnson re: Mason treatment plan — Spoke with guardian", type: "call" },
            { time: "11:47 AM", action: "Isabella Davis confirmed for treatment — $1,840 case scheduled", type: "revenue" },
            { time: "1:02 PM", action: "Claim #CIG-44291 status checked — still pending review, follow-up set", type: "claim" },
            { time: "2:15 PM", action: "Lesley escalated Charlotte Moore claim to Vanessa", type: "escalate" },
          ].map((event, i) => {
            const typeColors: Record<string, string> = {
              call: "bg-blue-500",
              schedule: "bg-green-500",
              text: "bg-purple-500",
              claim: "bg-red-500",
              revenue: "bg-emerald-500",
              escalate: "bg-orange-500",
            };

            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeColors[event.type]}`} />
                  {i < 7 && <div className="w-px h-6 bg-slate-200 mt-1" />}
                </div>
                <div className="flex-1 pb-2">
                  <span className="text-xs font-semibold text-slate-400 mr-2">{event.time}</span>
                  <span className="text-sm text-slate-700">{event.action}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
