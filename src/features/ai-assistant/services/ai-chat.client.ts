import { apiFetch } from '@/lib/api/base-fetch';

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

/**
 * Send a message to the backend keyword/answer engine. The backend is the only
 * source of assistant replies: callers must surface an error state on rejection
 * or on an empty reply, never a locally generated answer.
 */
export async function sendAssistantMessage(message: string): Promise<string> {
  const response = await apiFetch<AssistantMessageApi>('/api/general/ai-assistant/messages', {
    method: 'POST',
    body: { message },
  });
  return response.message ?? '';
}
