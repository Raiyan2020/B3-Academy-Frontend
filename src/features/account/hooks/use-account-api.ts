'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountKeys } from '../query-keys';
import {
  changeBackendPassword,
  getBackendProfile,
  resendBackendEmailChangeCode,
  sendBackendEmailChangeCode,
  updateBackendProfile,
  verifyBackendEmailChangeCode,
} from '../services/profile-api.service';
import {
  createBackendAddress,
  deleteBackendAddress,
  getBackendAddresses,
  setBackendDefaultAddress,
  updateBackendAddress,
  type AddressInput,
} from '../services/addresses-api.service';
import {
  clearAllBackendNotifications,
  deleteBackendNotification,
  deleteManyBackendNotifications,
  getBackendNotifications,
  getBackendUnreadNotificationCount,
  markAllBackendNotificationsRead,
  markBackendNotificationRead,
  toggleBackendNotifications,
} from '../services/notifications-api.service';
import {
  getBackendNewsletterStatus,
  resendBackendNewsletterVerification,
  subscribeBackendNewsletter,
  unsubscribeBackendNewsletter,
  verifyBackendNewsletter,
} from '@/features/newsletter/services/newsletter-api.service';
import { getStoredApiToken } from '@/features/auth/services/auth-api.service';

function hasBackendToken() {
  return Boolean(getStoredApiToken());
}

export function useBackendProfile() {
  return useQuery({
    queryKey: accountKeys.profile(),
    queryFn: getBackendProfile,
    enabled: hasBackendToken(),
    retry: 1,
  });
}

export function useUpdateBackendProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBackendProfile,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: accountKeys.profile() }),
  });
}

export function useBackendEmailChange() {
  const queryClient = useQueryClient();
  return {
    send: useMutation({ mutationFn: sendBackendEmailChangeCode }),
    resend: useMutation({ mutationFn: resendBackendEmailChangeCode }),
    verify: useMutation({
      mutationFn: verifyBackendEmailChangeCode,
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: accountKeys.profile() }),
    }),
  };
}

export function useChangeBackendPassword() {
  return useMutation({ mutationFn: changeBackendPassword });
}

export function useBackendNewsletter() {
  return useQuery({
    queryKey: accountKeys.newsletter(),
    queryFn: getBackendNewsletterStatus,
    enabled: hasBackendToken(),
    retry: 1,
  });
}

export function useBackendNewsletterActions() {
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: accountKeys.newsletter() });
  return {
    subscribe: useMutation({ mutationFn: subscribeBackendNewsletter, onSuccess: invalidate }),
    verify: useMutation({ mutationFn: verifyBackendNewsletter, onSuccess: invalidate }),
    resend: useMutation({ mutationFn: resendBackendNewsletterVerification, onSuccess: invalidate }),
    unsubscribe: useMutation({ mutationFn: unsubscribeBackendNewsletter, onSuccess: invalidate }),
  };
}

export function useBackendAddresses() {
  return useQuery({
    queryKey: accountKeys.addresses(),
    queryFn: getBackendAddresses,
    enabled: hasBackendToken(),
    retry: 1,
  });
}

export function useBackendAddressActions() {
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: accountKeys.addresses() });
  return {
    create: useMutation({ mutationFn: (input: AddressInput) => createBackendAddress(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: AddressInput }) => updateBackendAddress(id, input), onSuccess: invalidate }),
    setDefault: useMutation({ mutationFn: setBackendDefaultAddress, onSuccess: invalidate }),
    delete: useMutation({ mutationFn: deleteBackendAddress, onSuccess: invalidate }),
  };
}

export function useBackendNotifications() {
  return useQuery({
    queryKey: accountKeys.notifications(),
    queryFn: getBackendNotifications,
    enabled: hasBackendToken(),
    retry: 1,
  });
}

export function useBackendUnreadNotificationCount() {
  return useQuery({
    queryKey: accountKeys.notificationUnreadCount(),
    queryFn: getBackendUnreadNotificationCount,
    enabled: hasBackendToken(),
    retry: 1,
  });
}

export function useBackendNotificationActions() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: accountKeys.notifications() });
    void queryClient.invalidateQueries({ queryKey: accountKeys.notificationUnreadCount() });
  };
  return {
    markRead: useMutation({ mutationFn: markBackendNotificationRead, onSuccess: invalidate }),
    markAllRead: useMutation({ mutationFn: markAllBackendNotificationsRead, onSuccess: invalidate }),
    delete: useMutation({ mutationFn: deleteBackendNotification, onSuccess: invalidate }),
    deleteMany: useMutation({ mutationFn: deleteManyBackendNotifications, onSuccess: invalidate }),
    clearAll: useMutation({ mutationFn: clearAllBackendNotifications, onSuccess: invalidate }),
    toggle: useMutation({ mutationFn: toggleBackendNotifications, onSuccess: invalidate }),
  };
}
