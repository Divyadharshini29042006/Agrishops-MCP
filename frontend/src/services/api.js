// frontend/src/services/api.js
import axios from "axios";

// ✅ Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 🔥 dynamic (local + production)
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000,
});

// ✅ Request interceptor (attach token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`🌐 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || "");
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor (handle errors globally)
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (axios.isCancel(error) || error.code === "ERR_CANCELED" || error.message === "canceled") {
      return Promise.reject(error);
    }

    console.error("❌ API Error:", error.response?.data || error.message);

    // 🔐 Handle Unauthorized (401)
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";

      const isAuthEndpoint =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/register");

      if (!isAuthEndpoint) {
        console.log("🔒 Unauthorized! Clearing token...");

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    // ⚠️ Handle Forbidden (403)
    if (error.response?.status === 403) {
      console.warn("⚠️ Access forbidden:", error.response.data.message);
    }

    return Promise.reject(error);
  }
);

export default api;