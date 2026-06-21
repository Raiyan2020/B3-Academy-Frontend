import React, { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, Link } from '@/lib/routing/next-router-compat';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { 
  MessageSquare, Send, Paperclip, Check, CheckCheck, 
  Clock, AlertCircle, Info, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';

interface ChatMessage {
  id: string;
  sender: 'user' | 'doctor';
  text: string;
  timestamp: string;
  read: boolean;
}

const ChatConsultation: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { t, localize, dir } = useLanguage();
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const booking = user?.consultations?.find(c => c.id === id);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
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

    if (!booking) {
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

    // For demo purposes, we consider consultation active if the date is today or in the past.
    // In a real app we'd compare the exact minute and time duration
    const consultationDate = new Date(booking.date);
    const now = new Date();
    
    // To enable testing right now, let's enable it if the consultation is "today" or in the past.
    // Wait, the user might want a real check
    // Let's check both actual date & time
    const bookingTimeObj = new Date(`${booking.date} ${booking.time}`);
    const isPast = now >= bookingTimeObj;
    
    // For demo we'll just allow it if difference is within some hours, or just allow it if past the start time.
    // However, if the consultation is in future, disable it.
    const isEnabled = now >= bookingTimeObj || true; // Wait! "enabled when the consultation time comes"
    const isActive = now >= bookingTimeObj;
    
    // We can also allow if difference in MS is small, but let's just do an exact check for demo.
    // Actually, to make the demo testable, if the consultation is in the future, it is disabled.
    const isChatAvailable = now.getTime() >= bookingTimeObj.getTime();

    // To prevent total lockdown during demo if they want to test it now:
    // Actually the prompt says "the chat becomes enabled when the consultation time comes". So we strictly enforce it.

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !isChatAvailable) return;

        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: newMessage.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false
        };

        setMessages([...messages, newMsg]);
        setNewMessage('');
        
        // Simulate doctor reply after 2 seconds
        setTimeout(() => {
            const replyMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'doctor',
                text: localize({ 
                    en: 'Welcome to this chat. I am reviewing your health assessment now.', 
                    ar: 'مرحباً بك في المحادثة. أقوم بمراجعة التقييم الصحي الخاص بك الآن.' 
                }),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: true
            };
            setMessages(prev => {
                // mark user message as read
                const updated = prev.map(m => m.id === newMsg.id ? { ...m, read: true } : m);
                return [...updated, replyMsg];
            });
        }, 2000);
    };

    const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 h-[calc(100vh-140px)] flex flex-col">
            <div className="mb-4">
                <Link to="/dashboard" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium">
                    <BackIcon size={20} className="me-1" />
                    {t('dash.my_consultations')}
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-grow">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 justify-between items-center">
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">
                            {localize(booking.serviceName) || t('highlight.consult')}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {localize({ en: 'With:', ar: 'مع:' })} {localize(booking.instructorName)}
                        </p>
                    </div>
                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <Clock size={16} className="text-emerald-500" />
                            <span dir="ltr">{booking.date} | {booking.time}</span>
                        </div>
                    </div>
                </div>

                {/* Status Bar for disabled chat */}
                {!isChatAvailable && (
                    <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-start gap-3">
                        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-amber-800 font-medium text-sm">
                                {localize({ 
                                    en: 'Chat is currently disabled', 
                                    ar: 'المحادثة معطلة حالياً' 
                                })}
                            </p>
                            <p className="text-amber-700/80 text-xs mt-0.5">
                                {localize({ 
                                    en: 'You can start sending messages when the consultation time arrives.', 
                                    ar: 'يمكنك البدء في إرسال الرسائل عندما يحين وقت الاستشارة.' 
                                })}
                            </p>
                        </div>
                    </div>
                )}

                {/* Chat Area */}
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

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-200">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <button
                            type="button"
                            className={`p-2 rounded-xl transition-colors ${
                                isChatAvailable 
                                    ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50' 
                                    : 'text-slate-300 cursor-not-allowed'
                            }`}
                            disabled={!isChatAvailable}
                        >
                            <Paperclip size={20} />
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={localize({ 
                                en: isChatAvailable ? 'Type your message...' : 'Chat disabled...', 
                                ar: isChatAvailable ? 'اكتب رسالتك...' : 'المحادثة معطلة...' 
                            })}
                            className="flex-grow bg-slate-100 border-none focus:ring-2 focus:ring-emerald-500 rounded-xl px-4 py-2 text-sm"
                            disabled={!isChatAvailable}
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
