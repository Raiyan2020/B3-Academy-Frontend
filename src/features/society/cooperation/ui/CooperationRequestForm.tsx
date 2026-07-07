'use client';

import type { CooperationType } from '../types';

export function CooperationRequestForm({
  types,
  selectedTypeId,
  title,
  message,
  labels,
  isSubmitting,
  onTypeChange,
  onTitleChange,
  onMessageChange,
  onSubmit,
}: {
  types: CooperationType[];
  selectedTypeId: string;
  title: string;
  message: string;
  labels: Record<'type' | 'title' | 'message' | 'submit' | 'noTypes', string>;
  isSubmitting?: boolean;
  onTypeChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
}) {
  if (types.length === 0) {
    return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">{labels.noTypes}</div>;
  }

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">{labels.type}</span>
        <select value={selectedTypeId} onChange={(event) => onTypeChange(event.target.value)} className="w-full rounded-md border border-slate-200 px-4 py-3">
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name.en || type.name.ar}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-bold text-slate-700">{labels.title}</span>
        <input value={title} onChange={(event) => onTitleChange(event.target.value)} className="w-full rounded-md border border-slate-200 px-4 py-3" required minLength={3} />
      </label>
      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-bold text-slate-700">{labels.message}</span>
        <textarea value={message} onChange={(event) => onMessageChange(event.target.value)} rows={7} className="w-full resize-none rounded-md border border-slate-200 px-4 py-3" required minLength={10} />
      </label>
      <button disabled={isSubmitting || !selectedTypeId} className="mt-6 w-full rounded-lg bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
        {labels.submit}
      </button>
    </form>
  );
}
