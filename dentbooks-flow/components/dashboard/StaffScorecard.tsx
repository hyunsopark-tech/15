"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { StaffMember } from "@/lib/types";

interface Props {
  staff: StaffMember[];
}

export default function StaffScorecard({ staff }: Props) {
  const sorted = [...staff].sort((a, b) => b.dailyScore - a.dailyScore);

  const totalRevenue = staff.reduce((sum, s) => sum + s.revenueRecovered, 0);
  const totalCompleted = staff.reduce((sum, s) => sum + s.completedToday, 0);
  const totalOverdue = staff.reduce((sum, s) => sum + s.overdue, 0);

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Team summary bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: Users,
            label: "Team Members",
            value: staff.length,
            color: "blue",
          },
          {
            icon: CheckCircle,
            label: "Tasks Completed",
            value: totalCompleted,
            color: "green",
          },
          {
            icon: AlertTriangle,
            label: "Overdue Tasks",
            value: totalOverdue,
            color: "red",
          },
          {
            icon: DollarSign,
            label: "Revenue Recovered",
            value: `$${totalRevenue.toLocaleString()}`,
            color: "green",
          },
        ].map((metric, i) => {
          const Icon = metric.icon;
          const colorMap = {
            blue: "bg-blue-50 text-blue-600 border-blue-200",
            green: "bg-green-50 text-green-600 border-green-200",
            red: "bg-red-50 text-red-600 border-red-200",
          };

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
            >
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-2 ${colorMap[metric.color as keyof typeof colorMap]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{metric.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Staff cards */}
      <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        Team Performance — Today
      </h2>

      <div className="grid grid-cols-3 gap-5">
        {sorted.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Card header */}
            <div
              className="p-5 text-white"
              style={{ backgroundColor: member.color }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                    {member.initials}
                  </div>
                  <div>
                    <div className="font-bold text-lg leading-none">{member.name}</div>
                    <div className="text-white/70 text-sm">{member.role}</div>
                  </div>
                </div>

                {/* Rank badge */}
                {i === 0 && (
                  <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Score */}
              <div className="mt-4">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black">{member.dailyScore}</span>
                  <span className="text-white/60 text-lg mb-1">/100</span>
                </div>
                <div className="text-white/60 text-xs">Daily Score</div>

                {/* Score bar */}
                <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/80 rounded-full"
                    style={{ width: `${member.dailyScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="p-4 space-y-3">
              <StatRow
                icon={<CheckCircle className="w-4 h-4 text-green-500" />}
                label="Completed Today"
                value={`${member.completedToday} / ${member.assignedTasks}`}
                highlight="green"
              />
              <StatRow
                icon={<Clock className="w-4 h-4 text-amber-500" />}
                label="Pending"
                value={member.pending}
                highlight="amber"
              />
              <StatRow
                icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
                label="Overdue"
                value={member.overdue}
                highlight={member.overdue > 0 ? "red" : "slate"}
              />

              <div className="border-t border-slate-100 pt-3">
                <StatRow
                  icon={<DollarSign className="w-4 h-4 text-green-600" />}
                  label="Revenue Recovered"
                  value={`$${member.revenueRecovered.toLocaleString()}`}
                  highlight="green"
                  bold
                />
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1 pt-1">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star
                    key={si}
                    className={`w-3.5 h-3.5 ${
                      si < Math.round(member.dailyScore / 20)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200 fill-slate-200"
                    }`}
                  />
                ))}
                <span className="text-xs text-slate-400 ml-1">
                  {member.dailyScore >= 90
                    ? "Exceptional"
                    : member.dailyScore >= 80
                    ? "Strong day"
                    : member.dailyScore >= 70
                    ? "Good progress"
                    : "Keep going"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  highlight,
  bold,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight: "green" | "amber" | "red" | "slate";
  bold?: boolean;
}) {
  const textColor = {
    green: "text-green-700",
    amber: "text-amber-700",
    red: "text-red-600",
    slate: "text-slate-600",
  }[highlight];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className={`text-sm ${bold ? "font-bold" : "font-semibold"} ${textColor}`}>
        {value}
      </span>
    </div>
  );
}
