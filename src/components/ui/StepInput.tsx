"use client";

import { useState } from "react";
import { Plus, Calendar, X, Clock } from "lucide-react";

interface StepInputProps {
  onAdd: (step: { title: string; targetDate?: string }) => void;
  placeholder?: string;
}

export function StepInput({
  onAdd,
  placeholder = "e.g. update CV",
}: StepInputProps) {
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [showDate, setShowDate] = useState(false);

  const handleAdd = () => {
    if (title.trim()) {
      onAdd({
        title: title.trim(),
        targetDate: targetDate || undefined,
      });
      setTitle("");
      setTargetDate("");
      setShowDate(false);
    }
  };

  return (
    <div className="space-y-4 p-5 bg-white rounded-3xl border border-gray-100 animate-in fade-in zoom-in-95">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-[var(--color-magenta)] uppercase tracking-widest px-1">
          Add new step
        </label>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={placeholder}
            className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-[var(--color-magenta)]/40 text-gray-900 placeholder:text-gray-300"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex-1">
          {showDate ? (
            <div className="flex items-center gap-2 px-4 h-14 bg-gray-50 rounded-2xl animate-in slide-in-from-left-2">
              <Calendar className="w-5 h-5 text-[var(--color-magenta)]" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="flex-1 text-base border-none focus:outline-none focus:ring-2 focus:ring-[var(--color-magenta)]/40 p-0 text-gray-700 bg-transparent cursor-pointer rounded"
              />
              <button
                onClick={() => { setShowDate(false); setTargetDate(""); }}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDate(true)}
              className="flex items-center gap-2 px-4 h-14 rounded-2xl text-gray-400 hover:text-[var(--color-magenta)] hover:bg-[var(--color-magenta)]/5 transition-all text-base font-medium"
            >
              <Clock className="w-5 h-5" />
              <span>Add deadline</span>
            </button>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={!title.trim()}
          className="w-12 h-12 bg-[var(--color-magenta)] text-white rounded-2xl flex items-center justify-center disabled:opacity-30 disabled:shadow-none transition-all active:scale-95 group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
}
