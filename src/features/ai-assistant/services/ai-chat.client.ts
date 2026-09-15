import type { AiChatMessage } from '../types/ai-chat.types';
import { apiFetch } from '@/lib/api/base-fetch';
import { resolveAssistantReply } from './assistant-config.service';

export interface AssistantPublicConfig {
  isEnabled: boolean;
  welcomeMessage: string | null;
}

interface AssistantPublicConfigApi {
  is_enabled?: boolean;
  welcome_message?: string | null;
}

interface AssistantMessageApi {
  message?: string | null;
}

/**
 * The backend localizes this response from Accept-Language, which apiFetch
 * supplies from the user's persisted language preference.
 */
export async function getAssistantPublicConfig(): Promise<AssistantPublicConfig> {
  const response = await apiFetch<AssistantPublicConfigApi>('/api/general/ai-assistant');
  return {
    isEnabled: Boolean(response.is_enabled),
    welcomeMessage: response.welcome_message ?? null,
  };
}

/** Send a message to the backend keyword/answer engine. */
export async function sendAssistantMessage(message: string): Promise<string> {
  const response = await apiFetch<AssistantMessageApi>('/api/general/ai-assistant/messages', {
    method: 'POST',
    body: { message },
  });
  return response.message ?? '';
}

/**
 * Local fallback retained for offline/demo mode. The backend currently does
 * not accept conversation history, so it is deliberately not serialized.
 */
export async function chatWithAI(message: string, history: AiChatMessage[] = []) {
  void history;
  try {
    const response = await sendAssistantMessage(message);
    if (response) return response;
  } catch {
    // Keep the supplementary widget useful when the API is unavailable.
  }

  const hasArabic = /[\u0600-\u06ff]/.test(message);
  return resolveAssistantReply(message, hasArabic ? 'ar' : 'en');
}
