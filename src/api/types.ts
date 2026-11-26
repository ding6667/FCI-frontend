/**
 * 员工系统（SYS）接口类型定义
 * 权威来源：employee-api.md v1.0（2026-11-25）
 *
 * 约定：
 * - Long 在 JSON 中一律为字符串（pig 全局 Long → String），前端用 string 承接
 * - BigDecimal 为 JSON number，计算时转分处理
 * - LocalDateTime 为 "yyyy-MM-dd HH:mm:ss"，LocalDate 为 "yyyy-MM-dd"
 */

/** pig 统一返回体：成功 code=0(number)，业务失败 code="SYS_00x"(string) */
export interface ApiResult<T> {
  code: number | string
  msg: string | null
  data: T
}

/** MyBatis-Plus 分页体：只需依赖这五个字段，其余为元数据 */
export interface ApiPage<T> {
  records: T[]
  total: number | string
  size: number | string
  current: number | string
  pages: number | string
}

export interface PageQuery {
  current?: number
  size?: number
}

/* ------------------------------ 认证 ------------------------------ */

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope?: string
}

export interface LoginResult {
  empId: string
  empNo: string
  empName: string
  loginName: string
  storeId?: string | null
  storeName?: string | null
  jobTitle?: string | null
  approvalLimit: number
  roles: string[]
  permissions: string[]
}

/* ------------------------------ 员工 ------------------------------ */

/** 0 离职 / 1 在职 / 2 冻结 */
export type EmployeeStatus = 0 | 1 | 2

export interface EmployeeVO {
  id: string
  empNo: string
  empName: string
  phone: string
  storeId?: string | null
  storeName?: string | null
  loginName: string
  jobTitle?: string | null
  approvalLimit: number
  healthCertNo?: string | null
  healthCertExpire?: string | null
  entryDate?: string | null
  status: EmployeeStatus
  lastLoginTime?: string | null
  roles: RoleVO[]
}

export interface EmployeeQuery extends PageQuery {
  empNo?: string
  empName?: string
  phone?: string
  storeId?: string
  status?: EmployeeStatus
  jobTitle?: string
}

export interface EmployeeSaveCmd {
  empNo: string
  empName: string
  phone: string
  storeId?: string
  loginName: string
  password?: string
  jobTitle?: string
  healthCertNo?: string
  healthCertExpire?: string
  entryDate?: string
  roleIds?: string[]
}

/* ------------------------------ 角色与权限 ------------------------------ */

export type DataScope = 'ALL' | 'REGION' | 'STORE' | 'SELF'

export interface RoleVO {
  id: string
  roleCode: string
  roleName: string
  dataScope: DataScope
  remark?: string | null
  status: number
  isBuiltin: number
  permIds: string[]
}

export interface RoleSaveCmd {
  roleCode: string
  roleName: string
  dataScope?: DataScope
  remark?: string
  status?: number
}

/** 1 菜单 / 2 按钮 / 3 接口 */
export type PermType = 1 | 2 | 3

export interface PermissionVO {
  id: string
  permCode: string
  permName: string
  permType: PermType
  parentId: string
  apiPath?: string | null
  sortOrder?: number | null
  children: PermissionVO[]
}

/* ------------------------------ 审批 ------------------------------ */

export type BizType =
  | 'PRICE'
  | 'WASTE'
  | 'REFUND'
  | 'RETURN'
  | 'WEIGHT'
  | 'TRANSFER'
  | 'PURCHASE'
  | 'EXPIRY'
  | 'INVOICE'

/** 0 待审 / 1 通过 / 2 驳回 / 3 撤回（保留） */
export type ApproveResult = 0 | 1 | 2 | 3

export interface ApprovalSubmitCmd {
  bizType: BizType
  bizId: string
  bizNo?: string
  applyEmpId: string
  applyAmount: number
  /** 业务快照，必须是 JSON.stringify 后的字符串 */
  snapshotJson: string
}

export interface DecideCmd {
  result: 'PASS' | 'REJECT'
  remark?: string
}

export interface ApprovalVO {
  id: string
  approvalNo: string
  bizType: BizType
  bizId: string
  bizNo?: string | null
  applyEmpId: string
  applyEmpName?: string | null
  applyAmount: number
  needLevel: 1 | 2
  approverEmpId?: string | null
  approverEmpName?: string | null
  approveResult: ApproveResult
  approveTime?: string | null
  approveRemark?: string | null
  snapshotJson?: string | null
  createTime: string
}

export interface ApprovalQuery extends PageQuery {
  bizType?: BizType
  approveResult?: ApproveResult
  approverEmpId?: string
  applyEmpId?: string
  bizNo?: string
}

/* ------------------------------ 审计 ------------------------------ */

export interface OperationLogVO {
  id: string
  operatorEmpId?: string | null
  operatorType: number
  module: string
  action: string
  targetType?: string | null
  targetId?: string | null
  beforeJson?: string | null
  afterJson?: string | null
  clientIp?: string | null
  createTime: string
}

export interface OperationLogQuery extends PageQuery {
  module?: string
  action?: string
  targetType?: string
  targetId?: string
  startTime?: string
  endTime?: string
}
