'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import { useCourseApiList, useCourseCategories, useCourseLevels, useFeaturedCourseApiList, useMyCourseApiList } from '../hooks/use-course-api';
import type { CourseFilters as CourseFiltersType } from '../types/api.types';
import { CourseCard } from './CourseCard';
import { CourseFilters } from './CourseFilters';

export function CourseCatalogPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const isAr = language === 'ar';
  const [filters, setFilters] = useState<CourseFiltersType>({ categoryId: 'all', levelId: 'all', sort: 'newest' });
  // Prices are requested in the globally selected currency so the switcher updates them.
  const effectiveFilters = useMemo(() => ({ ...filters, currency }), [filters, currency]);
  const categoriesQuery = useCourseCategories();
  const levelsQuery = useCourseLevels();
  const coursesQuery = useCourseApiList(effectiveFilters);
  const featuredQuery = useFeaturedCourseApiList(3, currency);
  const myCoursesQuery = useMyCourseApiList(Boolean(user));

  const enrolledIds = useMemo(() => new Set((myCoursesQuery.data || []).map((course) => course.id)), [myCoursesQuery.data]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{isAr ? 'الدورات' : 'Courses'}</p>
          <h1 className="text-4xl font-bold text-slate-950">{isAr ? 'الدورات المفعلة' : 'Active courses'}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {isAr
              ? 'تُجلب بيانات الدورات الآن من الـ backend مباشرة، بما في ذلك الفئات والمستويات والتسعير والالتحاق.'
              : 'Course data now comes directly from the backend, including categories, levels, pricing, and enrollment state.'}
          </p>
        </div>
      </section>

      {(featuredQuery.data || []).length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-bold text-slate-950">{isAr ? 'الدورات المميزة' : 'Featured courses'}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {(featuredQuery.data || []).map((course) => (
              <CourseCard key={course.id} course={course} isAr={isAr} enrolled={enrolledIds.has(course.id) || course.isEnrolled} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <CourseFilters filters={filters} categories={categoriesQuery.data || []} levels={levelsQuery.data || []} isAr={isAr} onChange={setFilters} />
        {coursesQuery.isLoading ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500">{isAr ? 'جار تحميل الدورات...' : 'Loading courses...'}</div>
        ) : coursesQuery.isError ? (
          <div className="mt-6 rounded-lg border border-red-100 bg-white p-10 text-center text-red-700">{isAr ? 'تعذر تحميل الدورات.' : 'Unable to load courses.'}</div>
        ) : (coursesQuery.data || []).length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">{isAr ? 'لا توجد دورات مطابقة.' : 'No matching courses.'}</div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(coursesQuery.data || []).map((course) => (
              <CourseCard key={course.id} course={course} isAr={isAr} enrolled={enrolledIds.has(course.id) || course.isEnrolled} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
