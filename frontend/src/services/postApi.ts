import api from "./api";

export const getAllPosts = async (userId?: string) => {
  const res = await api.get("/posts" + (userId ? `?userId=${userId}` : ""));
  return res.data;
};

export const getPostById = async (id: string) => {
  const res = await api.get(`/posts/${id}`);
  return res.data;
};

export const createPost = async (data: {
  image?: string;
  video?: string;
  description?: string;
  user: string;
  type?: string;
  mediaFile?: { uri: string; name: string; type: string };
}) => {
  const formData = new FormData();
  if (data.mediaFile) {
    formData.append("media", {
      uri: data.mediaFile.uri,
      name: data.mediaFile.name,
      type: data.mediaFile.type,
    } as any);
  }
  if (data.description) formData.append("description", data.description);
  if (data.user) formData.append("user", data.user);
  // Eğer video varsa type otomatik olarak 'reel' olsun
  if (data.video && !data.type) {
    formData.append("type", "reel");
  } else if (data.type) {
    formData.append("type", data.type);
  }
  // image/video path fallback (eski sistem)
  if (data.image && !data.mediaFile) formData.append("image", data.image);
  if (data.video && !data.mediaFile) formData.append("video", data.video);

  const res = await api.post("/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deletePost = async (postId: string) => {
  const res = await api.delete(`/posts/${postId}`);
  return res.data;
};

export const toggleLike = async (postId: string, userId: string) => {
  const res = await api.put(`/posts/${postId}/like`, { userId });
  return res.data;
};

export const getComments = async (postId: string) => {
  const res = await api.get(`/posts/${postId}/comments`);
  return res.data;
};

export const addComment = async (
  postId: string,
  userId: string,
  text: string
) => {
  const res = await api.post(`/posts/${postId}/comments`, { userId, text });
  return res.data;
};

export const toggleCommentLike = async (commentId: string, userId: string) => {
  const res = await api.put(`/posts/comments/${commentId}/like`, { userId });
  return res.data;
};

export const getUserPosts = async (userId: string, currentUserId?: string) => {
  const url = currentUserId
    ? `/posts/user/${userId}?currentUserId=${currentUserId}`
    : `/posts/user/${userId}`;
  const res = await api.get(url);
  return res.data;
};

export const savePost = async (userId: string, postId: string) => {
  const res = await api.post("/users/save", { userId, postId });
  return res.data;
};

export const getSavedPosts = async (userId: string) => {
  const res = await api.get(`/users/saved/${userId}`);
  return res.data;
};

export const archivePost = async (postId: string, archived: boolean = true) => {
  const res = await api.post(`/posts/${postId}/archive`, { archived });
  return res.data;
};
