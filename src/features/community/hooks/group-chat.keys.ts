export const groupChatKeys = {
  all: ['community-chat'] as const,
  room: () => [...groupChatKeys.all, 'room'] as const,
  messages: (roomId?: string) => [...groupChatKeys.all, 'messages', roomId ?? 'default'] as const,
};
