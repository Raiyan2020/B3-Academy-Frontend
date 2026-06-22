import React, { useState } from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { Button } from '../../../../components/UI';
import { useNavigate } from '@/lib/routing/next-router-compat';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { CheckCircle2, FileHeart } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import { addHealthAssessmentRecord } from '@/features/account/services/account-records.service';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { getActiveHealthAssessmentSections } from '../services/health-assessment-config.service';

/** 0 = none, 1 = present, 2 = chronic */
export type HealthAssessmentAnswerValue = 0 | 1 | 2;

export const HealthAssessment: React.FC = () => {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const returnHref = searchParams.get('return') || '/dashboard';
  const { user } = useAuth();
  const assessmentData = getActiveHealthAssessmentSections();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fdf8f0] py-24 px-4 flex items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
          <AccessDeniedState variant="login_required" isAr={language === 'ar'} />
        </div>
      </div>
    );
  }

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selections, setSelections] = useState<Record<string, HealthAssessmentAnswerValue>>({});
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = assessmentData.length + 1;

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((c) => c + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage((c) => c - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCycle = (sectionId: string, itemIndex: number) => {
    const key = `${sectionId}-${itemIndex}`;
    setSelections((prev) => {
      const current = prev[key] ?? 0;
      const next = current === 0 ? 1 : current === 1 ? 2 : 0;
      return { ...prev, [key]: next as HealthAssessmentAnswerValue };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCount = Object.values(selections).filter((val) => val === 1 || val === 2).length;
    addHealthAssessmentRecord(
      user.id,
      language === 'ar'
        ? `تم إرسال تقييم صحي يحتوي على ${selectedCount} إجابة محفوظة للمراجعة.`
        : `Health assessment submitted with ${selectedCount} saved answers for review.`,
      selections,
      additionalNotes,
    );
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#fdf8f0] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl max-w-lg w-full text-center border border-[#ede3ce]"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-emerald-900 mb-4">
            {language === 'ar' ? 'تم استلام تقييمك بنجاح' : 'Assessment Received Successfully'}
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            {language === 'ar'
              ? 'شكراً لك على إكمال نموذج التقييم الصحي. تم حفظ إجاباتك وإرسالها للمراجعة، ولا تعرض المنصة نتيجة أو درجة أو تشخيصاً لهذا التقييم.'
              : 'Thank you for completing the health assessment. Your answers were saved for review, and the platform does not show a score, result, or diagnosis for this assessment.'}
          </p>
          <Button onClick={() => navigate(returnHref)} className="w-full justify-center py-4 bg-emerald-800 hover:bg-emerald-700 text-[#ede3ce]">
            {language === 'ar' ? 'المتابعة' : 'Continue'}
          </Button>
        </motion.div>
      </div>
    );
  }

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const answerLabel = (val: HealthAssessmentAnswerValue) => {
    if (val === 1) return t('موجود', 'Present');
    if (val === 2) return t('مزمن', 'Chronic');
    return '';
  };

  return (
    <div className="min-h-screen bg-[#fdf8f0] pb-24 pt-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-800 text-[#ede3ce] rounded-full mb-6 shadow-lg shadow-emerald-900/20">
            <FileHeart size={32} />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-emerald-900 mb-4 tracking-tight">
            {t('نموذج التقييم الدستوري الصحي', 'Constitutional Health Assessment')}
          </h1>
          <p className="text-lg text-emerald-800/70 max-w-2xl mx-auto mb-8 font-medium">
            {t(
              'التعليمات: لكل حالة اختر "موجود" إذا كانت تظهر أحياناً، أو "مزمن" إذا كانت مستمرة. الافتراضي هو عدم التحديد.',
              'Instructions: for each condition choose "Present" if it appears occasionally, or "Chronic" if ongoing. Default is none selected.',
            )}
          </p>
        </div>

        <div className="flex gap-1 max-w-2xl mx-auto mb-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentPage ? 'bg-emerald-600' : 'bg-emerald-100'}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border border-[#ede3ce] overflow-hidden max-w-3xl mx-auto">
          {currentPage >= 0 && currentPage < assessmentData.length && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              {(() => {
                const category = assessmentData[currentPage];
                return (
                  <div className="mb-8">
                    <div className="bg-emerald-800 text-white px-4 py-3 font-bold flex justify-between items-center text-lg uppercase tracking-wider shadow-sm rounded-t-lg">
                      <span>{t(category.title.ar, category.title.en)}</span>
                    </div>
                    <div className="border border-emerald-800/10 border-t-0 p-4 sm:p-6 space-y-3 rounded-b-lg bg-[#fdf8f0]/30 min-h-[400px]">
                      {category.items.map((item, itemIndex) => {
                        const key = `${category.id}-${itemIndex}`;
                        const val = selections[key] ?? 0;
                        return (
                          <div
                            key={key}
                            className={`flex items-start gap-4 p-2 hover:bg-white rounded-lg transition-colors ${item.indent ? (dir === 'rtl' ? 'mr-6' : 'ml-6') : ''}`}
                          >
                            <button
                              type="button"
                              onClick={() => handleCycle(category.id, itemIndex)}
                              className={`flex-shrink-0 min-w-20 h-8 border-2 rounded px-2 flex items-center justify-center font-bold text-xs transition-colors mt-0.5 ${
                                val === 0
                                  ? 'bg-white border-slate-300 text-slate-400'
                                  : val === 1
                                    ? 'bg-amber-100 border-amber-500 text-amber-800'
                                    : 'bg-rose-700 border-rose-700 text-white'
                              }`}
                            >
                              {val === 0 ? t('لا شيء', 'None') : answerLabel(val)}
                            </button>
                            <span
                              className="text-base text-slate-700 leading-snug pt-1 select-none cursor-pointer"
                              onClick={() => handleCycle(category.id, itemIndex)}
                            >
                              {t(item.ar, item.en)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="mt-8 flex justify-between pt-8 border-t border-[#ede3ce]">
                {currentPage > 0 ? (
                  <Button type="button" onClick={handleBack} variant="outline" size="lg" className="px-8 border-emerald-800 text-emerald-800">
                    {t('السابق', 'Back')}
                  </Button>
                ) : (
                  <div />
                )}
                <Button type="button" onClick={handleNext} size="lg" className="px-12 bg-emerald-800 hover:bg-emerald-700 text-[#ede3ce] shadow-xl shadow-emerald-900/20">
                  {t('التالي', 'Next')}
                </Button>
              </div>
            </motion.div>
          )}

          {currentPage === assessmentData.length && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-12 space-y-4">
                <label className="font-bold text-emerald-900 block text-xl">{t('أشياء إضافية ترغب في ذكرها', 'Any additional things you would like to mention')}</label>
                <textarea
                  className="w-full h-48 p-4 bg-[#fdf8f0] border border-emerald-800/20 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-medium text-slate-700 resize-none text-lg"
                  placeholder={t('اكتب هنا...', 'Type here...')}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                />
              </div>

              <div className="mt-8 flex justify-between pt-8 border-t border-[#ede3ce]">
                <Button type="button" onClick={handleBack} variant="outline" size="lg" className="px-8 border-emerald-800 text-emerald-800">
                  {t('السابق', 'Back')}
                </Button>
                <Button type="submit" size="lg" className="px-12 bg-emerald-800 hover:bg-emerald-700 text-[#ede3ce] shadow-xl shadow-emerald-900/20">
                  {t('إرسال التقييم', 'Submit Assessment')}
                </Button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
};

export { HealthAssessment as HealthAssessmentPage };

// Backward-compatible export for history detail view
export { getActiveHealthAssessmentSections as getAssessmentSectionsForDisplay } from '../services/health-assessment-config.service';
