import { POS_COUPONS, PRODUCTS } from '@/data/mock'
import type { Member, Product, TicketLine, Totals } from '@/types'
import { LEVELS } from './catalog'
import { round2 } from './format'

/** 商品索引：接口接入后由 src/api 统一提供，页面通过此函数取数避免到处 find */
export const productById = (id: string): Product | undefined => PRODUCTS.find((p) => p.id === id)

export const couponById = (id: string | null) => POS_COUPONS.find((c) => c.id === id)

export const levelOf = (m?: Member | null) => LEVELS[m?.level ?? 'NORMAL']

/** 行原价：散称按净重 / 500g 计价，计件按单价 × 数量 */
export function lineBase(l: TicketLine): number {
  const p = productById(l.pid)
  if (!p) return 0
  return round2(p.loose ? p.price * ((l.weight ?? 0) / 0.5) : p.price * l.qty)
}

/** 行实付：临期批次折价 7 折后不再叠加会员价 */
export function lineNet(l: TicketLine): number {
  const p = productById(l.pid)
  const base = lineBase(l)
  if (p?.nearExpiry && l.discounted) return round2(base * 0.7)
  return base
}

/**
 * 单据统计。口径：
 * 1. 临期折价优先于会员价，且不叠加；
 * 2. 优惠券门槛按“会员价 / 临期折价后金额”判断；
 * 3. 积分按实收金额 × 等级倍率向下取整。
 */
export function calcTotals(lines: TicketLine[], member: Member | null, couponId: string | null): Totals {
  let base = 0
  let memberSaving = 0
  let expirySaving = 0

  lines.forEach((l) => {
    const p = productById(l.pid)
    if (!p) return
    const b = lineBase(l)
    base += b
    if (p.nearExpiry) {
      if (l.discounted) expirySaving += round2(b * 0.3)
    } else if (member) {
      memberSaving += round2(b * (1 - levelOf(member).discount))
    }
  })

  base = round2(base)
  memberSaving = round2(memberSaving)
  expirySaving = round2(expirySaving)

  const after = round2(base - memberSaving - expirySaving)
  const coupon = couponById(couponId)
  const couponOK = !!coupon && !coupon.locked && after >= coupon.threshold
  const couponAmount = couponOK ? coupon.amount || 0 : 0
  const payable = round2(Math.max(0, after - couponAmount))
  const count = lines.reduce((s, l) => {
    const p = productById(l.pid)
    return s + (p?.loose ? 1 : l.qty)
  }, 0)
  const points = member ? Math.floor(payable * levelOf(member).pointsRate) : 0

  return { base, memberSaving, expirySaving, after, coupon, couponOK, couponAmount, payable, count, points }
}
