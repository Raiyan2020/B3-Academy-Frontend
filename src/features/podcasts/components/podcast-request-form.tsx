'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Info, Send } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import {
  getActiveCooperationRequestTypes,
  submitCooperationRequest,
} from '@/features/community/services/cooperation-request.service';
import type {
  CooperationContactPreference,
  CooperationRequestType,
} from '@/features/community/types/cooperation-request.types';
import { useLanguage } from '../../../../LanguageContext';
import { Button } from '../../../../components/UI';
import { useNavigate } from '@/lib/routing/next-router-compat';

const contactPreferences: CooperationContactPreference[] = ['email', 'phone', 'whatsapp'];

export const PodcastRequest: React.FC = () => {
  const { dir, language, localize } = useLanguage();
  const { user, requireAuthAction } = useAuth();
  const navigate = useNavigate();
  const activeTypes = getActiveCooperationRequestTypes();
  const [submittedId, setSubmittedId] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    type: 'conference' as CooperationRequestType,
    title: '',
    description: '',
    attachmentName: '',
    contactPreference: 'email' as CooperationContactPreference,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireAuthAction()) return;
    if (!user) return;

    const request = submitCooperationRequest({
      userId: user.id,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      type: formData.type,
      title: formData.title.trim(),
      description: formData.description.trim(),
      attachmentName: formData.attachmentName || undefined,
      contactPreference: formData.contactPreference,
    });
    setSubmittedId(request.id);
  };

  if (submittedId) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-4" dir={dir}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-lg border border-emerald-100 bg-white p-8 text-center shadow-sm"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle size={34} />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-slate-950">
            {language === 'ar' ? 'تم استلام طلبك' : 'Request received'}
          </h2>
          <p className="mb-2 text-sm font-semibold text-slate-500">{submittedId}</p>
          <p className="mb-8 leading-7 text-slate-600">
            {language === 'ar'
              ? 'سيتم مراجعة الطلب من الفريق المختص والتواصل معك حسب وسيلة التواصل المفضلة.'
              : 'The team will review your request and contact you through your preferred contact method.'}
          </p>
          <Button className="w-full" onClick={() => navigate('/community')}>
            {language === 'ar' ? 'العودة إلى المجتمع' : 'Back to Community'}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50" dir={dir}>
      <section className="relative h-[320px] overflow-hidden bg-slate-950">
        <img
          src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=2574&auto=format&fit=crop"
          alt={language === 'ar' ? 'التعاون والاقتراحات' : 'Cooperation and suggestions'}
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                {language === 'ar' ? 'التعاون والاقتراحات' : 'Cooperation and Suggestions'}
              </h1>
              <p className="mt-4 max-w-2xl text-lg font-medium leading-8 text-emerald-50">
                {language === 'ar'
                  ? 'أرسل طلب تعاون، دعوة إعلامية، اقتراح محتوى، أو فكرة تطوير ليتم مراجعتها من الفريق المختص.'
                  : 'Send cooperation requests, media invitations, content suggestions, or development ideas for team review.'}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <Info size={20} />
            </div>
            <h2 className="font-bold text-slate-950">{language === 'ar' ? 'أنواع الطلبات' : 'Request types'}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {language === 'ar'
                ? 'اختر النوع الأقرب لطلبك. يمكن للإدارة تعديل هذه الأنواع لاحقاً من مصدر البيانات.'
                : 'Choose the closest request type. These options can later be managed from the admin data source.'}
            </p>
          </div>
          <div className="grid gap-3">
            {activeTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData((current) => ({ ...current, type: type.id }))}
                className={`rounded-lg border p-4 text-start transition ${
                  formData.type === type.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200'
                }`}
              >
                <span className="block text-sm font-bold">{localize(type.label)}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{localize(type.description)}</span>
              </button>
            ))}
          </div>
        </aside>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {!user && (
            <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              {language === 'ar'
                ? 'يجب تسجيل الدخول قبل إرسال طلب تعاون أو اقتراح.'
                : 'Please sign in before submitting a cooperation request or suggestion.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={language === 'ar' ? 'الاسم' : 'Name'}>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </Field>
              <Field label={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </Field>
              <Field label={language === 'ar' ? 'رقم الهاتف' : 'Phone'}>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </Field>
              <Field label={language === 'ar' ? 'طريقة التواصل المفضلة' : 'Preferred contact'}>
                <select
                  value={formData.contactPreference}
                  onChange={(event) => setFormData((current) => ({ ...current, contactPreference: event.target.value as CooperationContactPreference }))}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  {contactPreferences.map((preference) => (
                    <option key={preference} value={preference}>
                      {preference === 'email' ? (language === 'ar' ? 'البريد الإلكتروني' : 'Email') : preference === 'phone' ? (language === 'ar' ? 'الهاتف' : 'Phone') : 'WhatsApp'}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label={language === 'ar' ? 'عنوان الطلب' : 'Request title'}>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder={language === 'ar' ? 'مثال: دعوة للمشاركة في مؤتمر' : 'Example: Invitation to speak at a conference'}
              />
            </Field>

            <Field label={language === 'ar' ? 'تفاصيل الطلب' : 'Request details'}>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder={language === 'ar' ? 'اكتب الهدف، الموعد، الجهة، وأي تفاصيل مهمة.' : 'Share the purpose, timing, organization, and any important details.'}
              />
            </Field>

            <Field label={language === 'ar' ? 'مرفق اختياري' : 'Optional attachment'}>
              <input
                type="file"
                onChange={(event) => setFormData((current) => ({ ...current, attachmentName: event.target.files?.[0]?.name || '' }))}
                className="w-full rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 file:me-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {formData.attachmentName && <p className="mt-2 text-xs font-semibold text-slate-500">{formData.attachmentName}</p>}
            </Field>

            <Button type="submit" className="flex w-full items-center justify-center gap-2 py-4">
              <Send size={18} />
              <span>{language === 'ar' ? 'إرسال الطلب' : 'Submit Request'}</span>
            </Button>
          </form>
        </motion.div>
      </section>
    </main>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export { PodcastRequest as PodcastRequestForm };
