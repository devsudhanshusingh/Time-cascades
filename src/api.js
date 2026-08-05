import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://my-server-1-nvrv.onrender.com";

export const authStorageKey = "timeCascadesAuth";

export const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem(authStorageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string") return { token: parsed };
      if (parsed?.token || parsed?.accessToken) {
        return { token: parsed.token || parsed.accessToken, user: parsed.user };
      }
    }

    const altToken = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (altToken) return { token: altToken };

    return null;
  } catch {
    const altToken = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (altToken) return { token: altToken };
    return null;
  }
};

export const setStoredAuth = (auth) => {
  localStorage.setItem(authStorageKey, JSON.stringify(auth));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(authStorageKey);
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  const token = auth?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized API access (401). Invalid or expired JWT token.");
    }
    return Promise.reject(error);
  }
);

export default api;
