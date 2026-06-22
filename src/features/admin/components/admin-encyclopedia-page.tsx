'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminTable } from './admin-table';
import { AdminFormCard, AdminSaveMessage, CheckboxField, LocalizedFields } from './admin-form-fields';
import {
  listAdminEncyclopediaNews,
  listAdminHerbs,
  saveAdminHerb,
  upsertAdminEncyclopediaNews,
  type EncyclopediaNewsItem,
} from '@/features/library/services/encyclopedia.service';
import { useLanguage } from '../../../../LanguageContext';

type Tab = 'news' | 'herbs';

export function AdminEncyclopediaPage() {
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';
  const [tab, setTab] = useState<Tab>('news');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [editingNews, setEditingNews] = useState<EncyclopediaNewsItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const news = listAdminEncyclopediaNews();
  const herbs = listAdminHerbs();
  void refreshKey;

  const filteredNews = news.filter((item) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return item.title.en.toLowerCase().includes(query) || item.title.ar.includes(query);
  });

  const filteredHerbs = herbs.filter((item) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return item.title.en.toLowerCase().includes(query) || item.title.ar.includes(query) || item.scientificName.toLowerCase().includes(query);
  });

  const newsColumns = [
    {
      key: 'title',
      header: isAr ? 'الخبر' : 'News',
      render: (row: EncyclopediaNewsItem) => localize(row.title),
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (row: EncyclopediaNewsItem) => row.status,
    },
    {
      key: 'actions',
      header: isAr ? 'إجراءات' : 'Actions',
      className: 'text-end',
      render: (row: EncyclopediaNewsItem) => (
        <button type="button" onClick={() => setEditingNews({ ...row })} className="text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'تعديل' : 'Edit'}
        </button>
      ),
    },
  ];

  const herbColumns = [
    {
      key: 'name',
      header: isAr ? 'العشب' : 'Herb',
      render: (row: (typeof filteredHerbs)[number]) => (
        <div>
          <p className="font-semibold">{localize(row.title)}</p>
          <p className="text-xs text-slate-500">{row.scientificName}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: isAr ? 'الفئة' : 'Category',
      render: (row: (typeof filteredHerbs)[number]) => row.category,
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (row: (typeof filteredHerbs)[number]) => row.status,
    },
    {
      key: 'actions',
      header: isAr ? 'إجراءات' : 'Actions',
      className: 'text-end',
      render: (row: (typeof filteredHerbs)[number]) => (
        <Link href={`/encyclopedia/${row.id}`} className="text-sm font-semibold text-slate-600 hover:underline">
          {isAr ? 'معاينة' : 'Preview'}
        </Link>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'موسوعة التعليم' : 'Education encyclopedia'}
        description={isAr ? 'إدارة أخبار الموسوعة ومكتبة الأعشاب.' : 'Manage encyclopedia news and herb library.'}
      />
      <AdminSaveMessage message={message} />
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setTab('news')} className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === 'news' ? 'bg-emerald-700 text-white' : 'border border-slate-300 text-slate-700'}`}>
          {isAr ? 'الأخبار' : 'News'}
        </button>
        <button type="button" onClick={() => setTab('herbs')} className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === 'herbs' ? 'bg-emerald-700 text-white' : 'border border-slate-300 text-slate-700'}`}>
          {isAr ? 'الأعشاب' : 'Herbs'}
        </button>
      </div>

      {tab === 'news' && (
        <>
          {editingNews && (
            <AdminFormCard
              title={isAr ? 'تعديل خبر' : 'Edit news'}
              onSubmit={(event) => {
                event.preventDefault();
                upsertAdminEncyclopediaNews(editingNews);
                setMessage(isAr ? 'تم حفظ الخبر.' : 'News saved.');
                setEditingNews(null);
                setRefreshKey((value) => value + 1);
              }}
              submitLabel={isAr ? 'حفظ' : 'Save'}
            >
              <LocalizedFields label={isAr ? 'العنوان' : 'Title'} value={editingNews.title} onChange={(title) => setEditingNews({ ...editingNews, title })} isAr={isAr} />
              <LocalizedFields label={isAr ? 'الملخص' : 'Summary'} value={editingNews.summary} onChange={(summary) => setEditingNews({ ...editingNews, summary })} multiline isAr={isAr} />
              <CheckboxField label={isAr ? 'نشط' : 'Active'} checked={editingNews.status === 'active'} onChange={(checked) => setEditingNews({ ...editingNews, status: checked ? 'active' : 'inactive' })} />
              <button type="button" onClick={() => setEditingNews(null)} className="text-sm font-semibold text-slate-600">
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </AdminFormCard>
          )}
          <div className="mt-4">
            <AdminTable columns={newsColumns} rows={filteredNews} rowKey={(row) => row.id} searchValue={search} onSearchChange={setSearch} emptyTitle={isAr ? 'لا توجد أخبار' : 'No news items'} />
          </div>
        </>
      )}

      {tab === 'herbs' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <AdminTable columns={herbColumns} rows={filteredHerbs} rowKey={(row) => row.id} searchValue={search} onSearchChange={setSearch} emptyTitle={isAr ? 'لا توجد أعشاب' : 'No herbs'} />
          <HerbQuickEdit isAr={isAr} herbs={filteredHerbs} onSaved={() => { setMessage(isAr ? 'تم حفظ العشب.' : 'Herb saved.'); setRefreshKey((value) => value + 1); }} />
        </div>
      )}
    </>
  );
}

function HerbQuickEdit({
  isAr,
  herbs,
  onSaved,
}: {
  isAr: boolean;
  herbs: ReturnType<typeof listAdminHerbs>;
  onSaved: () => void;
}) {
  const [selectedId, setSelectedId] = useState(herbs[0]?.id ?? '');
  const selected = herbs.find((item) => item.id === selectedId);
  const [summary, setSummary] = useState(selected?.summary ?? { ar: '', en: '' });
  const [isActive, setIsActive] = useState(selected?.status === 'active');
  const [isEditorPick, setIsEditorPick] = useState(selected?.isEditorPick ?? false);

  if (!selected) return null;

  return (
    <AdminFormCard
      title={isAr ? 'تعديل سريع للعشب' : 'Quick herb edit'}
      onSubmit={(event) => {
        event.preventDefault();
        saveAdminHerb(selectedId, {
          summary,
          status: isActive ? 'active' : 'inactive',
          isEditorPick,
        });
        onSaved();
      }}
      submitLabel={isAr ? 'حفظ' : 'Save'}
    >
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        {isAr ? 'العشب' : 'Herb'}
        <select
          value={selectedId}
          onChange={(event) => {
            const id = event.target.value;
            setSelectedId(id);
            const item = herbs.find((herb) => herb.id === id);
            if (item) {
              setSummary(item.summary);
              setIsActive(item.status === 'active');
              setIsEditorPick(item.isEditorPick);
            }
          }}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal"
        >
          {herbs.map((item) => (
            <option key={item.id} value={item.id}>
              {item.scientificName}
            </option>
          ))}
        </select>
      </label>
      <LocalizedFields label={isAr ? 'الملخص' : 'Summary'} value={summary} onChange={setSummary} multiline isAr={isAr} />
      <CheckboxField label={isAr ? 'نشط' : 'Active'} checked={isActive} onChange={setIsActive} />
      <CheckboxField label={isAr ? 'اختيار المحرر' : "Editor's pick"} checked={isEditorPick} onChange={setIsEditorPick} />
    </AdminFormCard>
  );
}
