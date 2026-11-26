import axios from 'axios'
import { ApiError, oauthTokenRequest, request, toApiError } from './http'
import { clearTokens, setTokens } from './token'
import type { LoginResult } from './types'

/**
 * 认证接口（employee-api.md §1.2、§1.3、#1 / #2 / #3）
 *
 * 令牌端点返回 OAuth2 标准结构（非 {code,msg,data} 成功体），
 * 失败时返回 pig 的 R 结构，`data` 是 OAuth2 错误码字符串，见 §9.2 D1。
 */

/** 把令牌端点的失败响应映射成业务错误码（§6） */
function mapTokenError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { msg?: string; data?: string } | undefined
    const reason = typeof body?.data === 'string' ? body.data : ''
    const msg = typeof body?.msg === 'string' && body.msg ? body.msg : '登录失败，请稍后重试'

    // §9.2 D1：username_not_found 必须与口令错误合并，不得暴露账号是否存在
    if (reason === 'bad_credentials' || reason === 'username_not_found') {
      return new ApiError('SYS_001', '账号或口令错误')
    }
    // 冻结 / 离职 / 连错锁定：前端需禁用登录按钮并倒计时
    if (reason === 'user_locked' || reason === 'user_disable') {
      return new ApiError('SYS_003', msg)
    }
    return new ApiError('SYS_001', msg)
  }
  return toApiError(error)
}

/**
 * 员工登录：先取令牌，再拉 /auth/me 拿门店、岗位与权限集合。
 * 任一步失败都不保留令牌（§8.4 失败分支）。
 */
export async function login(username: string, password: string): Promise<LoginResult> {
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
    scope: 'server',
  })

  try {
    const token = await oauthTokenRequest(body)
    setTokens(token)
  } catch (error) {
    throw mapTokenError(error)
  }

  try {
    return await me()
  } catch (error) {
    clearTokens()
    throw toApiError(error)
  }
}

/** 当前登录人：刷新页面后用令牌恢复身份（#2） */
export function me(): Promise<LoginResult> {
  return request<LoginResult>({ url: '/auth/me', method: 'GET' })
}

/** 查询指定员工权限码；空数组表示无权限点，不报错（#3，注意冒号是路径的一部分） */
export function employeePermissions(empId: string): Promise<string[]> {
  return request<string[]>({ url: `/employees/${empId}:permissions`, method: 'GET' })
}

/** 注销：成功与否都清空本地令牌（§1.3） */
export async function logout(): Promise<void> {
  try {
    await request<null>({ url: '/token/logout', method: 'DELETE' })
  } finally {
    clearTokens()
  }
}
