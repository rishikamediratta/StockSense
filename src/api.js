import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("stocksense-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
  login: async (login_id, password) => {
    const res = await api.post("/api/auth/login", { login_id, password });
    return res.data;
  },
  signup: async (login_id, email, password) => {
    const res = await api.post("/api/auth/signup", { login_id, email, password });
    return res.data;
  },
  me: async () => {
    const res = await api.get("/api/auth/me");
    return res.data;
  },
  requestReset: async (email) => {
    const res = await api.post("/api/auth/forgot-password/request", { email });
    return res.data;
  },
  verifyReset: async (email, otp) => {
    const res = await api.post("/api/auth/forgot-password/verify", { email, otp });
    return res.data;
  },
  confirmReset: async (email, otp, new_password) => {
    const res = await api.post("/api/auth/forgot-password/confirm", {
      email,
      otp,
      new_password,
    });
    return res.data;
  },
};

export default api;
