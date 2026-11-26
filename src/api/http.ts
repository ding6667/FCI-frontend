import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { clearTokens, getTokens, setTokens } from './token'
import type { ApiResult, TokenResponse } from './types'

/**
 * 统一请求层（employee-api.md §1、§2、§6）
 *
 * - 基地址：VITE_API_BASE_URL，缺省 `/admin`（pig-boot context-path）
 * - 成功判定：Number(code) === 0（成功为数字 0，失败为字符串 "SYS_00x"，不可用全等 0 判断）
 * - 401：先用 refresh_token 换新令牌重放一次；仍失败则清空会话并广播登出事件
 * - 其余业务码原样抛 ApiError，由调用方按 §6 决定文案与动作
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/admin'
const CLIENT_ID = (import.meta.env.VITE_OAUTH_CLIENT_ID as string | undefined) ?? 'pig'
const CLIENT_SECRET = (import.meta.env.VITE_OAUTH_CLIENT_SECRET as string | undefined) ?? 'pig'

/** 登录态失效广播：App 层监听后清空 store 并跳回 S1 */
export const UNAUTHORIZED_EVENT = 'fci:unauthorized'

export class ApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

/* ---------------------------- 业务请求实例 ---------------------------- */

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const { accessToken } = getTokens()
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const basicAuth = () => `Basic ${window.btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`

/** 令牌端点不走业务包装，单独用裸实例 */
const oauth = axios.create({ baseURL: API_BASE_URL, timeout: 15_000 })

export async function oauthTokenRequest(body: URLSearchParams): Promise<TokenResponse> {
  const res = await oauth.post<TokenResponse>('/oauth2/token', body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuth(),
    },
  })
  return res.data
}

/** 合并并发刷新：同一时刻只发一次 refresh，其余请求排队等结果 */
let refreshing: Promise<string> | null = null

function refreshAccessToken(): Promise<string> {
  if (!refreshing) {
    refreshing = (async () => {
      const { refreshToken } = getTokens()
      if (!refreshToken) throw new ApiError('NO_REFRESH_TOKEN', '登录已过期，请重新登录')
      const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
      const token = await oauthTokenRequest(body)
      setTokens(token)
      return token.access_token
    })().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status
    const cfg = error.config as RetriableConfig | undefined

    if (status === 401) {
      if (cfg && !cfg._retry && getTokens().refreshToken) {
        cfg._retry = true
        try {
          const accessToken = await refreshAccessToken()
          cfg.headers.Authorization = `Bearer ${accessToken}`
          return await client.request(cfg)
        } catch {
          /* 刷新失败，走下方登出 */
        }
      }
      clearTokens()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }

    return Promise.reject(error)
  },
)

/**
 * 业务请求：自动判 code、剥出 data。
 * 业务失败（HTTP 200 + SYS_00x）与 403/401 都会抛 ApiError。
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const res = await client.request<ApiResult<T>>(config)
    const body = res.data
    if (Number(body.code) !== 0) {
      throw new ApiError(String(body.code), body.msg ?? '请求失败')
    }
    return body.data as T
  } catch (error) {
    throw toApiError(error)
  }
}

/** 把任意异常归一成 ApiError，便于页面按 code 分支 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  const axiosError = error as AxiosError<{ code?: number | string; msg?: string | null }>
  const body = axiosError.response?.data
  if (body && typeof body === 'object' && 'code' in body) {
    const code = String(body.code ?? 'UNKNOWN')
    const msg = typeof body.msg === 'string' && body.msg ? body.msg : '请求失败'
    return new ApiError(code, msg)
  }

  const status = axiosError.response?.status
  if (status === 401) return new ApiError('SYS_401', '登录已过期，请重新登录')
  if (status === 403) return new ApiError('SYS_006', '无权限访问该功能')
  if (axiosError.code === 'ECONNABORTED') return new ApiError('TIMEOUT', '请求超时，请重试')

  return new ApiError('NETWORK', '网络异常，请检查门店网络后重试')
}
