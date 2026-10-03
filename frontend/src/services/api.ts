import axios from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://menu-production-8ad9.up.railway.app";

const api = axios.create({
  baseURL: API_URL,
});

export default api;