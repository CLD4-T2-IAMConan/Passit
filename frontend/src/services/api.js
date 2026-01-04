// frontend/src/services/api.js
import axios from "axios";

// CloudFront를 통한 CS Service 접근
const CLOUDFRONT_URL = process.env.REACT_APP_CLOUDFRONT_URL || "https://d82dq0ggv7fb.cloudfront.net";
const api = axios.create({
  baseURL: process.env.REACT_APP_CS_API_URL || CLOUDFRONT_URL,
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
