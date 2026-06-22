import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { addCommunityChatMessage, getCommunityChatMessages, type CommunityChatMessage } from '../services/community-chat-storage.service';
import { Users, Send } from 'lucide-react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { isSubscriptionActive, getSubscriptionExpiryState } from '@/features/subscriptions/services/subscription-access.service';

export const CommunityChat: React.FC = () => {
  const { user } = useAuth();
  const { t, localize, dir } = useLanguage();
  const isAr = dir === 'rtl';

  const [messages, setMessages] = useState<CommunityChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) return;
    setMessages(getCommunityChatMessages(user.subscriptionStartDate));
  }, [user?.id, user?.subscriptionStartDate]);

  useEffect(() => {
    scrollToBottom();
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

  const subscriptionActive = isSubscriptionActive(user);
  const expiryState = getSubscriptionExpiryState(user);
  const isExpiredReadOnly = expiryState === 'expired';
  const isMuted = Boolean(user.isChatMuted);

  if (!subscriptionActive && expiryState === 'none') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <AccessDeniedState variant="subscription_required" isAr={isAr} />
        </div>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isExpiredReadOnly || isMuted) return;

    const newMsg = addCommunityChatMessage({
      senderName: user.name,
      senderId: user.id,
      text: newMessage.trim(),
    });

    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8 h-[calc(100vh-140px)] flex flex-col">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-grow">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{t('nav.community_chat')}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isExpiredReadOnly
                  ? localize({ en: 'Read-only because subscription expired', ar: 'قراءة فقط لانتهاء الاشتراك' })
                  : localize({ en: '23 Online | Subscription Required', ar: '23 متصل | للمشتركين فقط' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-grow p-4 overflow-y-auto bg-slate-50/50">
          <div className="space-y-6">
            {messages.map((msg, index) => {
              const isConsecutive = index > 0 && messages[index - 1].senderId === msg.senderId;
              const isMe = msg.senderId === user.id;

              if (msg.isDeleted) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <p className="rounded-full bg-slate-200 px-4 py-1 text-xs italic text-slate-500">
                      {localize({ en: 'This message was deleted by administration', ar: 'تم حذف هذه الرسالة من قبل الإدارة' })}
                    </p>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isConsecutive && !isMe && (
                      <div className="mb-1 ms-1 flex items-center gap-2">
                        <span className={`text-xs font-semibold ${msg.isAdmin ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {msg.senderName}
                        </span>
                        {msg.isAdmin && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {localize({ en: 'Admin', ar: 'الإدارة' })}
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl p-3 ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : msg.isAdmin
                            ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-bl-none shadow-sm'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 mx-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          {isExpiredReadOnly && (
            <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              {localize({
                en: 'Your subscription has ended. You can read previous available messages, but sending requires renewal.',
                ar: 'انتهى اشتراكك. يمكنك قراءة الرسائل السابقة المتاحة لك، لكن الإرسال يحتاج إلى تجديد الاشتراك.',
              })}
            </p>
          )}
          {isMuted && !isExpiredReadOnly && (
            <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
              {localize({
                en: 'Your ability to send messages has been disabled by administration.',
                ar: 'تم تعطيل إرسال الرسائل من حسابك من قبل الإدارة.',
              })}
            </p>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isExpiredReadOnly || isMuted}
              placeholder={localize({
                en: 'Type a message to the community...',
                ar: 'اكتب رسالة للمجتمع...',
              })}
              className="flex-grow bg-slate-100 border-none focus:ring-2 focus:ring-emerald-500 rounded-xl px-4 py-2 text-sm"
            />
            <button
              type="submit"
              className={`p-2 sm:px-6 rounded-xl font-medium transition-all flex items-center justify-center ${
                newMessage.trim() && !isExpiredReadOnly && !isMuted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              disabled={!newMessage.trim() || isExpiredReadOnly || isMuted}
            >
              <Send size={18} className={dir === 'rtl' ? 'rotate-180' : ''} />
              <span className="hidden sm:inline-block ms-2">{localize({ en: 'Send', ar: 'إرسال' })}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommunityChat;
