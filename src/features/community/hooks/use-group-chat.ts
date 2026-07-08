import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentGroupChatRoom, getGroupChatMessages, sendGroupChatMessage } from '../services/group-chat-api.service';
import { groupChatKeys } from './group-chat.keys';

export function useGroupChatRoom(enabled: boolean) {
  return useQuery({
    queryKey: groupChatKeys.room(),
    queryFn: getCurrentGroupChatRoom,
    enabled,
  });
}

export function useGroupChatMessages(roomId?: string) {
  return useQuery({
    queryKey: groupChatKeys.messages(roomId),
    queryFn: getGroupChatMessages,
    enabled: Boolean(roomId),
    refetchInterval: 10000,
  });
}

export function useSendGroupChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendGroupChatMessage,
    meta: { silentSuccess: true },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: groupChatKeys.all });
    },
  });
}
