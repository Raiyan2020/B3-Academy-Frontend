'use client';

import type { CommunityPostListItem } from '../types';
import { CommunityPostCard } from './CommunityPostCard';

export function CommunityPostListView({
  title,
  description,
  items,
  emptyText,
  lockedLabel,
  formatDate,
  localize,
}: {
  title: string;
  description: string;
  items: CommunityPostListItem[];
  emptyText: string;
  lockedLabel: string;
  formatDate: (value?: string) => string;
  localize: (value: { en: string; ar: string }) => string;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
          <p className="mt-2 max-w-2xl text-slate-600">{description}</p>
        </div>
        {items.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CommunityPostCard
                key={item.id}
                item={item}
                title={localize(item.title)}
                summary={localize(item.summary)}
                dateLabel={formatDate(item.publishedAt)}
                lockedLabel={lockedLabel}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
            {emptyText}
          </div>
        )}
      </section>
    </main>
  );
}
