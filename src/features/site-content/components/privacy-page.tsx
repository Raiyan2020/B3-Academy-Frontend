import React from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { Shield } from 'lucide-react';
import { BerryBranchGraphic } from '../../../../components/Graphics';
import { useSitePageContent } from '../hooks/use-site-content';
import { RichText } from '@/components/ui/rich-text';

export const PrivacyPolicy: React.FC = () => {
  const { t, language } = useLanguage();
  const content = useSitePageContent('privacy', language);
  const backendHtml = content.data?.html?.trim();

  return (
    <div className="min-h-screen bg-slate-50 py-12 md:py-20 relative overflow-hidden">
      {/* Background Graphics */}
      <div className="absolute bottom-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <BerryBranchGraphic className="absolute bottom-10 left-10 w-64 h-64 transform translate-y-1/4 text-emerald-600" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                {t('privacy.title')}
              </h1>
              <p className="text-slate-500">
                {t('privacy.last_updated')}
              </p>
            </div>
          </div>

          <div className="space-y-10 text-slate-600 leading-relaxed">
            {backendHtml ? (
              <RichText html={backendHtml} className="text-slate-700" />
            ) : (
              <>
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                {t('privacy.s1.title')}
              </h2>
              <p>{t('privacy.s1.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                {t('privacy.s2.title')}
              </h2>
              <p>{t('privacy.s2.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                {t('privacy.s3.title')}
              </h2>
              <p>{t('privacy.s3.content')}</p>
            </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { PrivacyPolicy as PrivacyPage };
