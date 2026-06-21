import React from 'react';
import { useParams, Link, useNavigate } from '@/lib/routing/next-router-compat';
import { useLanguage } from '../../../../LanguageContext';
import { EncyclopediaEntry } from '../../../../types';
import { ArrowLeft, ArrowRight, Leaf, Shield, Heart, Share2, Info } from 'lucide-react';
import { Button } from '../../../../components/UI';
import { motion } from 'motion/react';
import { getEncyclopediaEntries, getEntryById } from '@/features/library/services/encyclopedia.service';

export const EncyclopediaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, dir, t } = useLanguage();
  const isAr = language === 'ar';
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const entry = getEntryById(id);

  if (!entry) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">{isAr ? 'الإدخال غير موجود' : 'Entry not found'}</h2>
        <Link to="/encyclopedia" className="text-emerald-600 hover:underline">
          {isAr ? 'العودة إلى الموسوعة' : 'Return to Encyclopedia'}
        </Link>
      </div>
    );
  }

  const nameStr = entry.name[language as keyof typeof entry.name] || entry.name.en;
  const descriptionStr = entry.description[language as keyof typeof entry.description] || entry.description.en;
  const contentStr = entry.fullContent[language as keyof typeof entry.fullContent] || entry.fullContent.en;

  return (
    <div className="bg-[#fdf8f0] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate('/encyclopedia')}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors mb-8 font-bold"
        >
          <BackIcon size={20} />
          <span>{isAr ? 'العودة للموسوعة' : 'Back to Encyclopedia'}</span>
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] shadow-xl shadow-emerald-900/5 overflow-hidden border border-[#281810]/5"
        >
          <div className="relative aspect-[21/9] overflow-hidden">
            <img 
              src={entry.image} 
              alt={nameStr}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8 md:p-12">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white mb-4 border border-white/20">
                  <Leaf size={12} />
                  {entry.category}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
                  {nameStr}
                </h1>
                <p className="text-xl text-white/80 italic font-serif">
                  {entry.scientificName}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="md:col-span-2 prose prose-emerald prose-lg max-w-none">
                <p className="text-xl text-[#281810] font-bold mb-6 leading-relaxed">
                  {descriptionStr}
                </p>
                <div className="space-y-6 text-[#483820] leading-[1.8]">
                  {contentStr.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#f0f9f4] p-6 rounded-[2rem] border border-emerald-100">
                  <h3 className="text-sm font-black uppercase tracking-widest text-emerald-900 mb-4 flex items-center gap-2">
                    <Shield size={16} />
                    {isAr ? 'الخصائص' : 'Properties'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Additional Info Widgets */}
                <div className="grid grid-cols-1 gap-4">
                  {entry.family && (
                    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        {isAr ? 'الفصيلة' : 'Family'}
                      </h4>
                      <p className="text-sm font-bold text-[#281810]">
                        {entry.family[language as keyof typeof entry.family] || entry.family.en}
                      </p>
                    </div>
                  )}
                  {entry.originCountry && (
                    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        {isAr ? 'بلد المنشأ' : 'Origin Country'}
                      </h4>
                      <p className="text-sm font-bold text-[#281810]">
                        {entry.originCountry[language as keyof typeof entry.originCountry] || entry.originCountry.en}
                      </p>
                    </div>
                  )}
                  {entry.sex && (
                    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        {isAr ? 'الجنس' : 'Sex'}
                      </h4>
                      <p className="text-sm font-bold text-[#281810]">
                        {entry.sex[language as keyof typeof entry.sex] || entry.sex.en}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                  <h3 className="text-sm font-black uppercase tracking-widest text-amber-900 mb-4 flex items-center gap-2">
                    <Info size={16} />
                    {isAr ? 'تنبيه طبي' : 'Medical Notice'}
                  </h3>
                  <p className="text-xs text-amber-800/80 leading-relaxed italic">
                    {isAr 
                      ? 'هذه المعلومات للأغراض التعليمية فقط. استشر الطبيب قبل استخدام أي علاجات طبيعية.'
                      : 'This information is for educational purposes only. Consult a doctor before using any natural remedies.'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 justify-center rounded-2xl py-4 shadow-emerald-900/10">
                    <Share2 size={18} className={isAr ? 'ml-2' : 'mr-2'} />
                    {isAr ? 'مشاركة' : 'Share'}
                  </Button>
                  <button className="aspect-square bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl text-slate-400 hover:text-red-500 transition-colors border border-slate-100">
                    <Heart size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-12 border-t border-slate-100">
               <h3 className="text-2xl font-bold text-[#281810] mb-8">
                 {isAr ? 'مقالات ذات صلة' : 'Related Articles'}
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {getEncyclopediaEntries().filter(e => e.id !== entry.id).slice(0, 2).map(item => (
                   <Link key={item.id} to={`/encyclopedia/${item.id}`} className="group flex gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-500">
                     <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                       <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                     </div>
                     <div className="flex flex-col justify-center">
                       <h4 className="font-bold text-[#281810] group-hover:text-emerald-700 transition-colors">
                         {item.name[language as keyof typeof item.name] || item.name.en}
                       </h4>
                       <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
                         {item.category}
                       </p>
                     </div>
                   </Link>
                 ))}
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
