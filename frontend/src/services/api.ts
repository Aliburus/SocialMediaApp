import axios from "axios";
// @ts-ignore
import { BACKEND_URL } from "@env";

const API_URL: string = BACKEND_URL;

const api = axios.create({
  baseURL: API_URL + "/api",
  withCredentials: true,
});

export default api;

// Tüm postları listele
export const getAllPosts = async (userId?: string) => {
  const res = await api.get("/posts" + (userId ? `?userId=${userId}` : ""));
  return res.data;
};

// Tekil post detayını getir
export const getPostById = async (id: string) => {
  const res = await api.get(`/posts/${id}`);
  return res.data;
};

// Post oluştur
export const createPost = async (data: {
  image: string;
  description?: string;
  user: string;
}) => {
  const res = await api.post("/posts", data);
  return res.data;
};

// Postu beğen veya beğenmekten vazgeç
export const toggleLike = async (postId: string, userId: string) => {
  const res = await api.put(`/posts/${postId}/like`, { userId });
  return res.data;
};

// Postun yorumlarını getir
export const getComments = async (postId: string) => {
  const res = await api.get(`/posts/${postId}/comments`);
  return res.data;
};

// Posta yorum ekle
export const addComment = async (
  postId: string,
  userId: string,
  text: string
) => {
  const res = await api.post(`/posts/${postId}/comments`, { userId, text });
  return res.data;
};

// Yorumu beğen veya beğenmekten vazgeç
export const toggleCommentLike = async (commentId: string, userId: string) => {
  const res = await api.put(`/posts/comments/${commentId}/like`, { userId });
  return res.data;
};

// Kullanıcının kendi postlarını getir
export const getUserPosts = async (userId: string) => {
  const res = await api.get(`/posts/user/${userId}`);
  return res.data;
};

// Kullanıcı profilini güncelle
export const updateProfile = async (data: {
  userId: string;
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
}) => {
  const res = await api.post("/users/update-profile", data);
  return res.data;
};

// Kullanıcı profilini getir
export const getProfile = async (userId: string) => {
  const res = await api.get(`/users/profile/${userId}`);
  return res.data;
};

// Story'leri getir (kullanıcıya göre izlenmişlik için userId parametresi alır)
export const getStories = async (userId?: string) => {
  const url = userId ? `/users/stories?userId=${userId}` : "/users/stories";
  const res = await api.get(url);
  return res.data;
};

// Story'yi görüldü olarak işaretle
export const viewStory = async (storyId: string, userId: string) => {
  const res = await api.post(`/users/stories/${storyId}/view`, { userId });
  return res.data;
};

// Story'yi sil
export const deleteStory = async (storyId: string, userId: string) => {
  const res = await api.delete(`/users/stories/${storyId}`, {
    data: { userId },
  });
  return res.data;
};

// Story'yi arşivle
export const archiveStory = async (storyId: string, userId: string) => {
  const res = await api.post(`/users/stories/${storyId}/archive`, { userId });
  return res.data;
};

// Arşivlenen story'leri getir
export const getArchivedStories = async (userId: string) => {
  const res = await api.get(`/users/stories/archived/${userId}`);
  return res.data;
};

// Story'yi arşivden çıkar
export const unarchiveStory = async (storyId: string, userId: string) => {
  const res = await api.post(`/users/stories/${storyId}/unarchive`, { userId });
  return res.data;
};

// Postu kaydet/kaldır (toggle)
export const savePost = async (userId: string, postId: string) => {
  console.log("[api/savePost] POST", api.defaults.baseURL + "/users/save", {
    userId,
    postId,
  });
  const res = await api.post("/users/save", { userId, postId });
  return res.data;
};

// Kullanıcının kaydedilen postlarını getir
export const getSavedPosts = async (userId: string) => {
  const res = await api.get(`/users/saved/${userId}`);
  return res.data;
};

// Kullanıcıyı takip et
export const followUser = async (userId: string, targetUserId: string) => {
  const res = await api.post("/users/follow", { userId, targetUserId });
  return res.data;
};

// Kullanıcıyı takipten çıkar
export const unfollowUser = async (userId: string, targetUserId: string) => {
  const res = await api.post("/users/unfollow", { userId, targetUserId });
  return res.data;
};

// Username'e göre kullanıcı arama
export const searchUsers = async (query: string) => {
  const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
  return res.data;
};

// Takip isteği gönder
export const sendFollowRequest = async (
  userId: string,
  targetUserId: string
) => {
  const res = await api.post("/users/send-follow-request", {
    userId,
    targetUserId,
  });
  return res.data;
};

// Takip isteğini iptal et
export const cancelFollowRequest = async (
  userId: string,
  targetUserId: string
) => {
  const res = await api.post("/users/cancel-follow-request", {
    userId,
    targetUserId,
  });
  return res.data;
};

// Takip isteğini kabul et
export const acceptFollowRequest = async (
  userId: string,
  requesterId: string
) => {
  const res = await api.post("/users/accept-follow-request", {
    userId,
    requesterId,
  });
  return res.data;
};

// Takip isteğini reddet
export const rejectFollowRequest = async (
  userId: string,
  requesterId: string
) => {
  const res = await api.post("/users/reject-follow-request", {
    userId,
    requesterId,
  });
  return res.data;
};

// Bildirimleri getir
export const getNotifications = async (userId: string) => {
  const res = await api.get(`/users/notifications/${userId}`);
  return res.data;
};

// Postu sil
export const deletePost = async (postId: string) => {
  const res = await api.delete(`/posts/${postId}`);
  return res.data;
};

// Kullanıcının DM listesini getir
export const getUserConversations = async (userId: string) => {
  const res = await api.get(`/users/${userId}/conversations`);
  return res.data;
};

// İki kullanıcı arasındaki conversation ve mesajları getir
export const getConversationMessages = async (
  userId: string,
  otherUserId: string
) => {
  const res = await api.get(
    `/users/${userId}/conversations/${otherUserId}/messages`
  );
  return res.data;
};

// Mesaj gönder
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  text: string
) => {
  const res = await api.post("/users/send-message", {
    senderId,
    receiverId,
    text,
  });
  return res.data;
};

// Kullanıcının arkadaş listesini getir
export const getUserFriends = async (userId: string) => {
  const res = await api.get(`/users/${userId}/friends`);
  return res.data;
};

// Şifre değiştirme
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

export const getNotificationSettings = async (userId: string) => {
  const res = await api.get(`/users/${userId}/notification-settings`);
  return res.data;
};

export const updateNotificationSettings = async (
  userId: string,
  settings: { push: boolean; comment: boolean; follow: boolean }
) => {
  const res = await api.post(
    `/users/${userId}/notification-settings`,
    settings
  );
  return res.data;
};

export const archivePost = async (postId: string, archived: boolean = true) => {
  const res = await api.post(`/posts/${postId}/archive`, { archived });
  return res.data;
};
