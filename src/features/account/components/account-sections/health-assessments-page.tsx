'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { getHealthAssessmentRecords } from '../../services/account-records.service';
import { AccountShell, EmptyAccountState } from '../account-shell';
import { getActiveHealthAssessmentSections } from '@/features/health-assessment/services/health-assessment-config.service';
import { useLanguage } from '../../../../../LanguageContext';
import type { HealthAssessmentRecord } from '../../types/account.types';
import { Eye, RotateCcw, X, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getStoredApiToken } from '@/features/auth/services/auth-api.service';
import {
  getHealthAssessment,
  getHealthAssessments,
} from '@/features/health-assessment/services/health-assessment-api.service';

export function AccountHealthAssessmentsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const records = user ? getHealthAssessmentRecords(user.id) : [];
  const [selectedRecord, setSelectedRecord] = useState<HealthAssessmentRecord | null>(null);
  const [selectedBackendId, setSelectedBackendId] = useState<string | null>(null);
  const sections = getActiveHealthAssessmentSections();
  const backendEnabled = Boolean(user && getStoredApiToken());
  const backendAssessments = useQuery({
    queryKey: ['health-assessments', 'list'],
    queryFn: getHealthAssessments,
    enabled: backendEnabled,
    retry: 1,
  });
  const backendDetail = useQuery({
    queryKey: ['health-assessments', 'detail', selectedBackendId],
    queryFn: () => getHealthAssessment(selectedBackendId!),
    enabled: Boolean(backendEnabled && selectedBackendId),
    retry: 1,
  });
  const hasBackendRecords = Boolean(backendAssessments.data?.length);

  const getSelectedAnswersGrouped = (record: HealthAssessmentRecord) => {
    const groups: Record<string, Array<{ label: { ar: string; en: string }; val: number }>> = {};
    if (record.answers) {
      Object.entries(record.answers).forEach(([key, val]) => {
        if (val === 1 || val === 2) {
          const [sectionId, itemIdxStr] = key.split('-');
          const itemIdx = parseInt(itemIdxStr, 10);
          const category = sections.find((s) => s.id === sectionId);
          const item = category?.items?.[itemIdx];
          if (category && item) {
            const catName = isAr ? category.title.ar : category.title.en;
            if (!groups[catName]) groups[catName] = [];
            groups[catName].push({ label: item, val });
          }
        }
      });
    }
    return groups;
  };

  const activeGroups = selectedRecord ? getSelectedAnswersGrouped(selectedRecord) : {};
  const backendGroups = Object.fromEntries(
    (backendDetail.data?.answers || [])
      .map((section) => [
        isAr ? section.name.ar : section.name.en,
        section.conditions
          .map((condition) => {
            const value = typeof condition.answer === 'string' ? condition.answer : condition.answer?.value;
            return {
              label: condition.name,
              val: value === 'present' ? 1 : value === 'chronic' ? 2 : 0,
            };
          })
          .filter((condition) => condition.val > 0),
      ])
      .filter(([, conditions]) => (conditions as Array<unknown>).length > 0),
  ) as Record<string, Array<{ label: { ar: string; en: string }; val: number }>>;
  const displayedGroups = selectedBackendId ? backendGroups : activeGroups;
  const hasSelectedAnswers = Object.keys(displayedGroups).length > 0;
  const displayedDate = selectedBackendId
    ? backendDetail.data?.created_at
    : selectedRecord?.submittedAt;

  return (
    <AccountShell
      title={isAr ? 'التقييمات الصحية الدستورية' : 'Constitutional Health Assessments'}
      description={
        isAr
          ? 'سجل التقييمات الصحية الدستورية المرسلة للمراجعة. لا تعرض المنصة تشخيصاً أو علاجاً مباشراً.'
          : 'Persisted history of constitutional health assessments. The platform does not display diagnosis or treatment.'
      }
    >
      {!hasBackendRecords && records.length === 0 ? (
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
          {(hasBackendRecords
            ? backendAssessments.data!.map((record) => ({
                id: String(record.id),
                submittedAt: record.created_at,
                summary: isAr
                  ? `${record.conditions_count} إجابة في ${record.sections_count} أقسام — الحالة: ${record.status}`
                  : `${record.conditions_count} answers across ${record.sections_count} sections — status: ${record.status}`,
                backend: true as const,
              }))
            : records.map((record) => ({ ...record, backend: false as const }))
          ).map((record) => (
            <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {isAr ? 'التقييم الصحي الدستوري' : 'Constitutional Health Assessment'}
                </h2>
                <p className="mt-1.5 text-xs text-slate-500">
                  {new Date(record.submittedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                </p>
                <p className="mt-3 text-sm text-slate-700 leading-relaxed max-w-xl">{record.summary}</p>
                {'adminNotified' in record && record.adminNotified && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    {isAr ? 'تم إرسال إشعار للإدارة للمراجعة' : 'Admin review notification sent'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (record.backend) {
                      setSelectedBackendId(record.id);
                      setSelectedRecord(null);
                    } else {
                      setSelectedRecord(record);
                      setSelectedBackendId(null);
                    }
                  }}
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

      {(selectedRecord || selectedBackendId) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{isAr ? 'تفاصيل التقييم الدستوري' : 'Assessment Details'}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {displayedDate ? new Date(displayedDate).toLocaleString(isAr ? 'ar-EG' : 'en-US') : ''}
                </p>
              </div>
              <button onClick={() => { setSelectedRecord(null); setSelectedBackendId(null); }} className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-200 rounded-full transition-colors">
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

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  {isAr ? 'الإجابات المسجلة' : 'Recorded Selections'}
                </h4>

                {!hasSelectedAnswers ? (
                  <p className="text-sm text-slate-500 italic">
                    {isAr ? 'لم يتم تحديد أي أعراض أو حالات.' : 'No symptoms or conditions were selected.'}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(displayedGroups).map(([groupTitle, items]) => (
                      <div key={groupTitle} className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50">
                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-150 text-xs font-bold text-slate-700">{groupTitle}</div>
                        <div className="divide-y divide-slate-150 bg-white">
                          {items.map(({ label, val }, idx) => (
                            <div key={idx} className="flex justify-between items-center px-4 py-2.5 text-sm">
                              <span className="text-slate-700 font-medium">{isAr ? label.ar : label.en}</span>
                              <span className={`px-2 py-0.5 text-xs font-bold rounded-lg ${val === 1 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                {val === 1 ? (isAr ? 'موجود' : 'Present') : isAr ? 'مزمن' : 'Chronic'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedRecord?.additionalNotes && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">{isAr ? 'ملاحظات إضافية' : 'Additional Notes'}</h4>
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-sm text-slate-700 leading-relaxed whitespace-pre-line font-serif italic">
                    {selectedRecord.additionalNotes}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
              <button onClick={() => { setSelectedRecord(null); setSelectedBackendId(null); }} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors">
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountShell>
  );
}
