import { Clock } from 'lucide-react';
import Link from 'next/link';
import type { CourseListItem } from '../types/api.types';

export function CourseCard({ course, isAr, enrolled }: { course: CourseListItem; isAr: boolean; enrolled: boolean }) {
  const price = new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: course.rawPrice?.currency || course.currency,
  }).format(course.rawPrice?.amount ?? course.price);

  return (
    <Link href={`/courses/${course.id}`} className="block h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      {course.imageUrl && <img src={course.imageUrl} alt={course.title} className="h-44 w-full object-cover" />}
      <div className="p-5">
        <div className="mb-2 flex flex-wrap gap-2 text-xs font-semibold">
          {course.level?.name && <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{course.level.name}</span>}
          {course.category?.name && <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{course.category.name}</span>}
          {enrolled && <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{isAr ? 'مسجلة لديك' : 'Enrolled'}</span>}
        </div>
        <h3 className="line-clamp-2 text-lg font-bold text-slate-950">{course.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{course.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Clock className="h-4 w-4" />
            {course.durationHours ? (isAr ? `${course.durationHours} س` : `${course.durationHours}h`) : '-'}
          </span>
          <span className="font-bold text-emerald-700">{price}</span>
        </div>
      </div>
    </Link>
  );
}
