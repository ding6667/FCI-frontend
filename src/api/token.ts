import type { TokenResponse } from './types'

/**
 * 令牌存储：按 employee-api.md §1.3，门店共用终端禁止写入 localStorage
 * （收银台换班场景），统一使用 sessionStorage，关闭标签页即失效。
 */
const ACCESS_KEY = 'fci:access_token'
const REFRESH_KEY = 'fci:refresh_token'
const EXPIRE_KEY = 'fci:expires_at'

export interface TokenSnapshot {
  accessToken: string | null
  refreshToken: string | null
  /** 毫秒时间戳；0 表示未知 */
  expiresAt: number
}

const safe = {
  get(key: string): string | null {
    try {
      return sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      sessionStorage.setItem(key, value)
    } catch {
      /* 隐私模式下忽略 */
    }
  },
  remove(key: string) {
    try {
      sessionStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}

export function getTokens(): TokenSnapshot {
  const expiresAt = Number(safe.get(EXPIRE_KEY) ?? 0)
  return {
    accessToken: safe.get(ACCESS_KEY),
    refreshToken: safe.get(REFRESH_KEY),
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : 0,
  }
}

export function setTokens(token: TokenResponse) {
  safe.set(ACCESS_KEY, token.access_token)
  if (token.refresh_token) safe.set(REFRESH_KEY, token.refresh_token)
  const ttl = Number(token.expires_in ?? 0)
  // 提前 60 秒视为过期，避免边界时刻失败
  safe.set(EXPIRE_KEY, String(ttl > 60 ? Date.now() + (ttl - 60) * 1000 : 0))
}

export function clearTokens() {
  safe.remove(ACCESS_KEY)
  safe.remove(REFRESH_KEY)
  safe.remove(EXPIRE_KEY)
}

export function hasSession(): boolean {
  return Boolean(getTokens().accessToken)
}
