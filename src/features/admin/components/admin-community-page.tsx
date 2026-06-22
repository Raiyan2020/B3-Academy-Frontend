'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminTable } from './admin-table';
import { getBlogs, getResearches, getTheories } from '@/features/community/services/community-content.service';
import { useLanguage } from '../../../../LanguageContext';

type ContentType = 'all' | 'articles' | 'theories' | 'research';

type CommunityRow = {
  id: string;
  type: 'articles' | 'theories' | 'research';
  title: { ar: string; en: string };
  authorName: string;
  date: string;
  href: string;
};

export function AdminCommunityPage() {
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContentType>('all');

  const rows = useMemo<CommunityRow[]>(() => {
    const articles = getBlogs().map((item) => ({
      id: item.id,
      type: 'articles' as const,
      title: item.title,
      authorName: item.authorName,
      date: item.date,
      href: `/community/blogs/${item.id}`,
    }));
    const theories = getTheories().map((item) => ({
      id: item.id,
      type: 'theories' as const,
      title: item.title,
      authorName: item.authorName,
      date: item.date,
      href: `/community/theories/${item.id}`,
    }));
    const research = getResearches().map((item) => ({
      id: item.id,
      type: 'research' as const,
      title: item.title,
      authorName: item.authorName,
      date: item.date,
      href: `/community/researches/${item.id}`,
    }));
    return [...articles, ...theories, ...research].sort((a, b) => b.date.localeCompare(a.date));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== 'all' && row.type !== typeFilter) return false;
      if (!query) return true;
      return row.title.en.toLowerCase().includes(query) || row.title.ar.includes(query) || row.authorName.toLowerCase().includes(query);
    });
  }, [rows, search, typeFilter]);

  const typeLabel = (type: CommunityRow['type']) => {
    if (type === 'articles') return isAr ? 'مقال' : 'Article';
    if (type === 'theories') return isAr ? 'نظرية' : 'Theory';
    return isAr ? 'بحث' : 'Research';
  };

  const columns = [
    {
      key: 'title',
      header: isAr ? 'المحتوى' : 'Content',
      render: (row: CommunityRow) => (
        <div>
          <p className="font-semibold">{localize(row.title)}</p>
          <p className="text-xs text-slate-500">{row.authorName}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: isAr ? 'النوع' : 'Type',
      render: (row: CommunityRow) => typeLabel(row.type),
    },
    {
      key: 'date',
      header: isAr ? 'التاريخ' : 'Date',
      render: (row: CommunityRow) => new Date(row.date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
    },
    {
      key: 'actions',
      header: isAr ? 'إجراءات' : 'Actions',
      className: 'text-end',
      render: (row: CommunityRow) => (
        <Link href={row.href} className="text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'معاينة' : 'Preview'}
        </Link>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'المجتمع' : 'Community'}
        description={isAr ? 'قائمة محتوى المقالات والنظريات والأبحاث.' : 'Content list for articles, theories, and research.'}
      />
      <AdminTable
        columns={columns}
        rows={filtered}
        rowKey={(row) => `${row.type}-${row.id}`}
        searchValue={search}
        onSearchChange={setSearch}
        filterSlot={
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as ContentType)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="all">{isAr ? 'كل الأنواع' : 'All types'}</option>
            <option value="articles">{isAr ? 'مقالات' : 'Articles'}</option>
            <option value="theories">{isAr ? 'نظريات' : 'Theories'}</option>
            <option value="research">{isAr ? 'أبحاث' : 'Research'}</option>
          </select>
        }
        emptyTitle={isAr ? 'لا يوجد محتوى' : 'No content'}
      />
    </>
  );
}
