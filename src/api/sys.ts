import { request } from './http'
import type {
  ApiPage,
  EmployeeQuery,
  EmployeeSaveCmd,
  EmployeeStatus,
  EmployeeVO,
  OperationLogQuery,
  OperationLogVO,
  PageQuery,
  PermissionVO,
  RoleSaveCmd,
  RoleVO,
} from './types'

/**
 * 员工 / 角色 / 权限点 / 审计接口（employee-api.md §4.2 ~ §4.6）
 *
 * 门店端目前只用 #2 的权限集合控制入口；这里的方法供后续「员工管理、角色授权、
 * 审批中心、操作日志」页面直接复用，路径与入参严格按契约（#4 ~ #18、#23）。
 */

/* ------------------------------ 员工档案 ------------------------------ */

export function employeesPage(query: EmployeeQuery): Promise<ApiPage<EmployeeVO>> {
  return request<ApiPage<EmployeeVO>>({ url: '/employees/page', method: 'GET', params: query })
}

/** 详情；员工不存在时服务端返回 code="SYS_001"（§9.2 D4，按 msg 展示） */
export function employeeDetail(empId: string): Promise<EmployeeVO> {
  return request<EmployeeVO>({ url: `/employees/${empId}`, method: 'GET' })
}

/** 入职开通账号（#6），返回新员工 ID */
export function createEmployee(cmd: EmployeeSaveCmd): Promise<string> {
  return request<string>({ url: '/employees', method: 'POST', data: cmd })
}

/** 资料变更（#7）：empNo / loginName / password 不生效，交由服务端忽略 */
export function updateEmployee(empId: string, cmd: EmployeeSaveCmd): Promise<null> {
  return request<null>({ url: `/employees/${empId}`, method: 'PUT', data: cmd })
}

/** 管理员重置口令（#8） */
export function resetPassword(empId: string, newPassword: string): Promise<null> {
  return request<null>({ url: `/employees/${empId}/password`, method: 'PUT', data: { newPassword } })
}

/** 冻结 / 解冻，仅允许 1↔2；离职必须走 disableOnLeave（§9.2 D5） */
export function updateEmployeeStatus(empId: string, status: Extract<EmployeeStatus, 1 | 2>): Promise<null> {
  return request<null>({ url: `/employees/${empId}/status`, method: 'PUT', data: { status } })
}

/** 离职停用（#10），幂等；存在未完结审批单时返回 SYS_008 */
export function disableOnLeave(empId: string, leaveDate?: string): Promise<null> {
  return request<null>({ url: `/employees/${empId}:disable-on-leave`, method: 'POST', data: { leaveDate } })
}

/** 设定审批额度（#11）：不得为负，且不得超过操作人自身额度（SYS_011） */
export function updateApprovalLimit(empId: string, limit: number): Promise<null> {
  return request<null>({ url: `/employees/${empId}/approval-limit`, method: 'PUT', data: { limit } })
}

/** 员工授权（#12），全量替换语义 */
export function assignRoles(empId: string, roleIds: string[]): Promise<null> {
  return request<null>({ url: `/employees/${empId}/roles`, method: 'PUT', data: { roleIds } })
}

/* ------------------------------ 角色 ------------------------------ */

export function rolesPage(query: PageQuery & { roleName?: string; roleCode?: string }): Promise<ApiPage<RoleVO>> {
  return request<ApiPage<RoleVO>>({ url: '/roles/page', method: 'GET', params: query })
}

export function createRole(cmd: RoleSaveCmd): Promise<string> {
  return request<string>({ url: '/roles', method: 'POST', data: cmd })
}

export function updateRole(roleId: string, cmd: RoleSaveCmd): Promise<null> {
  return request<null>({ url: `/roles/${roleId}`, method: 'PUT', data: cmd })
}

/** 删除角色（#16）：内置角色禁止删除（SYS_009） */
export function deleteRole(roleId: string): Promise<null> {
  return request<null>({ url: `/roles/${roleId}`, method: 'DELETE' })
}

/** 角色授权（#17），全量替换；建议连同父节点一并提交 */
export function assignPermissions(roleId: string, permIds: string[]): Promise<null> {
  return request<null>({ url: `/roles/${roleId}/permissions`, method: 'PUT', data: { permIds } })
}

/* ------------------------------ 权限点 ------------------------------ */

/** 权限树（#18），服务端已按 sortOrder 组装好 children */
export function permissionTree(): Promise<PermissionVO[]> {
  return request<PermissionVO[]>({ url: '/permissions/tree', method: 'GET' })
}

/* ------------------------------ 审计 ------------------------------ */

export function operationLogsPage(query: OperationLogQuery): Promise<ApiPage<OperationLogVO>> {
  return request<ApiPage<OperationLogVO>>({ url: '/operation-logs/page', method: 'GET', params: query })
}
