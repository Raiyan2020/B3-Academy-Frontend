import React from 'react';
import { useParams, useNavigate } from '@/lib/routing/next-router-compat';
import { useAuth } from '@/features/auth/auth-provider';
import { Navigate } from '@/lib/routing/next-router-compat';
import { ArrowLeft, ArrowRight, Info, MapPin, Search, Sprout, FlaskConical, Leaf } from 'lucide-react';
import { useLanguage } from '../../../../LanguageContext';
import { MOCK_MONOGRAPHS } from './monograph-list';
import { motion } from 'motion/react';
import { FavoriteButton } from '@/features/account/components/favorite-button';

import { AccessDeniedState } from '@/features/access/components/access-denied-state';

export const MonographDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, dir } = useLanguage();
  const isAr = language === 'ar';
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (!user) {
    return (
      <div className="bg-[#fdf8f0] min-h-screen py-24 flex items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
          <AccessDeniedState variant="login_required" isAr={isAr} />
        </div>
      </div>
    );
  }

  if (!user.isSubscribed) {
    return (
      <div className="bg-[#fdf8f0] min-h-screen py-24 flex items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
          <AccessDeniedState variant="subscription_required" isAr={isAr} />
        </div>
      </div>
    );
  }

  const item = MOCK_MONOGRAPHS.find(m => m.id === id);

  if (!item) {
    return (
      <div className="bg-slate-50 min-h-screen py-12 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">{isAr ? 'الإدخال غير موجود' : 'Item not found'}</h2>
        <button onClick={() => navigate('/monograph')} className="text-emerald-600 hover:underline font-bold">
          {isAr ? 'العودة' : 'Go back'}
        </button>
      </div>
    );
  }

  const nameStr = isAr ? item.name.ar : item.name.en;
  const descriptionStr = isAr ? item.description.ar : item.description.en;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate('/monograph')}
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors font-bold"
          >
            <BackIcon size={20} />
            <span>{isAr ? 'العودة إلى الموسوعة' : 'Back to Monograph'}</span>
          </button>
          <FavoriteButton 
            favorite={{ 
              itemId: item.id, 
              kind: 'encyclopedia', 
              title: nameStr, 
              href: `/monograph/${item.id}`, 
              isAvailable: true 
            }} 
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 p-2.5 text-slate-700 transition-all shadow-sm"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="h-64 sm:h-80 w-full relative">
            <img 
              src={item.imageUrl} 
              alt={nameStr}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
              <div>
                <span className={`inline-block px-3 py-1 mb-3 rounded-full text-xs font-bold uppercase tracking-widest ${
                  item.type === 'Fungi' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {item.type}
                </span>
                <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">{nameStr}</h1>
              </div>
            </div>
          </div>

            <div className="p-8 sm:p-12 space-y-12">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Info size={20} className="text-emerald-600" />
                {isAr ? 'الوصف' : 'Description'}
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg italic">
                {descriptionStr}
              </p>
            </div>

            {/* Family */}
            {item.family && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 inline-block">
                <span className="text-xs text-slate-400 uppercase font-black tracking-widest block mb-1">
                  {isAr ? 'العائلة' : 'Family'}
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {isAr ? item.family.ar : item.family.en}
                </span>
              </div>
            )}

            {/* Properties */}
            {item.properties && (
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Sprout size={20} className="text-emerald-600" />
                  {isAr ? 'الخصائص والوصف' : 'Properties & Botany'}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {isAr ? item.properties.ar : item.properties.en}
                </p>
              </div>
            )}

            {/* Benefits */}
            {item.benefits && (
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Leaf size={20} className="text-emerald-600" />
                  {isAr ? 'الفوائد والاستخدامات الطبية' : 'Benefits & Medical Uses'}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {isAr ? item.benefits.ar : item.benefits.en}
                </p>
              </div>
            )}

            {/* Warnings */}
            {item.warnings && (
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-950">
                <h4 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-red-800">
                  <Info size={16} />
                  {isAr ? 'تحذيرات وموانع الاستعمال' : 'Warnings & Contraindications'}
                </h4>
                <p className="text-sm leading-relaxed">
                  {isAr ? item.warnings.ar : item.warnings.en}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Origin */}
              {item.origin && (
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                    <MapPin size={12} />
                    {isAr ? 'المنشأ / الموطن الأصلي' : 'Origin & Habitat'}
                  </h4>
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                    {isAr ? item.origin.ar : item.origin.en}
                  </p>
                </div>
              )}

              {/* Spread */}
              {item.spread && (
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                    <Search size={12} />
                    {isAr ? 'الانتشار والبيئة' : 'Spread & Ecology'}
                  </h4>
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                    {isAr ? item.spread.ar : item.spread.en}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <FlaskConical size={20} className="text-emerald-400" />
                {isAr ? 'التصنيفات والتعريفات' : 'Classifications & Taxonomy'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {item.classifications.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 transition-colors border border-white/10 rounded-lg text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
};
