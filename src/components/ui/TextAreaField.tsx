"use client";

import { TextareaHTMLAttributes } from "react";

interface TextAreaFieldProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
  error?: string;
}

/**
 * Styled textarea with label for reflection prompts
 */
export function TextAreaField({
  label,
  helperText,
  error,
  className = "",
  ...props
}: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-base text-gray-900">{label}</label>
      {helperText && (
        <p className="text-sm text-gray-500 italic">{helperText}</p>
      )}
      <textarea
        {...props}
        rows={4}
        className={`
          w-full px-4 py-3
          text-base text-gray-900
          bg-white rounded-2xl
          border-2 border-gray-200
          focus:border-brand-primary focus:outline-none
          placeholder:text-gray-400
          transition-colors
          resize-none
          ${error ? "border-red-400" : ""}
          ${className}
        `}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
