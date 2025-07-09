import api from "./api";

export const getUserConversations = async (userId: string) => {
  const res = await api.get(`/users/${userId}/conversations`);
  return res.data;
};

export const getConversationMessages = async (
  userId: string,
  otherUserId: string
) => {
  const res = await api.get(
    `/users/${userId}/conversations/${otherUserId}/messages`
  );
  return res.data;
};

export const sendMessage = async (payload: {
  senderId: string;
  receiverId: string;
  text?: string;
  postId?: string;
  storyId?: string;
}) => {
  const res = await api.post("/users/send-message", payload);
  return res.data;
};

export const markMessagesAsSeen = async (
  userId: string,
  conversationId: string
) => {
  const res = await api.post(`/users/${userId}/mark-messages-seen`, {
    conversationId,
  });
  return res.data;
};

export const getUnreadMessageCount = async (userId: string) => {
  const res = await api.get(`/users/${userId}/unread-count`);
  return res.data;
};

export const deleteConversation = async (
  userId: string,
  conversationId: string
) => {
  const res = await api.post(`/users/delete-conversation`, {
    userId,
    conversationId,
  });
  return res.data;
};
