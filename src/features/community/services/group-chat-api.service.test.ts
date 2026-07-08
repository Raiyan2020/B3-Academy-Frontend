import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/lib/api/base-fetch';
import { getCurrentGroupChatRoom, getGroupChatMessages, sendGroupChatMessage } from './group-chat-api.service';

vi.mock('@/lib/api/base-fetch', () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe('group-chat-api.service', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('loads the current room from the backend route file endpoint', async () => {
    apiFetchMock.mockResolvedValueOnce({
      id: 5,
      is_current: true,
      can_send: false,
      last_message: {
        id: 9,
        body: 'Welcome',
        sender_name: 'Admin',
        is_admin_message: true,
        is_deleted: false,
        created_at: '2026-07-08T10:00:00Z',
      },
    });

    const room = await getCurrentGroupChatRoom();

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith('/api/user/group-chat/current-room');
    expect(room).toMatchObject({
      id: '5',
      is_current: true,
      can_send: false,
      last_message: { id: '9', body: 'Welcome', is_admin_message: true },
    });
  });

  it('maps paginated messages', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: 1,
          type: 'text',
          body: 'Hello',
          is_admin_message: false,
          sender_name: 'Member',
          is_deleted: false,
          created_at: '2026-07-08T10:01:00Z',
        },
      ],
    });

    const messages = await getGroupChatMessages();

    expect(apiFetchMock).toHaveBeenCalledWith('/api/user/group-chat/messages');
    expect(messages).toEqual([
      {
        id: '1',
        type: 'text',
        body: 'Hello',
        is_admin_message: false,
        sender_name: 'Member',
        is_deleted: false,
        created_at: '2026-07-08T10:01:00Z',
      },
    ]);
  });

  it('trims message body before posting', async () => {
    apiFetchMock.mockResolvedValueOnce({ id: 2 });

    await sendGroupChatMessage({ body: '  hello community  ' });

    expect(apiFetchMock).toHaveBeenCalledWith('/api/user/group-chat/messages', {
      method: 'POST',
      body: { body: 'hello community' },
    });
  });
});
