'use client';

import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../../../LanguageContext';
import { useSitePageContent } from '../hooks/use-site-content';

export function TermsPage() {
  const { language } = useLanguage();
  const content = useSitePageContent('terms', language);
  const backendHtml = content.data?.html?.trim();

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <section className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-950">{language === 'ar' ? 'الشروط والأحكام' : 'Terms and Conditions'}</h1>
            <p className="mt-1 text-sm text-slate-500">{language === 'ar' ? 'نسخة أولية قابلة للتحديث من الإدارة.' : 'Initial version, editable by administration.'}</p>
          </div>
        </div>
        <div className="space-y-6 leading-8 text-slate-700">
          {backendHtml ? (
            <div className="prose max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: backendHtml }} />
          ) : (
            <>
          <p>
            {language === 'ar'
              ? 'باستخدام منصة B3 Academy، يوافق العميل على استخدام الخدمات والمحتوى وفق القواعد المعتمدة داخل المنصة، وعلى أن عمليات الشراء والحجز والاشتراك تتم من خلال الحساب الشخصي ولا يترتب على نجاح الدفع استرداد تلقائي.'
              : 'By using B3 Academy, customers agree to use services and content according to platform rules. Purchases, bookings, and subscriptions are tied to the customer account and successful payments do not create an automatic refund right.'}
          </p>
          <p>
            {language === 'ar'
              ? 'المحتوى التعليمي والمجتمعي لا يمثل بديلاً عن الاستشارة الطبية المتخصصة، ولا يقدم مساعد B3 الذكي تشخيصاً أو علاجاً.'
              : 'Learning and community content is not a substitute for professional medical consultation, and the B3 assistant does not provide diagnosis or treatment.'}
          </p>
          <p>
            {language === 'ar'
              ? 'الكتب الإلكترونية تقرأ داخل المنصة فقط ولا يسمح بتحميلها أو تصديرها خارج المنصة.'
              : 'Electronic books are read inside the platform only and may not be downloaded or exported.'}
          </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

