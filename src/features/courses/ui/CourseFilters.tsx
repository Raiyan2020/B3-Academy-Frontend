import { Search } from 'lucide-react';
import type { CourseCategory, CourseFilters as CourseFiltersType, CourseLevel } from '../types/api.types';

export function CourseFilters({
  filters,
  categories,
  levels = [],
  isAr,
  onChange,
}: {
  filters: CourseFiltersType;
  categories: CourseCategory[];
  levels?: CourseLevel[];
  isAr: boolean;
  onChange: (filters: CourseFiltersType) => void;
}) {
  const update = (key: keyof CourseFiltersType, value: string) => onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => update('categoryId', 'all')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filters.categoryId === 'all' ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
        >
          {isAr ? 'الكل' : 'All'}
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => update('categoryId', category.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filters.categoryId === category.id ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3 lg:grid-cols-8">
        <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 md:col-span-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={filters.search || ''}
            onChange={(event) => update('search', event.target.value)}
            placeholder={isAr ? 'بحث داخل الدورات' : 'Search courses'}
            className="w-full text-sm outline-none"
          />
        </div>
        <select value={filters.levelId || 'all'} onChange={(event) => update('levelId', event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="all">{isAr ? 'كل المستويات' : 'All levels'}</option>
          {levels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.name}
            </option>
          ))}
        </select>
        <input type="number" value={filters.minPrice || ''} onChange={(event) => update('minPrice', event.target.value)} placeholder={isAr ? 'السعر من' : 'Price from'} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input type="number" value={filters.maxPrice || ''} onChange={(event) => update('maxPrice', event.target.value)} placeholder={isAr ? 'السعر إلى' : 'Price to'} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input type="number" value={filters.minDurationHours || ''} onChange={(event) => update('minDurationHours', event.target.value)} placeholder={isAr ? 'المدة من' : 'Hours from'} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input type="number" value={filters.maxDurationHours || ''} onChange={(event) => update('maxDurationHours', event.target.value)} placeholder={isAr ? 'المدة إلى' : 'Hours to'} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={filters.sort || 'newest'} onChange={(event) => update('sort', event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="newest">{isAr ? 'الأحدث أولاً' : 'Newest first'}</option>
          <option value="oldest">{isAr ? 'الأقدم أولاً' : 'Oldest first'}</option>
        </select>
      </div>
    </div>
  );
}
