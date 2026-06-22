'use client';

import { useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminFormCard, AdminSaveMessage, CheckboxField, LocalizedFields } from './admin-form-fields';
import {
  getAssistantConfig,
  getDefaultAssistantConfig,
  saveAssistantConfig,
  type AssistantConfig,
  type AssistantKeywordEntry,
} from '@/features/ai-assistant/services/assistant-config.service';
import { useLanguage } from '../../../../LanguageContext';

export function AdminAssistantPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [config, setConfig] = useState<AssistantConfig>(() => getAssistantConfig());
  const [message, setMessage] = useState<string | null>(null);

  const updateKeyword = (index: number, patch: Partial<AssistantKeywordEntry>) => {
    setConfig((current) => ({
      ...current,
      keywords: current.keywords.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)),
    }));
  };

  const addKeyword = () => {
    setConfig((current) => ({
      ...current,
      keywords: [
        ...current.keywords,
        {
          id: `kw-${Date.now()}`,
          keywords: { ar: [], en: [] },
          answers: { ar: [], en: [] },
        },
      ],
    }));
  };

  const removeKeyword = (index: number) => {
    setConfig((current) => ({
      ...current,
      keywords: current.keywords.filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'مساعد الذكاء الاصطناعي' : 'AI assistant'}
        description={isAr ? 'تعديل رسائل الترحيب والكلمات المفتاحية.' : 'Edit welcome messages and keyword rules.'}
        actions={
          <button
            type="button"
            onClick={() => {
              setConfig(getDefaultAssistantConfig());
              setMessage(isAr ? 'تمت استعادة الإعدادات الافتراضية (لم تُحفظ بعد).' : 'Defaults restored (not saved yet).');
            }}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            {isAr ? 'استعادة الافتراضي' : 'Restore defaults'}
          </button>
        }
      />
      <AdminSaveMessage message={message} />
      <AdminFormCard
        title={isAr ? 'الإعدادات العامة' : 'General settings'}
        onSubmit={(event) => {
          event.preventDefault();
          saveAssistantConfig(config);
          setMessage(isAr ? 'تم حفظ إعدادات المساعد.' : 'Assistant settings saved.');
        }}
        submitLabel={isAr ? 'حفظ الكل' : 'Save all'}
      >
        <CheckboxField label={isAr ? 'المساعد مفعّل' : 'Assistant enabled'} checked={config.enabled} onChange={(enabled) => setConfig((current) => ({ ...current, enabled }))} />
        <LocalizedFields label={isAr ? 'رسالة الترحيب' : 'Welcome message'} value={config.welcomeMessage} onChange={(welcomeMessage) => setConfig((current) => ({ ...current, welcomeMessage }))} multiline isAr={isAr} />
        <LocalizedFields label={isAr ? 'رسالة الاحتياط' : 'Fallback message'} value={config.fallbackMessage} onChange={(fallbackMessage) => setConfig((current) => ({ ...current, fallbackMessage }))} multiline isAr={isAr} />

        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-950">{isAr ? 'الكلمات المفتاحية' : 'Keywords'}</h3>
            <button type="button" onClick={addKeyword} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700">
              {isAr ? 'إضافة' : 'Add'}
            </button>
          </div>
          {config.keywords.map((entry, index) => (
            <div key={entry.id} className="rounded-md border border-slate-100 p-3">
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                {isAr ? 'كلمات (عربي، مفصولة بفاصلة)' : 'Keywords (Arabic, comma-separated)'}
                <input
                  value={entry.keywords.ar.join(', ')}
                  onChange={(event) =>
                    updateKeyword(index, {
                      keywords: { ...entry.keywords, ar: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) },
                    })
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 font-normal"
                  dir="rtl"
                />
              </label>
              <label className="mt-2 grid gap-1 text-xs font-semibold text-slate-600">
                {isAr ? 'كلمات (إنجليزي، مفصولة بفاصلة)' : 'Keywords (English, comma-separated)'}
                <input
                  value={entry.keywords.en.join(', ')}
                  onChange={(event) =>
                    updateKeyword(index, {
                      keywords: { ...entry.keywords, en: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) },
                    })
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 font-normal"
                  dir="ltr"
                />
              </label>
              <label className="mt-2 grid gap-1 text-xs font-semibold text-slate-600">
                {isAr ? 'إجابة (عربي)' : 'Answer (Arabic)'}
                <textarea
                  value={entry.answers.ar.join('\n')}
                  onChange={(event) =>
                    updateKeyword(index, {
                      answers: { ...entry.answers, ar: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) },
                    })
                  }
                  className="min-h-[60px] rounded-md border border-slate-300 px-3 py-2 font-normal"
                  dir="rtl"
                />
              </label>
              <label className="mt-2 grid gap-1 text-xs font-semibold text-slate-600">
                {isAr ? 'إجابة (إنجليزي)' : 'Answer (English)'}
                <textarea
                  value={entry.answers.en.join('\n')}
                  onChange={(event) =>
                    updateKeyword(index, {
                      answers: { ...entry.answers, en: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) },
                    })
                  }
                  className="min-h-[60px] rounded-md border border-slate-300 px-3 py-2 font-normal"
                  dir="ltr"
                />
              </label>
              <button type="button" onClick={() => removeKeyword(index)} className="mt-2 text-sm font-semibold text-red-700">
                {isAr ? 'حذف' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      </AdminFormCard>
    </>
  );
}
