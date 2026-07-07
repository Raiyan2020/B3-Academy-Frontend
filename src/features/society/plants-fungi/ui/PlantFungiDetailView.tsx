'use client';

import Link from 'next/link';
import type { PlantFungiDetail } from '../types';

export function PlantFungiDetailView({
  item,
  name,
  labels,
  localize,
}: {
  item: PlantFungiDetail;
  name: string;
  labels: Record<'back' | 'scientific' | 'description' | 'properties' | 'benefits' | 'warnings' | 'family' | 'origin' | 'distribution', string>;
  localize: (value: { en: string; ar: string }) => string;
}) {
  const sections = [
    ['description', item.description],
    ['properties', item.properties],
    ['benefits', item.benefits],
    ['warnings', item.warnings],
    ['family', item.family],
    ['origin', item.origin],
    ['distribution', item.distribution],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link href="/monograph" className="mb-8 inline-flex text-sm font-bold text-emerald-700 hover:underline">{labels.back}</Link>
        <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {item.imageUrl && <img src={item.imageUrl} alt={name} className="h-80 w-full object-cover" />}
          <div className="space-y-8 p-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-950">{name}</h1>
              {item.scientificName && <p className="mt-2 text-sm italic text-slate-500">{labels.scientific}: {item.scientificName}</p>}
            </div>
            {sections.map(([key, value]) => {
              const text = value ? localize(value) : '';
              if (!text) return null;
              return (
                <section key={key}>
                  <h2 className="mb-3 text-lg font-bold text-slate-900">{labels[key]}</h2>
                  <p className="leading-7 text-slate-700">{text}</p>
                </section>
              );
            })}
          </div>
        </article>
      </div>
    </main>
  );
}
