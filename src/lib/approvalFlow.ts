import { checkApproval, submitApproval } from '@/api/approval'
import { IS_API_MODE } from '@/api/env'
import type { BizType } from '@/api/types'

/**
 * 业务侧审批流封装（employee-api.md §4.5 / §7.3）
 *
 * 后端只有一套审批能力：提交 #19 → 待审 → 裁决 #20 → 业务写入前 #21 校验。
 * 门店台各业务域（S4 折价、S6 报损）都走这里，避免每个页面各写一遍。
 *
 * 两个关键语义必须由调用方知道：
 * 1. `applyAmount ≤ 申请人额度` 时服务端**直接置通过**，不要假设一定进待审；
 * 2. `bizType + bizId` 幂等，重复提交返回原单号，所以按钮可以放心重试。
 */

export interface BizApprovalInput {
  bizType: BizType
  /** 业务单据主键（Long）。STK 域接口到位前由批次号派生，见 deriveBizId */
  bizId: string
  /** 业务单号，便于审批中心按单号检索（批次号 / 订单号） */
  bizNo?: string
  applyEmpId: string
  /** 申请金额：折价=让利额，报损=损耗成本 */
  applyAmount: number
  /** 申请人额度，额度内自动通过 */
  limit: number
  /** 业务快照，写入 ApprovalVO.snapshotJson，供审批中心渲染差异 */
  snapshot: Record<string, unknown>
}

export interface BizApprovalOutcome {
  approvalNo: string
  /** true = 已通过（额度内自动通过 / 已裁决），false = 待审 */
  passed: boolean
  /** 是否由额度自动通过（决定提示文案） */
  auto: boolean
}

/**
 * 批次号 → 数字主键占位。
 * `B20261028-09` → `2026102809`。接 STK 域后应换成真实批次主键 batchId，
 * 这里仅保证 bizId 满足 Long 格式，业务可凭 bizNo 追溯。
 */
export function deriveBizId(code: string): string {
  const digits = code.replace(/\D/g, '')
  return digits || String(Date.now())
}

/** 演示模式单号：AP + yyyyMMdd + 4 位流水，刷新后从 1 重新计数 */
let mockSeq = 0

function mockApprovalNo(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  mockSeq += 1
  return `AP${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${String(mockSeq).padStart(4, '0')}`
}

export async function submitBizApproval(input: BizApprovalInput): Promise<BizApprovalOutcome> {
  const { bizType, bizId, bizNo, applyEmpId, applyAmount, limit, snapshot } = input
  const withinLimit = applyAmount <= limit

  if (!IS_API_MODE) {
    return { approvalNo: mockApprovalNo(), passed: withinLimit, auto: withinLimit }
  }

  const approvalNo = await submitApproval({
    bizType,
    bizId,
    bizNo,
    applyEmpId,
    applyAmount,
    snapshotJson: JSON.stringify(snapshot),
  })

  // 单号只说明单据存在，最终是否可放行以 #21 为准（幂等重提也适用）
  const passed = await checkApproval(bizType, bizId)
  return { approvalNo, passed, auto: passed && withinLimit }
}
