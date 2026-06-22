'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';

export interface ConsultationChatAttachment {
  name: string;
  url: string;
  mimeType: string;
}

export interface ConsultationChatMessage {
  id: string;
  consultationId: string;
  sender: 'user' | 'doctor';
  text: string;
  timestamp: string;
  read: boolean;
  attachment?: ConsultationChatAttachment;
}

const CHAT_MESSAGES_KEY = 'b3-consultation-chat-messages';

function getAllMessages(): ConsultationChatMessage[] {
  return readLocalStorageJson<ConsultationChatMessage[]>(CHAT_MESSAGES_KEY, []);
}

export function getConsultationChatMessages(consultationId: string): ConsultationChatMessage[] {
  return getAllMessages().filter((message) => message.consultationId === consultationId);
}

export function addConsultationChatMessage(
  consultationId: string,
  input: Omit<ConsultationChatMessage, 'id' | 'consultationId' | 'timestamp' | 'read'> & { read?: boolean },
): ConsultationChatMessage {
  const message: ConsultationChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    consultationId,
    sender: input.sender,
    text: input.text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: input.read ?? false,
    attachment: input.attachment,
  };
  writeLocalStorageJson(CHAT_MESSAGES_KEY, [...getAllMessages(), message]);
  return message;
}
