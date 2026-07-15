'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, RotateCcw, X, Info, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../../LanguageContext';
import { AccountShell, EmptyAccountState } from '@/features/account/components/account-shell';
import {
  useHealthAssessmentSubmission,
  useHealthAssessmentSubmissions,
} from '../hooks/use-health-assessment';
import type { HealthAssessmentSubmissionCondition } from '../types/health-assessment.types';

function DetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';
  const { data, isLoading, isError } = useHealthAssessmentSubmission(id);

  const groups = (data?.answers ?? [])
    .map((section) => ({
      title: localize(section.name),
      items: section.conditions.filter(
        (condition) => condition.answer && condition.answer.value !== 'not_present',
      ),
    }))
    .filter((group) => group.items.length > 0);

  const answerBadge = (condition: HealthAssessmentSubmissionCondition) => {
    const value = condition.answer?.value;
    const label =
      condition.answer?.label ||
      (value === 'chronic' ? (isAr ? 'مزمن' : 'Chronic') : isAr ? 'موجود' : 'Present');
    return (
      <span
        className={`px-2 py-0.5 text-xs font-bold rounded-lg ${
          value === 'chronic' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isAr ? 'تفاصيل التقييم الدستوري' : 'Assessment Details'}
            </h3>
            {data?.createdAt && (
              <p className="text-xs text-slate-500 mt-1">
                {new Date(data.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 text-emerald-950">
            <Info className="text-emerald-700 shrink-0 mt-0.5" size={18} />
            <p className="text-xs leading-relaxed font-medium">
              {isAr
                ? 'هذا التقييم مصنف كأداة صحية دستورية لمراجعة المؤشرات الحيوية. لا يتم تشخيص الأمراض أو إصدار وصفات طبية علاجية من خلاله.'
                : 'This assessment is classified as a constitutional tool to review biological indicators. It is not used for disease diagnosis or prescriptions.'}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-emerald-800">
              <Loader2 className="animate-spin" size={26} />
            </div>
          ) : isError ? (
            <p className="text-sm text-rose-700 font-semibold">
              {isAr ? 'تعذر تحميل تفاصيل التقييم.' : 'Could not load assessment details.'}
            </p>
          ) : (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                {isAr ? 'الإجابات المسجلة' : 'Recorded Selections'}
              </h4>

              {groups.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  {isAr ? 'لم يتم تحديد أي أعراض أو حالات.' : 'No symptoms or conditions were selected.'}
                </p>
              ) : (
                <div className="space-y-4">
                  {groups.map((group, groupIdx) => (
                    <div
                      key={groupIdx}
                      className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50"
                    >
                      <div className="bg-slate-100 px-4 py-2 border-b border-slate-150 text-xs font-bold text-slate-700">
                        {group.title}
                      </div>
                      <div className="divide-y divide-slate-150 bg-white">
                        {group.items.map((condition) => (
                          <div
                            key={condition.id}
                            className="flex justify-between items-center px-4 py-2.5 text-sm"
                          >
                            <span className="text-slate-700 font-medium">{localize(condition.name)}</span>
                            {answerBadge(condition)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AccountHealthAssessmentsPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { data, isLoading, isError, refetch } = useHealthAssessmentSubmissions();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const records = data?.items ?? [];

  return (
    <AccountShell
      title={isAr ? 'التقييمات الصحية الدستورية' : 'Constitutional Health Assessments'}
      description={
        isAr
          ? 'سجل التقييمات الصحية الدستورية المرسلة للمراجعة. لا تعرض المنصة تشخيصاً أو علاجاً مباشراً.'
          : 'Persisted history of constitutional health assessments. The platform does not display diagnosis or treatment.'
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-emerald-800">
          <Loader2 className="animate-spin" size={30} />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center">
          <p className="text-rose-700 font-semibold mb-4">
            {isAr ? 'تعذر تحميل التقييمات. حاول مرة أخرى.' : 'Could not load assessments. Please try again.'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 px-5 py-2.5 font-bold text-white text-sm transition-all"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      ) : records.length === 0 ? (
        <EmptyAccountState
          title={isAr ? 'لا توجد تقييمات مرسلة' : 'No submitted assessments'}
          description={
            isAr
              ? 'يمكنك إرسال تقييم صحي دستوري جديد في أي وقت للمتابعة الصحية.'
              : 'You can submit a constitutional health assessment at any time for health tracking.'
          }
        />
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <article
              key={record.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {isAr ? 'التقييم الصحي الدستوري' : 'Constitutional Health Assessment'}
                </h2>
                <p className="mt-1.5 text-xs text-slate-500">
                  {new Date(record.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                </p>
                <p className="mt-3 text-sm text-slate-700 leading-relaxed max-w-xl">
                  {isAr
                    ? `تم إرسال تقييم يغطي ${record.sectionsCount} قسماً و${record.conditionsCount} حالة للمراجعة.`
                    : `Submitted an assessment covering ${record.sectionsCount} sections and ${record.conditionsCount} conditions for review.`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedId(record.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all"
                >
                  <Eye size={14} />
                  {isAr ? 'عرض التفاصيل' : 'View Details'}
                </button>
                <Link
                  href="/health-assessment"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 text-xs font-bold text-emerald-800 transition-all"
                >
                  <RotateCcw size={14} />
                  {isAr ? 'إعادة التقييم' : 'Retake'}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/health-assessment"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 px-5 py-3 font-bold text-white text-sm transition-all shadow-md"
        >
          {isAr ? 'إجراء تقييم جديد' : 'Perform New Assessment'}
        </Link>
      </div>

      {selectedId !== null && <DetailModal id={selectedId} onClose={() => setSelectedId(null)} />}
    </AccountShell>
  );
}
