'use client';

import React, { useState } from 'react';
import { Link } from '@/lib/routing/next-router-compat';
import {
  ArrowRight, BookOpen, Video, Users, Activity, Star, ArrowLeft,
  Heart, Sprout, Microscope, Pill, Stethoscope, FlaskConical, GraduationCap, Check,
  Mail, Bell
} from 'lucide-react';
import { CourseCard, BookCard, SectionHeader, Button } from '../../../../components/UI';
import { MushroomGraphic, HempLeafGraphic, VineGraphic, BerryBranchGraphic } from '../../../../components/Graphics';
import { useLanguage } from '../../../../LanguageContext';
import { getApprovedTestimonials } from '@/features/site-content/services/site-configuration.service';
import { useAuth } from '@/features/auth/auth-provider';
import { useFeaturedCoursesQuery } from '@/features/courses/hooks/use-courses-query';
import { useFeaturedBooksQuery } from '@/features/books/hooks/use-books-query';
import { StaggerItem, StaggerList } from '@/lib/motion/stagger-list';
import {
  isValidNewsletterEmail,
  NEWSLETTER_MESSAGES,
  requestNewsletterSubscription,
} from '@/features/newsletter/services/newsletter-storage.service';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';
import { useHomepageContent } from '../hooks/use-site-content';

