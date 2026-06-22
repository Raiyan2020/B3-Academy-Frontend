'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';

export interface CommunityChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  timestamp: string;
  createdAt: string;
  isAdmin?: boolean;
  isDeleted?: boolean;
}

const COMMUNITY_CHAT_KEY = 'b3-community-chat-messages';

const seedMessages: CommunityChatMessage[] = [
  {
    id: 'chat-seed-0',
    senderName: 'Dr. Sarah (Admin)',
    senderId: 'admin1',
    text: 'Archived community notice from before current subscription window.',
    timestamp: '9:00 AM',
    createdAt: new Date('2025-06-01T09:00:00.000Z').toISOString(),
    isAdmin: true,
  },
  {
    id: 'chat-seed-1',
    senderName: 'Dr. Sarah (Admin)',
    senderId: 'admin1',
    text: 'Welcome to the subscriber community. Please keep messages text-only and respectful.',
    timestamp: '10:10 AM',
    createdAt: new Date('2026-01-01T10:10:00.000Z').toISOString(),
    isAdmin: true,
  },
  {
    id: 'chat-seed-2',
    senderName: 'Member',
    senderId: 'u-muted',
    text: 'This message was removed by administration.',
    timestamp: '10:15 AM',
    createdAt: new Date('2026-01-02T10:15:00.000Z').toISOString(),
    isDeleted: true,
  },
];

export function getCommunityChatMessages(subscriptionStartDate?: string) {
  const stored = readLocalStorageJson<CommunityChatMessage[]>(COMMUNITY_CHAT_KEY, []);
  const messages = stored.length > 0 ? stored : seedMessages;
  if (!subscriptionStartDate) return messages;
  const start = new Date(subscriptionStartDate).getTime();
  return messages.filter((message) => new Date(message.createdAt).getTime() >= start);
}

export function addCommunityChatMessage(input: {
  senderId: string;
  senderName: string;
  text: string;
}) {
  const now = new Date();
  const message: CommunityChatMessage = {
    id: `chat-${Date.now()}`,
    senderId: input.senderId,
    senderName: input.senderName,
    text: input.text,
    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: now.toISOString(),
  };
  const messages = getCommunityChatMessages();
  writeLocalStorageJson(COMMUNITY_CHAT_KEY, [...messages, message]);
  return message;
}
