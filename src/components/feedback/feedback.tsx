'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';

export function FormFieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return <p id={id} role="alert" className="mt-1 text-sm text-red-700">{children}</p>;
}

export function FormStatusMessage({ severity, children }: { severity: 'success' | 'error' | 'info'; children: ReactNode }) {
  const style = severity === 'success' ? 'bg-emerald-50 text-emerald-800' : severity === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800';
  return <div role={severity === 'error' ? 'alert' : 'status'} className={`rounded-xl p-3 text-sm ${style}`}>{children}</div>;
}

export function InlineNotice({ children }: { children: ReactNode }) {
  return <div className="flex gap-2 rounded-xl bg-amber-50 p-4 text-amber-900"><AlertCircle className="shrink-0" size={20} />{children}</div>;
}

function StatePanel({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center"><div className="mb-3 flex justify-center">{icon}</div><h2 className="text-xl font-bold">{title}</h2>{description && <p className="mt-2 text-slate-600">{description}</p>}{action && <div className="mt-5">{action}</div>}</section>;
}

export const EmptyState = (props: Omit<Parameters<typeof StatePanel>[0], 'icon'>) => <StatePanel {...props} icon={<CheckCircle2 className="text-slate-400" />} />;
export const UnavailableState = (props: Omit<Parameters<typeof StatePanel>[0], 'icon'>) => <StatePanel {...props} icon={<AlertCircle className="text-amber-600" />} />;
export const LoadingState = ({ title = 'Loading…' }: { title?: string }) => <StatePanel title={title} icon={<LoaderCircle className="animate-spin text-emerald-600" />} />;
export const RetryPanel = ({ title, description, onRetry }: { title: string; description?: string; onRetry: () => void }) => <StatePanel title={title} description={description} icon={<AlertCircle className="text-red-600" />} action={<button type="button" onClick={onRetry} className="rounded-lg bg-emerald-700 px-4 py-2 text-white">Retry</button>} />;
