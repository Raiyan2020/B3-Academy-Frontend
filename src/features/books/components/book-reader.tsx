import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from '@/lib/routing/next-router-compat';
import { ArrowLeft, Moon, Sun, Smartphone, ShieldCheck, X, Lock } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { getBookById } from '@/features/books/services/books.service';
import { hasEbookAccess } from '@/features/books/services/book-purchase.service';

const CHAPTERS = [
  {
    title: {
      ar: 'الفصل الأول: مقدمة ومبادئ التغذية الحيوية',
      en: 'Chapter 1: Introduction and Principles of Bio-Nutrition',
    },
    pages: [
      {
        pageNum: 1,
        content: {
          ar: 'مرحبًا بك في الفصل الأول من هذا الدليل الشامل. في هذا القسم، سنستكشف الأسس العلمية للتغذية الحيوية وتأثيرها المباشر على مستويات الطاقة والنشاط الخلوي. إن فهم احتياجات جسمك على المستوى الجزيئي هو الخطوة الأولى نحو تحقيق التوازن الصحي المتكامل.',
          en: 'Welcome to Chapter 1 of this comprehensive guide. In this section, we explore the scientific foundations of bio-nutrition and its direct impact on cellular energy and activity levels. Understanding your body\'s needs at a molecular level is the first step toward achieving complete health balance.',
        }
      },
      {
        pageNum: 2,
        content: {
          ar: 'تعتمد التغذية الحيوية على فكرة أن كل خلية تحتاج إلى مغذيات دقيقة محددة لتعمل بكفاءة قصوى. من خلال اختيار الأطعمة الكاملة الغنية بالمركبات النشطة بيولوجيًا، فإننا ندعم العمليات الطبيعية لإزالة السموم الخلوية وتجديد الأنسجة.',
          en: 'Bio-nutrition is based on the idea that every cell needs specific micronutrients to function at peak efficiency. By selecting whole foods rich in biologically active compounds, we support the natural processes of cellular detoxification and tissue regeneration.',
        }
      }
    ]
  },
  {
    title: {
      ar: 'الفصل الثاني: تنظيم الميكروبيوم والأمعاء',
      en: 'Chapter 2: Microbiome and Gut Regulation',
    },
    pages: [
      {
        pageNum: 3,
        content: {
          ar: 'تعتبر الأمعاء الدماغ الثاني لجسم الإنسان. يلعب الميكروبيوم المعوي دورًا حاسمًا في تنظيم نظام المناعة، وتصنيع الفيتامينات، وإرسال الإشارات العصبية المؤثرة على الحالة المزاجية والتركيز الذهني.',
          en: 'The gut is often referred to as the second brain of the human body. The gut microbiome plays a crucial role in regulating the immune system, synthesizing vitamins, and sending neurotransmitter signals that influence mood and mental focus.',
        }
      },
      {
        pageNum: 4,
        content: {
          ar: 'لتحسين صحة الميكروبيوم المعوي، يجب التركيز على تناول الأطعمة المخمرة الغنية بالبروبيوتيك والألياف الغذائية القابلة للذوبان التي تمثل الغذاء الأساسي للبكتيريا الصديقة داخل الجهاز الهضمي.',
          en: 'To optimize gut microbiome health, focus on consuming fermented foods rich in probiotics and soluble dietary fibers, which serve as the primary nourishment for beneficial bacteria in the digestive tract.',
        }
      }
    ]
  },
  {
    title: {
      ar: 'الفصل الثالث: مضادات الأكسدة ومقاومة الشيخوخة',
      en: 'Chapter 3: Antioxidants and Anti-Aging',
    },
    pages: [
      {
        pageNum: 5,
        content: {
          ar: 'الشوارد الحرة هي جزيئات غير مستقرة تسبب الإجهاد التأكسدي وتلف الخلايا وتسرع من ظهور الشيخوخة. مضادات الأكسدة الطبيعية الموجودة في الفواكه الملونة والخضروات تعمل كدرع واقٍ يحمي الخلايا.',
          en: 'Free radicals are unstable molecules that cause oxidative stress, damage cells, and accelerate aging. Natural antioxidants found in colorful fruits and vegetables act as a protective shield defending your cells.',
        }
      }
    ]
  }
];

