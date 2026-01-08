// frontend/src/services/api.js
import axios from "axios";
import { API_SERVICES } from "../config/apiConfig";

// CloudFront를 통한 CS Service 접근
const api = axios.create({
  baseURL: API_SERVICES.CS,
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
