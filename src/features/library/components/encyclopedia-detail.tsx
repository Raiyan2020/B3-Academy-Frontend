'use client';

import React from 'react';
import { useParams, Link, useNavigate } from '@/lib/routing/next-router-compat';
import { useLanguage } from '../../../../LanguageContext';
import { ArrowLeft, ArrowRight, Leaf, Shield, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { getEntryById, getEncyclopediaEntries } from '@/features/library/services/encyclopedia.service';
import { ShareButton } from '@/components/actions/share-button';
import { FavoriteButton } from '@/features/account/components/favorite-button';
import type { EncyclopediaHerbItem } from '@/features/library/types/encyclopedia.types';
import { useApiEncyclopediaDetail } from '../hooks/use-encyclopedia-api';

export const EncyclopediaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const isAr = language === 'ar';
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const apiEntry = useApiEncyclopediaDetail(id);
  const entry = apiEntry.data ?? getEntryById(id);
  const inactiveEntry = apiEntry.data ?? getEntryById(id, { includeInactive: true });

  if (!inactiveEntry) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">{isAr ? 'الإدخال غير موجود' : 'Entry not found'}</h2>
        <Link to="/encyclopedia" className="text-emerald-600 hover:underline">
          {isAr ? 'العودة إلى الموسوعة' : 'Return to Encyclopedia'}
        </Link>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">{isAr ? 'الإدخال غير متاح' : 'Entry unavailable'}</h2>
        <p className="mb-6 text-slate-600">{isAr ? 'هذا العنصر غير نشط حالياً.' : 'This item is currently inactive.'}</p>
        <Link to="/encyclopedia" className="text-emerald-600 hover:underline">
          {isAr ? 'العودة إلى الموسوعة' : 'Return to Encyclopedia'}
        </Link>
      </div>
    );
  }

  const titleStr = entry.title[language as keyof typeof entry.title] || entry.title.en;
  const summaryStr = entry.summary[language as keyof typeof entry.summary] || entry.summary.en;
  const contentStr = entry.fullContent[language as keyof typeof entry.fullContent] || entry.fullContent.en;
  const publishedLabel = new Date(entry.publishedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const related = getEncyclopediaEntries().filter((item) => item.id !== entry.id).slice(0, 2);
  const herb = entry.kind === 'herb' ? (entry as EncyclopediaHerbItem) : null;

  return (
    <div className="min-h-screen bg-[#fdf8f0] py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/encyclopedia')}
          className="mb-8 flex items-center gap-2 font-bold text-slate-500 transition-colors hover:text-emerald-700"
        >
          <BackIcon size={20} />
          <span>{isAr ? 'العودة للموسوعة' : 'Back to Encyclopedia'}</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[3rem] border border-[#281810]/5 bg-white shadow-xl shadow-emerald-900/5"
        >
          <div className="relative aspect-[21/9] overflow-hidden">
            <img src={entry.image} alt={titleStr} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-8 md:p-12">
              <div>
                <div className="mb-4 inline-flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                    <Leaf size={12} />
                    {entry.kind === 'news' ? entry.category[language as 'en' | 'ar'] || entry.category.en : herb?.category}
                  </span>
                  {herb && (
                    <span className="rounded-full border border-white/20 bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                      {herb.herbType[language as 'en' | 'ar'] || herb.herbType.en}
                    </span>
                  )}
                </div>
                <h1 className="mb-2 text-4xl font-bold leading-tight text-white md:text-5xl">{titleStr}</h1>
                {herb && <p className="font-serif text-xl italic text-white/80">{herb.scientificName}</p>}
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="prose prose-emerald prose-lg max-w-none md:col-span-2">
                <p className="mb-6 text-xl font-bold leading-relaxed text-[#281810]">{summaryStr}</p>
                <div className="space-y-6 leading-[1.8] text-[#483820]">
                  {contentStr.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {herb && (
                  <>
                    <div className="rounded-[2rem] border border-emerald-100 bg-[#f0f9f4] p-6">
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-900">
                        <Shield size={16} />
                        {isAr ? 'الخصائص' : 'Properties'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {herb.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {herb.family && (
                        <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                          <h4 className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {isAr ? 'الفصيلة' : 'Family'}
                          </h4>
                          <p className="text-sm font-bold text-[#281810]">
                            {herb.family[language as keyof typeof herb.family] || herb.family.en}
                          </p>
                        </div>
                      )}
                      {herb.originCountry && (
                        <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                          <h4 className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {isAr ? 'بلد المنشأ' : 'Origin Country'}
                          </h4>
                          <p className="text-sm font-bold text-[#281810]">
                            {herb.originCountry[language as keyof typeof herb.originCountry] || herb.originCountry.en}
                          </p>
                        </div>
                      )}
                      {herb.sex && (
                        <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                          <h4 className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {isAr ? 'الجنس' : 'Sex'}
                          </h4>
                          <p className="text-sm font-bold text-[#281810]">
                            {herb.sex[language as keyof typeof herb.sex] || herb.sex.en}
                          </p>
                        </div>
                      )}
                      <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                        <h4 className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {isAr ? 'النوع' : 'Type'}
                        </h4>
                        <p className="text-sm font-bold text-[#281810]">
                          {herb.herbType[language as keyof typeof herb.herbType] || herb.herbType.en}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {entry.kind === 'news' && (
                  <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                    <h4 className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {isAr ? 'الفئة' : 'Category'}
                    </h4>
                    <p className="text-sm font-bold text-[#281810]">
                      {entry.category[language as keyof typeof entry.category] || entry.category.en}
                    </p>
                    <h4 className="mb-1 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {isAr ? 'تاريخ النشر' : 'Published'}
                    </h4>
                    <p className="text-sm font-bold text-[#281810]">{publishedLabel}</p>
                  </div>
                )}

                <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-900">
                    <Info size={16} />
                    {isAr ? 'تنبيه طبي' : 'Medical Notice'}
                  </h3>
                  <p className="text-xs italic leading-relaxed text-amber-800/80">
                    {isAr
                      ? 'هذه المعلومات للأغراض التعليمية فقط. استشر الطبيب قبل استخدام أي علاجات طبيعية.'
                      : 'This information is for educational purposes only. Consult a doctor before using any natural remedies.'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <ShareButton title={titleStr} />
                  <FavoriteButton
                    favorite={{
                      itemId: entry.id,
                      kind: 'encyclopedia',
                      title: titleStr,
                      href: `/encyclopedia/${entry.id}`,
                      isAvailable: true,
                    }}
                    className="aspect-square rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
                  />
                </div>
              </div>
            </div>

            {related.length > 0 && (
              <div className="mt-12 border-t border-slate-100 pt-12">
                <h3 className="mb-8 text-2xl font-bold text-[#281810]">{isAr ? 'مقالات ذات صلة' : 'Related Articles'}</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      to={`/encyclopedia/${item.id}`}
                      className="group flex gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 transition-all duration-500 hover:bg-white hover:shadow-xl"
                    >
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
                        <img src={item.image} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h4 className="font-bold text-[#281810] transition-colors group-hover:text-emerald-700">
                          {item.title[language as keyof typeof item.title] || item.title.en}
                        </h4>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                          {item.kind === 'news' ? item.category.en : item.kind === 'herb' ? item.category : ''}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
