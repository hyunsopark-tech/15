"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Paperclip,
  Upload,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { mockSOPs } from "@/lib/mock-data";
import { SOPDocument, WorkflowType } from "@/lib/types";

interface Props {
  workflow: WorkflowType;
}

export default function SOPPanel({ workflow }: Props) {
  const [sops, setSOPs] = useState<SOPDocument[]>(mockSOPs);
  const [isExpanded, setIsExpanded] = useState(true);

  const visibleSOPs = sops.filter(
    (s) => s.workflow === workflow || s.workflow === "all"
  );

  const handleUpload = (id: string) => {
    setSOPs((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              attached: true,
              lastUpdated: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              fileSize: "—",
            }
          : s
      )
    );
  };

  const handleReplace = (id: string) => {
    handleUpload(id);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">SOPs & Scripts</span>
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
            <div className="space-y-2">
              {visibleSOPs.map((sop) => (
                <SOPCard
                  key={sop.id}
                  sop={sop}
                  onUpload={() => handleUpload(sop.id)}
                  onReplace={() => handleReplace(sop.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SOPCard({
  sop,
  onUpload,
  onReplace,
}: {
  sop: SOPDocument;
  onUpload: () => void;
  onReplace: () => void;
}) {
  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        sop.attached
          ? "border-slate-200 bg-white"
          : "border-dashed border-slate-300 bg-slate-50"
      }`}
    >
      {/* Title row */}
      <div className="flex items-start gap-2 mb-2">
        <FileText
          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
            sop.attached ? "text-blue-500" : "text-slate-400"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 leading-tight">
            {sop.title}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
            {sop.description}
          </p>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-1.5 mb-2">
        {sop.attached ? (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-[10px] font-medium text-green-600">Attached</span>
            {sop.lastUpdated && (
              <span className="text-[10px] text-slate-400">
                · Updated {sop.lastUpdated}
              </span>
            )}
            {sop.fileSize && (
              <span className="text-[10px] text-slate-400">· {sop.fileSize}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-medium text-amber-600">Not attached</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {sop.attached ? (
          <>
            <button className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-all border border-blue-200">
              <Eye className="w-3 h-3" />
              View
            </button>
            <button
              onClick={onReplace}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Replace
            </button>
          </>
        ) : (
          <button
            onClick={onUpload}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-all"
          >
            <Upload className="w-3 h-3" />
            Upload SOP
          </button>
        )}
      </div>
    </div>
  );
}
