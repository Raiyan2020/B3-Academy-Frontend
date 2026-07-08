import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/api-error';
import { CommunityChat } from './community-chat';
import { useGroupChatMessages, useGroupChatRoom, useSendGroupChatMessage } from '../hooks/use-group-chat';

vi.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({ user: { id: 'user-1', name: 'Member' } }),
}));

vi.mock('../../../../LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    localize: (value: { en: string; ar: string }) => value.en,
    dir: 'ltr',
  }),
}));

vi.mock('../hooks/use-group-chat', () => ({
  useGroupChatRoom: vi.fn(),
  useGroupChatMessages: vi.fn(),
  useSendGroupChatMessage: vi.fn(),
}));

const roomHook = vi.mocked(useGroupChatRoom);
const messagesHook = vi.mocked(useGroupChatMessages);
const sendHook = vi.mocked(useSendGroupChatMessage);
const mutate = vi.fn();

function renderChat() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CommunityChat />
    </QueryClientProvider>,
  );
}

describe('CommunityChat', () => {
  beforeEach(() => {
    mutate.mockReset();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    sendHook.mockReturnValue({ mutate, isPending: false } as unknown as ReturnType<typeof useSendGroupChatMessage>);
    messagesHook.mockReturnValue({ data: [], isLoading: false } as ReturnType<typeof useGroupChatMessages>);
  });

  it('shows subscription access state for backend 403 errors', () => {
    roomHook.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError({ status: 403, key: 'subscription_required', message: 'subscription required' }),
    } as ReturnType<typeof useGroupChatRoom>);

    renderChat();

    expect(screen.getByText('Subscribers Only')).toBeInTheDocument();
    expect(screen.getByText('Could not load the community room.')).toBeInTheDocument();
  });

  it('disables composer when backend can_send is false', async () => {
    roomHook.mockReturnValue({
      data: { id: 'room-1', is_current: true, can_send: false, last_message: null },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useGroupChatRoom>);

    renderChat();

    const input = screen.getByPlaceholderText('Type a message to the community...');
    expect(input).toBeDisabled();
    expect(screen.getByText('Sending is disabled for your account.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(mutate).not.toHaveBeenCalled();
  });
});
