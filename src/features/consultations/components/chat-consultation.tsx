'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from '@/lib/routing/next-router-compat';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { MessageSquare, Send, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { toastError, toastSuccess } from '@/lib/feedback/toast';
import { usePortalDetail, usePortalMessages, useSendPortalMessage } from '../hooks/use-care-portal';
import { CARE_PORTAL_RESOURCES_WITH_MESSAGES, type CarePortalResource } from '../types/api.types';

const MAX_MESSAGE_LENGTH = 5000;

const ChatConsultation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, localize, dir } = useLanguage();
  const isAr = dir === 'rtl';
  const searchParams = useSearchParams();

  // The chat route serves several portal resources; the resource is passed via ?resource=.
  // Only messages-capable resources are valid; default to individual consultations.
  const resourceParam = searchParams?.get('resource') as CarePortalResource | null;
  const resource: CarePortalResource =
    resourceParam && CARE_PORTAL_RESOURCES_WITH_MESSAGES.includes(resourceParam)
      ? resourceParam
      : 'individual-consultations';

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const detailQuery = usePortalDetail(resource, id, Boolean(user));
  const detail = detailQuery.data;
  const canInteract = Boolean(detail?.portal.canInteract);

  const messagesQuery = usePortalMessages(resource, id, {
    enabled: Boolean(user) && Boolean(detail),
    refetchInterval: 10000,
  });
  const messages = messagesQuery.data?.items ?? [];
  const sendMutation = useSendPortalMessage(resource, id);
  const trimmed = newMessage.trim();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <AccessDeniedState variant="login_required" isAr={isAr} />
        </div>
      </div>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center text-slate-500">
        {localize({ en: 'Loading chat...', ar: 'جار تحميل المحادثة...' })}
      </div>
    );
  }

  if (detailQuery.error || !detail) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <AccessDeniedState
            variant="ownership_required"
            isAr={isAr}
            ctaHref="/dashboard/consultations"
            ctaLabel={isAr ? 'عرض استشاراتي' : 'View My Consultations'}
            description={isAr
              ? 'لم يتم العثور على هذا الحجز أو لا تملك صلاحية الوصول إليه.'
              : 'This booking was not found or you do not have access to it.'}
          />
        </div>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed || !canInteract || !id || sendMutation.isPending) return;
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      toastError(isAr ? 'الرسالة يجب ألا تتجاوز 5000 حرف.' : 'Message must be 5000 characters or fewer.');
      return;
    }
    sendMutation.mutate(trimmed, {
      onSuccess: () => {
        setNewMessage('');
        toastSuccess(isAr ? 'تم إرسال الرسالة.' : 'Message sent.');
      },
      onError: (error) => {
        toastError(error instanceof Error ? error.message : isAr ? 'تعذر إرسال الرسالة.' : 'Could not send the message.');
      },
    });
  };

  const BackIcon = isAr ? ChevronRight : ChevronLeft;

  const statusMessage = !canInteract
    ? detail.portal.canPrepare
      ? {
          title: localize({ en: 'Preparation mode', ar: 'وضع التحضير' }),
          body: localize({ en: 'You can review details now. Messaging starts at the scheduled time.', ar: 'يمكنك مراجعة التفاصيل الآن. تبدأ المراسلة عند الموعد المحدد.' }),
        }
      : {
          title: localize({ en: 'Messaging unavailable', ar: 'المراسلة غير متاحة' }),
          body: localize({ en: 'This session is read-only. You can review previous messages only.', ar: 'هذه الجلسة للقراءة فقط. يمكنك مراجعة الرسائل السابقة فقط.' }),
        }
    : null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-4">
        <Link to="/dashboard/consultations" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium">
          <BackIcon size={20} className="me-1" />
          {t('dash.my_consultations')}
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-grow">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{detail.bookingTypeLabel || localize({ en: 'Consultation', ar: 'استشارة' })}</h1>
            {detail.userName && <p className="text-sm text-slate-500 mt-1">{detail.userName}</p>}
          </div>
          {(detail.appointmentDate || detail.startTime) && (
            <div className="flex items-center gap-1.5 text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-sm">
              <Clock size={16} className="text-emerald-500" />
              <span dir="ltr">
                {[detail.appointmentDate, detail.startTime].filter(Boolean).join(' | ')}
              </span>
            </div>
          )}
        </div>

        {statusMessage && (
          <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-start gap-3">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-amber-800 font-medium text-sm">{statusMessage.title}</p>
              <p className="text-amber-700/80 text-xs mt-0.5">{statusMessage.body}</p>
            </div>
          </div>
        )}

        <div className="flex-grow p-4 overflow-y-auto bg-slate-50/50">
          {messagesQuery.isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              {localize({ en: 'Loading messages...', ar: 'جار تحميل الرسائل...' })}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} className="mb-4 opacity-50" />
              <p>{localize({ en: 'No messages yet.', ar: 'لا توجد رسائل بعد.' })}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isMine = !msg.isAdminMessage;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl p-3 ${
                      isMine
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                    }`}>
                      {!isMine && msg.senderName && (
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{msg.senderName}</div>
                      )}
                      <p className="whitespace-pre-wrap text-sm">
                        {msg.isDeleted ? localize({ en: 'This message was deleted.', ar: 'تم حذف هذه الرسالة.' }) : msg.body}
                      </p>
                      <div className={`mt-1 text-[10px] ${isMine ? 'text-emerald-100 text-end' : 'text-slate-400'}`}>
                        {msg.createdAt}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder={localize({
                en: canInteract ? 'Type your message...' : 'Messaging is currently unavailable...',
                ar: canInteract ? 'اكتب رسالتك...' : 'المراسلة غير متاحة حالياً...',
              })}
              className="flex-grow bg-slate-100 border-none focus:ring-2 focus:ring-emerald-500 rounded-xl px-4 py-2 text-sm disabled:opacity-60"
              disabled={!canInteract || sendMutation.isPending}
            />
            <button
              type="submit"
              className={`p-2 sm:px-6 rounded-xl font-medium transition-all flex items-center justify-center ${
                canInteract && trimmed && !sendMutation.isPending
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              disabled={!canInteract || !trimmed || sendMutation.isPending}
            >
              <Send size={18} className={isAr ? 'rotate-180' : ''} />
              <span className="hidden sm:inline-block ms-2">
                {sendMutation.isPending ? localize({ en: 'Sending...', ar: 'جار الإرسال...' }) : localize({ en: 'Send', ar: 'إرسال' })}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatConsultation;

export { ChatConsultation };
