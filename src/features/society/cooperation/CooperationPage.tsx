'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { useCooperationTypes, useSubmitCooperationRequest } from './hooks/use-cooperation-form';
import { CooperationPageView } from './ui/CooperationPageView';

export function CooperationPage() {
  const { language } = useLanguage();
  const { requireAuthAction } = useAuth();
  const types = useCooperationTypes();
  const submit = useSubmitCooperationRequest();
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!selectedTypeId && types.data?.[0]) setSelectedTypeId(types.data[0].id);
  }, [selectedTypeId, types.data]);

  const isAr = language === 'ar';

  return (
    <CooperationPageView
      title={isAr ? 'التعاون والاقتراحات' : 'Cooperation and Suggestions'}
      description={isAr ? 'أرسل طلب تعاون أو اقتراحاً ليتم تسجيله لدى الإدارة.' : 'Submit a cooperation request or suggestion for the administration team.'}
      types={types.data || []}
      selectedTypeId={selectedTypeId}
      requestTitle={title}
      requestMessage={message}
      labels={{
        type: isAr ? 'نوع الطلب' : 'Request type',
        title: isAr ? 'عنوان الطلب' : 'Request title',
        message: isAr ? 'تفاصيل الطلب' : 'Request details',
        submit: isAr ? 'إرسال الطلب' : 'Submit request',
        noTypes: types.isLoading ? (isAr ? 'جار التحميل...' : 'Loading...') : (isAr ? 'لا توجد أنواع طلبات مفعلة حالياً.' : 'No active request types are available.'),
      }}
      isSubmitting={submit.isPending}
      onTypeChange={setSelectedTypeId}
      onTitleChange={setTitle}
      onMessageChange={setMessage}
      onSubmit={() => {
        if (!requireAuthAction()) return;
        submit.mutate({ collaborationTypeId: selectedTypeId, title: title.trim(), message: message.trim() }, {
          onSuccess: () => {
            setTitle('');
            setMessage('');
          },
        });
      }}
    />
  );
}