export const Home: React.FC = () => {
  const { t, localize, dir, language } = useLanguage();
  const { user, requireAuthAction } = useAuth();
  const [email, setEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    if (!isValidNewsletterEmail(trimmed)) {
      setNewsletterMessage(dir === 'rtl' ? NEWSLETTER_MESSAGES.invalidEmail.ar : NEWSLETTER_MESSAGES.invalidEmail.en);
      return;
    }

    if (!user) {
      savePendingIntent({ type: 'newsletter.subscribe', href: '/', returnUrl: '/', label: 'Newsletter subscription', itemKind: 'newsletter', email: trimmed });
      requireAuthAction();
      return;
    }

    const result = requestNewsletterSubscription(user.id, trimmed);
    if ('message' in result) {
      setNewsletterMessage(dir === 'rtl' ? result.message.ar : result.message.en);
      return;
    }

    setIsSubscribed(true);
    setNewsletterMessage(dir === 'rtl' ? `تم إرسال طلب تأكيد إلى ${result.record.email}.` : `Confirmation request sent to ${result.record.email}.`);
  };

  const featuredCourses = useFeaturedCoursesQuery(3).data ?? [];
  const featuredBooks = useFeaturedBooksQuery(4).data ?? [];
  const homepageContent = useHomepageContent(language);
  const testimonials = getApprovedTestimonials();

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const fallbackSpecialties = [
    { icon: Heart, title: t('edu.spec1.title'), desc: t('edu.spec1.desc') },
    { icon: Sprout, title: t('edu.spec2.title'), desc: t('edu.spec2.desc') },
    { icon: Microscope, title: t('edu.spec3.title'), desc: t('edu.spec3.desc') },
    { icon: Pill, title: t('edu.spec4.title'), desc: t('edu.spec4.desc') },
    { icon: Stethoscope, title: t('edu.spec5.title'), desc: t('edu.spec5.desc') },
    { icon: FlaskConical, title: t('edu.spec6.title'), desc: t('edu.spec6.desc') },
    { icon: GraduationCap, title: t('edu.spec7.title'), desc: t('edu.spec7.desc') },
    { icon: Video, title: t('edu.spec8.title'), desc: t('edu.spec8.desc') },
  ];
  const specialtyIcons = [Heart, Sprout, Microscope, Pill, Stethoscope, FlaskConical, GraduationCap, Video];
  const specialties = homepageContent.data?.academicSpecializations.length
    ? homepageContent.data.academicSpecializations.map((item, index) => ({
        icon: specialtyIcons[index % specialtyIcons.length],
        title: item.title,
        desc: item.description,
      }))
    : fallbackSpecialties;
  const homeFaqs = homepageContent.data?.faqs.length
    ? homepageContent.data.faqs.map((item) => ({ q: item.question, a: item.answer }))
    : [
        { q: t('faq.q1'), a: t('faq.a1') },
        { q: t('faq.q2'), a: t('faq.a2') },
        { q: t('faq.q3'), a: t('faq.a3') },
        { q: t('faq.q6'), a: t('faq.a6') },
        { q: t('faq.q7'), a: t('faq.a7') },
      ];

  return (
    <div>
      <section className="relative overflow-hidden bg-[url('https://raiyansoft.com/wp-content/uploads/2026/04/n1.webp')] bg-cover bg-center">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <VineGraphic className="absolute top-0 right-0 w-96 h-96 transform translate-x-1/4 -translate-y-1/4 text-emerald-100" />
          <BerryBranchGraphic className="absolute bottom-0 right-10 w-64 h-64 transform translate-y-1/4 text-emerald-100" />
          <HempLeafGraphic className="absolute top-20 left-10 w-48 h-48 transform -rotate-12 text-emerald-100" />
          <MushroomGraphic className="absolute bottom-10 left-1/4 w-32 h-32 transform rotate-12 text-emerald-100" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <img
              src="https://raiyansoft.com/wp-content/uploads/2026/04/logo1.png"
              alt="B3 Academy Logo"
              className="h-40 md:h-56 w-auto object-contain mb-6"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-8 flex flex-col items-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-[#281810]">
                {t('hero.title')}
              </h1>
              <p className="text-base sm:text-lg text-[#281810] font-medium max-w-lg mx-auto">
                {t('hero.subtitle')}
              </p>
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 bg-emerald-800/20 rounded-full border border-emerald-700/30 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse flex-shrink-0" />
                <span className="text-sm font-medium text-[#281810] truncate">{t('hero.welcome')}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto px-4 sm:px-0">
                <Link to="/education" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full">{t('hero.cta.courses')}</Button>
                </Link>
                <Link to="/consultations" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full text-[#281810] border-[#281810] hover:bg-[#281810]/10">
                    {t('hero.cta.book')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#ede3ce]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-3xl font-bold text-[#281810] mb-4">
              {t('edu.specialties.title')}
            </h2>
            <p className="text-lg text-[#483820] max-w-3xl mx-auto opacity-80">
              {t('edu.specialties.sub')}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {specialties.map((spec, i) => (
              <div
                key={i}
                className="bg-[#e5d4c2]/50 p-8 rounded-xl border border-[#281810]/10 flex flex-col items-center text-center group hover:bg-[#e5d4c2] transition-all duration-300 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
              >
                <div className="w-16 h-16 bg-[#4a634a] rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                  <spec.icon size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-[#281810] mb-3">{spec.title}</h3>
                <p className="text-[#483820] text-sm leading-relaxed opacity-90">{spec.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 bg-[#2a1e14bf] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://raiyansoft.com/wp-content/uploads/2026/04/n2.webp')] bg-cover bg-center opacity-[0.45] mix-blend-overlay" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader title={t('section.featured_courses')} subtitle={t('section.featured_courses.sub')} centered light />
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course) => (
              <StaggerItem key={course.id}>
                <CourseCard course={course} />
              </StaggerItem>
            ))}
          </StaggerList>
          <div className="text-center mt-12">
            <Link to="/courses">
              <Button variant="ghost" className="group bg-[#ede3ce] text-[#281810] hover:bg-[#ede3ce]/90 font-bold px-8 py-3 rounded-full">
                {t('btn.view_all_courses')} <ArrowIcon size={18} className="ms-2 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">{t('section.latest_books')}</h2>
              <p className="text-slate-600 mt-2">{t('section.latest_books.sub')}</p>
            </div>
            <Link to="/books" className="hidden sm:flex items-center text-emerald-600 font-medium hover:text-emerald-700">
              {t('btn.browse_library')} <ArrowIcon size={18} className="ms-1" />
            </Link>
          </div>
          <StaggerList className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredBooks.map((book) => (
              <StaggerItem key={book.id}>
                <BookCard book={book} />
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </section>

      <section className="py-20 bg-emerald-900 text-white relative overflow-hidden bg-[url('https://raiyansoft.com/wp-content/uploads/2026/04/n3.webp')] bg-cover bg-center bg-fixed">
        <div className="absolute inset-0 bg-emerald-900/80" />
        <div className="absolute inset-0 opacity-5 pointer-events-none flex justify-center items-center">
          <HempLeafGraphic className="w-[800px] h-[800px] text-emerald-100" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-16">{t('section.testimonials')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-emerald-800/50 backdrop-blur p-8 rounded-2xl border border-emerald-700">
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                </div>
                <p className="text-emerald-100 italic mb-6">"{localize(testimonial.quote)}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
                    {localize(testimonial.customerName).slice(0, 1)}
                  </div>
                  <div className="font-bold">{localize(testimonial.customerName)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#ede3ce]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-[#281810] mb-4">{t('sub.title')}</h2>
            <p className="text-lg text-[#281810]/70 max-w-2xl mx-auto">{t('sub.sub')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#281810]/5 flex flex-col hover:shadow-xl transition-shadow duration-300">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-[#281810] mb-2">{t('sub.monthly.title')}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#281810]">{t('sub.monthly.price')}</span>
                  <span className="text-[#281810]/50">{t('sub.monthly.period')}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[t('sub.feat.monograph'), t('sub.feat.exclusive'), t('sub.feat.community'), t('sub.feat.updates')].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#281810]/80">
                    <div className="mt-1 bg-emerald-100 text-emerald-600 rounded-full p-0.5">
                      <Check size={14} />
                    </div>
                    <span className="text-sm font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link to="/subscriptions">
                <Button variant="ghost" className="w-full py-6 rounded-2xl bg-[#281810] hover:bg-[#3d2a1e] text-white font-bold">
                  {t('sub.cta')}
                </Button>
              </Link>
            </div>

            <div className="bg-[#281810] rounded-3xl p-8 shadow-xl border border-[#281810] flex flex-col relative transform md:scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-[#281810] text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
                {t('sub.yearly.badge')}
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{t('sub.yearly.title')}</h3>
                <div className="flex items-baseline gap-1 text-white">
                  <span className="text-4xl font-black">{t('sub.yearly.price')}</span>
                  <span className="text-white/50">{t('sub.yearly.period')}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[t('sub.feat.monograph'), t('sub.feat.exclusive'), t('sub.feat.community'), t('sub.feat.updates')].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/90">
                    <div className="mt-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm shadow-emerald-900/50">
                      <Check size={14} />
                    </div>
                    <span className="text-sm font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link to="/subscriptions">
                <Button variant="ghost" className="w-full py-6 rounded-2xl bg-white text-[#281810] hover:bg-white/90 font-bold">
                  {t('sub.cta')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-800">{t('section.faq')}</h2>
          <div className="space-y-4">
            {homeFaqs.map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-5">
            <Mail size={28} />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">{t('newsletter.title')}</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">{t('newsletter.sub')}</p>
          {!isSubscribed ? (
            <form onSubmit={handleSubscribe} className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('newsletter.email_placeholder')}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Button className="rounded-2xl px-6 py-3 justify-center">{t('newsletter.subscribe')}</Button>
            </form>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-emerald-800 font-semibold">
              {t('newsletter.success')}
            </div>
          )}
          {newsletterMessage && <p className="mt-4 text-sm text-slate-600">{newsletterMessage}</p>}
        </div>
      </section>
    </div>
  );
};

export { Home as HomePage };
