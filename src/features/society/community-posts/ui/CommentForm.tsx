'use client';

import { Send } from 'lucide-react';

export function CommentForm({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  buttonLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder: string;
  buttonLabel: string;
}) {
  return (
    <form
      className="mb-8"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
