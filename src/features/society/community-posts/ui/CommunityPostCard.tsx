'use client';

import Link from 'next/link';
import { Lock, MessageCircle, Heart } from 'lucide-react';
import type { CommunityPostListItem } from '../types';

export function CommunityPostCard({
  item,
  title,
  summary,
  dateLabel,
  lockedLabel,
}: {
  item: CommunityPostListItem;
  title: string;
  summary: string;
  dateLabel: string;
  lockedLabel: string;
}) {
  return (
    <Link href={item.href} className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      {item.imageUrl && (
        <div className="aspect-video overflow-hidden bg-slate-100">
          <img src={item.imageUrl} alt={title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          {dateLabel && <span>{dateLabel}</span>}
          {item.requiresSubscription && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
              <Lock className="h-3 w-3" />
              {lockedLabel}
            </span>
          )}
        </div>
        <h2 className="line-clamp-2 text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{summary}</p>
        <div className="mt-6 flex items-center gap-5 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-4 w-4" />
            {item.likesCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" />
            {item.commentsCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
