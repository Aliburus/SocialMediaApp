import axios from "axios";
// @ts-ignore
import { BACKEND_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL: string = BACKEND_URL;

const api = axios.create({
  baseURL: API_URL + "/api",
  withCredentials: true,
});

// Her isteğe otomatik token ekle
api.interceptors.request.use(async (config) => {
  try {
    const userStr = await AsyncStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${user.token}`;
      }
    }
  } catch (e) {}
  return config;
});

export default api;

export * from "./userApi";
export * from "./postApi";
export * from "./storyApi";
export * from "./notificationApi";
export * from "./messageApi";
export * from "./followApi";

// Message API fonksiyonlarını doğrudan export et
export { getUnreadMessageCount } from "./messageApi";
