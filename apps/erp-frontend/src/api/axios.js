import axios from "axios"

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (url) {
    url = url.trim().replace(/\/+$/, "");
    if (!url.endsWith("/api")) {
      url = `${url}/api`;
    }
    return url;
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "/api";
  }
  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: getBaseUrl()
})

// 🔐 Attach JWT Token Automatically (sessionStorage for tab isolation, localStorage fallback)
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 🚨 Response Interceptor: Handle 401 & 429 rate limit responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthPath = window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/super-login")
      if (!isAuthPath) {
        sessionStorage.removeItem("user")
        sessionStorage.removeItem("token")
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    }
    if (error.response && error.response.status === 429) {
      console.warn("[RateLimit] Too many requests hit. Waiting before retrying.")
    }
    return Promise.reject(error)
  }
)

export default api
