'use client';

import Link from 'next/link';
import { Lock, LogIn } from 'lucide-react';

export function CommunityPostAccessState({
  title,
  message,
  ctaHref,
  ctaLabel,
  requiresSubscription,
}: {
  title: string;
  message: string;
  ctaHref: string;
  ctaLabel: string;
  requiresSubscription: boolean;
}) {
  const Icon = requiresSubscription ? Lock : LogIn;
  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">{message}</p>
        <Link href={ctaHref} className="mt-6 inline-flex rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
