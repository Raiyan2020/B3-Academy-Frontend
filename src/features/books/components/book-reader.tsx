'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '@/LanguageContext';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { useApiBookDetail, useMyBooks } from '../hooks/use-books-api';
import { PdfCanvasReader } from './pdf-canvas-reader';

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">{children}</div>
    </div>
  );
}

export function BookReader() {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const bookQuery = useApiBookDetail(bookId ?? '');
  const myBooksQuery = useMyBooks(Boolean(user));
  const book = bookQuery.data;
  const owned = Boolean(book && (book.ownership.ebook || book.ownership.bundle));
  // The signed stream URL only exists on a paid ebook/bundle order and expires server-side.
  const readUrl = myBooksQuery.data?.find((item) => item.bookId === bookId && item.readUrl)?.readUrl ?? null;

  // Identifies whoever is reading, burned into every rendered page. A screenshot cannot be
  // prevented, but it can be made traceable to the account that took it.
  const watermarkLabel = [user?.email, user?.name].filter(Boolean).join(' · ') || String(user?.id ?? '');

  useEffect(() => {
    const block = (event: Event) => event.preventDefault();
    document.addEventListener('contextmenu', block);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('dragstart', block);

    // Ctrl/Cmd+P and Ctrl/Cmd+S reach the browser even with no viewer toolbar present.
    const blockShortcuts = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ['p', 's'].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
    };
    document.addEventListener('keydown', blockShortcuts);

    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('dragstart', block);
      document.removeEventListener('keydown', blockShortcuts);
    };
  }, []);

  if (bookQuery.isLoading || (owned && myBooksQuery.isLoading)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-sm font-semibold text-white">
        {isAr ? 'جاري تحميل الكتاب...' : 'Loading book...'}
      </div>
    );
  }

  if (!book) {
    return (
      <Centered>
        <h2 className="text-xl font-bold text-slate-900">{isAr ? 'الكتاب غير متاح' : 'Book unavailable'}</h2>
        <Link href="/books" className="mt-6 inline-block font-semibold text-emerald-700 hover:underline">
          {isAr ? 'العودة للكتب' : 'Back to books'}
        </Link>
      </Centered>
    );
  }

  if (!owned) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-2 shadow-2xl">
          <AccessDeniedState
            variant="ownership_required"
            isAr={isAr}
            ctaHref={`/checkout/book/${book.id}/ebook`}
            ctaLabel={isAr ? 'شراء الكتاب الإلكتروني' : 'Purchase ebook'}
            description={
              isAr
                ? 'أنت لا تملك النسخة الرقمية من هذا الكتاب. اشترِ صيغة الكتاب الإلكتروني أو الحزمة لقراءته داخل المنصة.'
                : 'You do not own the digital format of this book. Purchase the ebook or bundle format to read it inside the platform.'
            }
          />
        </div>
      </div>
    );
  }

  if (!readUrl) {
    return (
      <Centered>
        <h2 className="text-xl font-bold text-slate-900">{isAr ? 'تعذر فتح القارئ' : 'Reader unavailable'}</h2>
        <p className="mt-3 text-slate-600">
          {isAr
            ? 'تعذر الحصول على رابط قراءة موقع لهذا الكتاب. حاول مرة أخرى بعد قليل.'
            : 'We could not obtain a signed reading link for this book. Please try again shortly.'}
        </p>
        <button onClick={() => router.push(`/books/${book.id}`)} className="mt-6 font-semibold text-emerald-700 hover:underline">
          {isAr ? 'العودة لتفاصيل الكتاب' : 'Back to book details'}
        </button>
      </Centered>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* Last line of defence: if a print dialog is reached anyway, there is nothing to print. */}
      <style>{'@media print { body { display: none !important; } }'}</style>
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3 text-white">
        <button onClick={() => router.push(`/books/${book.id}`)} className="rounded-full p-2 text-slate-300 hover:bg-slate-800">
          <ArrowLeft size={22} />
        </button>
        <span className="truncate text-sm font-bold">{book.title}</span>
        <span className="hidden text-xs text-slate-400 sm:block">
          {isAr ? 'للقراءة داخل المنصة فقط' : 'In-platform reading only'}
        </span>
      </div>
      <PdfCanvasReader url={readUrl} watermark={watermarkLabel} />
    </div>
  );
}
