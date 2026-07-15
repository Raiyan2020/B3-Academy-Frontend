'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useLanguage } from '../../../../LanguageContext';
import { Button } from '../../../../components/UI';
import { useNavigate } from '@/lib/routing/next-router-compat';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { CheckCircle2, FileHeart, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { useAppForm } from '@/lib/forms/use-app-form';
import { useHealthAssessmentForm, useSubmitHealthAssessment } from '../hooks/use-health-assessment';
import type { HealthAssessmentAnswer } from '../types/health-assessment.types';

const ANSWER_VALUES = ['not_present', 'present', 'chronic'] as const;

const assessmentSchema = z.object({
  answers: z.record(z.string(), z.enum(ANSWER_VALUES)),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

function nextAnswer(current: HealthAssessmentAnswer): HealthAssessmentAnswer {
  if (current === 'not_present') return 'present';
  if (current === 'present') return 'chronic';
  return 'not_present';
}

export const HealthAssessment: React.FC = () => {
  const { language, dir, localize } = useLanguage();
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const returnHref = searchParams.get('return') || '/dashboard';
  const { user } = useAuth();
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const formQuery = useHealthAssessmentForm(Boolean(user));
  const sections = useMemo(() => formQuery.data ?? [], [formQuery.data]);
  const submitMutation = useSubmitHealthAssessment(
    t(
      'تم إرسال التقييم الصحي بنجاح.',
      'Health assessment submitted successfully.',
    ),
  );

  const form = useAppForm<AssessmentFormValues>(assessmentSchema, {
    defaultValues: { answers: {} },
  });
  const answers = form.watch('answers') ?? {};

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Seed every condition to "not_present" once the dynamic schema arrives.
  useEffect(() => {
    if (!sections.length) return;
    const seeded: Record<string, HealthAssessmentAnswer> = {};
    sections.forEach((section) => {
      section.conditions.forEach((condition) => {
        seeded[String(condition.id)] = 'not_present';
      });
    });
    form.reset({ answers: seeded });
    setCurrentPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const totalPages = sections.length;

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

  const handleCycle = (conditionId: number) => {
    const key = String(conditionId);
    const current = (answers[key] ?? 'not_present') as HealthAssessmentAnswer;
    form.setValue(`answers.${key}` as `answers.${string}`, nextAnswer(current), {
      shouldDirty: true,
    });
  };

  const onSubmit = form.handleSubmit((values) => {
    const payload = Object.entries(values.answers).map(([conditionId, answer]) => ({
      condition_id: Number(conditionId),
      answer,
    }));
    submitMutation.mutate(payload, {
      onSuccess: () => {
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  });

  const answerLabel = (val: HealthAssessmentAnswer) => {
    if (val === 'present') return t('موجود', 'Present');
    if (val === 'chronic') return t('مزمن', 'Chronic');
    return t('لا شيء', 'None');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fdf8f0] py-24 px-4 flex items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
          <AccessDeniedState variant="login_required" isAr={isAr} />
        </div>
      </div>
    );
  }

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
            {t('تم استلام تقييمك بنجاح', 'Assessment Received Successfully')}
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            {t(
              'شكراً لك على إكمال نموذج التقييم الصحي. تم حفظ إجاباتك وإرسالها للمراجعة، ولا تعرض المنصة نتيجة أو درجة أو تشخيصاً لهذا التقييم.',
              'Thank you for completing the health assessment. Your answers were saved for review, and the platform does not show a score, result, or diagnosis for this assessment.',
            )}
          </p>
          <Button
            onClick={() => navigate(returnHref)}
            className="w-full justify-center py-4 bg-emerald-800 hover:bg-emerald-700 text-[#ede3ce]"
          >
            {t('المتابعة', 'Continue')}
          </Button>
        </motion.div>
      </div>
    );
  }

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

        {formQuery.isLoading ? (
          <div className="flex items-center justify-center py-24 text-emerald-800">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : formQuery.isError ? (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-rose-200 text-center">
            <p className="text-rose-700 font-semibold mb-4">
              {t('تعذر تحميل نموذج التقييم. حاول مرة أخرى.', 'Could not load the assessment form. Please try again.')}
            </p>
            <Button onClick={() => formQuery.refetch()} className="bg-emerald-800 hover:bg-emerald-700 text-[#ede3ce]">
              {t('إعادة المحاولة', 'Retry')}
            </Button>
          </div>
        ) : sections.length === 0 ? (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-[#ede3ce] text-center text-slate-600">
            {t('لا يوجد نموذج تقييم متاح حالياً.', 'No assessment form is available right now.')}
          </div>
        ) : (
          <>
            <div className="flex gap-1 max-w-2xl mx-auto mb-8">
              {Array.from({ length: totalPages }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentPage ? 'bg-emerald-600' : 'bg-emerald-100'}`}
                />
              ))}
            </div>

            <form
              onSubmit={onSubmit}
              className="bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border border-[#ede3ce] overflow-hidden max-w-3xl mx-auto"
            >
              {(() => {
                const section = sections[currentPage];
                if (!section) return null;
                const isLastPage = currentPage === totalPages - 1;
                return (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="mb-8">
                      <div className="bg-emerald-800 text-white px-4 py-3 font-bold flex justify-between items-center text-lg uppercase tracking-wider shadow-sm rounded-t-lg">
                        <span>{localize(section.name)}</span>
                      </div>
                      <div className="border border-emerald-800/10 border-t-0 p-4 sm:p-6 space-y-3 rounded-b-lg bg-[#fdf8f0]/30 min-h-[400px]">
                        {section.conditions.map((condition) => {
                          const key = String(condition.id);
                          const val = (answers[key] ?? 'not_present') as HealthAssessmentAnswer;
                          return (
                            <div
                              key={key}
                              className="flex items-start gap-4 p-2 hover:bg-white rounded-lg transition-colors"
                            >
                              <button
                                type="button"
                                onClick={() => handleCycle(condition.id)}
                                className={`flex-shrink-0 min-w-20 h-8 border-2 rounded px-2 flex items-center justify-center font-bold text-xs transition-colors mt-0.5 ${
                                  val === 'not_present'
                                    ? 'bg-white border-slate-300 text-slate-400'
                                    : val === 'present'
                                      ? 'bg-amber-100 border-amber-500 text-amber-800'
                                      : 'bg-rose-700 border-rose-700 text-white'
                                }`}
                              >
                                {answerLabel(val)}
                              </button>
                              <span
                                className="text-base text-slate-700 leading-snug pt-1 select-none cursor-pointer"
                                onClick={() => handleCycle(condition.id)}
                              >
                                {localize(condition.name)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-8 flex justify-between pt-8 border-t border-[#ede3ce]">
                      {currentPage > 0 ? (
                        <Button
                          type="button"
                          onClick={handleBack}
                          variant="outline"
                          size="lg"
                          className="px-8 border-emerald-800 text-emerald-800"
                        >
                          {t('السابق', 'Back')}
                        </Button>
                      ) : (
                        <div />
                      )}
                      {isLastPage ? (
                        <Button
                          type="submit"
                          size="lg"
                          disabled={submitMutation.isPending}
                          className="px-12 bg-emerald-800 hover:bg-emerald-700 text-[#ede3ce] shadow-xl shadow-emerald-900/20 inline-flex items-center gap-2"
                        >
                          {submitMutation.isPending && <Loader2 className="animate-spin" size={18} />}
                          {t('إرسال التقييم', 'Submit Assessment')}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleNext}
                          size="lg"
                          className="px-12 bg-emerald-800 hover:bg-emerald-700 text-[#ede3ce] shadow-xl shadow-emerald-900/20"
                        >
                          {t('التالي', 'Next')}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })()}
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export { HealthAssessment as HealthAssessmentPage };
