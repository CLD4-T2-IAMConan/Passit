// frontend/src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_CS_API_URL || "http://cs-service.passit.com",
  headers: { "Content-Type": "application/json" },
});

export default api;

// (선택) 요청/응답 디버깅
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
