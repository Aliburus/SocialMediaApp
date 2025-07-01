import api from "./api";

export const register = async (data: {
  name: string;
  username: string;
  email: string;
  password: string;
}) => {
  const res = await api.post("/users/register", data);
  return res.data;
};

export const login = async (data: {
  emailOrUsername: string;
  password: string;
}) => {
  const res = await api.post("/users/login", data);
  return res.data;
};
