export const accountKeys = {
  all: ['account'] as const,
  profile: () => [...accountKeys.all, 'profile'] as const,
  newsletter: () => [...accountKeys.all, 'newsletter'] as const,
  addresses: () => [...accountKeys.all, 'addresses'] as const,
  notifications: () => [...accountKeys.all, 'notifications'] as const,
  notificationUnreadCount: () => [...accountKeys.notifications(), 'unread-count'] as const,
  payments: (page?: number) => [...accountKeys.all, 'payments', page ?? 1] as const,
};
