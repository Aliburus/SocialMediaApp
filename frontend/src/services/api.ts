import axios from "axios";
// @ts-ignore
import { BACKEND_URL } from "@env";

const API_URL: string = BACKEND_URL;

const api = axios.create({
  baseURL: API_URL + "/api",
  withCredentials: true,
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
