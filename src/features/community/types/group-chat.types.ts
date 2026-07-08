export interface GroupChatRoom {
  id: string;
  is_current: boolean;
  can_send: boolean;
  last_message?: {
    id: string;
    body: string;
    sender_name?: string;
    is_admin_message?: boolean;
    is_deleted?: boolean;
    created_at?: string;
  } | null;
}

export interface GroupChatMessage {
  id: string;
  type?: string | null;
  body: string;
  is_admin_message: boolean;
  sender_name: string;
  is_deleted: boolean;
  created_at?: string | null;
}
