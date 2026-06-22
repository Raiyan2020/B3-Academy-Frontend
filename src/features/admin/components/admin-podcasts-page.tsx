'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminTable } from './admin-table';
import { getPodcasts } from '@/features/podcasts/services/podcasts.service';
import { useLanguage } from '../../../../LanguageContext';

export function AdminPodcastsPage() {
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const podcasts = getPodcasts();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return podcasts.filter((podcast) => {
      if (!query) return true;
      return podcast.title.en.toLowerCase().includes(query) || podcast.title.ar.includes(query) || podcast.id.includes(query);
    });
  }, [podcasts, search]);

  const columns = [
    {
      key: 'title',
      header: isAr ? 'البودكاست' : 'Podcast',
      render: (row: (typeof filtered)[number]) => (
        <div>
          <p className="font-semibold">{localize(row.title)}</p>
          <p className="text-xs text-slate-500">{localize(row.category)}</p>
        </div>
      ),
    },
    {
      key: 'duration',
      header: isAr ? 'المدة' : 'Duration',
      render: (row: (typeof filtered)[number]) => row.duration,
    },
    {
      key: 'actions',
      header: isAr ? 'إجراءات' : 'Actions',
      className: 'text-end',
      render: (row: (typeof filtered)[number]) => (
        <div className="flex justify-end gap-2">
          <Link href="/podcasts" className="text-sm font-semibold text-slate-600 hover:underline">
            {isAr ? 'معاينة' : 'Preview'}
          </Link>
          <Link href={`/admin/podcasts/${row.id}/edit`} className="text-sm font-semibold text-emerald-700 hover:underline">
            {isAr ? 'تعديل' : 'Edit'}
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'البودكاست' : 'Podcasts'}
        description={isAr ? 'إدارة حلقات البودكاست.' : 'Manage podcast episodes.'}
        actions={
          <Link href="/admin/podcasts/new" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
            {isAr ? 'إضافة حلقة' : 'Add episode'}
          </Link>
        }
      />
      <AdminTable columns={columns} rows={filtered} rowKey={(row) => row.id} searchValue={search} onSearchChange={setSearch} emptyTitle={isAr ? 'لا توجد حلقات' : 'No episodes'} />
    </>
  );
}
