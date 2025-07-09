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
  description?: string;
  user: string;
  type?: string;
  video?: string;
}) => {
  const res = await api.post("/posts", data);
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
