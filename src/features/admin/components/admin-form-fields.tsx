'use client';

import type { LocalizedString } from '../../../../types';
import { SubmitButton } from '@/components/ui/submit-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
/** @deprecated Use toastSuccess instead of inline save banners. */
export function AdminSaveMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p>;
}

export function AdminFormCard({
  title,
  children,
  onSubmit,
  submitLabel,
  isPending,
  pendingLabel,
}: {
  title: string;
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent) => void;
  submitLabel: string;
  isPending?: boolean;
  pendingLabel?: string;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-bold text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
      <SubmitButton
        isPending={isPending}
        label={submitLabel}
        pendingLabel={pendingLabel}
        className="mt-5"
      />
    </form>
  );
}

export function LocalizedFields({
  label,
  value,
  onChange,
  multiline,
  isAr,
}: {
  label: string;
  value: LocalizedString;
  onChange: (next: LocalizedString) => void;
  multiline?: boolean;
  isAr: boolean;
}) {
  const Field = multiline ? Textarea : Input;

  return (
    <fieldset className="grid gap-2 rounded-md border border-slate-100 p-3">
      <legend className="px-1 text-sm font-semibold text-slate-700">{label}</legend>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        {isAr ? 'العربية' : 'Arabic'}
        <Field
          value={value.ar}
          onChange={(event) => onChange({ ...value, ar: event.target.value })}
          dir="rtl"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        {isAr ? 'الإنجليزية' : 'English'}
        <Field
          value={value.en}
          onChange={(event) => onChange({ ...value, en: event.target.value })}
          dir="ltr"
        />
      </label>
    </fieldset>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  dir?: 'rtl' | 'ltr';
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} dir={dir} />
    </label>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="rounded border-slate-300" />
      {label}
    </label>
  );
}
