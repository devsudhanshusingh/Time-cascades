import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://my-server-1-nvrv.onrender.com";

export const authStorageKey = "timeCascadesAuth";

export const getStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem(authStorageKey)) || null;
  } catch {
    return null;
  }
};

export const setStoredAuth = (auth) => {
  localStorage.setItem(authStorageKey, JSON.stringify(auth));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(authStorageKey);
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

export default api;
