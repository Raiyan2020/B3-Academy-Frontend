'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminTable } from './admin-table';
import { listAdminBooks } from '@/features/books/services/books.service';
import { useLanguage } from '../../../../LanguageContext';

const statusFilterOptions = ['all', 'active', 'inactive'] as const;

export function AdminBooksPage() {
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilterOptions)[number]>('all');
  const books = listAdminBooks();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return books.filter(({ book, metadata }) => {
      if (statusFilter === 'active' && !metadata.isActive) return false;
      if (statusFilter === 'inactive' && metadata.isActive) return false;
      if (!query) return true;
      return book.title.en.toLowerCase().includes(query) || book.title.ar.includes(query) || book.id.includes(query);
    });
  }, [books, search, statusFilter]);

  const formatLabel = (formats: { ebook: boolean; physical: boolean; bundle: boolean }) => {
    const parts = [];
    if (formats.ebook) parts.push(isAr ? 'إلكتروني' : 'Ebook');
    if (formats.physical) parts.push(isAr ? 'مطبوع' : 'Print');
    if (formats.bundle) parts.push(isAr ? 'باقة' : 'Bundle');
    return parts.join(', ') || '—';
  };

  const columns = [
    {
      key: 'title',
      header: isAr ? 'الكتاب' : 'Book',
      render: (row: (typeof filtered)[number]) => (
        <div>
          <p className="font-semibold text-slate-950">{localize(row.book.title)}</p>
          <p className="text-xs text-slate-500">{localize(row.book.author)}</p>
        </div>
      ),
    },
    {
      key: 'formats',
      header: isAr ? 'الصيغ' : 'Formats',
      render: (row: (typeof filtered)[number]) => formatLabel(row.metadata.formats),
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (row: (typeof filtered)[number]) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.metadata.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
          {row.metadata.isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'غير نشط' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: isAr ? 'إجراءات' : 'Actions',
      className: 'text-end',
      render: (row: (typeof filtered)[number]) => (
        <div className="flex justify-end gap-2">
          <Link href={`/books/${row.book.id}`} className="text-sm font-semibold text-slate-600 hover:underline">
            {isAr ? 'معاينة' : 'Preview'}
          </Link>
          <Link href={`/admin/books/${row.book.id}/edit`} className="text-sm font-semibold text-emerald-700 hover:underline">
            {isAr ? 'تعديل' : 'Edit'}
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'الكتب' : 'Books'}
        description={isAr ? 'إدارة الكتب وتوفر الصيغ والأسعار.' : 'Manage books, format availability, and pricing.'}
        actions={
          <Link href="/admin/books/new" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
            {isAr ? 'إضافة كتاب' : 'Add book'}
          </Link>
        }
      />
      <AdminTable
        columns={columns}
        rows={filtered}
        rowKey={(row) => row.book.id}
        searchValue={search}
        onSearchChange={setSearch}
        filterSlot={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {statusFilterOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? (isAr ? 'كل الحالات' : 'All statuses') : option === 'active' ? (isAr ? 'نشط' : 'Active') : isAr ? 'غير نشط' : 'Inactive'}
              </option>
            ))}
          </select>
        }
        emptyTitle={isAr ? 'لا توجد كتب' : 'No books found'}
      />
    </>
  );
}
