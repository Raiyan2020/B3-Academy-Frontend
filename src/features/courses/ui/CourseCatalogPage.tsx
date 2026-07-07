'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import {
  useCourseApiList,
  useCourseCategories,
  useFeaturedCourseApiList,
  useMyCourseApiList,
} from '../hooks/use-course-api';
import type { CourseFilters as CourseFiltersType } from '../types/api.types';
import { CourseCard } from './CourseCard';
import { CourseFilters } from './CourseFilters';

export function CourseCatalogPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';
  const [filters, setFilters] = useState<CourseFiltersType>({ categoryId: 'all', currency: 'USD', sort: 'newest' });
  const categoriesQuery = useCourseCategories();
  const coursesQuery = useCourseApiList(filters);
  const featuredQuery = useFeaturedCourseApiList(3, filters.currency);
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
              ? 'كل الدورات مدفوعة. يمكن للزائر التصفح وفتح التفاصيل، ويبدأ التسجيل والدفع بعد تسجيل الدخول.'
              : 'All courses are paid. Visitors can browse and open details; enrollment and payment start after sign-in.'}
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
        <CourseFilters filters={filters} categories={categoriesQuery.data || []} isAr={isAr} onChange={setFilters} />
        {coursesQuery.isLoading ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500">
            {isAr ? 'جار تحميل الدورات...' : 'Loading courses...'}
          </div>
        ) : (coursesQuery.data || []).length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
            {isAr ? 'لا توجد دورات مطابقة.' : 'No matching courses.'}
          </div>
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

