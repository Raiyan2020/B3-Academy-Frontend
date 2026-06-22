import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Bot, User, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../LanguageContext';
import {
  getAssistantConfig,
  isAssistantEnabled,
  resolveAssistantReply,
  type AssistantLanguage,
} from '@/features/ai-assistant/services/assistant-config.service';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

function getWelcomeMessage(language: AssistantLanguage): string {
  const config = getAssistantConfig();
  return config.welcomeMessage[language] ?? config.welcomeMessage.en;
}

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const { t, dir, language } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const assistantLanguage: AssistantLanguage = language === 'ar' ? 'ar' : 'en';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetConversation = useCallback(() => {
    setMessages([
      {
        role: 'model',
        text: getWelcomeMessage(assistantLanguage),
        timestamp: new Date(),
      },
    ]);
    setInputValue('');
  }, [assistantLanguage]);

  useEffect(() => {
    resetConversation();
  }, [resetConversation]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, messages]);

  const handleClose = () => {
    setIsOpen(false);
    setMessages([]);
    setInputValue('');
  };

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    const replyText = resolveAssistantReply(trimmed, assistantLanguage);
    const modelMessage: Message = {
      role: 'model',
      text: replyText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, modelMessage]);
    setInputValue('');
  };

  if (!isAssistantEnabled()) {
    return null;
  }

  return (
    <div className={`fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-end`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`mb-4 w-[calc(100vw-2rem)] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col`}
          >
            <div className={`p-4 bg-emerald-600 text-white flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold">{t('chat.title')}</h3>
                  <span className="text-xs text-white/80 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Online
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Minimize2 size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {(messages.length > 0 ? messages : [
                {
                  role: 'model' as const,
                  text: getWelcomeMessage(assistantLanguage),
                  timestamp: new Date(),
                },
              ]).map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <span className={`text-[10px] mt-1 block opacity-70 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t('chat.placeholder')}
                  className={`flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-slate-700 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                >
                  <Send size={20} className={dir === 'rtl' ? 'rotate-180' : ''} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (isOpen) {
            handleClose();
          } else {
            resetConversation();
            setIsOpen(true);
          }
        }}
        className={`w-14 h-14 rounded-full bg-emerald-600 text-white shadow-2xl flex items-center justify-center hover:bg-emerald-700 transition-colors relative group`}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && (
          <span className={`absolute ${dir === 'rtl' ? 'left-full mr-3' : 'right-full ml-3'} px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
            {t('chat.title')}
          </span>
        )}
      </motion.button>
    </div>
  );
};
