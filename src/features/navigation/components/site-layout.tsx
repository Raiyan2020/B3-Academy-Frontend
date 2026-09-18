'use client';

import { BookOpen, ChevronDown, ChevronUp, LogIn, Search, UserCircle, Instagram, Twitter, Youtube, Facebook, Globe2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { isValidNewsletterEmail, NEWSLETTER_MESSAGES } from '@/features/newsletter/services/newsletter-storage.service';
import { useLanguage } from '@/LanguageContext';
import { useSiteContactInfo, useSiteSocialMedia } from '@/features/site-content/hooks/use-site-content';
import { useBackendNewsletterActions } from '@/features/account/hooks/use-account-api';
import { getErrorMessage } from '@/lib/feedback/toast';

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

/**
 * Switches the site between Arabic and English.
 *
 * The whole i18n system already existed — translations, `dir`/RTL handling and
 * the backend `change-lang` call — but nothing in the UI ever called
 * `setLanguage`, so every visitor was locked to Arabic with no way out. This is
 * that missing control.
 */
function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  const next = language === 'ar' ? 'en' : 'ar';

  return (
    <button
      type="button"
      onClick={() => setLanguage(next)}
      className={className}
      aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      lang={next}
    >
      <Globe2 className="h-4 w-4" aria-hidden="true" />
      <span>{next === 'en' ? 'EN' : 'ع'}</span>
    </button>
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
                  {item.items?.map((sub) => (
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
          <LanguageToggle className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100" />
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
                          {/* Links to the section's own overview, not the site homepage — the
                              previous label ("الرئيسية") read as Home and sent people looking
                              for the homepage into /education and /consultations instead. */}
                          {isAr ? `نظرة عامة: ${item.label}` : `${item.label} overview`}
                        </Link>
                        {item.items?.map((sub) => (
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
            <LanguageToggle className="flex w-full items-center gap-2 rounded-md px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100" />
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
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  // Set once a code has been mailed out, which is what switches the footer to the
  // confirmation step. Empty means there is nothing awaiting confirmation.
  const [pendingEmail, setPendingEmail] = useState('');
  const [newsletterCode, setNewsletterCode] = useState('');
  const isAr = language === 'ar';
  const backendNewsletterActions = useBackendNewsletterActions();

  // All contact/social data is backend-served; nothing is rendered when the API has none.
  const contactQuery = useSiteContactInfo(language);
  const socialQuery = useSiteSocialMedia(language);
  const footerEmail = contactQuery.data?.email;
  const footerPhone = contactQuery.data?.phone;
  const footerAddress = contactQuery.data?.address;
  const footerSocials = socialQuery.data?.length ? socialQuery.data : contactQuery.data?.socials ?? [];

  const educationLinks = [
    { label: isAr ? 'نظرة عامة على التعليم' : 'Education overview', href: '/education' },
    { label: isAr ? 'الدورات' : 'Courses', href: '/courses' },
    { label: isAr ? 'الكتب' : 'Books', href: '/books' },
    { label: isAr ? 'الموسوعة' : 'Encyclopedia', href: '/encyclopedia' },
  ];
  const careLinks = [
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

  // Subscribing needs no account: the code mailed to the address is what proves the
  // subscriber owns it. Signing in is only what attaches the subscription to a profile,
  // and the sanctum token travels with the request when there is one.
  const handleNewsletter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) return;

    if (!isValidNewsletterEmail(email)) {
      setNewsletterMessage(isAr ? NEWSLETTER_MESSAGES.invalidEmail.ar : NEWSLETTER_MESSAGES.invalidEmail.en);
      return;
    }

    void backendNewsletterActions.subscribe
      .mutateAsync(email)
      .then((record) => {
        setPendingEmail(record.isConfirmed ? '' : record.email);
        setNewsletterMessage(
          record.isConfirmed
            ? isAr ? 'هذا البريد مشترك بالفعل وتم تأكيده.' : 'This email is already subscribed and confirmed.'
            : isAr ? `تم إرسال رمز تأكيد إلى ${record.email}.` : `A confirmation code was sent to ${record.email}.`,
        );
      })
      .catch((error) => {
        setNewsletterMessage(getErrorMessage(error, isAr ? 'تعذر إتمام الاشتراك.' : 'Unable to complete subscription.'));
      });
  };

  const handleNewsletterVerify = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = newsletterCode.trim();
    if (!pendingEmail || !code) return;

    void backendNewsletterActions.verify
      .mutateAsync({ email: pendingEmail, code })
      .then(() => {
        setPendingEmail('');
        setNewsletterCode('');
        setNewsletterEmail('');
        setNewsletterMessage(isAr ? 'تم تأكيد اشتراكك في النشرة.' : 'Your newsletter subscription is confirmed.');
      })
      .catch((error) => {
        setNewsletterMessage(getErrorMessage(error, isAr ? 'رمز غير صحيح.' : 'Invalid code.'));
      });
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
              {footerAddress && <address className="mt-1 not-italic">{footerAddress}</address>}
            </div>
            <div className="mt-5 flex gap-3">
              {footerSocials.map(({ id, name, url }) => {
                const normalized = name.toLowerCase();
                const Icon = normalized.includes('instagram')
                  ? Instagram
                  : normalized.includes('twitter') || normalized === 'x'
                    ? Twitter
                    : normalized.includes('youtube')
                      ? Youtube
                      : normalized.includes('facebook')
                        ? Facebook
                        : Globe2;
                return (
                <a key={id} href={url} target="_blank" rel="noreferrer" aria-label={name} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-emerald-700 hover:text-white transition-colors">
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
            {pendingEmail && (
              <form onSubmit={handleNewsletterVerify} className="mt-3 flex flex-col gap-2">
                <label htmlFor="newsletter-code" className="text-sm text-slate-300">
                  {isAr ? 'رمز التأكيد' : 'Confirmation code'}
                </label>
                <input
                  id="newsletter-code"
                  inputMode="numeric"
                  value={newsletterCode}
                  onChange={(e) => setNewsletterCode(e.target.value)}
                  placeholder={isAr ? 'رمز مكوّن من 6 أرقام' : '6-digit code'}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                />
                <button type="submit" className="w-full rounded-md border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-900">
                  {isAr ? 'تأكيد الاشتراك' : 'Confirm subscription'}
                </button>
              </form>
            )}
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
