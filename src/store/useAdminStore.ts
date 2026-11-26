/**
 * 管理台状态（员工域 / SYS）
 *
 * 与作业台分离成独立 store，原因：
 * 1. 管理台的数据量大、更新频繁（分页、筛选、勾选），塞进 useAppStore 会让作业台每改一次 UI 都跟着跑；
 * 2. 管理台是「临时进入」的二级场景，独立 store 便于按需卸载与后续做权限隔离。
 *
 * 双模式：
 * - mock：直接改内存数组，并补一条操作日志，方便断网演示完整闭环；
 * - api：调用 src/api/sys.ts、src/api/approval.ts，成功后重新拉取列表，保证以服务端为准。
 */
import { create } from 'zustand'
import { IS_API_MODE } from '@/api/env'
import { approvalPage, decideApproval } from '@/api/approval'
import {
  assignPermissions as apiAssignPermissions,
  assignRoles as apiAssignRoles,
  createEmployee as apiCreateEmployee,
  createRole as apiCreateRole,
  deleteRole as apiDeleteRole,
  disableOnLeave as apiDisableOnLeave,
  employeeDetail as apiEmployeeDetail,
  employeesPage as apiEmployeesPage,
  operationLogsPage as apiOperationLogsPage,
  permissionTree as apiPermissionTree,
  resetPassword as apiResetPassword,
  rolesPage as apiRolesPage,
  updateApprovalLimit as apiUpdateApprovalLimit,
  updateEmployee as apiUpdateEmployee,
  updateEmployeeStatus as apiUpdateEmployeeStatus,
  updateRole as apiUpdateRole,
} from '@/api/sys'
import type {
  ApprovalVO,
  EmployeeSaveCmd,
  EmployeeStatus,
  EmployeeVO,
  OperationLogVO,
  PermissionVO,
  RoleSaveCmd,
  RoleVO,
} from '@/api/types'
import { APPROVALS, EMPLOYEES, OPERATION_LOGS, PERMISSION_TREE, ROLES } from '@/data/adminMock'

/** 演示模式的操作用户：真实模式由服务端从登录态取，前端不传 operatorEmpId */
const DEMO_OPERATOR = '1'

/** 审批回写时用于日志的「对象类型」文案 */
const BIZ_TARGET: Record<string, string> = {
  PRICE: '批次',
  WASTE: '批次',
  REFUND: '订单',
  RETURN: '订单',
  WEIGHT: '订单',
  TRANSFER: '调拨单',
  PURCHASE: '采购单',
  EXPIRY: '批次',
  INVOICE: '订单',
}

interface LogInput {
  module: string
  action: string
  targetType?: string
  targetId?: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
}

interface AdminStore {
  employees: EmployeeVO[]
  roles: RoleVO[]
  permissions: PermissionVO[]
  approvals: ApprovalVO[]
  logs: OperationLogVO[]
  loading: boolean
  /** 最近一次加载失败的原因，页面据此提示「后端未启动」 */
  loadError: string | null

  refresh: () => Promise<void>

  /* 员工 #4 ~ #12 */
  /** 详情 #5：仅 API 模式真正请求，mock 模式直接读内存；失败时回退列表里的快照 */
  loadEmployee: (empId: string) => Promise<EmployeeVO | null>
  saveEmployee: (cmd: EmployeeSaveCmd, empId?: string) => Promise<void>
  resetPassword: (empId: string, newPassword: string) => Promise<void>
  updateStatus: (empId: string, status: Extract<EmployeeStatus, 1 | 2>) => Promise<void>
  disableOnLeave: (empId: string, leaveDate?: string) => Promise<void>
  updateQuota: (empId: string, limit: number) => Promise<void>
  assignRoles: (empId: string, roleIds: string[]) => Promise<void>

  /* 角色 #13 ~ #17、权限树 #18 */
  saveRole: (cmd: RoleSaveCmd, roleId?: string) => Promise<string>
  removeRole: (roleId: string) => Promise<void>
  assignPermissions: (roleId: string, permIds: string[]) => Promise<void>

  /* 审批 #20 */
  decide: (approvalNo: string, result: 'PASS' | 'REJECT', remark?: string) => Promise<void>
  /** S4/S6 提交审批后回写一条，保证审批中心能看到刚产生的单子 */
  recordApproval: (approval: ApprovalVO) => void
}

