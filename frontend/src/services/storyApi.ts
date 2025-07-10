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

export const createStory = async (data: {
  user: string;
  imageFile?: { uri: string; name: string; type: string };
  videoFile?: { uri: string; name: string; type: string };
  image?: string;
  video?: string;
}) => {
  const formData = new FormData();
  if (data.user) formData.append("user", data.user);
  if (data.imageFile) {
    formData.append("media", {
      uri: data.imageFile.uri,
      name: data.imageFile.name,
      type: data.imageFile.type,
    } as any);
  }
  if (data.videoFile) {
    formData.append("media", {
      uri: data.videoFile.uri,
      name: data.videoFile.name,
      type: data.videoFile.type,
    } as any);
  }
  if (data.image && !data.imageFile) formData.append("image", data.image);
  if (data.video && !data.videoFile) formData.append("video", data.video);
  const res = await api.post("/users/stories", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
