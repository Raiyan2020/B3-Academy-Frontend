'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminFormCard, AdminSaveMessage, CheckboxField, LocalizedFields, TextField } from './admin-form-fields';
import { listAdminTripPackages, saveAdminTripPackage } from '@/features/care/services/care-data.service';
import { useLanguage } from '../../../../LanguageContext';

export function AdminTripEditPage() {
  const params = useParams<{ id: string }>();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const initial = useMemo(() => listAdminTripPackages().find((trip) => trip.id === params.id), [params.id]);

  const [title, setTitle] = useState(initial?.title ?? { ar: '', en: '' });
  const [description, setDescription] = useState(initial?.description ?? { ar: '', en: '' });
  const [place, setPlace] = useState(initial?.place ?? { ar: '', en: '' });
  const [durationDays, setDurationDays] = useState(String(initial?.durationDays ?? 1));
  const [availableSeats, setAvailableSeats] = useState(String(initial?.availableSeats ?? 0));
  const [price, setPrice] = useState(String(initial?.price ?? 0));
  const [image, setImage] = useState(initial?.image ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [message, setMessage] = useState<string | null>(null);

  if (!initial) {
    return (
      <>
        <AdminPageHeader title={isAr ? 'الرحلة غير موجودة' : 'Trip not found'} />
        <Link href="/admin/trips" className="text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'العودة للقائمة' : 'Back to list'}
        </Link>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'تعديل الرحلة' : 'Edit trip'}
        actions={
          <Link href="/admin/trips" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            {isAr ? 'العودة للقائمة' : 'Back to list'}
          </Link>
        }
      />
      <AdminSaveMessage message={message} />
      <AdminFormCard
        title={isAr ? 'بيانات الرحلة' : 'Trip details'}
        onSubmit={(event) => {
          event.preventDefault();
          saveAdminTripPackage({
            ...initial,
            title,
            description,
            place,
            durationDays: Number(durationDays) || 1,
            availableSeats: Number(availableSeats) || 0,
            price: Number(price) || 0,
            image,
            isActive,
          });
          setMessage(isAr ? 'تم حفظ الرحلة.' : 'Trip saved.');
        }}
        submitLabel={isAr ? 'حفظ' : 'Save'}
      >
        <LocalizedFields label={isAr ? 'العنوان' : 'Title'} value={title} onChange={setTitle} isAr={isAr} />
        <LocalizedFields label={isAr ? 'الوصف' : 'Description'} value={description} onChange={setDescription} multiline isAr={isAr} />
        <LocalizedFields label={isAr ? 'المكان' : 'Place'} value={place} onChange={setPlace} isAr={isAr} />
        <TextField label={isAr ? 'المدة (أيام)' : 'Duration (days)'} value={durationDays} onChange={setDurationDays} type="number" dir="ltr" />
        <TextField label={isAr ? 'المقاعد المتاحة' : 'Available seats'} value={availableSeats} onChange={setAvailableSeats} type="number" dir="ltr" />
        <TextField label={isAr ? 'السعر' : 'Price'} value={price} onChange={setPrice} type="number" dir="ltr" />
        <TextField label={isAr ? 'رابط الصورة' : 'Image URL'} value={image} onChange={setImage} dir="ltr" />
        <CheckboxField label={isAr ? 'نشط' : 'Active'} checked={isActive} onChange={setIsActive} />
      </AdminFormCard>
    </>
  );
}
