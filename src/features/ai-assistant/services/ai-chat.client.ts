import type { AiChatMessage } from '../types/ai-chat.types';
import { resolveAssistantReply } from './assistant-config.service';

export const chatWithAI = async (message: string, history: AiChatMessage[] = []) => {
  void history;
  const hasArabic = /[\u0600-\u06ff]/.test(message);
  return resolveAssistantReply(message, hasArabic ? 'ar' : 'en');
};
