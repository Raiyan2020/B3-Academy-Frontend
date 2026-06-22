import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from '@/lib/routing/next-router-compat';
import { Menu, X, User, LogOut, Globe, Home, Video, BookOpen, Calendar, LayoutDashboard, ChevronDown, Instagram, Youtube, Linkedin, Lock, Activity } from 'lucide-react';
import { useAuth } from '../src/features/auth/auth-provider';
import { useLanguage } from '../LanguageContext';
import { VineGraphic, MushroomGraphic } from './Graphics';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const { user, logout } = useAuth();
  const { t, setLanguage, language, dir } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'en', name: 'English', short: 'EN' },
    { code: 'ar', name: 'العربية', short: 'AR' },
    { code: 'fr', name: 'Français', short: 'FR' },
    { code: 'es', name: 'Español', short: 'ES' },
  ] as const;

  const currentLang = languages.find(l => l.code === language) || languages[0];

  const hasAccess = user && user.isSubscribed;

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    {
      name: t('nav.edu_learning'),
      isDropdown: true,
      items: [
        { name: t('nav.courses'), path: '/courses' },
        { name: t('nav.books'), path: '/books' },
        { name: t('nav.encyclopedia'), path: '/encyclopedia' },
      ]
    },
    {
      name: t('nav.services_care'),
      isDropdown: true,
      items: [
        { name: t('nav.clinic'), path: '/clinic' },
        { name: t('nav.consultations'), path: '/consultations' },
        { name: t('nav.trips'), path: '/trips' },
      ]
    },
    { 
      name: t('nav.community'), 
      isDropdown: true,
      items: [
        { name: t('nav.community_chat'), path: '/community/chat', requiresSubscription: true, hasNew: true },
        { name: t('podcast.title'), path: '/podcasts' },
        { name: t('nav.podcast_request'), path: '/community/cooperation' },
        { name: t('nav.blogs'), path: '/community/blogs' },
        { name: t('nav.theories'), path: '/community/theories' },
        { name: t('nav.researches'), path: '/community/researches', requiresSubscription: true },
        { name: t('nav.monograph'), path: '/monograph', requiresSubscription: true },
        { name: t('nav.about'), path: '/about' },
      ]
    }
  ];

  // Mobile Bottom Bar Items
  const mobileTabItems = [
    { name: t('nav.home'), path: '/', icon: Home },
    { name: t('nav.courses'), path: '/courses', icon: Video },
    { name: t('nav.books'), path: '/books', icon: BookOpen },
    { name: t('nav.consultations'), path: '/consultations', icon: Calendar },
    { name: t('nav.dashboard'), path: '/dashboard', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans" dir={dir}>
      {/* Announcement Bar */}
      <div className="bg-[#281810] text-emerald-50 py-2.5 px-4 text-center text-sm font-medium border-b border-[#281810]/20">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="inline-flex items-center justify-center bg-emerald-500 text-white p-1 rounded-full text-[10px] animate-pulse">
            <Activity size={12} />
          </span>
          <p>
            {t('announcement.text')}
            <span className="font-bold underline cursor-pointer text-yellow-400 hover:text-yellow-300 transition-colors">{t('announcement.cta')}</span>
          </p>
        </div>
      </div>

      {/* Navigation (Desktop & Mobile Header) */}
      <nav className="sticky top-0 z-50 bg-[#d8c0a8eb] backdrop-blur-md border-b border-[#281810]/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-3">
              <img 
                src="https://raiyansoft.com/wp-content/uploads/2026/04/logo1.png" 
                alt="B3 Academy" 
                className="h-14 w-auto"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-[#281810] hidden sm:block leading-none uppercase">
                  B3 Academy
                </span>
                <div className="text-[8px] md:text-[10px] font-normal tracking-[0.3em] text-[#281810] uppercase hidden sm:flex flex-col mt-1 opacity-90 leading-tight">
                  <span>Academy of Natural</span>
                  <span>Philosophy & Psychedelics</span>
                </div>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
              {navLinks.map((link) => (
                link.isDropdown ? (
                  <div key={link.name} className="relative group">
                    <button className="flex items-center gap-1 text-sm font-medium text-[#483820] hover:text-emerald-600 transition-colors duration-200 py-2">
                      {link.name}
                      <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
                    </button>
                    <div className="absolute top-full mt-0 w-56 bg-white border border-slate-100 rounded-xl shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 ltr:left-0 rtl:right-0">
                      {link.items?.map((subItem, idx) => {
                        const isRestricted = subItem.requiresSubscription && !hasAccess;
                        return (
                          <Link
                            key={`${subItem.path}-${idx}`}
                            to={isRestricted ? '#' : subItem.path}
                            onClick={(e) => {
                              if (isRestricted) {
                                e.preventDefault();
                                setShowSubscribeModal(true);
                              }
                            }}
                            className={`block px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                              isActive(subItem.path)
                                ? 'bg-emerald-50 text-emerald-700 font-medium'
                                : 'text-[#483820] hover:bg-slate-50 hover:text-emerald-600'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {subItem.name}
                              {(subItem as any).hasNew && (
                                <span className="w-2 h-2 bg-yellow-400 rounded-full shadow-sm animate-pulse" />
                              )}
                            </span>
                            {isRestricted && <Lock size={14} className="text-[#483820] opacity-70" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.name}
                    to={link.path!}
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isActive(link.path!)
                        ? 'text-emerald-700 font-bold'
                        : 'text-[#483820] hover:text-emerald-600'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4 rtl:space-x-reverse">
              <div className="relative" ref={langMenuRef}>
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="flex items-center gap-1 text-[#483820] hover:text-emerald-600 px-3 py-1.5 rounded-full border border-[#483820]/20 hover:border-emerald-200 transition"
                >
                  <Globe size={16} />
                  <span className="text-xs font-bold uppercase">{currentLang.name}</span>
                  <ChevronDown size={14} className={`transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isLangMenuOpen && (
                  <div className="absolute top-full mt-2 w-32 bg-white border border-slate-100 rounded-xl shadow-lg py-2 z-50 ltr:right-0 rtl:left-0">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full text-start px-4 py-2 text-sm transition-colors ${
                          language === lang.code 
                            ? 'bg-emerald-50 text-emerald-700 font-medium' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {user ? (
                <div className="flex items-center gap-4">
                  <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-[#483820] hover:text-emerald-600 transition">
                    <User size={18} />
                    <span>{t('nav.dashboard')}</span>
                  </Link>
                  <button 
                    onClick={logout}
                    className="p-2 rounded-full hover:bg-[#281810]/10 text-[#483820] hover:text-red-500 transition"
                    title={t('nav.logout')}
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
                >
                  {t('nav.login')}
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-[#281810]/10 text-[#483820] text-xs font-bold rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.short}</option>
                ))}
              </select>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-[#483820] hover:text-emerald-600 p-2"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Add this inside the original button's location if we need, but we'll remove the dropdown code below it. wait, replacing the whole mobile menu dropdown logic */}
      </nav>

      {/* Mobile Sidebar (Drawer) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[200]">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar Content */}
          <div className={`absolute top-0 bottom-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} w-4/5 max-w-sm bg-[#fdf8f0] shadow-2xl flex flex-col`}>
             <div className="flex items-center justify-between px-4 py-4 border-b border-[#281810]/10 bg-[#d8c0a8eb]">
               <div className="flex items-center gap-3">
                 <img 
                    src="https://raiyansoft.com/wp-content/uploads/2026/04/logo1.png" 
                    alt="B3 Academy" 
                    className="h-8 w-8 object-cover rounded-full"
                  />
                  <span className="font-bold text-xl tracking-tight text-[#281810] font-serif">B3 Academy</span>
               </div>
               <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[#483820] bg-white/50 rounded-full hover:bg-white transition-colors">
                 <X size={20} />
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
              {navLinks.map((link) => (
                link.isDropdown ? (
                  <div key={link.name} className="space-y-1">
                    <div className="px-3 py-2 text-base font-bold text-[#281810] border-b border-[#281810]/5">
                      {link.name}
                    </div>
                    <div className="pl-6 rtl:pl-0 rtl:pr-6 space-y-1 mt-2">
                      {link.items?.map((subItem, idx) => {
                        const isRestricted = subItem.requiresSubscription && !hasAccess;
                        return (
                          <Link
                            key={`mobile-${subItem.path}-${idx}`}
                            to={isRestricted ? '#' : subItem.path}
                            onClick={(e) => {
                              if (isRestricted) {
                                e.preventDefault();
                                setIsMobileMenuOpen(false);
                                setShowSubscribeModal(true);
                              } else {
                                setIsMobileMenuOpen(false);
                              }
                            }}
                            className={`block px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                              isActive(subItem.path)
                                ? 'bg-emerald-700/10 text-emerald-800'
                                : 'text-[#483820] hover:bg-white hover:shadow-sm transition-all'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {subItem.name}
                              {(subItem as any).hasNew && (
                                <span className="w-2 h-2 bg-yellow-400 rounded-full shadow-sm animate-pulse" />
                              )}
                            </span>
                            {isRestricted && <Lock size={14} className="text-[#483820] opacity-70" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.name}
                    to={link.path!}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-3 rounded-lg text-base font-bold ${
                      isActive(link.path!)
                        ? 'bg-emerald-700/10 text-emerald-800'
                        : 'text-[#483820] hover:bg-white hover:shadow-sm transition-all'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              ))}
              </div>
              
              <div className="p-4 border-t border-[#281810]/10 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
              {user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                       {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-slate-800 line-clamp-1">{user.name}</span>
                       <span className="text-xs text-slate-500 line-clamp-1">{user.email}</span>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-3 text-center rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                     {t('nav.dashboard')}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-center px-3 py-3 rounded-xl text-sm font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 rounded-xl text-base font-bold bg-emerald-600 text-white shadow-md shadow-emerald-900/20 active:scale-95 transition-all"
                >
                   {t('nav.login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[100] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 safe-area-pb">
          {mobileTabItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform duration-200 ${
                isActive(item.path) ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon size={24} strokeWidth={isActive(item.path) ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[70px]">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#281810] text-[#ede3ce]/80 md:block hidden relative overflow-hidden">
        <div className="absolute bottom-0 right-0 opacity-5 pointer-events-none">
          <VineGraphic className="w-96 h-96 text-[#ede3ce] transform translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="absolute bottom-0 left-10 opacity-5 pointer-events-none">
          <MushroomGraphic className="w-48 h-48 text-[#ede3ce] transform translate-y-1/4" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                 <img 
                  src="https://raiyansoft.com/wp-content/uploads/2026/04/logo1.png" 
                  alt="B3 Academy" 
                  className="h-16 w-auto"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xl font-bold text-white">B3 Academy</span>
              </div>
              <p className="text-sm leading-relaxed text-[#ede3ce]/60">
                {t('hero.subtitle')}
              </p>
              <div className="flex gap-4 mt-4">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[#ede3ce]/40 hover:text-emerald-400 transition">
                  <Instagram size={20} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-[#ede3ce]/40 hover:text-emerald-400 transition">
                  <Youtube size={20} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-[#ede3ce]/40 hover:text-emerald-400 transition">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">{t('footer.learn')}</h3>
              <ul className="space-y-2 text-sm text-[#ede3ce]/60">
                <li><Link to="/courses" className="hover:text-emerald-400 transition">{t('nav.courses')}</Link></li>
                <li><Link to="/books" className="hover:text-emerald-400 transition">{t('nav.books')}</Link></li>
                <li><Link to="/encyclopedia" className="hover:text-emerald-400 transition">{t('nav.encyclopedia')}</Link></li>
                <li><Link to="/monograph" className="hover:text-emerald-400 transition">{t('nav.monograph')}</Link></li>
                <li><Link to="/clinic" className="hover:text-emerald-400 transition">{t('nav.clinic')}</Link></li>
                <li><Link to="/consultations" className="hover:text-emerald-400 transition">{t('nav.consultations')}</Link></li>
                <li><Link to="/trips" className="hover:text-emerald-400 transition">{t('nav.trips')}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">{t('nav.community')}</h3>
              <ul className="space-y-2 text-sm text-[#ede3ce]/60">
                <li><Link to="/community/chat" className="hover:text-emerald-400 transition">{t('nav.community_chat')}</Link></li>
                <li><Link to="/podcasts" className="hover:text-emerald-400 transition">{t('podcast.title')}</Link></li>
                <li><Link to="/community/blogs" className="hover:text-emerald-400 transition">{t('nav.blogs')}</Link></li>
                <li><Link to="/community/theories" className="hover:text-emerald-400 transition">{t('nav.theories')}</Link></li>
                <li><Link to="/community/researches" className="hover:text-emerald-400 transition">{t('nav.researches')}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">{t('footer.support')}</h3>
              <ul className="space-y-2 text-sm text-[#ede3ce]/60">
                <li><Link to="/about" className="hover:text-emerald-400 transition">{t('nav.about')}</Link></li>
                <li><Link to="/contact" className="hover:text-emerald-400 transition">{t('nav.contact')}</Link></li>
                <li><Link to="/faq" className="hover:text-emerald-400 transition">{t('footer.faq')}</Link></li>
                <li><Link to="/privacy" className="hover:text-emerald-400 transition">{t('footer.privacy')}</Link></li>
                <li><Link to="/rate-us" className="hover:text-emerald-400 transition">{language === 'ar' ? 'قيمنا' : language === 'fr' ? 'Évaluez-nous' : language === 'es' ? 'Valóranos' : 'Rate Us'}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">{t('footer.newsletter')}</h3>
              <p className="text-sm text-[#ede3ce]/60 mb-4">{t('footer.newsletter.desc')}</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-[#281810] text-white px-4 py-2 rounded-s-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full border border-[#ede3ce]/20"
                />
                <button className="bg-emerald-600 text-white px-4 py-2 rounded-e-lg hover:bg-emerald-700 transition">
                  {t('btn.join_newsletter')}
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-[#ede3ce]/10 mt-12 pt-8 text-center text-xs text-[#ede3ce]/40">
            <p className="mb-2">&copy; {new Date().getFullYear()} B3 Academy. {t('footer.rights')} {t('footer.disclaimer')}</p>
          </div>
        </div>
      </footer>
      
      {/* Mobile Footer Simplified (optional, showing copyright in main flow but adjusted) */}
      <footer className="bg-[#281810] text-[#ede3ce]/40 md:hidden pb-safe">
         <div className="px-4 py-8 text-center text-xs">
            <p className="mb-2">&copy; {new Date().getFullYear()} B3 Academy.</p>
         </div>
      </footer>

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSubscribeModal(false)}
          />
          <div className="relative bg-[#fdf8f0] w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowSubscribeModal(false)}
              className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 text-slate-400 hover:text-slate-600 bg-white/50 rounded-full hover:bg-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center text-center mt-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-bold text-[#281810] mb-2 font-serif">
                {language === 'ar' ? 'محتوى حصري للمشتركين' : 'Subscriber Exclusive Content'}
              </h3>
              <p className="text-slate-600 mb-8 max-w-[280px]">
                {language === 'ar' 
                  ? 'اشترك الآن في أكاديمية B3 للوصول المفتوح إلى هذا المحتوى ومحتويات حصرية أخرى.' 
                  : 'Subscribe now to B3 Academy to get unlimited access to this and other exclusive content.'}
              </p>
              
              <Link
                to="/dashboard#subscription"
                onClick={() => setShowSubscribeModal(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-center"
              >
                {language === 'ar' ? 'اشترك الآن' : 'Subscribe Now'}
              </Link>
              <button 
                onClick={() => setShowSubscribeModal(false)}
                className="mt-4 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
              >
                {language === 'ar' ? 'لا شكراً' : 'No, thanks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};