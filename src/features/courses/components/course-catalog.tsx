'use client';

import { Clock, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import {
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  formatDurationMinutes,
  getCourseMetadata,
  getCoursePriceInCurrency,
} from '@/features/courses/services/courses.service';
import { getCourseEnrollment } from '@/features/learning/services/enrollment.service';
import { useCoursesQuery, useFeaturedCoursesQuery } from '../hooks/use-courses-query';
import { StaggerItem, StaggerList } from '@/lib/motion/stagger-list';
import type { Course } from '../types/course.types';

type SortOrder = 'newest' | 'oldest';

export function CourseCatalog() {
  const { localize, language } = useLanguage();
  const { formatPrice, convertPrice, currency } = useCurrency();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [sort, setSort] = useState<SortOrder>('newest');
  const { data: courses = [] } = useCoursesQuery();
  const { data: featured = [] } = useFeaturedCoursesQuery();

  const categories = useMemo(() => {
    const ids = Array.from(new Set(courses.map((course) => getCourseMetadata(course.id)?.categoryId).filter(Boolean)));
    return ids as string[];
  }, [courses]);

  const filtered = useMemo(() => {
    return courses
      .filter((course) => {
        const metadata = getCourseMetadata(course.id);
        const convertedPrice = getCoursePriceInCurrency(course.id, currency);
        const durationMinutes = metadata?.durationMinutes ?? 0;
        const categoryLabel = metadata?.categoryId ? COURSE_CATEGORIES[metadata.categoryId] : undefined;
        const levelLabel = metadata?.levelId ? COURSE_LEVELS[metadata.levelId] : undefined;

        const matchesSearch =
          localize(course.title).toLowerCase().includes(query.toLowerCase()) ||
          localize(course.description).toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === 'all' || metadata?.categoryId === category;
        const matchesMinPrice = !minPrice || convertedPrice >= Number(minPrice);
        const matchesMaxPrice = !maxPrice || convertedPrice <= Number(maxPrice);
        const durationHours = (metadata?.durationMinutes ?? 0) / 60;
        const matchesMinDuration = !minDuration || durationHours >= Number(minDuration);
        const matchesMaxDuration = !maxDuration || durationHours <= Number(maxDuration);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesMinPrice &&
          matchesMaxPrice &&
          matchesMinDuration &&
          matchesMaxDuration
        );
      })
      .sort((a, b) => {
        const aDate = getCourseMetadata(a.id)?.publishedAt ?? '';
        const bDate = getCourseMetadata(b.id)?.publishedAt ?? '';
        return sort === 'newest' ? bDate.localeCompare(aDate) : aDate.localeCompare(bDate);
      });
  }, [category, courses, currency, localize, maxDuration, maxPrice, minDuration, minPrice, query, sort]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{language === 'ar' ? 'الدورات' : 'Courses'}</p>
          <h1 className="text-4xl font-bold text-slate-950">{language === 'ar' ? 'الدورات المفعّلة' : 'Active courses'}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {language === 'ar'
              ? 'كل الدورات مدفوعة. يستطيع الزائر التصفح وفتح التفاصيل، وتبدأ إجراءات التسجيل والدفع بعد تسجيل الدخول.'
              : 'All courses are paid. Visitors can browse and open details; enrollment and payment start after sign-in.'}
          </p>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-bold text-slate-950">{language === 'ar' ? 'الدورات المميزة' : 'Featured courses'}</h2>
          <StaggerList className="grid gap-4 md:grid-cols-3">
            {featured.map((course) => (
              <StaggerItem key={course.id}>
                <CourseCard
                course={course}
                owned={Boolean(user && getCourseEnrollment(user.id, course.id))}
                formatPrice={formatPrice}
                convertPrice={convertPrice}
                title={localize(course.title)}
                description={localize(course.description)}
                duration={formatDurationMinutes(getCourseMetadata(course.id)?.durationMinutes ?? 0, language)}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setCategory('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${category === 'all' ? 'bg-emerald-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}
          >
            {language === 'ar' ? 'الكل' : 'All'}
          </button>
          {categories.map((catId) => (
            <button
              key={catId}
              onClick={() => setCategory(catId)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${category === catId ? 'bg-emerald-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}
            >
              {localize(COURSE_CATEGORIES[catId])}
            </button>
          ))}
        </div>

        <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3 lg:grid-cols-8">
          <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 md:col-span-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={language === 'ar' ? 'بحث داخل الدورات' : 'Search courses'} className="w-full outline-none text-sm" />
          </div>
          <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={language === 'ar' ? `السعر من (${currency})` : `Price from (${currency})`} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={language === 'ar' ? `السعر إلى (${currency})` : `Price to (${currency})`} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" value={minDuration} onChange={(e) => setMinDuration(e.target.value)} placeholder={language === 'ar' ? 'المدة من (س)' : 'Duration from (hrs)'} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" value={maxDuration} onChange={(e) => setMaxDuration(e.target.value)} placeholder={language === 'ar' ? 'المدة إلى (س)' : 'Duration to (hrs)'} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortOrder)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="newest">{language === 'ar' ? 'الأحدث أولاً' : 'Newest first'}</option>
            <option value="oldest">{language === 'ar' ? 'الأقدم أولاً' : 'Oldest first'}</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
            {language === 'ar' ? 'لا توجد دورات مطابقة.' : 'No matching courses.'}
          </div>
        ) : (
          <StaggerList className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <StaggerItem key={course.id}>
                <CourseCard
                course={course}
                owned={Boolean(user && getCourseEnrollment(user.id, course.id))}
                formatPrice={formatPrice}
                convertPrice={convertPrice}
                title={localize(course.title)}
                description={localize(course.description)}
                duration={formatDurationMinutes(getCourseMetadata(course.id)?.durationMinutes ?? 0, language)}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </section>
    </main>
  );
}

function CourseCard({ course, owned, title, description, duration, formatPrice, convertPrice }: {
  course: Course;
  owned: boolean;
  title: string;
  description: string;
  duration: string;
  formatPrice: (price: number) => string;
  convertPrice: (amount: number, baseCurrency?: import('@/features/business/business.types').CurrencyCode) => number;
}) {
  const { localize, language } = useLanguage();
  const metadata = getCourseMetadata(course.id);
  const baseCurrency = metadata?.baseCurrency ?? 'USD';
  const displayPrice = convertPrice(course.price, baseCurrency);
  const levelLabel = metadata?.levelId ? COURSE_LEVELS[metadata.levelId as keyof typeof COURSE_LEVELS] : undefined;

  return (
    <Link href={`/courses/${course.id}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <img src={course.thumbnail} alt={title} className="h-44 w-full object-cover" />
      <div className="p-5">
        <div className="mb-2 flex flex-wrap gap-2 text-xs font-semibold">
          {levelLabel && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{localize(levelLabel)}</span>
          )}
          {metadata?.categoryId && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
              {localize(COURSE_CATEGORIES[metadata.categoryId])}
            </span>
          )}
          {owned && <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">مسجلة لديك</span>}
        </div>
        <h3 className="line-clamp-2 text-lg font-bold text-slate-950">{title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1 text-slate-500"><Clock className="h-4 w-4" />{duration}</span>
          <span className="font-bold text-emerald-700">{formatPrice(displayPrice)}</span>
        </div>
      </div>
    </Link>
  );
}
