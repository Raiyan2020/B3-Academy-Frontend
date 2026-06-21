import type { AiChatMessage } from '../types/ai-chat.types';

export const chatWithAI = async (message: string, history: AiChatMessage[] = []) => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    return "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }

  const data = (await response.json()) as { text?: string };
  return data.text || "I'm sorry, I couldn't process that request.";
};
