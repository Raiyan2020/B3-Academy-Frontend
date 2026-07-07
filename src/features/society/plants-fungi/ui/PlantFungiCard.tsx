'use client';

import Link from 'next/link';
import type { PlantFungiEntry } from '../types';

export function PlantFungiCard({
  item,
  name,
  description,
  category,
}: {
  item: PlantFungiEntry;
  name: string;
  description: string;
  category?: string;
}) {
  return (
    <Link href={item.href} className="flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      {item.imageUrl && <img src={item.imageUrl} alt={name} className="h-44 w-40 shrink-0 object-cover" />}
      <div className="min-w-0 flex-1 p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {item.typeLabel && <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{item.typeLabel}</span>}
          {category && <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{category}</span>}
        </div>
        <h2 className="text-xl font-bold text-slate-950">{name}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </Link>
  );
}
