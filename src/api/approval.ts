import { request } from './http'
import type { ApprovalQuery, ApprovalSubmitCmd, ApprovalVO, ApiPage, BizType, DecideCmd } from './types'

/**
 * 审批接口（employee-api.md §4.5，#19 ~ #22）
 *
 * S3 超额度折价、S4 低于成本线折价、S6 报损都用这里的四个方法：
 * 提交 → 待审 → 裁决 → 业务写入前 check 一次。
 */

/**
 * 提交审批（#19）。幂等：同一 bizType+bizId 已存在待审单时返回原单号；
 * 申请金额 ≤ 申请人额度时服务端直接置「通过」，返回值仍是单号。
 */
export function submitApproval(cmd: ApprovalSubmitCmd): Promise<string> {
  return request<string>({ url: '/approvals', method: 'POST', data: cmd })
}

/** 裁决（#20）。result=PASS/REJECT；驳回时 remark 必填（§7） */
export function decideApproval(approvalNo: string, cmd: DecideCmd): Promise<null> {
  return request<null>({ url: `/approvals/${approvalNo}:decide`, method: 'POST', data: cmd })
}

/** 业务写入前校验审批是否已通过（#21），只读可重试 */
export function checkApproval(bizType: BizType, bizId: string): Promise<boolean> {
  return request<boolean>({ url: '/approvals:check', method: 'GET', params: { bizType, bizId } })
}

/** 审批列表（#22）：待办传 approverEmpId，我的申请传 applyEmpId */
export function approvalPage(query: ApprovalQuery): Promise<ApiPage<ApprovalVO>> {
  return request<ApiPage<ApprovalVO>>({ url: '/approvals/page', method: 'GET', params: query })
}

/** 待办红点数量：approveResult=0 + size=1 取 total（#22 备注） */
export async function pendingApprovalCount(approverEmpId: string): Promise<number> {
  const page = await approvalPage({ approverEmpId, approveResult: 0, current: 1, size: 1 })
  return Number(page.total ?? 0)
}
