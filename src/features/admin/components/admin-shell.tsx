'use client';

import {
  BookOpen,
  Bot,
  Building2,
  Calendar,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  Mail,
  Menu,
  Mic,
  Plane,
  Stethoscope,
  Users,
  Video,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';

type NavItem = {
  href: string;
  labelEn: string;
  labelAr: string;
  icon: typeof Users;
};

const navItems: NavItem[] = [
  { href: '/admin/users', labelEn: 'Users', labelAr: 'المستخدمون', icon: Users },
  { href: '/admin/courses', labelEn: 'Courses', labelAr: 'الدورات', icon: GraduationCap },
  { href: '/admin/books', labelEn: 'Books', labelAr: 'الكتب', icon: BookOpen },
  { href: '/admin/encyclopedia', labelEn: 'Encyclopedia', labelAr: 'الموسوعة', icon: Library },
  { href: '/admin/clinics', labelEn: 'Clinics', labelAr: 'العيادات', icon: Building2 },
  { href: '/admin/consultations', labelEn: 'Consultations', labelAr: 'الاستشارات', icon: Video },
  { href: '/admin/trips', labelEn: 'Trips', labelAr: 'الرحلات', icon: Plane },
  { href: '/admin/schedule', labelEn: 'Schedule', labelAr: 'الجدول', icon: Calendar },
  { href: '/admin/community', labelEn: 'Community', labelAr: 'المجتمع', icon: FileText },
  { href: '/admin/podcasts', labelEn: 'Podcasts', labelAr: 'البودكاست', icon: Mic },
  { href: '/admin/newsletter', labelEn: 'Newsletter', labelAr: 'النشرة', icon: Mail },
  { href: '/admin/assistant', labelEn: 'AI Assistant', labelAr: 'المساعد', icon: Bot },
  { href: '/admin', labelEn: 'Overview', labelAr: 'نظرة عامة', icon: LayoutDashboard },
];

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAr = language === 'ar';

  const sidebar = (
    <aside className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {isAr ? 'لوحة الإدارة' : 'Admin Panel'}
        </p>
        <p className="mt-1 font-bold text-slate-950">{user?.name}</p>
        <p className="text-xs text-slate-500">{user?.email}</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const label = isAr ? item.labelAr : item.labelEn;
          const baseClass = `flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
            active ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
          }`;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={baseClass}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <Link
          href="/doctor"
          className="mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          onClick={() => setDrawerOpen(false)}
        >
          <Stethoscope className="h-4 w-4" />
          {isAr ? 'بوابة الطبيب' : 'Doctor portal'}
        </Link>
        <Link
          href="/"
          className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          onClick={() => setDrawerOpen(false)}
        >
          {isAr ? 'العودة للموقع' : 'Back to site'}
        </Link>
      </div>
    </aside>
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            <Menu className="h-4 w-4" />
            {isAr ? 'القائمة' : 'Menu'}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="hidden lg:block">{sidebar}</div>

          <section>
            {(title || actions) && (
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  {title && <h1 className="text-3xl font-bold text-slate-950">{title}</h1>}
                  {description && <p className="mt-2 text-slate-600">{description}</p>}
                </div>
                {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
              </div>
            )}
            {children}
          </section>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-label={isAr ? 'إغلاق' : 'Close'}
          />
          <div className="absolute start-0 top-0 h-full w-[min(100%,280px)] bg-slate-50 p-4 shadow-xl">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-md border border-slate-200 p-2 text-slate-600"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}
    </main>
  );
}
