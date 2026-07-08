'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Send, Users } from 'lucide-react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { useAuth } from '@/features/auth/auth-provider';
import { ApiError } from '@/lib/api/api-error';
import { toastError, toastSuccess } from '@/lib/feedback/toast';
import { useLanguage } from '../../../../LanguageContext';
import { useGroupChatMessages, useGroupChatRoom, useSendGroupChatMessage } from '../hooks/use-group-chat';

export const CommunityChat = () => {
  const { user } = useAuth();
  const { t, localize, dir } = useLanguage();
  const isAr = dir === 'rtl';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const trimmedMessage = newMessage.trim();

  const roomQuery = useGroupChatRoom(Boolean(user));
  const messagesQuery = useGroupChatMessages(roomQuery.data?.id);
  const sendMutation = useSendGroupChatMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesQuery.data]);

  if (!user) {
    return <AccessDeniedState variant="login_required" isAr={isAr} />;
  }

  if (roomQuery.isLoading || messagesQuery.isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-slate-500">{isAr ? 'جار تحميل الدردشة...' : 'Loading chat...'}</div>;
  }

  if (roomQuery.error) {
    const isSubscriptionError = roomQuery.error instanceof ApiError && (roomQuery.error.status === 403 || roomQuery.error.key === 'subscription_required');
    return (
      <AccessDeniedState
        variant={isSubscriptionError ? 'subscription_required' : 'ownership_required'}
        isAr={isAr}
        description={isAr ? 'تعذر الوصول إلى غرفة المجتمع.' : 'Could not load the community room.'}
      />
    );
  }

  if (messagesQuery.error) {
    const isSubscriptionError = messagesQuery.error instanceof ApiError && (messagesQuery.error.status === 403 || messagesQuery.error.key === 'subscription_required');
    return (
      <AccessDeniedState
        variant={isSubscriptionError ? 'subscription_required' : 'ownership_required'}
        isAr={isAr}
        description={isAr ? 'تعذر تحميل رسائل المجتمع.' : 'Could not load community messages.'}
      />
    );
  }

  const room = roomQuery.data;
  const messages = messagesQuery.data || [];
  const canSend = Boolean(room?.can_send);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedMessage || !canSend || sendMutation.isPending) return;
    if (trimmedMessage.length > 2000) {
      toastError(isAr ? 'الرسالة يجب ألا تتجاوز 2000 حرف.' : 'Message must be 2000 characters or fewer.');
      return;
    }
    sendMutation.mutate(
      { body: trimmedMessage },
      {
        onSuccess: () => {
          setNewMessage('');
          toastSuccess(isAr ? 'تم إرسال الرسالة.' : 'Message sent.');
        },
        onError: (error) => {
          toastError(error instanceof Error ? error.message : isAr ? 'تعذر إرسال الرسالة.' : 'Could not send the message.');
        },
      },
    );
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-4xl flex-col px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex grow flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{t('nav.community_chat')}</h1>
              <p className="mt-0.5 text-xs text-slate-500">
                {room?.is_current ? localize({ en: 'Live group room', ar: 'غرفة مباشرة' }) : localize({ en: 'Group room', ar: 'غرفة المجموعة' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto bg-slate-50/50 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                {isAr ? 'لا توجد رسائل بعد.' : 'No messages yet.'}
              </div>
            ) : null}
            {messages.map((message) => {
              const isAdmin = message.is_admin_message;
              return (
                <div key={message.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl border p-3 text-sm ${isAdmin ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-white text-slate-800'}`}>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {message.sender_name || (isAdmin ? localize({ en: 'Admin', ar: 'الإدارة' }) : localize({ en: 'Community member', ar: 'عضو المجتمع' }))}
                    </div>
                    <p className="whitespace-pre-wrap">{message.is_deleted ? localize({ en: 'This message was deleted.', ar: 'تم حذف هذه الرسالة.' }) : message.body}</p>
                    <div className="mt-1 text-[10px] text-slate-400">{message.created_at}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
          {!canSend ? (
            <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              {localize({ en: 'Sending is disabled for your account.', ar: 'تم تعطيل الإرسال لحسابك.' })}
            </p>
          ) : null}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              disabled={!canSend}
              maxLength={2000}
              placeholder={localize({ en: 'Type a message to the community...', ar: 'اكتب رسالة للمجتمع...' })}
              className="flex-grow rounded-xl border-none bg-slate-100 px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!trimmedMessage || !canSend || sendMutation.isPending}
              className="flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <Send size={18} className={dir === 'rtl' ? 'rotate-180' : ''} />
              <span className="ms-2 hidden sm:inline-block">{sendMutation.isPending ? localize({ en: 'Sending...', ar: 'جار الإرسال...' }) : localize({ en: 'Send', ar: 'إرسال' })}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommunityChat;
