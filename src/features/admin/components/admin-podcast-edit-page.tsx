'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminFormCard, AdminSaveMessage, LocalizedFields, TextField } from './admin-form-fields';
import { getAdminPodcastById, saveAdminPodcast } from '@/features/podcasts/services/podcasts.service';
import { useLanguage } from '../../../../LanguageContext';

export function AdminPodcastEditPage({ isNew = false }: { isNew?: boolean }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const podcastId = isNew ? null : params.id;
  const initial = useMemo(() => (isNew ? null : getAdminPodcastById(params.id)), [isNew, params.id]);

  const [title, setTitle] = useState(initial?.title ?? { ar: '', en: '' });
  const [author, setAuthor] = useState(initial?.author ?? { ar: 'أكاديمية B3', en: 'B3 Academy' });
  const [category, setCategory] = useState(initial?.category ?? { ar: '', en: '' });
  const [description, setDescription] = useState(initial?.description ?? { ar: '', en: '' });
  const [duration, setDuration] = useState(initial?.duration ?? '30:00');
  const [categoryColor, setCategoryColor] = useState(initial?.categoryColor ?? 'bg-emerald-500');
  const [image, setImage] = useState(initial?.image ?? '');
  const [audioUrl, setAudioUrl] = useState(initial?.audioUrl ?? '');
  const [message, setMessage] = useState<string | null>(null);

  if (!isNew && !initial) {
    return (
      <>
        <AdminPageHeader title={isAr ? 'الحلقة غير موجودة' : 'Episode not found'} />
        <Link href="/admin/podcasts" className="text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'العودة للقائمة' : 'Back to list'}
        </Link>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={isNew ? (isAr ? 'إضافة حلقة' : 'Add episode') : isAr ? 'تعديل الحلقة' : 'Edit episode'}
        actions={
          <Link href="/admin/podcasts" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            {isAr ? 'العودة للقائمة' : 'Back to list'}
          </Link>
        }
      />
      <AdminSaveMessage message={message} />
      <AdminFormCard
        title={isAr ? 'بيانات الحلقة' : 'Episode details'}
        onSubmit={(event) => {
          event.preventDefault();
          const id = saveAdminPodcast(podcastId, {
            title,
            author,
            category,
            description,
            duration,
            categoryColor,
            image,
            audioUrl,
            status: initial?.status ?? 'active',
            accessLevel: initial?.accessLevel ?? 'public',
            displayOrder: initial?.displayOrder ?? 1,
            publishedAt: initial?.publishedAt ?? new Date().toISOString(),
          });
          setMessage(isAr ? 'تم حفظ الحلقة.' : 'Episode saved.');
          if (isNew) router.push(`/admin/podcasts/${id}/edit`);
        }}
        submitLabel={isAr ? 'حفظ' : 'Save'}
      >
        <LocalizedFields label={isAr ? 'العنوان' : 'Title'} value={title} onChange={setTitle} isAr={isAr} />
        <LocalizedFields label={isAr ? 'المؤلف' : 'Author'} value={author} onChange={setAuthor} isAr={isAr} />
        <LocalizedFields label={isAr ? 'الفئة' : 'Category'} value={category} onChange={setCategory} isAr={isAr} />
        <LocalizedFields label={isAr ? 'الوصف' : 'Description'} value={description} onChange={setDescription} multiline isAr={isAr} />
        <TextField label={isAr ? 'المدة' : 'Duration'} value={duration} onChange={setDuration} dir="ltr" />
        <TextField label={isAr ? 'لون الفئة (Tailwind)' : 'Category color (Tailwind)'} value={categoryColor} onChange={setCategoryColor} dir="ltr" />
        <TextField label={isAr ? 'رابط الصورة' : 'Image URL'} value={image} onChange={setImage} dir="ltr" />
        <TextField label={isAr ? 'رابط الصوت' : 'Audio URL'} value={audioUrl} onChange={setAudioUrl} dir="ltr" />
      </AdminFormCard>
    </>
  );
}
