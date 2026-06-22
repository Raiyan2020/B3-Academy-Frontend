'use client';

import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminTable } from './admin-table';
import { AdminFormCard, AdminSaveMessage } from './admin-form-fields';
import {
  getNewsletterSubscriptions,
  listNewsletterCampaigns,
  sendNewsletterCampaign,
} from '@/features/newsletter/services/newsletter-storage.service';
import { useLanguage } from '../../../../LanguageContext';

export function AdminNewsletterPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const [subjectAr, setSubjectAr] = useState('');
  const [subjectEn, setSubjectEn] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  void refreshKey;

  const subscribers = getNewsletterSubscriptions();
  const campaigns = listNewsletterCampaigns();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subscribers.filter((item) => {
      if (!query) return true;
      return item.email.toLowerCase().includes(query) || item.status.includes(query);
    });
  }, [search, subscribers]);

  const columns = [
    {
      key: 'email',
      header: isAr ? 'البريد' : 'Email',
      render: (row: (typeof filtered)[number]) => row.email,
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (row: (typeof filtered)[number]) => row.status,
    },
    {
      key: 'requested',
      header: isAr ? 'تاريخ الطلب' : 'Requested',
      render: (row: (typeof filtered)[number]) => new Date(row.requestedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'النشرة الإلكترونية' : 'Newsletter'}
        description={isAr ? 'عرض المشتركين وإرسال حملات (نموذج أولي).' : 'Subscriber list and send composer (stub).'}
      />
      <AdminSaveMessage message={message} />
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminTable columns={columns} rows={filtered} rowKey={(row) => row.id} searchValue={search} onSearchChange={setSearch} emptyTitle={isAr ? 'لا يوجد مشتركون' : 'No subscribers'} />
        <AdminFormCard
          title={isAr ? 'إرسال حملة' : 'Send campaign'}
          onSubmit={(event) => {
            event.preventDefault();
            const campaign = sendNewsletterCampaign({
              subject: { ar: subjectAr, en: subjectEn },
              body: { ar: bodyAr, en: bodyEn },
            });
            setMessage(
              isAr
                ? `تم إرسال الحملة إلى ${campaign.recipientCount} مشترك مؤكد.`
                : `Campaign sent to ${campaign.recipientCount} confirmed subscribers.`,
            );
            setRefreshKey((value) => value + 1);
          }}
          submitLabel={isAr ? 'إرسال' : 'Send'}
        >
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            {isAr ? 'الموضوع (عربي)' : 'Subject (Arabic)'}
            <input value={subjectAr} onChange={(event) => setSubjectAr(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 font-normal" dir="rtl" required />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            {isAr ? 'الموضوع (إنجليزي)' : 'Subject (English)'}
            <input value={subjectEn} onChange={(event) => setSubjectEn(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 font-normal" dir="ltr" required />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            {isAr ? 'المحتوى (عربي)' : 'Body (Arabic)'}
            <textarea value={bodyAr} onChange={(event) => setBodyAr(event.target.value)} className="min-h-[100px] rounded-md border border-slate-300 px-3 py-2 font-normal" dir="rtl" required />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            {isAr ? 'المحتوى (إنجليزي)' : 'Body (English)'}
            <textarea value={bodyEn} onChange={(event) => setBodyEn(event.target.value)} className="min-h-[100px] rounded-md border border-slate-300 px-3 py-2 font-normal" dir="ltr" required />
          </label>
        </AdminFormCard>
      </div>
      {campaigns.length > 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-bold text-slate-950">{isAr ? 'آخر الحملات' : 'Recent campaigns'}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {campaigns.slice(0, 5).map((campaign) => (
              <li key={campaign.id}>
                {isAr ? campaign.subject.ar : campaign.subject.en} — {campaign.recipientCount} {isAr ? 'مستلم' : 'recipients'} ({new Date(campaign.sentAt).toLocaleString(isAr ? 'ar-SA' : 'en-US')})
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
