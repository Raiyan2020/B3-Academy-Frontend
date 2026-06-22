'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminTable } from './admin-table';
import { listAdminCourses } from '@/features/courses/services/courses.service';
import { useLanguage } from '../../../../LanguageContext';

const levelFilterOptions = ['all', 'Beginner', 'Intermediate', 'Advanced'] as const;
const statusFilterOptions = ['all', 'active', 'inactive'] as const;

export function AdminCoursesPage() {
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<(typeof levelFilterOptions)[number]>('all');
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilterOptions)[number]>('all');
  const courses = listAdminCourses();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter(({ course, metadata }) => {
      if (levelFilter !== 'all' && course.level !== levelFilter) return false;
      if (statusFilter === 'active' && !metadata.isActive) return false;
      if (statusFilter === 'inactive' && metadata.isActive) return false;
      if (!query) return true;
      return (
        course.title.en.toLowerCase().includes(query) ||
        course.title.ar.includes(query) ||
        course.id.toLowerCase().includes(query)
      );
    });
  }, [courses, levelFilter, search, statusFilter]);

  const columns = [
    {
      key: 'title',
      header: isAr ? 'الدورة' : 'Course',
      render: (row: (typeof filtered)[number]) => (
        <div>
          <p className="font-semibold text-slate-950">{localize(row.course.title)}</p>
          <p className="text-xs text-slate-500">{row.course.id}</p>
        </div>
      ),
    },
    {
      key: 'level',
      header: isAr ? 'المستوى' : 'Level',
      render: (row: (typeof filtered)[number]) => row.course.level,
    },
    {
      key: 'price',
      header: isAr ? 'السعر' : 'Price',
      render: (row: (typeof filtered)[number]) => `$${row.course.price}`,
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (row: (typeof filtered)[number]) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.metadata.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
          {row.metadata.isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'غير نشط' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'featured',
      header: isAr ? 'مميز' : 'Featured',
      render: (row: (typeof filtered)[number]) => (row.metadata.isFeatured ? (isAr ? 'نعم' : 'Yes') : '—'),
    },
    {
      key: 'actions',
      header: isAr ? 'إجراءات' : 'Actions',
      className: 'text-end',
      render: (row: (typeof filtered)[number]) => (
        <div className="flex justify-end gap-2">
          <Link href={`/courses/${row.course.id}`} className="text-sm font-semibold text-slate-600 hover:underline">
            {isAr ? 'معاينة' : 'Preview'}
          </Link>
          <Link href={`/admin/courses/${row.course.id}/edit`} className="text-sm font-semibold text-emerald-700 hover:underline">
            {isAr ? 'تعديل' : 'Edit'}
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'الدورات' : 'Courses'}
        description={isAr ? 'إدارة بيانات الدورات وإعدادات العرض.' : 'Manage course data and visibility settings.'}
        actions={
          <Link href="/admin/courses/new" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
            {isAr ? 'إضافة دورة' : 'Add course'}
          </Link>
        }
      />
      <AdminTable
        columns={columns}
        rows={filtered}
        rowKey={(row) => row.course.id}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={isAr ? 'بحث بالعنوان أو المعرّف' : 'Search by title or ID'}
        filterSlot={
          <div className="flex flex-wrap gap-2">
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as typeof levelFilter)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              {levelFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? (isAr ? 'كل المستويات' : 'All levels') : option}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              {statusFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? (isAr ? 'كل الحالات' : 'All statuses') : option === 'active' ? (isAr ? 'نشط' : 'Active') : isAr ? 'غير نشط' : 'Inactive'}
                </option>
              ))}
            </select>
          </div>
        }
        emptyTitle={isAr ? 'لا توجد دورات' : 'No courses found'}
      />
    </>
  );
}
