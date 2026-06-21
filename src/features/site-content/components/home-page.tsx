import React, { useState, useEffect } from 'react';
import { Link } from '@/lib/routing/next-router-compat';
import { 
  ArrowRight, BookOpen, Video, Users, Activity, Star, ArrowLeft,
  Heart, Sprout, Microscope, Pill, Stethoscope, FlaskConical, GraduationCap, Check,
  X, Mail, Bell
} from 'lucide-react';
import { CourseCard, BookCard, SectionHeader, Button } from '../../../../components/UI';
import { MushroomGraphic, HempLeafGraphic, VineGraphic, BerryBranchGraphic } from '../../../../components/Graphics';
import { useLanguage } from '../../../../LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { getSessionStorageItem, setSessionStorageItem } from '@/lib/storage/safe-session-storage';
import { STORAGE_KEYS } from '@/lib/storage/safe-local-storage';
import { getFeaturedCourses } from '@/features/courses/services/courses.service';
import { getBooks, getFeaturedBooks } from '@/features/books/services/books.service';

export const Home: React.FC = () => {
  const { t, localize, dir } = useLanguage();
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const hasSeenNewsletter = getSessionStorageItem(STORAGE_KEYS.newsletterDismissed);
    if (!hasSeenNewsletter) {
      const timer = setTimeout(() => {
        setShowNewsletter(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeNewsletter = () => {
    setShowNewsletter(false);
    setSessionStorageItem(STORAGE_KEYS.newsletterDismissed, 'true');
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => {
        closeNewsletter();
      }, 3000);
    }
  };

  const featuredCourses = getFeaturedCourses(3);
  const featuredBooks = getFeaturedBooks(4);

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const specialties = [
    { icon: Heart, title: t('edu.spec1.title'), desc: t('edu.spec1.desc') },
    { icon: Sprout, title: t('edu.spec2.title'), desc: t('edu.spec2.desc') },
    { icon: Microscope, title: t('edu.spec3.title'), desc: t('edu.spec3.desc') },
    { icon: Pill, title: t('edu.spec4.title'), desc: t('edu.spec4.desc') },
    { icon: Stethoscope, title: t('edu.spec5.title'), desc: t('edu.spec5.desc') },
    { icon: FlaskConical, title: t('edu.spec6.title'), desc: t('edu.spec6.desc') },
    { icon: GraduationCap, title: t('edu.spec7.title'), desc: t('edu.spec7.desc') },
    { icon: Video, title: t('edu.spec8.title'), desc: t('edu.spec8.desc') },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[url('https://raiyansoft.com/wp-content/uploads/2026/04/n1.webp')] bg-cover bg-center">
        {/* Botanical background graphics */}
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
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse flex-shrink-0"></span>
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

      {/* Educational Specialties Section */}
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


      {/* Featured Courses */}
      <section className="relative py-20 bg-[#2a1e14bf] overflow-hidden">
        {/* Background Overlay */}
        <div 
          className="absolute inset-0 bg-[url('https://raiyansoft.com/wp-content/uploads/2026/04/n2.webp')] bg-cover bg-center opacity-[0.45] mix-blend-overlay"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader 
            title={t('section.featured_courses')} 
            subtitle={t('section.featured_courses.sub')}
            centered 
            light
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/courses">
              <Button variant="ghost" className="group bg-[#ede3ce] text-[#281810] hover:bg-[#ede3ce]/90 font-bold px-8 py-3 rounded-full">
                {t('btn.view_all_courses')} <ArrowIcon size={18} className="ms-2 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Books Carousel (Grid for demo) */}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-emerald-900 text-white relative overflow-hidden bg-[url('https://raiyansoft.com/wp-content/uploads/2026/04/n3.webp')] bg-cover bg-center bg-fixed">
        <div className="absolute inset-0 bg-emerald-900/80"></div>
        <div className="absolute inset-0 opacity-5 pointer-events-none flex justify-center items-center">
           <HempLeafGraphic className="w-[800px] h-[800px] text-emerald-100" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-16">{t('section.testimonials')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-emerald-800/50 backdrop-blur p-8 rounded-2xl border border-emerald-700">
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                   {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                </div>
                <p className="text-emerald-100 italic mb-6">"{localize({
                  en: "The follow-up program was exactly what I needed. Having someone check in on my progress made all the difference.",
                  ar: "كان برنامج المتابعة بالضبط ما كنت أحتاجه. وجود شخص يتابع تقدمي صنع الفارق الكبير."
                })}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div>
                    <div className="font-bold">{localize({en: "Happy Student", ar: "طالب سعيد"})}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="py-24 bg-[#ede3ce]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-[#281810] mb-4">{t('sub.title')}</h2>
            <p className="text-lg text-[#281810]/70 max-w-2xl mx-auto">{t('sub.sub')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Monthly Package */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#281810]/5 flex flex-col hover:shadow-xl transition-shadow duration-300">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-[#281810] mb-2">{t('sub.monthly.title')}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#281810]">{t('sub.monthly.price')}</span>
                  <span className="text-[#281810]/50">{t('sub.monthly.period')}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  t('sub.feat.monograph'),
                  t('sub.feat.exclusive'),
                  t('sub.feat.community'),
                  t('sub.feat.updates')
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#281810]/80">
                    <div className="mt-1 bg-emerald-100 text-emerald-600 rounded-full p-0.5">
                      <Check size={14} />
                    </div>
                    <span className="text-sm font-medium">{feat}</span>
                  </li>
                ))}
              </ul>

              <Link to="/auth?mode=register">
                <Button variant="ghost" className="w-full py-6 rounded-2xl bg-[#281810] hover:bg-[#3d2a1e] text-white font-bold">
                  {t('sub.cta')}
                </Button>
              </Link>
            </div>

            {/* Yearly Package */}
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
                {[
                  t('sub.feat.monograph'),
                  t('sub.feat.exclusive'),
                  t('sub.feat.community'),
                  t('sub.feat.updates')
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/90">
                    <div className="mt-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm shadow-emerald-900/50">
                      <Check size={14} />
                    </div>
                    <span className="text-sm font-medium">{feat}</span>
                  </li>
                ))}
              </ul>

              <Link to="/auth?mode=register">
                <Button variant="ghost" className="w-full py-6 rounded-2xl bg-white text-[#281810] hover:bg-white/90 font-bold">
                  {t('sub.cta')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Demo */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-800">{t('section.faq')}</h2>
          <div className="space-y-4">
             {[
               { q: 'faq.q1', a: 'faq.a1' },
               { q: 'faq.q2', a: 'faq.a2' },
               { q: 'faq.q3', a: 'faq.a3' },
               { q: 'faq.q6', a: 'faq.a6' },
               { q: 'faq.q7', a: 'faq.a7' }
             ].map((faq, idx) => (
               <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                 <h3 className="font-bold text-slate-800 mb-2">{t(faq.q as any)}</h3>
                 <p className="text-slate-600">{t(faq.a as any)}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Newsletter Popup */}
      <AnimatePresence>
        {showNewsletter && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeNewsletter}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              {/* Botanical Design Accent */}
              <div className="absolute -top-24 -right-24 w-64 h-64 opacity-10 pointer-events-none">
                <VineGraphic className="w-full h-full text-emerald-900" />
              </div>
              
              <div className="p-8 md:p-12">
                {!isSubscribed ? (
                  <>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Mail size={32} />
                      </div>
                      <button 
                        onClick={closeNewsletter} 
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <h2 className="text-3xl font-bold text-slate-800 mb-4 leading-tight">
                      {t('newsletter.title')}
                    </h2>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                      {t('newsletter.sub')}
                    </p>

                    <form onSubmit={handleSubscribe} className="space-y-4">
                      <div className="relative">
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t('newsletter.email_placeholder')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-slate-800"
                        />
                      </div>
                      <Button className="w-full py-4 text-lg rounded-2xl justify-center shadow-lg shadow-emerald-900/10">
                        {t('newsletter.subscribe')}
                      </Button>
                    </form>

                    <button 
                      onClick={closeNewsletter}
                      className="mt-6 w-full text-slate-400 hover:text-slate-600 transition-colors font-bold uppercase tracking-wider text-[10px] text-center"
                    >
                      {t('newsletter.no_thanks')}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6"
                    >
                      <Check size={40} />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-4">
                      {t('newsletter.success')}
                    </h2>
                    <p className="text-slate-600">
                      {t('newsletter.sub')}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Bottom accent */}
              <div className="h-2 bg-emerald-600 w-full" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { Home as HomePage };
