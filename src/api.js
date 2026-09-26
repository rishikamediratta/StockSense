import axios from "axios";

// In local development, Vite proxies /api to FastAPI. Set VITE_API_URL for a deployed API.
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

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

export const inventoryApi = {
  products: async () => (await api.get("/api/products")).data,
  warehouses: async () => (await api.get("/api/warehouses")).data,
  locations: async () => (await api.get("/api/locations")).data,
  receipts: async () => (await api.get("/api/receipts")).data,
  deliveries: async () => (await api.get("/api/deliveries")).data,
  moves: async () => (await api.get("/api/moves")).data,
  transfers: async () => (await api.get("/api/transfers")).data,
  adjustments: async () => (await api.get("/api/adjustments")).data,
  createReceipt: async (payload) => (await api.post("/api/receipts", payload)).data,
  createDelivery: async (payload) => (await api.post("/api/deliveries", payload)).data,
  readyReceipt: async (id) => (await api.patch(`/api/receipts/${id}/ready`)).data,
  validateReceipt: async (id) => (await api.patch(`/api/receipts/${id}/validate`)).data,
  cancelReceipt: async (id) => (await api.patch(`/api/receipts/${id}/cancel`)).data,
  readyDelivery: async (id) => (await api.patch(`/api/deliveries/${id}/ready`)).data,
  validateDelivery: async (id) => (await api.patch(`/api/deliveries/${id}/validate`)).data,
  cancelDelivery: async (id) => (await api.patch(`/api/deliveries/${id}/cancel`)).data,
  createProduct: async (payload) => (await api.post("/api/products", payload)).data,
  updateProduct: async (id, payload) => (await api.patch(`/api/products/${id}`, payload)).data,
  createWarehouse: async (payload) => (await api.post("/api/warehouses", payload)).data,
  createLocation: async (payload) => (await api.post("/api/locations", payload)).data,
  createTransfer: async (payload) => (await api.post("/api/transfers", payload)).data,
  createAdjustment: async (payload) => (await api.post("/api/adjustments", payload)).data,
};

export default api;
