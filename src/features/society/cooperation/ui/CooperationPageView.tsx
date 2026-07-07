'use client';

import type { CooperationType } from '../types';
import { CooperationRequestForm } from './CooperationRequestForm';

export function CooperationPageView({
  title,
  description,
  types,
  selectedTypeId,
  requestTitle,
  requestMessage,
  labels,
  isSubmitting,
  onTypeChange,
  onTitleChange,
  onMessageChange,
  onSubmit,
}: {
  title: string;
  description: string;
  types: CooperationType[];
  selectedTypeId: string;
  requestTitle: string;
  requestMessage: string;
  labels: Record<'type' | 'title' | 'message' | 'submit' | 'noTypes', string>;
  isSubmitting?: boolean;
  onTypeChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-950">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{description}</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <CooperationRequestForm
          types={types}
          selectedTypeId={selectedTypeId}
          title={requestTitle}
          message={requestMessage}
          labels={labels}
          isSubmitting={isSubmitting}
          onTypeChange={onTypeChange}
          onTitleChange={onTitleChange}
          onMessageChange={onMessageChange}
          onSubmit={onSubmit}
        />
      </section>
    </main>
  );
}
