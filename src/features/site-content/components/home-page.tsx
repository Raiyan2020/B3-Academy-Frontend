'use client';

import React from 'react';
import { Link } from '@/lib/routing/next-router-compat';
import {
  ArrowRight, Video, Star, ArrowLeft,
  Heart, Sprout, Microscope, Pill, Stethoscope, FlaskConical, GraduationCap, Check,
} from 'lucide-react';
import { SectionHeader, Button } from '@/components/UI';
import { MushroomGraphic, HempLeafGraphic, VineGraphic, BerryBranchGraphic } from '@/components/Graphics';
import { useLanguage } from '@/LanguageContext';
import { useCurrency } from '@/CurrencyContext';
import { useFeaturedCourseApiList } from '@/features/courses/hooks/use-course-api';
import { CourseCard } from '@/features/courses/ui/CourseCard';
import { useApiFeaturedBooks } from '@/features/books/hooks/use-books-api';
import { BookCard } from '@/features/books/ui/BookCard';
import { StaggerItem, StaggerList } from '@/lib/motion/stagger-list';
import { imageOrLogo, LOGO_IMAGE } from '@/lib/images';
import { useHomepageContent } from '../hooks/use-site-content';

export const Home: React.FC = () => {
  const { t, dir, language } = useLanguage();
  const { currency } = useCurrency();
  const isAr = language === 'ar';
  const featuredCourses = useFeaturedCourseApiList(3, currency).data ?? [];
  const featuredBooks = useApiFeaturedBooks(4).data ?? [];
  const homepageContent = useHomepageContent(language);
  // قصص الشفاء is its own admin-curated collection, not the platform-review feed. This section
  // used to render `usePlatformReviews()`, which duplicated the "تقييمات المنصة" content under a
  // different heading and left curated healing stories invisible on the site.
  const testimonials = homepageContent.data?.healingStories ?? [];

  const heroImage = imageOrLogo(homepageContent.data?.sliders?.[0]?.image);

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const specialtyIcons = [Heart, Sprout, Microscope, Pill, Stethoscope, FlaskConical, GraduationCap, Video];
  const specialties = (homepageContent.data?.academicSpecializations ?? []).map((item, index) => ({
    icon: specialtyIcons[index % specialtyIcons.length],
    title: item.title,
    desc: item.description,
  }));
  const homeFaqs = (homepageContent.data?.faqs ?? []).map((item) => ({ q: item.question, a: item.answer }));

  return (
    <div>
      {/* The hero background is the admin's first homepage slider. It used to be hotlinked from
          a WordPress host that now 403s, so the section fell back to flat colour; the image the
          admin already uploads is the real source. `imageOrLogo` covers the no-slider case the
          same way every other image on the site does. */}
      <section className="relative overflow-hidden bg-emerald-50">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-20 pointer-events-none"
        />
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <VineGraphic className="absolute top-0 right-0 w-96 h-96 transform translate-x-1/4 -translate-y-1/4 text-emerald-100" />
          <BerryBranchGraphic className="absolute bottom-0 right-10 w-64 h-64 transform translate-y-1/4 text-emerald-100" />
          <HempLeafGraphic className="absolute top-20 left-10 w-48 h-48 transform -rotate-12 text-emerald-100" />
          <MushroomGraphic className="absolute bottom-10 left-1/4 w-32 h-32 transform rotate-12 text-emerald-100" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <img
              src={LOGO_IMAGE}
              alt="B3 Academy Logo"
              className="h-40 md:h-56 w-auto object-contain mb-6"
            />
            {/* w-full is load-bearing: as a flex item of an `items-center` column, this div is
                sized to fit-content, and `min-width: auto` floors that at the min-content width of
                the longest unbreakable headline — 517px against a 390px phone viewport. Being
                centered it overhung both sides, and the section's `overflow-hidden` clipped it
                rather than scrolling, cutting the first and last letters off the h1, the badge
                and both CTAs. Taking the parent's width instead lets the text wrap. */}
            <div className="w-full space-y-8 flex flex-col items-center">
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

      {specialties.length > 0 && (
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
      )}

      <section className="relative py-20 bg-[#2a1e14bf] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader title={t('section.featured_courses')} subtitle={t('section.featured_courses.sub')} centered light />
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course) => (
              <StaggerItem key={course.id}>
                <CourseCard course={course} isAr={isAr} enrolled={course.isEnrolled} />
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
                <BookCard book={book} isAr={isAr} />
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </section>

      {testimonials.length > 0 && (
      <section className="py-20 bg-emerald-900 text-white relative overflow-hidden">
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
                  {[...Array(testimonial.stars)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                </div>
                <p className="text-emerald-100 italic mb-6">&ldquo;{testimonial.message}&rdquo;</p>
                <div className="flex items-center gap-3">
                  {testimonial.image ? (
                    <img src={testimonial.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
                      {testimonial.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="font-bold">{testimonial.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

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
              <Link
                to="/subscriptions"
                className="flex w-full items-center justify-center rounded-2xl bg-[#281810] px-5 py-6 font-bold text-white transition-colors hover:bg-[#3d2a1e] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {t('sub.cta')}
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
              <Link
                to="/subscriptions"
                className="flex w-full items-center justify-center rounded-2xl bg-white px-5 py-6 font-bold text-[#281810] transition-colors hover:bg-stone-100 hover:text-[#281810] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {t('sub.cta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {homeFaqs.length > 0 && (
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
      )}

    </div>
  );
};

export { Home as HomePage };
