'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from '@/lib/routing/next-router-compat';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import {
  MessageSquare, Send, Check, CheckCheck,
  Clock, AlertCircle, ChevronLeft, ChevronRight, Paperclip, Image as ImageIcon,
} from 'lucide-react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { getStoredConsultationById } from '@/features/care/services/care-records-storage.service';
import {
  canInteractInPortal,
  getPortalState,
  getRemainingPortalMinutes,
  isPortalReadOnly,
} from '@/features/care/services/portal-eligibility.service';
import { markConsultationPortalEntered } from '@/features/care/services/consultation-lifecycle.service';
import {
  addConsultationChatMessage,
  getConsultationChatMessages,
  type ConsultationChatMessage,
} from '@/features/care/services/consultation-chat-storage.service';

const ChatConsultation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, localize, dir, language } = useLanguage();
  const isAr = language === 'ar';

  const [messages, setMessages] = useState<ConsultationChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const consultation = id ? getStoredConsultationById(id) : null;
  const isOwner = consultation?.userId === user?.id;
  const portalState = consultation ? getPortalState(consultation) : 'unavailable';
  const readOnly = consultation ? isPortalReadOnly(consultation) : true;
  const isChatAvailable = consultation ? canInteractInPortal(consultation) : false;
  const isPrepOnly = portalState === 'prep_only';

  useEffect(() => {
    if (id) setMessages(getConsultationChatMessages(id));
  }, [id]);

  useEffect(() => {
    if (id && consultation && (portalState === 'open' || portalState === 'prep_only') && !consultation.portalEnteredAt) {
      markConsultationPortalEntered(id);
    }
  }, [id, consultation, portalState]);

  useEffect(() => {
    if (!consultation) return;
    const tick = () => setRemainingMinutes(getRemainingPortalMinutes(consultation));
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [consultation, portalState]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <AccessDeniedState variant="login_required" isAr={dir === 'rtl'} />
        </div>
      </div>
    );
  }

  if (!consultation || !isOwner || consultation.kind !== 'individual-text') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <AccessDeniedState
            variant="ownership_required"
            isAr={dir === 'rtl'}
            ctaHref="/dashboard/consultations"
            ctaLabel={dir === 'rtl' ? 'عرض استشاراتي' : 'View My Consultations'}
            description={dir === 'rtl'
              ? 'لم يتم العثور على هذا الحجز أو لا تملك صلاحية الوصول إليه.'
              : 'This booking was not found or you do not have access to it.'}
          />
        </div>
      </div>
    );
  }

  const sendAttachment = (file: File) => {
    if (!isChatAvailable || !id) return;
    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    const newMsg = addConsultationChatMessage(id, {
      sender: 'user',
      text: isImage ? localize({ en: 'Sent an image', ar: 'أرسل صورة' }) : localize({ en: 'Sent a file', ar: 'أرسل ملفاً' }),
      attachment: { name: file.name, url, mimeType: file.type },
    });
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isChatAvailable || !id) return;

    const newMsg = addConsultationChatMessage(id, { sender: 'user', text: newMessage.trim() });
    setMessages((prev) => [...prev, newMsg]);
    setNewMessage('');

    window.setTimeout(() => {
      const replyMsg = addConsultationChatMessage(id, {
        sender: 'doctor',
        text: localize({
          en: 'Welcome to this chat. I am reviewing your health assessment now.',
          ar: 'مرحباً بك في المحادثة. أقوم بمراجعة التقييم الصحي الخاص بك الآن.',
        }),
        read: true,
      });
      setMessages((prev) => {
        const updated = prev.map((message) => (message.id === newMsg.id ? { ...message, read: true } : message));
        return [...updated, replyMsg];
      });
    }, 2000);
  };

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  const statusMessage = portalState === 'not_yet_open'
    ? { title: localize({ en: 'Portal not open yet', ar: 'البوابة لم تُفتح بعد' }), body: localize({ en: 'The portal opens 30 minutes before your consultation.', ar: 'تُفتح البوابة قبل 30 دقيقة من موعد الاستشارة.' }) }
    : portalState === 'prep_only'
      ? { title: localize({ en: 'Preparation mode', ar: 'وضع التحضير' }), body: localize({ en: 'You can review details now. Messaging starts at the scheduled time.', ar: 'يمكنك مراجعة التفاصيل الآن. تبدأ المراسلة عند الموعد المحدد.' }) }
      : portalState === 'closed'
        ? { title: localize({ en: 'Chat session closed', ar: 'انتهت جلسة المحادثة' }), body: localize({ en: 'This session is read-only. You can review previous messages only.', ar: 'هذه الجلسة للقراءة فقط. يمكنك مراجعة الرسائل السابقة.' }) }
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
            <h1 className="text-lg font-bold text-slate-800">{localize(consultation.serviceName)}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {localize({ en: 'With:', ar: 'مع:' })} {localize(consultation.doctorName)}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              <Clock size={16} className="text-emerald-500" />
              <span dir="ltr">{consultation.date} | {consultation.time}</span>
            </div>
            {portalState === 'open' && remainingMinutes > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                {remainingMinutes} {localize({ en: 'min left', ar: 'دقيقة متبقية' })}
              </div>
            )}
          </div>
        </div>

        {statusMessage && (
          <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-start gap-3">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-amber-800 font-medium text-sm">{statusMessage.title}</p>
              <p className="text-amber-700/80 text-xs mt-0.5">{statusMessage.body}</p>
              {consultation.portalEnteredAt && portalState === 'open' && (
                <p className="text-amber-700/80 text-xs mt-1">
                  {localize({ en: 'Reconnected to active session.', ar: 'تمت إعادة الاتصال بالجلسة النشطة.' })}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex-grow p-4 overflow-y-auto bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} className="mb-4 opacity-50" />
              <p>{localize({ en: 'No messages yet.', ar: 'لا توجد رسائل بعد.' })}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl p-3 ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.attachment && msg.attachment.mimeType.startsWith('image/') ? (
                      <img src={msg.attachment.url} alt={msg.attachment.name} className="mb-2 max-h-48 rounded-lg object-cover" />
                    ) : msg.attachment ? (
                      <a href={msg.attachment.url} download={msg.attachment.name} className="mb-2 block text-sm underline">
                        {msg.attachment.name}
                      </a>
                    ) : null}
                    <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                    <div className={`flex items-center gap-1.5 mt-1 text-[10px] ${
                      msg.sender === 'user' ? 'text-emerald-100 justify-end' : 'text-slate-400'
                    }`}>
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'user' && (
                        msg.read ? <CheckCheck size={14} /> : <Check size={14} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) sendAttachment(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isChatAvailable}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 disabled:opacity-50"
              title={localize({ en: 'Attach image or file', ar: 'إرفاق صورة أو ملف' })}
            >
              <Paperclip size={18} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={localize({
                en: isChatAvailable ? 'Type your message...' : isPrepOnly ? 'Prep mode — messaging starts at session time' : readOnly ? 'Session closed (read-only)...' : 'Chat disabled...',
                ar: isChatAvailable ? 'اكتب رسالتك...' : isPrepOnly ? 'وضع التحضير — تبدأ المراسلة عند الموعد' : readOnly ? 'الجلسة مغلقة (قراءة فقط)...' : 'المحادثة معطلة...',
              })}
              className="flex-grow bg-slate-100 border-none focus:ring-2 focus:ring-emerald-500 rounded-xl px-4 py-2 text-sm"
              disabled={!isChatAvailable}
              readOnly={readOnly || isPrepOnly}
            />
            <button
              type="submit"
              className={`p-2 sm:px-6 rounded-xl font-medium transition-all flex items-center justify-center ${
                isChatAvailable && newMessage.trim()
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              disabled={!isChatAvailable || !newMessage.trim()}
            >
              <Send size={18} className={dir === 'rtl' ? 'rotate-180' : ''} />
              <span className="hidden sm:inline-block ms-2">
                {localize({ en: 'Send', ar: 'إرسال' })}
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
