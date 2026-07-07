'use client';

import type { PlantFungiCategory, PlantFungiEntry } from '../types';
import { PlantFungiCard } from './PlantFungiCard';

export function PlantFungiPageView({
  title,
  searchLabel,
  categoryLabel,
  allCategoriesLabel,
  emptyText,
  search,
  categoryId,
  categories,
  items,
  localize,
  onSearchChange,
  onCategoryChange,
}: {
  title: string;
  searchLabel: string;
  categoryLabel: string;
  allCategoriesLabel: string;
  emptyText: string;
  search: string;
  categoryId: string;
  categories: PlantFungiCategory[];
  items: PlantFungiEntry[];
  localize: (value: { en: string; ar: string }) => string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}) {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-slate-950">{title}</h1>
        <div className="mb-8 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_260px]">
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchLabel} className="rounded-md border border-slate-200 px-4 py-3" />
          <label className="grid gap-1">
            <span className="text-xs font-bold text-slate-500">{categoryLabel}</span>
            <select value={categoryId} onChange={(event) => onCategoryChange(event.target.value)} className="rounded-md border border-slate-200 px-4 py-3">
              <option value="">{allCategoriesLabel}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {localize(category.name)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {items.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {items.map((item) => (
              <PlantFungiCard key={item.id} item={item} name={localize(item.name)} description={localize(item.briefDescription)} category={item.category ? localize(item.category.name) : undefined} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">{emptyText}</div>
        )}
      </div>
    </main>
  );
}
