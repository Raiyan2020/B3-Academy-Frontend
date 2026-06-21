'use client';

import { ArrowLeft, BookOpen, Library, Microscope, Video } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../../LanguageContext';
import { getFeaturedCourses } from '@/features/courses/services/courses.service';
import { getBooks } from '@/features/books/services/books.service';
import { getEncyclopediaEntries } from '@/features/library/services/encyclopedia.service';

export function EducationPage() {
  const { language, localize, dir } = useLanguage();
  const courses = getFeaturedCourses(3);
  const books = getBooks().slice(0, 3);
  const entries = getEncyclopediaEntries().slice(0, 3);
  const iconClass = dir === 'rtl' ? '' : 'rotate-180';

  const sections = [
    {
      title: language === 'ar' ? 'الدورات' : 'Courses',
      description:
        language === 'ar'
          ? 'برامج تعليمية مدفوعة مع محتوى تدريجي واختبارات وشهادات حسب إعداد الدورة.'
          : 'Paid learning programs with progressive content, tests, and certificates based on course settings.',
      href: '/courses',
      icon: Video,
    },
    {
      title: language === 'ar' ? 'الكتب' : 'Books',
      description:
        language === 'ar'
          ? 'كتب إلكترونية ومطبوعة، مع قراءة النسخ الإلكترونية داخل المنصة فقط.'
          : 'Electronic and printed books, with ebooks read inside the platform only.',
      href: '/books',
      icon: BookOpen,
    },
    {
      title: language === 'ar' ? 'الموسوعة' : 'Encyclopedia',
      description:
        language === 'ar'
          ? 'مقالات وموضوعات ومكتبة عشبية عامة للقراءة والتصفح.'
          : 'Articles, topics, and a public herbal library for browsing and reading.',
      href: '/encyclopedia',
      icon: Microscope,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold text-emerald-700">
              {language === 'ar' ? 'التعليم والتعلم' : 'Education and Learning'}
            </p>
            <h1 className="text-4xl font-bold text-slate-950">
              {language === 'ar'
                ? 'مدخل واحد للدورات والكتب والموسوعة'
                : 'One entry point for courses, books, and the encyclopedia'}
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              {language === 'ar'
                ? 'تصفح المحتوى التعليمي بحرية، ثم سجّل الدخول فقط عند تنفيذ إجراء فعلي مثل شراء كتاب أو التسجيل في دورة.'
                : 'Browse learning content freely, then sign in only when taking an action such as buying a book or enrolling in a course.'}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <section.icon className="mb-5 h-8 w-8 text-emerald-700" />
            <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
            <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{section.description}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
              {language === 'ar' ? 'الدخول للقسم' : 'Open section'}
              <ArrowLeft className={`h-4 w-4 transition group-hover:-translate-x-1 ${iconClass}`} />
            </span>
          </Link>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        <PreviewColumn title={language === 'ar' ? 'دورات مختارة' : 'Selected courses'} href="/courses">
          {courses.map((course) => (
            <MiniItem key={course.id} href={`/courses/${course.id}`} title={localize(course.title)} text={localize(course.description)} />
          ))}
        </PreviewColumn>
        <PreviewColumn title={language === 'ar' ? 'كتب مختارة' : 'Selected books'} href="/books">
          {books.map((book) => (
            <MiniItem key={book.id} href={`/books/${book.id}`} title={localize(book.title)} text={localize(book.description)} />
          ))}
        </PreviewColumn>
        <PreviewColumn title={language === 'ar' ? 'من الموسوعة' : 'From the encyclopedia'} href="/encyclopedia">
          {entries.map((entry) => (
            <MiniItem key={entry.id} href={`/encyclopedia/${entry.id}`} title={localize(entry.name)} text={localize(entry.description)} />
          ))}
        </PreviewColumn>
      </section>
    </main>
  );
}

function PreviewColumn({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-slate-950">{title}</h3>
        <Link href={href} className="text-sm font-semibold text-emerald-700">
          عرض الكل
        </Link>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function MiniItem({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} className="block rounded-md border border-slate-100 p-3 transition hover:border-emerald-200 hover:bg-emerald-50">
      <p className="line-clamp-1 font-semibold text-slate-900">{title}</p>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{text}</p>
    </Link>
  );
}

