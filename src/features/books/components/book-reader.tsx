import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from '@/lib/routing/next-router-compat';
import { ArrowLeft, Moon, Sun, Smartphone, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { getBookById } from '@/features/books/services/books.service';
import { hasBookReaderAccess } from '@/features/account/services/ownership.service';
import {
  getBookContent,
  getBookTotalPages,
  getReadingPosition,
  saveReadingPosition,
} from '@/features/books/services/book-content.service';

export const BookReader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, localize } = useLanguage();
  const book = getBookById(id);
  const inactiveBook = getBookById(id, { includeInactive: true });
  const content = id ? getBookContent(id) : undefined;

  const owned = user && book ? hasBookReaderAccess(user.id, book.id) : false;

  const [page, setPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotice, setShowNotice] = useState(true);
  const chapters = content?.chapters ?? [];
  const totalPages = id ? getBookTotalPages(id) : 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);

  useEffect(() => {
    if (user && book && owned) {
      setPage(getReadingPosition(user.id, book.id));
    }
  }, [user, book, owned]);

  useEffect(() => {
    if (owned && !initialScrollDone.current && containerRef.current) {
      const el = document.getElementById(`book-page-${page}`);
      if (el) {
        el.scrollIntoView({ behavior: 'auto' });
        initialScrollDone.current = true;
      }
    }
  }, [page, owned]);

  useEffect(() => {
    const preventCopy = (event: Event) => event.preventDefault();
    document.addEventListener('contextmenu', preventCopy);
    return () => document.removeEventListener('contextmenu', preventCopy);
  }, []);

  if (!inactiveBook) {
    return (
      <div className="p-20 text-center">
        {language === 'ar' ? 'الكتاب غير موجود.' : 'Book not found.'}
      </div>
    );
  }

  if (!book) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <h2 className="text-xl font-bold text-slate-900">
            {language === 'ar' ? 'الكتاب غير متاح' : 'Book unavailable'}
          </h2>
          <p className="mt-3 text-slate-600">
            {language === 'ar' ? 'هذا الكتاب غير نشط حالياً.' : 'This book is currently inactive.'}
          </p>
          <Link to="/books" className="mt-6 inline-block text-emerald-700 font-semibold hover:underline">
            {language === 'ar' ? 'العودة للكتب' : 'Back to books'}
          </Link>
        </div>
      </div>
    );
  }

  if (!user || !owned) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-2 shadow-2xl">
          <AccessDeniedState
            variant={!user ? 'login_required' : 'ownership_required'}
            isAr={language === 'ar'}
            ctaHref={!user ? '/auth' : `/checkout/book/${book.id}/ebook`}
            ctaLabel={!user ? undefined : language === 'ar' ? 'شراء الكتاب الإلكتروني' : 'Purchase Ebook'}
            description={
              !user
                ? undefined
                : language === 'ar'
                  ? 'أنت لا تملك النسخة الرقمية من هذا الكتاب. اشترِ صيغة الكتاب الإلكتروني أو الباقة لفتح وقراءة الكتاب فوراً.'
                  : 'You do not own the digital format of this book. Purchase the Ebook or Bundle format to unlock and read online instantly.'
            }
          />
        </div>
      </div>
    );
  }

  if (!content || totalPages === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <h2 className="text-xl font-bold text-slate-900">
            {language === 'ar' ? 'المحتوى غير متاح' : 'Content unavailable'}
          </h2>
          <p className="mt-3 text-slate-600">
            {language === 'ar'
              ? 'محتوى هذا الكتاب غير متوفر حالياً داخل القارئ.'
              : 'This book content is not available in the reader yet.'}
          </p>
          <button
            onClick={() => navigate(`/books/${book.id}`)}
            className="mt-6 font-semibold text-emerald-700 hover:underline"
          >
            {language === 'ar' ? 'العودة لتفاصيل الكتاب' : 'Back to book details'}
          </button>
        </div>
      </div>
    );
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    const currentPage = Math.max(1, Math.min(totalPages, Math.ceil(scrollPercentage * totalPages)));
    if (currentPage !== page) {
      setPage(currentPage);
      saveReadingPosition(user.id, book.id, currentPage);
    }
  };

  const getChapterForPage = (pageNum: number) => {
    let count = 0;
    for (const chapter of chapters) {
      count += chapter.pages.length;
      if (pageNum <= count) return chapter;
    }
    return chapters[0];
  };

  const currentChapter = getChapterForPage(page);
  const watermark = user.email || user.name;

  const goToPage = (newPage: number) => {
    setPage(newPage);
    saveReadingPosition(user.id, book.id, newPage);
    const el = document.getElementById(`book-page-${newPage}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}
      style={{ userSelect: 'none' }}
    >
      <div
        className={`z-10 flex items-center justify-between border-b px-4 py-3 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className={`rounded-full p-2 transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className={`hidden truncate px-2 font-bold sm:block ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
            {localize(book.title)}
          </h1>
        </div>

        <select
          value={page}
          onChange={(e) => goToPage(parseInt(e.target.value, 10))}
          className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-bold outline-none sm:text-sm ${
            isDarkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          {chapters.map((chapter, idx) => (
            <option key={idx} value={chapter.pages[0].pageNum}>
              {localize(chapter.title)}
            </option>
          ))}
        </select>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`rounded-full p-2 transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'}`}
        >
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 overflow-y-auto px-4 pb-32 pt-8 md:px-8 lg:px-12"
        onScroll={handleScroll}
      >
        <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center opacity-[0.04]">
          <p className="rotate-[-25deg] text-4xl font-black uppercase tracking-widest">{watermark}</p>
        </div>

        <div className="relative z-20 mx-auto max-w-2xl space-y-12">
          {chapters.map((chapter, chapterIdx) => (
            <div key={chapterIdx} className="space-y-12">
              {chapter.pages.map((p) => (
                <motion.div
                  id={`book-page-${p.pageNum}`}
                  key={p.pageNum}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`min-h-[70vh] rounded-2xl border p-8 font-serif text-lg leading-[1.8] shadow-xl md:p-12 ${
                    isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-350' : 'border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  <div className="mb-10 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                    <span className="font-sans text-xs font-bold uppercase tracking-widest text-emerald-600">
                      {localize(chapter.title)}
                    </span>
                    <span className="font-sans text-xs text-slate-400">
                      {language === 'ar' ? `صفحة ${p.pageNum} / ${totalPages}` : `Page ${p.pageNum} / ${totalPages}`}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-justify leading-relaxed">{localize(p.content)}</p>
                  <div className="mt-12 select-none text-center text-slate-300 opacity-20 dark:text-slate-700">
                    <Smartphone size={48} className="mx-auto" />
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showNotice && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-0 right-0 z-40 mx-auto w-[92%] max-w-lg"
          >
            <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-emerald-450/30 bg-emerald-900 bg-opacity-95 p-2.5 text-white shadow-2xl backdrop-blur-md sm:gap-4 sm:rounded-3xl sm:p-4">
              <div className="shrink-0 rounded-xl bg-emerald-800 p-2 sm:rounded-2xl sm:p-3">
                <ShieldCheck size={18} className="text-emerald-400 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold leading-tight sm:whitespace-normal sm:text-xs sm:leading-snug">
                  {language === 'ar'
                    ? 'هذا الكتاب متاح للقراءة داخل المنصة فقط ولا يمكن تحميله أو تصديره. يظهر اسمك كعلامة مائية.'
                    : 'This book is for in-platform reading only and cannot be downloaded or exported. Your name appears as a watermark.'}
                </p>
              </div>
              <button onClick={() => setShowNotice(false)} className="shrink-0 rounded-full p-1 text-emerald-300 transition-colors hover:bg-emerald-850">
                <X size={16} className="sm:h-[18px] sm:w-[18px]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`z-10 flex items-center justify-between border-t px-6 py-4 shadow-lg ${isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-500'}`}
      >
        <button
          disabled={page === 1}
          onClick={() => goToPage(page - 1)}
          className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 sm:text-sm ${
            isDarkMode ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {language === 'ar' ? 'السابق' : 'Previous'}
        </button>
        <span className="text-xs font-bold sm:text-sm">
          {language === 'ar' ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => goToPage(page + 1)}
          className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 sm:text-sm ${
            isDarkMode ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {language === 'ar' ? 'التالي' : 'Next'}
        </button>
      </div>
    </div>
  );
};

// Legacy exports for compatibility
export function getBookProgress(userId: string, bookId: string): number {
  return getReadingPosition(userId, bookId);
}

export function saveBookProgress(userId: string, bookId: string, pageNum: number) {
  saveReadingPosition(userId, bookId, pageNum);
}
