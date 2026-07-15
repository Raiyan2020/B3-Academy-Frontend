'use client';

import { BookOpen, ChevronDown, ChevronUp, LogIn, Search, UserCircle, Instagram, Twitter, Youtube, Facebook } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { requestNewsletterSubscription, isValidNewsletterEmail, NEWSLETTER_MESSAGES } from '@/features/newsletter/services/newsletter-storage.service';
import { useLanguage } from '../../../../LanguageContext';
import { SITE_CONTACT } from '@/features/site-content/services/site-configuration.service';
import { useSiteContactInfo, useSiteSocialMedia } from '@/features/site-content/hooks/use-site-content';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const isAr = language === 'ar';

  const nav = [
    {
      label: isAr ? 'التعليم والتعلم' : 'Education',
      href: '/education',
      items: [
        { label: isAr ? 'الدورات' : 'Courses', href: '/courses' },
        { label: isAr ? 'الكتب' : 'Books', href: '/books' },
        { label: isAr ? 'الموسوعة' : 'Encyclopedia', href: '/encyclopedia' },
      ],
    },
    {
      label: isAr ? 'الرعاية' : 'Care',
      href: '/consultations',
      items: [
        { label: isAr ? 'العيادات' : 'Clinics', href: '/clinic' },
        { label: isAr ? 'الاستشارات' : 'Consultations', href: '/consultations' },
        { label: isAr ? 'الرحلات' : 'Trips', href: '/trips' },
      ],
    },
    { label: isAr ? 'المجتمع' : 'Community', href: '/community' },
    { label: isAr ? 'الاشتراكات' : 'Subscriptions', href: '/subscriptions' },
    { label: isAr ? 'تقييمات المنصة' : 'Ratings', href: '/ratings' },
  ];

  const toggleMobileExpand = (href: string) => {
    setExpandedMobile((prev) => (prev === href ? null : href));
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-black text-emerald-800" aria-label="B3 Academy">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-800 text-white">
            <BookOpen className="h-5 w-5" />
          </span>
          <span>B3 Academy</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <div key={item.href} className="group relative">
              <Link href={item.href} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                {item.label}
                {'items' in item && <ChevronDown className="h-4 w-4" />}
              </Link>
              {'items' in item && (
                <div className="invisible absolute start-0 top-full min-w-44 rounded-md border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                  {item.items.map((sub) => (
                    <Link key={sub.href} href={sub.href} className="block rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/search" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100" aria-label={isAr ? 'البحث' : 'Search'}>
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href={user ? '/dashboard' : '/auth'}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            {user ? <UserCircle className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {user ? (isAr ? 'الحساب الشخصي' : 'Account') : isAr ? 'دخول / حساب جديد' : 'Login / Register'}
          </Link>
        </div>

        <button onClick={() => setMobileOpen((v) => !v)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold lg:hidden">
          {isAr ? 'القائمة' : 'Menu'}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="grid gap-1">
            {nav.map((item) => (
              <div key={item.href}>
                {'items' in item ? (
                  <>
                    <button
                      onClick={() => toggleMobileExpand(item.href)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <span>{item.label}</span>
                      {expandedMobile === item.href ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {expandedMobile === item.href && (
                      <div className="ms-4 mt-1 grid gap-1 border-s-2 border-emerald-100 ps-3">
                        <Link href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                          {isAr ? 'الرئيسية' : 'Overview'}
                        </Link>
                        {item.items.map((sub) => (
                          <Link key={sub.href} href={sub.href} onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100">
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
            <Link href="/search" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100">
              {isAr ? 'البحث' : 'Search'}
            </Link>
            <Link href={user ? '/dashboard' : '/auth'} onClick={() => setMobileOpen(false)} className="block rounded-md bg-emerald-700 px-3 py-2 text-center font-semibold text-white">
              {user ? (isAr ? 'الحساب الشخصي' : 'Account') : isAr ? 'دخول / حساب جديد' : 'Login / Register'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const isAr = language === 'ar';

  // Prefer backend-served contact/social data, falling back to static config.
  const contactQuery = useSiteContactInfo(language);
  const socialQuery = useSiteSocialMedia(language);
  const footerEmail = contactQuery.data?.email || SITE_CONTACT.email;
  const footerPhone = contactQuery.data?.phone || SITE_CONTACT.phone;
  const footerSocials = socialQuery.data?.length
    ? socialQuery.data.map((s) => ({ id: s.name.toLowerCase(), label: s.name, url: s.url }))
    : SITE_CONTACT.socials;

  const educationLinks = [
    { label: isAr ? 'نظرة عامة على التعليم' : 'Education overview', href: '/education' },
    { label: isAr ? 'الدورات' : 'Courses', href: '/courses' },
    { label: isAr ? 'الكتب' : 'Books', href: '/books' },
    { label: isAr ? 'الموسوعة' : 'Encyclopedia', href: '/encyclopedia' },
  ];
  const careLinks = [
    { label: isAr ? 'نظرة عامة على الرعاية' : 'Care overview', href: '/consultations' },
    { label: isAr ? 'العيادات' : 'Clinics', href: '/clinic' },
    { label: isAr ? 'الاستشارات' : 'Consultations', href: '/consultations' },
    { label: isAr ? 'الرحلات' : 'Trips', href: '/trips' },
  ];
  const platformLinks = [
    { label: isAr ? 'المجتمع' : 'Community', href: '/community' },
    { label: isAr ? 'الاشتراكات' : 'Subscriptions', href: '/subscriptions' },
    { label: isAr ? 'تقييمات المنصة' : 'Ratings', href: '/ratings' },
    { label: isAr ? 'الأسئلة الشائعة' : 'FAQ', href: '/faq' },
    { label: isAr ? 'الشروط والأحكام' : 'Terms', href: '/terms' },
    { label: isAr ? 'سياسة الخصوصية' : 'Privacy', href: '/privacy' },
  ];

  const handleNewsletter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) return;

    if (!isValidNewsletterEmail(email)) {
      setNewsletterMessage(isAr ? NEWSLETTER_MESSAGES.invalidEmail.ar : NEWSLETTER_MESSAGES.invalidEmail.en);
      return;
    }

    if (user) {
      const result = requestNewsletterSubscription(user.id, email);
      if ('message' in result) {
        setNewsletterMessage(isAr ? result.message.ar : result.message.en);
        return;
      }
      setNewsletterMessage(
        result.record.status === 'pending'
          ? isAr ? `تم إرسال طلب تأكيد إلى ${result.record.email}.` : `Confirmation request sent to ${result.record.email}.`
          : isAr ? 'هذا البريد مشترك بالفعل أو بانتظار التأكيد.' : 'This email is already subscribed or waiting for confirmation.',
      );
    } else {
      savePendingIntent({ type: 'newsletter.subscribe', href: '/', returnUrl: '/', label: 'Newsletter subscription', itemKind: 'newsletter', email });
      setNewsletterMessage(
        isAr
          ? 'يرجى تسجيل الدخول لإتمام الاشتراك في النشرة الإلكترونية.'
          : 'Please log in to complete your newsletter subscription.',
      );
    }
  };

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-16">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-black text-white">B3 Academy</Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
              {isAr
                ? 'منصة للتعليم والرعاية والمجتمع حول الفلسفة الطبيعية والمحتوى الصحي المتخصص.'
                : 'A platform for education, care, and community around natural philosophy and specialized wellness content.'}
            </p>
            <div className="mt-3 text-sm text-slate-400">
              {footerEmail && <a className="block hover:text-white" href={`mailto:${footerEmail}`}>{footerEmail}</a>}
              {footerPhone && <a className="mt-1 block hover:text-white" href={`tel:${footerPhone.replace(/\s/g, '')}`}>{footerPhone}</a>}
              {SITE_CONTACT.address && SITE_CONTACT.mapUrl && <a className="mt-1 block hover:text-white" href={SITE_CONTACT.mapUrl} target="_blank" rel="noreferrer">{language === 'ar' ? SITE_CONTACT.address.ar : SITE_CONTACT.address.en}</a>}
            </div>
            <div className="mt-5 flex gap-3">
              {footerSocials.map(({ id, label, url }) => {
                const Icon = id === 'instagram' ? Instagram : id === 'x' ? Twitter : id === 'youtube' ? Youtube : Facebook;
                return (
                <a key={id} href={url} target="_blank" rel="noreferrer" aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-emerald-700 hover:text-white transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              );})}
            </div>
          </div>

          {/* Education & Care */}
          <div>
            <h2 className="mb-4 font-bold text-white">{isAr ? 'التعليم والتعلم' : 'Education'}</h2>
            <div className="grid gap-2">
              {educationLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-slate-300 hover:text-white">{link.label}</Link>
              ))}
            </div>
            <h2 className="mt-6 mb-4 font-bold text-white">{isAr ? 'الرعاية' : 'Care'}</h2>
            <div className="grid gap-2">
              {careLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-slate-300 hover:text-white">{link.label}</Link>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h2 className="mb-4 font-bold text-white">{isAr ? 'المنصة' : 'Platform'}</h2>
            <div className="grid gap-2">
              {platformLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-slate-300 hover:text-white">{link.label}</Link>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h2 className="mb-4 font-bold text-white">{isAr ? 'النشرة الإلكترونية' : 'Newsletter'}</h2>
            <p className="mb-4 text-sm leading-7 text-slate-300">
              {isAr
                ? 'اشترك للحصول على آخر المستجدات والمحتوى الحصري.'
                : 'Subscribe to get the latest updates and exclusive content.'}
            </p>
            <form onSubmit={handleNewsletter} className="flex flex-col gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={isAr ? 'البريد الإلكتروني' : 'Email address'}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />
              <button type="submit" className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                {isAr ? 'اشتراك' : 'Subscribe'}
              </button>
            </form>
            {newsletterMessage && <p className="mt-3 text-sm text-emerald-300">{newsletterMessage}</p>}
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} B3 Academy.{' '}
          {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
        </div>
      </div>
    </footer>
  );
}