const PROGRESS_KEY = (userId: string, bookId: string) => `b3-book-progress-${userId}-${bookId}`;

export function getBookProgress(userId: string, bookId: string): number {
  if (typeof window === 'undefined') return 1;
  const val = localStorage.getItem(PROGRESS_KEY(userId, bookId));
  return val ? parseInt(val, 10) : 1;
}

export function saveBookProgress(userId: string, bookId: string, pageNum: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY(userId, bookId), pageNum.toString());
}

export const BookReader: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, language, localize } = useLanguage();
    const book = getBookById(id);

    const owned = user && book ? hasEbookAccess(user.id, book.id) : false;

    const [page, setPage] = useState(1);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showC2A, setShowC2A] = useState(true);
    const totalPages = CHAPTERS.reduce((acc, ch) => acc + ch.pages.length, 0);
    const containerRef = useRef<HTMLDivElement>(null);
    const initialScrollDone = useRef(false);

    useEffect(() => {
        if (user && book && owned) {
            const savedPage = getBookProgress(user.id, book.id);
            setPage(savedPage);
        }
    }, [user, book, owned]);

    useEffect(() => {
        if (owned && !initialScrollDone.current && containerRef.current) {
            const el = document.getElementById(`book-page-${page}`);
            if (el) {
                el.scrollIntoView({ behavior: 'auto' });
                initialScrollDone.current = true;
            }
        }
    }, [page, owned]);

    if (!book) {
        return <div className="p-20 text-center">Book not found.</div>;
    }

    if (!user || !owned) {
        return (
            <div className="fixed inset-0 bg-slate-950 flex flex-col justify-center items-center p-6 text-center z-50">
                <div className="w-full max-w-md bg-white rounded-2xl p-2 shadow-2xl">
                    <AccessDeniedState 
                        variant={!user ? 'login_required' : 'ownership_required'} 
                        isAr={language === 'ar'}
                        ctaHref={!user ? '/auth' : `/checkout/book/${book.id}/ebook`}
                        ctaLabel={!user ? undefined : (language === 'ar' ? 'شراء الكتاب الإلكتروني' : 'Purchase Ebook')}
                        description={!user ? undefined : (language === 'ar' 
                            ? 'أنت لا تملك النسخة الرقمية من هذا الكتاب. اشترِ صيغة الكتاب الإلكتروني أو الباقة لفتح وقراءة الكتاب فوراً.' 
                            : 'You do not own the digital format of this book. Purchase the Ebook or Bundle format to unlock and read online instantly.')}
                    />
                </div>
            </div>
        );
    }

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
        const currentPage = Math.max(1, Math.min(totalPages, Math.ceil(scrollPercentage * totalPages)));
        if (currentPage !== page) {
            setPage(currentPage);
            if (user && book) {
                saveBookProgress(user.id, book.id, currentPage);
            }
        }
    };

    const getChapterForPage = (pageNum: number) => {
        let count = 0;
        for (const ch of CHAPTERS) {
            count += ch.pages.length;
            if (pageNum <= count) return ch;
        }
        return CHAPTERS[0];
    };

    const currentChapter = getChapterForPage(page);

    return (
        <div className={`fixed inset-0 flex flex-col z-50 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
            {/* Header */}
            <div className={`border-b px-4 py-3 flex items-center justify-between shadow-sm z-10 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className={`font-bold truncate px-2 hidden sm:block ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{localize(book.title)}</h1>
                </div>
                
                {/* Chapter Select Dropdown */}
                <div className="relative">
                    <select 
                        value={page}
                        onChange={(e) => {
                            const newPage = parseInt(e.target.value);
                            setPage(newPage);
                            if (user && book) saveBookProgress(user.id, book.id, newPage);
                            const el = document.getElementById(`book-page-${newPage}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`text-xs sm:text-sm font-bold border rounded-lg px-2.5 py-1.5 outline-none cursor-pointer transition-all ${
                            isDarkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-750' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        {CHAPTERS.map((ch, idx) => {
                            const startPage = ch.pages[0].pageNum;
                            return (
                                <option key={idx} value={startPage}>
                                    {localize(ch.title)}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>
                    {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                </button>
            </div>

            {/* Content Container */}
            <div ref={containerRef} className="flex-1 overflow-y-auto pt-8 pb-32 px-4 md:px-8 lg:px-12" onScroll={handleScroll}>
                <div className="max-w-2xl mx-auto space-y-12">
                    {CHAPTERS.map((chapter, chapterIdx) => (
                        <div key={chapterIdx} className="space-y-12">
                            {chapter.pages.map((p) => (
                                <motion.div 
                                    id={`book-page-${p.pageNum}`}
                                    key={p.pageNum}
                                    data-page={p.pageNum}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className={`p-8 md:p-12 shadow-xl rounded-2xl leading-[1.8] font-serif text-lg min-h-[70vh] border transition-colors duration-300 ${
                                        isDarkMode 
                                        ? 'bg-slate-900 text-slate-350 border-slate-800' 
                                        : 'bg-white text-slate-800 border-slate-200'
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-10 border-b border-slate-100 dark:border-slate-800 pb-4">
                                        <span className="text-xs font-sans font-bold uppercase tracking-widest text-emerald-600">
                                            {localize(chapter.title)}
                                        </span>
                                        <span className="text-xs font-sans text-slate-400">Page {p.pageNum} / {totalPages}</span>
                                    </div>

                                    <div className="space-y-6">
                                        <p className="whitespace-pre-line text-justify leading-relaxed">
                                            {localize(p.content)}
                                        </p>
                                    </div>
                                    
                                    <div className="mt-12 text-center text-slate-300 dark:text-slate-700 select-none opacity-20">
                                        <Smartphone size={48} className="mx-auto" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Platform-only reading notice */}
            <AnimatePresence>
                {showC2A && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-24 left-0 right-0 mx-auto w-[92%] max-w-lg z-40"
                    >
                        <div className="bg-emerald-900 text-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl flex items-center justify-between gap-2.5 sm:gap-4 border border-emerald-450/30 backdrop-blur-md bg-opacity-95">
                            <div className="bg-emerald-800 p-2 sm:p-3 rounded-xl sm:rounded-2xl shrink-0">
                                <ShieldCheck size={18} className="text-emerald-400 sm:w-6 sm:h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] sm:text-xs font-bold leading-tight sm:leading-snug truncate sm:whitespace-normal">
                                    {language === 'ar'
                                        ? 'هذا الكتاب متاح للقراءة داخل المنصة فقط ولا يمكن تحميله أو تصديره.'
                                        : 'This book is available for in-platform reading only and cannot be downloaded or exported.'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <button 
                                    onClick={() => setShowC2A(false)}
                                    className="p-1 hover:bg-emerald-850 rounded-full transition-colors text-emerald-300"
                                >
                                    <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer / Control Bar */}
            <div className={`border-t py-4 px-6 flex items-center justify-between shadow-lg z-10 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                <button 
                    disabled={page === 1}
                    onClick={() => {
                        const newPage = page - 1;
                        setPage(newPage);
                        if (user && book) saveBookProgress(user.id, book.id, newPage);
                        const el = document.getElementById(`book-page-${newPage}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-4 py-2 border rounded-xl disabled:opacity-50 text-xs sm:text-sm font-bold transition-all ${
                        isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                >
                    {language === 'ar' ? 'السابق' : 'Previous'}
                </button>
                
                <span className="font-bold text-xs sm:text-sm">
                    Page {page} of {totalPages}
                </span>

                <button 
                    disabled={page === totalPages}
                    onClick={() => {
                        const newPage = page + 1;
                        setPage(newPage);
                        if (user && book) saveBookProgress(user.id, book.id, newPage);
                        const el = document.getElementById(`book-page-${newPage}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-4 py-2 border rounded-xl disabled:opacity-50 text-xs sm:text-sm font-bold transition-all ${
                        isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                >
                    {language === 'ar' ? 'التالي' : 'Next'}
                </button>
            </div>
        </div>
    );
};
