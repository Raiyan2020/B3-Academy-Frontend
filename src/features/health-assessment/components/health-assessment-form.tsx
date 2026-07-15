'use client';

import React, { useEffect, useMemo } from 'react';
import { z } from 'zod';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/UI';
import { useLanguage } from '../../../../LanguageContext';
import { useAppForm } from '@/lib/forms/use-app-form';
import { useHealthAssessmentForm, useSubmitHealthAssessment } from '../hooks/use-health-assessment';
import type { HealthAssessmentAnswer } from '../types/health-assessment.types';

const ANSWER_VALUES = ['not_present', 'present', 'chronic'] as const;

const modalSchema = z.object({
  answers: z.record(z.string(), z.enum(ANSWER_VALUES)),
});

type ModalFormValues = z.infer<typeof modalSchema>;

interface HealthAssessmentFormProps {
  onClose: () => void;
  onSubmit: () => void;
}

/**
 * Modal variant of the constitutional health assessment. Renders the dynamic
 * schema from `GET health-assessments/form` (real condition ids) and submits via
 * `POST health-assessments`. Tri-state maps to `not_present|present|chronic`.
 */
export const HealthAssessmentForm: React.FC<HealthAssessmentFormProps> = ({ onClose, onSubmit }) => {
  const { localize, language } = useLanguage();
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const formQuery = useHealthAssessmentForm();
  const sections = useMemo(() => formQuery.data ?? [], [formQuery.data]);
  const submitMutation = useSubmitHealthAssessment(
    t('تم إرسال التقييم الصحي بنجاح.', 'Health assessment submitted successfully.'),
  );

  const form = useAppForm<ModalFormValues>(modalSchema, { defaultValues: { answers: {} } });
  const answers = form.watch('answers') ?? {};

  useEffect(() => {
    if (!sections.length) return;
    const seeded: Record<string, HealthAssessmentAnswer> = {};
    sections.forEach((section) => {
      section.conditions.forEach((condition) => {
        seeded[String(condition.id)] = 'not_present';
      });
    });
    form.reset({ answers: seeded });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const handleSelect = (conditionId: number, value: HealthAssessmentAnswer) => {
    form.setValue(`answers.${conditionId}` as `answers.${string}`, value, { shouldDirty: true });
  };

  const submit = form.handleSubmit((values) => {
    const payload = Object.entries(values.answers).map(([conditionId, answer]) => ({
      condition_id: Number(conditionId),
      answer,
    }));
    submitMutation.mutate(payload, { onSuccess: () => onSubmit() });
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {t('نموذج التقييم الدستوري الصحي', 'Health Assessment Form')}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {t(
                'ضع علامة على الحالات المتكررة. "موجود" = أحياناً، "مزمن" = مستمرة.',
                'Mark recurring conditions. "Present" = occasional, "Chronic" = ongoing.',
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {formQuery.isLoading ? (
            <div className="flex items-center justify-center py-16 text-emerald-800">
              <Loader2 className="animate-spin" size={28} />
            </div>
          ) : formQuery.isError ? (
            <div className="text-center py-16">
              <p className="text-rose-700 font-semibold mb-4">
                {t('تعذر تحميل النموذج.', 'Could not load the form.')}
              </p>
              <Button onClick={() => formQuery.refetch()}>{t('إعادة المحاولة', 'Retry')}</Button>
            </div>
          ) : sections.length === 0 ? (
            <p className="text-center py-16 text-slate-500">
              {t('لا يوجد نموذج تقييم متاح حالياً.', 'No assessment form is available right now.')}
            </p>
          ) : (
            <form id="health-assessment-form" onSubmit={submit} className="space-y-8">
              {sections.map((section) => (
                <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-3 border-b border-slate-200">
                    <h3 className="font-bold text-emerald-900">{localize(section.name)}</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {section.conditions.map((condition) => {
                      const key = String(condition.id);
                      const current = (answers[key] ?? 'not_present') as HealthAssessmentAnswer;
                      return (
                        <div
                          key={key}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-4"
                        >
                          <span className="text-sm font-medium text-slate-700 flex-1">
                            {localize(condition.name)}
                          </span>
                          <div className="flex bg-slate-100 rounded-lg p-1 shrink-0 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => handleSelect(condition.id, 'not_present')}
                              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                                current === 'not_present'
                                  ? 'bg-white text-slate-800 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              {t('لا يوجد', 'None')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelect(condition.id, 'present')}
                              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                                current === 'present'
                                  ? 'bg-amber-100 text-amber-800 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              {t('موجود', 'Present')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelect(condition.id, 'chronic')}
                              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                                current === 'chronic'
                                  ? 'bg-rose-100 text-rose-800 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              {t('مزمن', 'Chronic')}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </form>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            {t('إلغاء', 'Cancel')}
          </Button>
          <Button
            form="health-assessment-form"
            type="submit"
            disabled={submitMutation.isPending || sections.length === 0}
            className="flex items-center gap-2"
          >
            {submitMutation.isPending ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <CheckCircle size={18} />
            )}
            {t('إرسال التقييم', 'Submit Assessment')}
          </Button>
        </div>
      </div>
    </div>
  );
};
