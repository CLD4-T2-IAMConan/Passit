import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8085",
  withCredentials: false,
});

// 요청 인터셉터
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log("📤 [Request]", config.method, config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ [Axios Error]", error);
    return Promise.reject(error);
  }
);

//  named export
export const axiosInstance = instance;
//  default export
export default instance;