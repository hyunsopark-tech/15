"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MessageSquare,
  Phone,
  FileText,
  BarChart3,
  Zap,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Patient, WorkflowType } from "@/lib/types";
import { getAIOutput } from "@/lib/mock-data";

interface AIButton {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  workflows: WorkflowType[];
}

const AI_BUTTONS: AIButton[] = [
  {
    id: "recall-text",
    label: "Warm Recall Text",
    icon: MessageSquare,
    description: "Parent-friendly recall text",
    workflows: ["recall"],
  },
  {
    id: "treatment-script",
    label: "Treatment Call Script",
    icon: Phone,
    description: "Non-fear treatment script",
    workflows: ["treatment"],
  },
  {
    id: "claims-script",
    label: "Insurance Call Script",
    icon: Phone,
    description: "Payer call talking points",
    workflows: ["claims"],
  },
  {
    id: "commlog",
    label: "Open Dental Commlog",
    icon: FileText,
    description: "Pre-formatted commlog note",
    workflows: ["recall", "treatment", "claims"],
  },
  {
    id: "manager-summary",
    label: "Manager Summary",
    icon: BarChart3,
    description: "End-of-day team summary",
    workflows: ["recall", "treatment", "claims"],
  },
  {
    id: "next-action",
    label: "Next Best Action",
    icon: Zap,
    description: "AI-recommended next step",
    workflows: ["recall", "treatment", "claims"],
  },
];

interface Props {
  patient: Patient | null;
  workflow: WorkflowType;
}

export default function AISupportPanel({ patient, workflow }: Props) {
  const [activeOutput, setActiveOutput] = useState<string | null>(null);
  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const relevantButtons = AI_BUTTONS.filter((b) => b.workflows.includes(workflow));

  const handleGenerate = (action: AIButton) => {
    if (activeOutput === action.id) {
      setActiveOutput(null);
      setOutputText("");
      return;
    }
    setActiveOutput(action.id);
    setOutputText(getAIOutput(action.id, patient));
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">AI Support</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {!patient && (
              <p className="text-xs text-slate-400 italic mb-3">
                Select a patient to generate patient-specific content
              </p>
            )}

            {/* Action buttons */}
            <div className="space-y-1.5 mb-3">
              {relevantButtons.map((btn) => {
                const Icon = btn.icon;
                const isActive = activeOutput === btn.id;

                return (
                  <button
                    key={btn.id}
                    onClick={() => handleGenerate(btn)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-xs font-medium ${
                      isActive
                        ? "bg-purple-50 border border-purple-200 text-purple-700"
                        : "border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-purple-600" : "text-slate-400"}`} />
                    <div className="flex-1">
                      <div>{btn.label}</div>
                      <div className={`text-[10px] font-normal ${isActive ? "text-purple-500" : "text-slate-400"}`}>
                        {btn.description}
                      </div>
                    </div>
                    {isActive && <Sparkles className="w-3 h-3 text-purple-400" />}
                  </button>
                );
              })}
            </div>

            {/* Output area */}
            <AnimatePresence>
              {activeOutput && outputText && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="border border-purple-200 rounded-lg bg-purple-50 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wide">
                        AI Generated
                      </span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md transition-all ${
                        copied
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                      }`}
                    >
                      {copied ? (
                        <><Check className="w-3 h-3" /> Copied</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy</>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-purple-900 leading-relaxed whitespace-pre-wrap">
                    {outputText}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
