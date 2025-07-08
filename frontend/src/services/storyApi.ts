import api from "./api";

export const getStories = async (userId?: string) => {
  const url = userId ? `/users/stories?userId=${userId}` : "/users/stories";
  const res = await api.get(url);
  return res.data;
};

export const viewStory = async (storyId: string, userId: string) => {
  const res = await api.post(`/users/stories/${storyId}/view`, { userId });
  return res.data;
};

export const deleteStory = async (storyId: string, userId: string) => {
  const res = await api.delete(`/users/stories/${storyId}`, {
    data: { userId },
  });
  return res.data;
};

export const archiveStory = async (storyId: string, userId: string) => {
  const res = await api.post(`/users/stories/${storyId}/archive`, { userId });
  return res.data;
};

export const getArchivedStories = async (userId: string) => {
  const res = await api.get(`/users/stories/archived/${userId}`);
  return res.data;
};

export const unarchiveStory = async (storyId: string, userId: string) => {
  const res = await api.post(`/users/stories/${storyId}/unarchive`, { userId });
  return res.data;
};

export const getStoryStats = async (userId: string) => {
  const res = await api.get(`/users/stories/stats/${userId}`);
  return res.data;
};
