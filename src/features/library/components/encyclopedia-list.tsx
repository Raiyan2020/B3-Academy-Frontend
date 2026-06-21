import React, { useState } from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { Search, ChevronDown } from 'lucide-react';
import { Link } from '@/lib/routing/next-router-compat';
import { getEncyclopediaEntries } from '@/features/library/services/encyclopedia.service';

export const Encyclopedia: React.FC = () => {
  const { language, t, localize } = useLanguage();
  const isAr = language === 'ar';
  
  const [searchQuery, setSearchQuery] = useState('');
  const entries = getEncyclopediaEntries();

  // Helper to get first few entries for various sections
  const latestNews = entries.slice(0, 3);
  const editorsPicks = entries.slice(0, 4);
  const herbLibrary = entries;

  return (
    <div className="bg-[#fbfcfa] min-h-screen font-sans text-slate-900" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Latest News Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-4xl font-bold text-[#4a634a] mb-8">
          {isAr ? 'آخر الأخبار في طب الأعشاب' : 'Latest news in herbal medicine'}
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feature */}
          <Link to={`/encyclopedia/${latestNews[0].id}`} className="lg:col-span-2 group relative overflow-hidden h-[500px] rounded-3xl shadow-lg">
            <img 
              src={latestNews[0].image} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent flex flex-col justify-end p-8">
              <h3 className="text-2xl font-bold text-white mb-2 leading-snug">
                {localize(latestNews[0].name)} literacy in herbalism: A clinical guide to privacy, pitfalls, and safety
              </h3>
              <p className="text-emerald-50 text-sm opacity-80 line-clamp-2 max-w-2xl">
                {localize(latestNews[0].description)}
              </p>
            </div>
          </Link>

          {/* Side Features */}
          <div className="flex flex-col gap-6">
            {latestNews.slice(1, 3).map((news, idx) => (
              <Link key={news.id} to={`/encyclopedia/${news.id}`} className="group relative overflow-hidden h-[238px] rounded-3xl shadow-md">
                <img src={news.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent flex flex-col justify-end p-6">
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {idx === 0 ? 'Making sense of herbal dosing: How much is enough?' : 'Nurturing the gut microbiome: Nutritional and herbal approaches'}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Editor's Pick Section */}
      <section className="bg-[#ede3ce]/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-[#4a634a] mb-10">
            {isAr ? 'اختيارات المحرر' : "Editor's pick"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {editorsPicks.map((pick, idx) => (
              <Link key={pick.id} to={`/encyclopedia/${pick.id}`} className="group">
                <div className="aspect-[4/3] overflow-hidden mb-4 rounded-2xl shadow-sm bg-white">
                  <img src={pick.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#006254] mb-1">
                  {idx % 2 === 0 ? 'Sustainability' : 'Safety'}
                </p>
                <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2 group-hover:text-[#006254] transition-colors">
                  {localize(pick.name)}: {idx === 0 ? 'Updates from the field' : 'A 2026 update'}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 italic">
                  {localize(pick.description)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Herb Library Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-[#4a634a] mb-12">
            {isAr ? 'استكشف مكتبة الأعشاب لدينا' : 'Explore our herb library'}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Slider Content */}
            <div className="lg:col-span-3">
               <div className="flex gap-4 overflow-x-auto pb-6 snap-x no-scrollbar">
                  {herbLibrary.map((herb) => (
                    <Link key={herb.id} to={`/encyclopedia/${herb.id}`} className="relative flex-none w-72 h-[450px] snap-start group overflow-hidden rounded-3xl shadow-lg">
                      <img src={herb.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                      <div className="absolute inset-x-0 bottom-20 px-4 py-2 bg-[#006254]/80 text-center mx-4 rounded-xl backdrop-blur-sm">
                        <span className="text-white font-bold text-sm tracking-widest uppercase">
                          {localize(herb.name)}
                        </span>
                      </div>
                    </Link>
                  ))}
               </div>
            </div>

            {/* sidebar Search */}
            <div className="bg-[#006254] p-8 flex flex-col gap-6 text-white h-full justify-center rounded-3xl shadow-xl">
              <h4 className="text-xl font-bold mb-4 font-serif italic">
                {isAr ? 'اكتشف جميع أعشابنا' : 'Discover all our herbs'}
              </h4>
              
              <div className="space-y-4">
                 {[
                   'encyclopedia.search.type', 
                   'encyclopedia.search.family', 
                   'encyclopedia.search.sex', 
                   'encyclopedia.search.origin'
                 ].map((labelKey) => (
                   <div key={labelKey} className="relative group">
                      <button className="w-full text-start flex items-center justify-between py-4 px-6 bg-emerald-400/10 hover:bg-emerald-400/20 transition-all rounded-2xl border border-white/5">
                        <span className="text-sm font-medium">{t(labelKey as any)}</span>
                        <ChevronDown size={16} />
                      </button>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
};

export { Encyclopedia as EncyclopediaList };
