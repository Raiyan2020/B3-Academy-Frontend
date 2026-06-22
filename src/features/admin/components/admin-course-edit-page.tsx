'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminFormCard, AdminSaveMessage, CheckboxField, LocalizedFields, TextField } from './admin-form-fields';
import { getAdminCourse, saveAdminCourse, type AdminCourseMetadata } from '@/features/courses/services/courses.service';
import { useLanguage } from '../../../../LanguageContext';

export function AdminCourseEditPage({ isNew = false }: { isNew?: boolean }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const courseId = isNew ? null : params.id;
  const initial = useMemo(() => (isNew ? null : getAdminCourse(params.id)), [isNew, params.id]);

  const [title, setTitle] = useState(initial?.course.title ?? { ar: '', en: '' });
  const [subtitle, setSubtitle] = useState(initial?.course.subtitle ?? { ar: '', en: '' });
  const [description, setDescription] = useState(initial?.course.description ?? { ar: '', en: '' });
  const [price, setPrice] = useState(String(initial?.course.price ?? 0));
  const [thumbnail, setThumbnail] = useState(initial?.course.thumbnail ?? '');
  const [level, setLevel] = useState(initial?.course.level ?? 'Beginner');
  const [isActive, setIsActive] = useState(initial?.metadata.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.metadata.isFeatured ?? false);
  const [displayOrder, setDisplayOrder] = useState(String(initial?.metadata.displayOrder ?? 1));
  const [installmentsEnabled, setInstallmentsEnabled] = useState(initial?.metadata.payment?.installmentsEnabled ?? false);
  const [totalInstallments, setTotalInstallments] = useState(String(initial?.metadata.payment?.totalInstallments ?? 4));
  const [message, setMessage] = useState<string | null>(null);

  if (!isNew && !initial) {
    return (
      <>
        <AdminPageHeader title={isAr ? 'الدورة غير موجودة' : 'Course not found'} />
        <Link href="/admin/courses" className="text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'العودة للقائمة' : 'Back to list'}
        </Link>
      </>
    );
  }

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const metadata: Partial<AdminCourseMetadata> = {
      isActive,
      isFeatured,
      displayOrder: Number(displayOrder) || 1,
      payment: installmentsEnabled
        ? { installmentsEnabled: true, totalInstallments: Number(totalInstallments) || 4 }
        : { installmentsEnabled: false, totalInstallments: 0 },
    };
    const id = saveAdminCourse(courseId, {
      course: {
        title,
        subtitle,
        description,
        price: Number(price) || 0,
        thumbnail,
        level: level as 'Beginner' | 'Intermediate' | 'Advanced',
      },
      metadata,
    });
    setMessage(isAr ? 'تم حفظ الدورة.' : 'Course saved.');
    if (isNew) router.push(`/admin/courses/${id}/edit`);
  };

  return (
    <>
      <AdminPageHeader
        title={isNew ? (isAr ? 'إضافة دورة' : 'Add course') : isAr ? 'تعديل الدورة' : 'Edit course'}
        actions={
          <Link href="/admin/courses" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            {isAr ? 'العودة للقائمة' : 'Back to list'}
          </Link>
        }
      />
      <AdminSaveMessage message={message} />
      <AdminFormCard title={isAr ? 'بيانات الدورة' : 'Course details'} onSubmit={save} submitLabel={isAr ? 'حفظ' : 'Save'}>
        <LocalizedFields label={isAr ? 'العنوان' : 'Title'} value={title} onChange={setTitle} isAr={isAr} />
        <LocalizedFields label={isAr ? 'العنوان الفرعي' : 'Subtitle'} value={subtitle} onChange={setSubtitle} isAr={isAr} />
        <LocalizedFields label={isAr ? 'الوصف' : 'Description'} value={description} onChange={setDescription} multiline isAr={isAr} />
        <TextField label={isAr ? 'السعر' : 'Price'} value={price} onChange={setPrice} type="number" dir="ltr" />
        <TextField label={isAr ? 'رابط الصورة' : 'Thumbnail URL'} value={thumbnail} onChange={setThumbnail} dir="ltr" />
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          {isAr ? 'المستوى' : 'Level'}
          <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className="rounded-md border border-slate-300 px-3 py-2 font-normal">
            <option value="Beginner">{isAr ? 'مبتدئ' : 'Beginner'}</option>
            <option value="Intermediate">{isAr ? 'متوسط' : 'Intermediate'}</option>
            <option value="Advanced">{isAr ? 'متقدم' : 'Advanced'}</option>
          </select>
        </label>
        <TextField label={isAr ? 'ترتيب العرض' : 'Display order'} value={displayOrder} onChange={setDisplayOrder} type="number" dir="ltr" />
        <CheckboxField label={isAr ? 'نشط' : 'Active'} checked={isActive} onChange={setIsActive} />
        <CheckboxField label={isAr ? 'مميز' : 'Featured'} checked={isFeatured} onChange={setIsFeatured} />
        <CheckboxField label={isAr ? 'تقسيط مفعّل' : 'Installments enabled'} checked={installmentsEnabled} onChange={setInstallmentsEnabled} />
        {installmentsEnabled && (
          <TextField label={isAr ? 'عدد الأقساط' : 'Total installments'} value={totalInstallments} onChange={setTotalInstallments} type="number" dir="ltr" />
        )}
      </AdminFormCard>
    </>
  );
}
