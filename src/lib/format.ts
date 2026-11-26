/** 展示层格式化与演示时钟工具 */

export const money = (n: number | null | undefined): string => Number(n || 0).toFixed(2)

export const round2 = (n: number): number => Math.round((Number(n) + Number.EPSILON) * 100) / 100

export const formatQty = (n: number): string => (Number.isInteger(n) ? String(n) : Number(n).toFixed(1))

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * 演示时钟：门店台的演示数据锚定在 2026-11-03 10:03，
 * 时钟按真实流逝时间推进，便于展示“班次内实时”的交互效果。
 */
const DEMO_START = Date.now()
const DEMO_BASE = new Date(2026, 10, 3, 10, 3, 0)

export function demoNow(): Date {
  return new Date(DEMO_BASE.getTime() + (Date.now() - DEMO_START))
}

export function nowHM(d: Date = demoNow()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function fmtDateCN(d: Date = demoNow()): string {
  const week = WEEK[d.getDay()]
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${mm}.${dd} ${week}`
}

export function pad4(n: number): string {
  return String(n).padStart(4, '0')
}

/** 手机号脱敏：138****2046 */
export function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}
