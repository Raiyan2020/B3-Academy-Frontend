'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminFormCard, AdminSaveMessage, CheckboxField, LocalizedFields, TextField } from './admin-form-fields';
import { listAdminConsultationPackages, saveAdminConsultationPackage } from '@/features/care/services/care-data.service';
import { useLanguage } from '../../../../LanguageContext';

export function AdminConsultationEditPage() {
  const params = useParams<{ id: string }>();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const initial = useMemo(() => listAdminConsultationPackages().find((pkg) => pkg.id === params.id), [params.id]);

  const [name, setName] = useState(initial?.name ?? { ar: '', en: '' });
  const [description, setDescription] = useState(initial?.description ?? { ar: '', en: '' });
  const [sessionCount, setSessionCount] = useState(String(initial?.sessionCount ?? 1));
  const [duration, setDuration] = useState(String(initial?.sessionDurationMinutes ?? 45));
  const [price, setPrice] = useState(String(initial?.price ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [message, setMessage] = useState<string | null>(null);

  if (!initial) {
    return (
      <>
        <AdminPageHeader title={isAr ? 'الباقة غير موجودة' : 'Package not found'} />
        <Link href="/admin/consultations" className="text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'العودة للقائمة' : 'Back to list'}
        </Link>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'تعديل باقة الاستشارة' : 'Edit consultation package'}
        actions={
          <Link href="/admin/consultations" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            {isAr ? 'العودة للقائمة' : 'Back to list'}
          </Link>
        }
      />
      <AdminSaveMessage message={message} />
      <AdminFormCard
        title={isAr ? 'بيانات الباقة' : 'Package details'}
        onSubmit={(event) => {
          event.preventDefault();
          saveAdminConsultationPackage({
            ...initial,
            name,
            description,
            sessionCount: Number(sessionCount) || 1,
            sessionDurationMinutes: Number(duration) || 45,
            price: Number(price) || 0,
            isActive,
          });
          setMessage(isAr ? 'تم حفظ الباقة.' : 'Package saved.');
        }}
        submitLabel={isAr ? 'حفظ' : 'Save'}
      >
        <LocalizedFields label={isAr ? 'الاسم' : 'Name'} value={name} onChange={setName} isAr={isAr} />
        <LocalizedFields label={isAr ? 'الوصف' : 'Description'} value={description} onChange={setDescription} multiline isAr={isAr} />
        <TextField label={isAr ? 'عدد الجلسات' : 'Session count'} value={sessionCount} onChange={setSessionCount} type="number" dir="ltr" />
        <TextField label={isAr ? 'مدة الجلسة (دقيقة)' : 'Session duration (min)'} value={duration} onChange={setDuration} type="number" dir="ltr" />
        <TextField label={isAr ? 'السعر' : 'Price'} value={price} onChange={setPrice} type="number" dir="ltr" />
        <CheckboxField label={isAr ? 'نشط' : 'Active'} checked={isActive} onChange={setIsActive} />
      </AdminFormCard>
    </>
  );
}
