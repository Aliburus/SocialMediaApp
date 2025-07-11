import api from "./api";

export const getNotifications = async (userId: string) => {
  const res = await api.get(`/notifications/${userId}`);
  return res.data;
};

export const getUnreadNotificationCount = async (userId: string) => {
  const res = await api.get(`/notifications/${userId}/unread-count`);
  return res.data;
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const res = await api.put(`/notifications/${userId}/read-all`);
  return res.data;
};
