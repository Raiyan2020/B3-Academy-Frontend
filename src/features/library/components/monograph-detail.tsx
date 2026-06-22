'use client';

import React, { useState } from 'react';
import { useParams, useNavigate } from '@/lib/routing/next-router-compat';
import { useAuth } from '@/features/auth/auth-provider';
import { ArrowLeft, ArrowRight, Info, MapPin, Search, Sprout, FlaskConical, Leaf } from 'lucide-react';
import { useLanguage } from '../../../../LanguageContext';
import { motion } from 'motion/react';
import { FavoriteButton } from '@/features/account/components/favorite-button';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { ShareButton } from '@/components/actions/share-button';
import { canAccessMonograph, getMonographById } from '@/features/library/services/monograph.service';
import { isSubscriptionActive } from '@/features/subscriptions/services/subscription-access.service';

export const MonographDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, dir } = useLanguage();
  const isAr = language === 'ar';
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const [sharePrompt, setSharePrompt] = useState('');

  const item = getMonographById(id);
  const inactiveItem = getMonographById(id, { includeInactive: true });

  if (!inactiveItem) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 py-12">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">{isAr ? 'الإدخال غير موجود' : 'Item not found'}</h2>
        <button onClick={() => navigate('/monograph')} className="font-bold text-emerald-600 hover:underline">
          {isAr ? 'العودة' : 'Go back'}
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 py-12">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">{isAr ? 'الإدخال غير متاح' : 'Item unavailable'}</h2>
        <p className="mb-4 text-slate-600">{isAr ? 'هذا العنصر معطّل أو غير متاح حالياً.' : 'This entry is disabled or currently unavailable.'}</p>
        <button onClick={() => navigate('/monograph')} className="font-bold text-emerald-600 hover:underline">
          {isAr ? 'العودة' : 'Go back'}
        </button>
      </div>
    );
  }

  const subscriptionActive = isSubscriptionActive(user);
  const hasAccess = canAccessMonograph(Boolean(user), subscriptionActive, item.metadata);
  const displayName = isAr ? item.name.ar : item.name.en;
  const descriptionStr = isAr ? item.description.ar : item.description.en;

  const handleShareAttempt = () => {
    if (!hasAccess) {
      setSharePrompt(isAr ? 'يتطلب الاشتراك لمشاركة هذا المحتوى.' : 'A subscription is required to share this content.');
      navigate('/subscriptions');
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 py-24">
        <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
          <AccessDeniedState
            variant={!user ? 'login_required' : 'subscription_required'}
            isAr={isAr}
          />
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleShareAttempt}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              {isAr ? 'مشاركة (يتطلب اشتراك)' : 'Share (subscription required)'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/monograph')}
            className="flex items-center gap-2 font-bold text-slate-500 transition-colors hover:text-emerald-700"
          >
            <BackIcon size={20} />
            <span>{isAr ? 'العودة إلى الموسوعة' : 'Back to Monograph'}</span>
          </button>
          <div className="flex items-center gap-2">
            <ShareButton title={displayName} />
            <FavoriteButton
              favorite={{
                itemId: item.id,
                kind: 'encyclopedia',
                title: displayName,
                href: `/monograph/${item.id}`,
                isAvailable: item.metadata.status === 'active',
                requiresSubscription: true,
              }}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="relative h-64 w-full sm:h-80">
            <img src={item.imageUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="mb-3 inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-800">
                {isAr ? item.category.ar : item.category.en}
              </span>
              <h1 className="mb-1 text-3xl font-bold text-white sm:text-5xl">{displayName}</h1>
              <p className="text-lg text-white/90">{item.name.en}</p>
              <p className="text-sm italic text-white/80">{item.scientificName}</p>
            </div>
          </div>

          <div className="space-y-12 p-8 sm:p-12">
            <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 sm:grid-cols-3">
              <div>
                <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isAr ? 'الاسم العربي' : 'Arabic name'}
                </span>
                <span className="text-sm font-bold text-slate-800">{item.name.ar}</span>
              </div>
              <div>
                <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isAr ? 'الاسم الإنجليزي' : 'English name'}
                </span>
                <span className="text-sm font-bold text-slate-800">{item.name.en}</span>
              </div>
              <div>
                <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isAr ? 'الاسم العلمي' : 'Scientific name'}
                </span>
                <span className="text-sm font-bold italic text-slate-800">{item.scientificName}</span>
              </div>
            </div>

            <div>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
                <Info size={20} className="text-emerald-600" />
                {isAr ? 'الوصف' : 'Description'}
              </h2>
              <p className="text-lg italic leading-relaxed text-slate-600">{descriptionStr}</p>
            </div>

            {item.family && (
              <div className="inline-block rounded-xl border border-slate-150 bg-slate-50 p-4">
                <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">
                  {isAr ? 'العائلة' : 'Family'}
                </span>
                <span className="text-sm font-bold text-slate-800">{isAr ? item.family.ar : item.family.en}</span>
              </div>
            )}

            {item.properties && (
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                  <Sprout size={20} className="text-emerald-600" />
                  {isAr ? 'الخصائص والوصف' : 'Properties & Botany'}
                </h3>
                <p className="leading-relaxed text-slate-600">{isAr ? item.properties.ar : item.properties.en}</p>
              </div>
            )}

            {item.benefits && (
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                  <Leaf size={20} className="text-emerald-600" />
                  {isAr ? 'الفوائد والاستخدامات الطبية' : 'Benefits & Medical Uses'}
                </h3>
                <p className="leading-relaxed text-slate-600">{isAr ? item.benefits.ar : item.benefits.en}</p>
              </div>
            )}

            {item.warnings && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-800">
                  <Info size={16} />
                  {isAr ? 'تحذيرات وموانع الاستعمال' : 'Warnings & Contraindications'}
                </h4>
                <p className="text-sm leading-relaxed">{isAr ? item.warnings.ar : item.warnings.en}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {item.origin && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                  <h4 className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <MapPin size={12} />
                    {isAr ? 'المنشأ / الموطن الأصلي' : 'Origin & Habitat'}
                  </h4>
                  <p className="text-sm font-semibold leading-relaxed text-slate-700">{isAr ? item.origin.ar : item.origin.en}</p>
                </div>
              )}
              {item.spread && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                  <h4 className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Search size={12} />
                    {isAr ? 'الانتشار والبيئة' : 'Spread & Ecology'}
                  </h4>
                  <p className="text-sm font-semibold leading-relaxed text-slate-700">{isAr ? item.spread.ar : item.spread.en}</p>
                </div>
              )}
            </div>

            <div className="rounded-[2rem] bg-slate-900 p-8 text-white">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-bold">
                <FlaskConical size={20} className="text-emerald-400" />
                {isAr ? 'التصنيفات والتعريفات' : 'Classifications & Taxonomy'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {item.classifications.map((tag) => (
                  <span key={tag} className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
        {sharePrompt && <p className="mt-4 text-center text-sm text-amber-700">{sharePrompt}</p>}
      </div>
    </div>
  );
};
