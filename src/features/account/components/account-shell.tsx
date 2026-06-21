'use client';

import { Bell, BookOpen, CalendarDays, CreditCard, Heart, KeyRound, Library, LogOut, Newspaper, Plane, Settings, ShieldAlert, Stethoscope, UserRound, Video } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';

import { getNotifications } from '../services/account-records.service';

const accountLinks = [
  { href: '/dashboard', label: 'الرئيسية', icon: UserRound },
  { href: '/dashboard/profile', label: 'البيانات الشخصية', icon: Settings },
  { href: '/dashboard/password', label: 'كلمة المرور', icon: KeyRound },
  { href: '/dashboard/courses', label: 'دوراتي وشهاداتي', icon: BookOpen },
  { href: '/dashboard/books', label: 'كتبي', icon: Library },
  { href: '/dashboard/clinic-bookings', label: 'حجوزات العيادات', icon: Stethoscope },
  { href: '/dashboard/consultations', label: 'استشاراتي', icon: Video },
  { href: '/dashboard/trips', label: 'باقات الرحلات', icon: Plane },
  { href: '/dashboard/subscription', label: 'اشتراكي', icon: CalendarDays },
  { href: '/dashboard/payments', label: 'المدفوعات والفواتير', icon: CreditCard },
  { href: '/dashboard/health-assessments', label: 'التقييمات الصحية', icon: ShieldAlert },
  { href: '/dashboard/favorites', label: 'المفضلة', icon: Heart },
  { href: '/dashboard/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/dashboard/newsletter', label: 'النشرة الإلكترونية', icon: Newspaper },
  { href: '/dashboard/security', label: 'الخروج وحذف الحساب', icon: LogOut },
];

export function AccountShell({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const unreadCount = user ? getNotifications(user.id).filter(n => !n.isRead).length : 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-950">تسجيل الدخول مطلوب</h1>
        <p className="mt-3 text-slate-600">يرجى تسجيل الدخول للوصول إلى الحساب الشخصي.</p>
        <Link href="/auth" className="mt-6 inline-flex rounded-md bg-emerald-700 px-5 py-3 font-semibold text-white">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="border-b border-slate-100 p-3">
            <p className="font-bold text-slate-950">{user.name}</p>
            <p className="mt-1 text-xs text-slate-500">{user.email}</p>
          </div>
          <nav className="mt-3 grid gap-1">
            {accountLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                    active ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <link.icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.href === '/dashboard/notifications' && unreadCount > 0 && (
                    <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs text-white font-bold">{unreadCount}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
            {description && <p className="mt-2 text-slate-600">{description}</p>}
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

export function EmptyAccountState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-100 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <div className="mt-1 font-semibold text-slate-950">{value || 'غير متاح'}</div>
    </div>
  );
}

