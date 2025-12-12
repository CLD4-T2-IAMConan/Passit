import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8084",
  withCredentials: false,
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    console.log("📤 [Request]", config.method, config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ [Axios Error]", error);
    return Promise.reject(error);
  }
);

export { axiosInstance };