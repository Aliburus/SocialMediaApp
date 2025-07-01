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
export const getAllPosts = async () => {
  const res = await api.get("/posts");
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