const byId = <T extends { id: string }>(list: T[], id: string) => list.find((x) => x.id === id)

const empNoOf = (list: EmployeeVO[], empId: string) => byId(list, empId)?.empNo ?? empId

/** 演示模式补日志：真实模式由服务端写，前端不再重复上报 */
function demoLog(state: Pick<AdminStore, 'logs'>, input: LogInput): OperationLogVO[] {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const time = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const entry: OperationLogVO = {
    id: String(Date.now()),
    operatorEmpId: DEMO_OPERATOR,
    operatorType: 1,
    module: input.module,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    beforeJson: input.before ? JSON.stringify(input.before) : null,
    afterJson: input.after ? JSON.stringify(input.after) : null,
    clientIp: '10.20.31.14',
    createTime: time,
  }
  return [entry, ...state.logs].slice(0, 200)
}

export const useAdminStore = create<AdminStore>()((set, get) => ({
  employees: EMPLOYEES,
  roles: ROLES,
  permissions: PERMISSION_TREE,
  approvals: APPROVALS,
  logs: OPERATION_LOGS,
  loading: false,
  loadError: null,

  refresh: async () => {
    if (!IS_API_MODE) return
    set({ loading: true, loadError: null })
    try {
      const [empPage, rolePage, tree, approvalP, logP] = await Promise.all([
        apiEmployeesPage({ current: 1, size: 200 }),
        apiRolesPage({ current: 1, size: 100 }),
        apiPermissionTree(),
        approvalPage({ current: 1, size: 200 }),
        apiOperationLogsPage({ current: 1, size: 200 }),
      ])
      set({
        employees: empPage.records,
        roles: rolePage.records,
        permissions: tree,
        approvals: approvalP.records,
        logs: logP.records,
        loading: false,
      })
    } catch (err) {
      set({ loading: false, loadError: err instanceof Error ? err.message : '管理台数据加载失败' })
    }
  },

  /* ----------------------------- 员工 ----------------------------- */

  loadEmployee: async (empId) => {
    if (!IS_API_MODE) return byId(get().employees, empId) ?? null
    try {
      const vo = await apiEmployeeDetail(empId)
      set((s) => ({ employees: s.employees.map((e) => (e.id === empId ? vo : e)) }))
      return vo
    } catch {
      return byId(get().employees, empId) ?? null
    }
  },

  saveEmployee: async (cmd, empId) => {
    if (IS_API_MODE) {
      if (empId) await apiUpdateEmployee(empId, cmd)
      else await apiCreateEmployee(cmd)
      await get().refresh()
      return
    }
    if (empId) {
      const before = byId(get().employees, empId)
      const roleList = (cmd.roleIds ?? before?.roles.map((r) => r.id) ?? [])
        .map((id) => byId(get().roles, id))
        .filter((r): r is RoleVO => Boolean(r))
      set((s) => ({
        employees: s.employees.map((e) =>
          e.id === empId
            ? {
                ...e,
                empName: cmd.empName,
                phone: cmd.phone,
                jobTitle: cmd.jobTitle ?? e.jobTitle,
                loginName: cmd.loginName,
                healthCertNo: cmd.healthCertNo ?? e.healthCertNo,
                healthCertExpire: cmd.healthCertExpire ?? e.healthCertExpire,
                entryDate: cmd.entryDate ?? e.entryDate,
                roles: roleList.length ? roleList : e.roles,
              }
            : e,
        ),
        logs: demoLog(s, {
          module: '员工档案',
          action: 'EMP_UPDATE',
          targetType: '员工',
          targetId: before?.empNo ?? empId,
          before: before ? { empName: before.empName, jobTitle: before.jobTitle, phone: before.phone } : null,
          after: { empName: cmd.empName, jobTitle: cmd.jobTitle, phone: cmd.phone },
        }),
      }))
      return
    }
    const nextId = String(Math.max(...get().employees.map((e) => Number(e.id)), 0) + 1)
    const roleList = (cmd.roleIds ?? []).map((id) => byId(get().roles, id)).filter((r): r is RoleVO => Boolean(r))
    const created: EmployeeVO = {
      id: nextId,
      empNo: cmd.empNo,
      empName: cmd.empName,
      phone: cmd.phone,
      storeId: cmd.storeId ?? '1',
      storeName: '望江路店 · A01',
      loginName: cmd.loginName,
      jobTitle: cmd.jobTitle ?? null,
      approvalLimit: 0,
      healthCertNo: cmd.healthCertNo ?? null,
      healthCertExpire: cmd.healthCertExpire ?? null,
      entryDate: cmd.entryDate ?? null,
      status: 1,
      lastLoginTime: null,
      roles: roleList,
    }
    set((s) => ({
      employees: [created, ...s.employees],
      logs: demoLog(s, {
        module: '员工档案',
        action: 'EMP_CREATE',
        targetType: '员工',
        targetId: cmd.empNo,
        after: { empName: cmd.empName, empNo: cmd.empNo, jobTitle: cmd.jobTitle, loginName: cmd.loginName },
      }),
    }))
  },

  resetPassword: async (empId, newPassword) => {
    if (IS_API_MODE) {
      await apiResetPassword(empId, newPassword)
      return
    }
    set((s) => ({
      logs: demoLog(s, {
        module: '员工档案',
        action: 'PWD_RESET',
        targetType: '员工',
        targetId: empNoOf(s.employees, empId),
        after: { resetBy: '门店管理员' },
      }),
    }))
  },

  updateStatus: async (empId, status) => {
    if (IS_API_MODE) {
      await apiUpdateEmployeeStatus(empId, status)
      await get().refresh()
      return
    }
    const before = byId(get().employees, empId)
    set((s) => ({
      employees: s.employees.map((e) => (e.id === empId ? { ...e, status } : e)),
      logs: demoLog(s, {
        module: '员工档案',
        action: 'EMP_STATUS',
        targetType: '员工',
        targetId: before?.empNo ?? empId,
        before: { status: before?.status },
        after: { status },
      }),
    }))
  },

  disableOnLeave: async (empId, leaveDate) => {
    if (IS_API_MODE) {
      await apiDisableOnLeave(empId, leaveDate)
      await get().refresh()
      return
    }
    const before = byId(get().employees, empId)
    set((s) => ({
      employees: s.employees.map((e) => (e.id === empId ? { ...e, status: 0 } : e)),
      logs: demoLog(s, {
        module: '员工档案',
        action: 'EMP_LEAVE',
        targetType: '员工',
        targetId: before?.empNo ?? empId,
        before: { status: before?.status },
        after: { status: 0, leaveDate: leaveDate ?? '' },
      }),
    }))
  },

  updateQuota: async (empId, limit) => {
    if (IS_API_MODE) {
      await apiUpdateApprovalLimit(empId, limit)
      await get().refresh()
      return
    }
    const before = byId(get().employees, empId)
    set((s) => ({
      employees: s.employees.map((e) => (e.id === empId ? { ...e, approvalLimit: limit } : e)),
      logs: demoLog(s, {
        module: '员工档案',
        action: 'QUOTA_CHANGE',
        targetType: '员工',
        targetId: before?.empNo ?? empId,
        before: { approvalLimit: before?.approvalLimit },
        after: { approvalLimit: limit },
      }),
    }))
  },

  assignRoles: async (empId, roleIds) => {
    if (IS_API_MODE) {
      await apiAssignRoles(empId, roleIds)
      await get().refresh()
      return
    }
    const before = byId(get().employees, empId)
    const roleList = roleIds.map((id) => byId(get().roles, id)).filter((r): r is RoleVO => Boolean(r))
    set((s) => ({
      employees: s.employees.map((e) => (e.id === empId ? { ...e, roles: roleList } : e)),
      logs: demoLog(s, {
        module: '员工档案',
        action: 'ROLE_ASSIGN',
        targetType: '员工',
        targetId: before?.empNo ?? empId,
        before: { roleIds: before?.roles.map((r) => r.id) },
        after: { roleIds },
      }),
    }))
  },

  /* ----------------------------- 角色 ----------------------------- */

  saveRole: async (cmd, roleId) => {
    if (IS_API_MODE) {
      if (roleId) {
        await apiUpdateRole(roleId, cmd)
        await get().refresh()
        return roleId
      }
      const newId = await apiCreateRole(cmd)
      await get().refresh()
      return newId
    }
    if (roleId) {
      const before = byId(get().roles, roleId)
      set((s) => ({
        roles: s.roles.map((r) =>
          r.id === roleId
            ? { ...r, roleName: cmd.roleName, roleCode: cmd.roleCode, dataScope: cmd.dataScope ?? r.dataScope, remark: cmd.remark ?? r.remark, status: cmd.status ?? r.status }
            : r,
        ),
        logs: demoLog(s, {
          module: '角色权限',
          action: 'ROLE_SAVE',
          targetType: '角色',
          targetId: before?.roleCode ?? roleId,
          before: before ? { roleName: before.roleName, dataScope: before.dataScope } : null,
          after: { roleName: cmd.roleName, dataScope: cmd.dataScope },
        }),
      }))
      return roleId
    }
    const nextId = String(Math.max(...get().roles.map((r) => Number(r.id)), 0) + 1)
    const created: RoleVO = {
      id: nextId,
      roleCode: cmd.roleCode,
      roleName: cmd.roleName,
      dataScope: cmd.dataScope ?? 'STORE',
      status: cmd.status ?? 1,
      isBuiltin: 0,
      remark: cmd.remark ?? null,
      permIds: [],
    }
    set((s) => ({
      roles: [...s.roles, created],
      logs: demoLog(s, {
        module: '角色权限',
        action: 'ROLE_SAVE',
        targetType: '角色',
        targetId: cmd.roleCode,
        after: { roleCode: cmd.roleCode, roleName: cmd.roleName, dataScope: created.dataScope },
      }),
    }))
    return nextId
  },

  removeRole: async (roleId) => {
    if (IS_API_MODE) {
      await apiDeleteRole(roleId)
      await get().refresh()
      return
    }
    const target = byId(get().roles, roleId)
    set((s) => ({
      roles: s.roles.filter((r) => r.id !== roleId),
      logs: demoLog(s, {
        module: '角色权限',
        action: 'ROLE_SAVE',
        targetType: '角色',
        targetId: target?.roleCode ?? roleId,
        before: target ? { roleName: target.roleName, permIds: target.permIds } : null,
        after: { deleted: true },
      }),
    }))
  },

  assignPermissions: async (roleId, permIds) => {
    if (IS_API_MODE) {
      await apiAssignPermissions(roleId, permIds)
      await get().refresh()
      return
    }
    const before = byId(get().roles, roleId)
    set((s) => ({
      roles: s.roles.map((r) => (r.id === roleId ? { ...r, permIds } : r)),
      logs: demoLog(s, {
        module: '角色权限',
        action: 'ROLE_PERM_ASSIGN',
        targetType: '角色',
        targetId: before?.roleCode ?? roleId,
        before: { permIds: before?.permIds },
        after: { permIds },
      }),
    }))
  },

  /* ----------------------------- 审批 ----------------------------- */

  decide: async (approvalNo, result, remark) => {
    if (IS_API_MODE) {
      await decideApproval(approvalNo, { result, remark })
      await get().refresh()
      return
    }
    const before = get().approvals.find((a) => a.approvalNo === approvalNo)
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const time = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.approvalNo === approvalNo
          ? {
              ...a,
              approveResult: result === 'PASS' ? 1 : 2,
              approveTime: time,
              approveRemark: remark ?? null,
              approverEmpId: DEMO_OPERATOR,
              approverEmpName: '王芳',
            }
          : a,
      ),
      logs: demoLog(s, {
        module: '审批',
        action: 'APPROVAL_DECIDE',
        targetType: '审批单',
        targetId: approvalNo,
        before: { approveResult: before?.approveResult ?? 0 },
        after: { approveResult: result === 'PASS' ? 1 : 2, remark: remark ?? '' },
      }),
    }))
  },

  recordApproval: (approval) =>
    set((s) => ({
      approvals: s.approvals.some((a) => a.approvalNo === approval.approvalNo)
        ? s.approvals
        : [approval, ...s.approvals],
      logs: demoLog(s, {
        module: '审批',
        action: 'APPROVAL_SUBMIT',
        targetType: BIZ_TARGET[approval.bizType] ?? '业务单',
        targetId: approval.bizNo ?? approval.bizId,
        after: { approvalNo: approval.approvalNo, applyAmount: approval.applyAmount },
      }),
    })),
}))
