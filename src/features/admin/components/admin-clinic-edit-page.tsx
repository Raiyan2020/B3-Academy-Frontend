'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminFormCard, AdminSaveMessage, CheckboxField, LocalizedFields, TextField } from './admin-form-fields';
import { getClinicById, listAdminClinics, saveAdminClinic } from '@/features/care/services/care-data.service';
import { useLanguage } from '../../../../LanguageContext';

export function AdminClinicEditPage() {
  const params = useParams<{ id: string }>();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const initial = useMemo(() => listAdminClinics().find((clinic) => clinic.id === params.id), [params.id]);

  const [name, setName] = useState(initial?.name ?? { ar: '', en: '' });
  const [category, setCategory] = useState(initial?.category ?? { ar: '', en: '' });
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? { ar: '', en: '' });
  const [description, setDescription] = useState(initial?.description ?? { ar: '', en: '' });
  const [address, setAddress] = useState(initial?.address ?? '');
  const [price, setPrice] = useState(String(initial?.price ?? 0));
  const [image, setImage] = useState(initial?.image ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [message, setMessage] = useState<string | null>(null);

  if (!initial) {
    return (
      <>
        <AdminPageHeader title={isAr ? 'العيادة غير موجودة' : 'Clinic not found'} />
        <Link href="/admin/clinics" className="text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'العودة للقائمة' : 'Back to list'}
        </Link>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'تعديل العيادة' : 'Edit clinic'}
        actions={
          <Link href="/admin/clinics" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            {isAr ? 'العودة للقائمة' : 'Back to list'}
          </Link>
        }
      />
      <AdminSaveMessage message={message} />
      <AdminFormCard
        title={isAr ? 'بيانات العيادة' : 'Clinic details'}
        onSubmit={(event) => {
          event.preventDefault();
          saveAdminClinic({
            ...initial,
            name,
            category,
            shortDescription,
            description,
            address,
            price: Number(price) || 0,
            image,
            isActive,
          });
          setMessage(isAr ? 'تم حفظ العيادة.' : 'Clinic saved.');
        }}
        submitLabel={isAr ? 'حفظ' : 'Save'}
      >
        <LocalizedFields label={isAr ? 'الاسم' : 'Name'} value={name} onChange={setName} isAr={isAr} />
        <LocalizedFields label={isAr ? 'الفئة' : 'Category'} value={category} onChange={setCategory} isAr={isAr} />
        <LocalizedFields label={isAr ? 'وصف مختصر' : 'Short description'} value={shortDescription} onChange={setShortDescription} multiline isAr={isAr} />
        <LocalizedFields label={isAr ? 'الوصف' : 'Description'} value={description} onChange={setDescription} multiline isAr={isAr} />
        <TextField label={isAr ? 'العنوان' : 'Address'} value={address} onChange={setAddress} dir="ltr" />
        <TextField label={isAr ? 'السعر' : 'Price'} value={price} onChange={setPrice} type="number" dir="ltr" />
        <TextField label={isAr ? 'رابط الصورة' : 'Image URL'} value={image} onChange={setImage} dir="ltr" />
        <CheckboxField label={isAr ? 'نشط' : 'Active'} checked={isActive} onChange={setIsActive} />
        <p className="text-xs text-slate-500">
          {isAr ? 'معاينة:' : 'Preview:'}{' '}
          <Link href={`/clinic/${params.id}`} className="font-semibold text-emerald-700 hover:underline">
            {getClinicById(params.id) ? (isAr ? 'متاح للعملاء' : 'Live for customers') : isAr ? 'غير نشط' : 'Inactive'}
          </Link>
        </p>
      </AdminFormCard>
    </>
  );
}
