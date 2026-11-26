import axios from 'axios'

/**
 * 统一请求客户端。
 * 接口方案落地后，在 src/api/modules 下按领域补充 request 函数，
 * 页面只依赖 store，不直接调用 axios。
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('fci:token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (res) => res,
  (error) => {
    // 预留统一错误处理：401 跳登录、业务错误码映射提示
    return Promise.reject(error)
  },
)
