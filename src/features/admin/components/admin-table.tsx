'use client';

import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../../../../LanguageContext';

export type AdminTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type AdminTableProps<T> = {
  columns: AdminTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterSlot?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function AdminTable<T>({
  columns,
  rows,
  rowKey,
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  filterSlot,
  emptyTitle,
  emptyDescription,
}: AdminTableProps<T>) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {(onSearchChange || filterSlot) && (
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          {onSearchChange && (
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={
                  searchPlaceholder ?? (isAr ? 'بحث...' : 'Search...')
                }
                className="w-full rounded-md border border-slate-300 py-2 ps-10 pe-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}
          {filterSlot}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-start">
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 font-semibold text-slate-600 ${column.className ?? ''}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <p className="font-semibold text-slate-950">
                    {emptyTitle ?? (isAr ? 'لا توجد نتائج' : 'No results')}
                  </p>
                  <p className="mt-1 text-slate-500">
                    {emptyDescription ?? (isAr ? 'جرّب تعديل البحث أو الفلاتر.' : 'Try adjusting search or filters.')}
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className="border-b border-slate-50 hover:bg-slate-50/80">
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-3 text-slate-700 ${column.className ?? ''}`}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          {isAr ? `عرض ${rows.length} سجل` : `Showing ${rows.length} records`}
          <span className="mx-2">·</span>
          {isAr ? 'ترقيم الصفحات قريباً' : 'Pagination coming soon'}
        </div>
      )}
    </div>
  );
}
