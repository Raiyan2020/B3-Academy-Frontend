'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminFormCard, LocalizedFields, TextField, CheckboxField } from './admin-form-fields';
import { getAdminBook, saveAdminBook } from '@/features/books/services/books.service';
import { useLanguage } from '../../../../LanguageContext';
import { toastSuccess } from '@/lib/feedback/toast';
import { ImageUpload } from '@/components/ui/image-upload';

export function AdminBookEditPage({ isNew = false }: { isNew?: boolean }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const bookId = isNew ? null : params.id;
  const initial = useMemo(() => (isNew ? null : getAdminBook(params.id)), [isNew, params.id]);

  const [title, setTitle] = useState(initial?.book.title ?? { ar: '', en: '' });
  const [author, setAuthor] = useState(initial?.book.author ?? { ar: '', en: '' });
  const [description, setDescription] = useState(initial?.book.description ?? { ar: '', en: '' });
  const [coverImage, setCoverImage] = useState(initial?.book.coverImage ?? '');
  const [pages, setPages] = useState(String(initial?.book.pages ?? 0));
  const [ebookPrice, setEbookPrice] = useState(String(initial?.book.prices.ebook ?? 0));
  const [physicalPrice, setPhysicalPrice] = useState(String(initial?.book.prices.physical ?? 0));
  const [bundlePrice, setBundlePrice] = useState(String(initial?.book.prices.bundle ?? 0));
  const [ebookAvailable, setEbookAvailable] = useState(initial?.metadata.formats.ebook ?? true);
  const [physicalAvailable, setPhysicalAvailable] = useState(initial?.metadata.formats.physical ?? true);
  const [bundleAvailable, setBundleAvailable] = useState(initial?.metadata.formats.bundle ?? true);
  const [isActive, setIsActive] = useState(initial?.metadata.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.metadata.isFeatured ?? false);
  const [displayOrder, setDisplayOrder] = useState(String(initial?.metadata.displayOrder ?? 1));
  const [isSaving, setIsSaving] = useState(false);

  if (!isNew && !initial) {
    return (
      <>
        <AdminPageHeader title={isAr ? 'الكتاب غير موجود' : 'Book not found'} />
        <Link href="/admin/books" className="text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'العودة للقائمة' : 'Back to list'}
        </Link>
      </>
    );
  }

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const id = saveAdminBook(bookId, {
        book: {
          title,
          author,
          description,
          coverImage,
          pages: Number(pages) || 0,
          prices: {
            ebook: ebookAvailable ? Number(ebookPrice) || 0 : 0,
            physical: physicalAvailable ? Number(physicalPrice) || 0 : 0,
            bundle: bundleAvailable ? Number(bundlePrice) || 0 : 0,
          },
        },
        metadata: {
          isActive,
          isFeatured,
          displayOrder: Number(displayOrder) || 1,
          publishedAt: initial?.metadata.publishedAt ?? new Date().toISOString(),
          formats: { ebook: ebookAvailable, physical: physicalAvailable, bundle: bundleAvailable },
        },
      });
      toastSuccess(isAr ? 'تم حفظ الكتاب.' : 'Book saved.');
      if (isNew) router.push(`/admin/books/${id}/edit`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title={isNew ? (isAr ? 'إضافة كتاب' : 'Add book') : isAr ? 'تعديل الكتاب' : 'Edit book'}
        actions={
          <Link href="/admin/books" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            {isAr ? 'العودة للقائمة' : 'Back to list'}
          </Link>
        }
      />
      <AdminFormCard
        title={isAr ? 'بيانات الكتاب' : 'Book details'}
        onSubmit={save}
        submitLabel={isAr ? 'حفظ' : 'Save'}
        isPending={isSaving}
        pendingLabel={isAr ? 'جاري الحفظ…' : 'Saving…'}
      >
        <LocalizedFields label={isAr ? 'العنوان' : 'Title'} value={title} onChange={setTitle} isAr={isAr} />
        <LocalizedFields label={isAr ? 'المؤلف' : 'Author'} value={author} onChange={setAuthor} isAr={isAr} />
        <LocalizedFields label={isAr ? 'الوصف' : 'Description'} value={description} onChange={setDescription} multiline isAr={isAr} />
        <ImageUpload
          label={isAr ? 'صورة الغلاف' : 'Cover image'}
          value={coverImage}
          onChange={setCoverImage}
          uploadLabel={isAr ? 'رفع صورة' : 'Upload image'}
          removeLabel={isAr ? 'إزالة' : 'Remove'}
        />
        <TextField label={isAr ? 'رابط الغلاف (اختياري)' : 'Cover URL (optional)'} value={coverImage} onChange={setCoverImage} dir="ltr" />
        <TextField label={isAr ? 'عدد الصفحات' : 'Pages'} value={pages} onChange={setPages} type="number" dir="ltr" />
        <div className="grid gap-2 rounded-md border border-slate-100 p-3">
          <p className="text-sm font-semibold text-slate-700">{isAr ? 'توفر الصيغ' : 'Format availability'}</p>
          <CheckboxField label={isAr ? 'إلكتروني' : 'Ebook'} checked={ebookAvailable} onChange={setEbookAvailable} />
          {ebookAvailable && <TextField label={isAr ? 'سعر إلكتروني' : 'Ebook price'} value={ebookPrice} onChange={setEbookPrice} type="number" dir="ltr" />}
          <CheckboxField label={isAr ? 'مطبوع' : 'Physical'} checked={physicalAvailable} onChange={setPhysicalAvailable} />
          {physicalAvailable && <TextField label={isAr ? 'سعر مطبوع' : 'Print price'} value={physicalPrice} onChange={setPhysicalPrice} type="number" dir="ltr" />}
          <CheckboxField label={isAr ? 'باقة' : 'Bundle'} checked={bundleAvailable} onChange={setBundleAvailable} />
          {bundleAvailable && <TextField label={isAr ? 'سعر الباقة' : 'Bundle price'} value={bundlePrice} onChange={setBundlePrice} type="number" dir="ltr" />}
        </div>
        <TextField label={isAr ? 'ترتيب العرض' : 'Display order'} value={displayOrder} onChange={setDisplayOrder} type="number" dir="ltr" />
        <CheckboxField label={isAr ? 'نشط' : 'Active'} checked={isActive} onChange={setIsActive} />
        <CheckboxField label={isAr ? 'مميز' : 'Featured'} checked={isFeatured} onChange={setIsFeatured} />
      </AdminFormCard>
    </>
  );
}
