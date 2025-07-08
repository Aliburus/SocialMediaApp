import api from "./api";

export const getProfile = async (userId: string) => {
  const res = await api.get(`/users/profile/${userId}`);
  return res.data;
};

export const updateProfile = async (data: {
  userId: string;
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  privateAccount?: boolean;
}) => {
  const res = await api.post("/users/update-profile", data);
  return res.data;
};

export const searchUsers = async (query: string) => {
  const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
  return res.data;
};

export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const res = await api.post("/users/change-password", {
    userId,
    oldPassword,
    newPassword,
  });
  return res.data;
};

export const getUserFriends = async (userId: string) => {
  const res = await api.get(`/users/friends/${userId}`);
  return res.data;
};

export const getNotificationSettings = async (userId: string) => {
  const res = await api.get(`/users/notification-settings/${userId}`);
  return res.data;
};

export const updateNotificationSettings = async (
  userId: string,
  settings: { push: boolean; comment: boolean; follow: boolean }
) => {
  const res = await api.post("/users/notification-settings", {
    userId,
    settings,
  });
  return res.data;
};
