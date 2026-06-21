'use client';

import { Clock, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import { getCourses } from '@/features/courses/services/courses.service';

type SortOrder = 'newest' | 'oldest';

export function CourseCatalog() {
  const { localize, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minHours, setMinHours] = useState('');
  const [maxHours, setMaxHours] = useState('');
  const [sort, setSort] = useState<SortOrder>('newest');
  const courses = getCourses();

  const categories = useMemo(() => {
    const values = courses.flatMap((course) => course.topics.map((topic) => topic.en));
    return Array.from(new Set(values));
  }, [courses]);

  // Featured: prefer isFeatured flag, fall back to first 3
  const featured = useMemo(() => {
    const withFlag = courses.filter((c) => (c as any).isFeatured);
    return withFlag.length > 0 ? withFlag.slice(0, 3) : courses.slice(0, 3);
  }, [courses]);

  const filtered = useMemo(() => {
    const parseHours = (duration: string) => Number(duration.match(/\d+/)?.[0] || 0);
    return courses
      .filter((course) => {
        const courseHours = parseHours(localize(course.duration));
        const matchesSearch =
          localize(course.title).toLowerCase().includes(query.toLowerCase()) ||
          localize(course.description).toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === 'all' || course.topics.some((topic) => topic.en === category);
        const matchesLevel = level === 'all' || course.level === level;
        const matchesMinPrice = !minPrice || course.price >= Number(minPrice);
        const matchesMaxPrice = !maxPrice || course.price <= Number(maxPrice);
        const matchesMinHours = !minHours || courseHours >= Number(minHours);
        const matchesMaxHours = !maxHours || courseHours <= Number(maxHours);
        return matchesSearch && matchesCategory && matchesLevel && matchesMinPrice && matchesMaxPrice && matchesMinHours && matchesMaxHours;
      })
      .sort((a, b) => (sort === 'newest' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id)));
  }, [category, courses, level, localize, maxHours, maxPrice, minHours, minPrice, query, sort]);

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
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((course) => (
              <CourseCard key={course.id} course={course} owned={Boolean(user?.purchasedCourseIds.includes(course.id))} formatPrice={formatPrice} title={localize(course.title)} description={localize(course.description)} duration={localize(course.duration)} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* Category Tabs */}
        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setCategory('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${category === 'all' ? 'bg-emerald-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}
          >
            {language === 'ar' ? 'الكل' : 'All'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${category === cat ? 'bg-emerald-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 md:col-span-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={language === 'ar' ? 'بحث داخل الدورات' : 'Search courses'} className="w-full outline-none text-sm" />
          </div>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="all">{language === 'ar' ? 'كل المستويات' : 'All levels'}</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={language === 'ar' ? 'السعر من' : 'Price from'} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={language === 'ar' ? 'السعر إلى' : 'Price to'} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} owned={Boolean(user?.purchasedCourseIds.includes(course.id))} formatPrice={formatPrice} title={localize(course.title)} description={localize(course.description)} duration={localize(course.duration)} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function CourseCard({ course, owned, title, description, duration, formatPrice }: {
  course: ReturnType<typeof getCourses>[number];
  owned: boolean;
  title: string;
  description: string;
  duration: string;
  formatPrice: (price: number) => string;
}) {
  return (
    <Link href={`/courses/${course.id}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <img src={course.thumbnail} alt={title} className="h-44 w-full object-cover" />
      <div className="p-5">
        <div className="mb-2 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{course.level}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{course.topics[0]?.ar || course.topics[0]?.en}</span>
          {owned && <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">مسجلة لديك</span>}
        </div>
        <h3 className="line-clamp-2 text-lg font-bold text-slate-950">{title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1 text-slate-500"><Clock className="h-4 w-4" />{duration}</span>
          <span className="font-bold text-emerald-700">{formatPrice(course.price)}</span>
        </div>
      </div>
    </Link>
  );
}
