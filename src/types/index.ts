/**
 * 门店台领域模型定义。
 * 字段命名与《项目立项书》中的统一数据口径保持一致，后续对接后端接口时
 * 只需替换 src/api 下的实现，页面层无需改动。
 */

export type LevelKey = 'NORMAL' | 'SILVER' | 'GOLD' | 'PLATINUM'

export interface LevelInfo {
  name: string
  short: string
  discount: number
  threshold: number
  pointsRate: number
  cls: string
}

export interface Member {
  id: string
  name: string
  phone: string
  /** 脱敏手机号，列表展示用 */
  mask: string
  level: LevelKey
  points: number
  coupons: number
  growth: number
  monthOrders: number
  monthSpend: number
  tags: string[]
  last: string
  joined: string
}

export interface Product {
  id: string
  name: string
  cat: string
  price: number
  /** 是否散称计价（每 500g） */
  loose: boolean
  tare?: number
  batch: string
  /** 剩余效期（天） */
  remain: number
  /** 展示用库存文案，如 "39.4kg" */
  stock: string
  icon: string
  pinyin: string
  barcode: string
  nearExpiry?: boolean
}

export interface PosCoupon {
  id: string
  title: string
  amount?: number
  rate?: number
  threshold: number
  scope: string
  /** 不可用原因，存在即置灰 */
  locked?: string
}

export type BatchStatus = '待处置' | '已折价' | '审批中' | '已转果切' | '已报损'

export interface Batch {
  id: string
  batch: string
  name: string
  icon: string
  remain: number
  stock: number
  unit: string
  price: number
  cost: number
  suggest: string
  status: BatchStatus
  newPrice?: number
  appliedRate?: number
}

export interface OrderItem {
  name: string
  icon: string
  qty: number
  batch: string
  loc: string
  loose?: boolean
  /** 预估重量 kg（散称） */
  est?: number
  weight?: number
}

export type OrderStatus = '待拣货' | '待打包' | '配送中' | '已完成'

export interface Order {
  no: string
  channel: string
  status: OrderStatus
  customer: string
  memberLevel: string
  time: string
  promise: string
  amount: number
  fulfillment: string
  items: OrderItem[]
}

export interface ChannelStock {
  mp: number
  mt: number
  ele: number
}

export interface InventoryRow {
  id: string
  name: string
  batch: string
  icon: string
  onHand: number
  locked: number
  safety: number
  unit: string
  status: string
  channel: ChannelStock
  sync: string
  transit: number
}

/** 购物单行：散称行带 weight，计件行带 qty */
export interface TicketLine {
  uid: number
  pid: string
  qty: number
  weight?: number
  /** 已应用临期 7 折 */
  discounted?: boolean
}

export type PayMethod = 'wechat' | 'alipay' | 'cash' | 'balance'

export interface Totals {
  base: number
  memberSaving: number
  expirySaving: number
  after: number
  coupon: PosCoupon | undefined
  couponOK: boolean
  couponAmount: number
  payable: number
  count: number
  points: number
}

export interface ReceiptItem {
  name: string
  meta: string
  amount: number
  discounted: boolean
}

export interface Receipt {
  slip: string
  trade: string
  time: string
  member: Member | null
  items: ReceiptItem[]
  base: number
  memberSaving: number
  expirySaving: number
  coupon: PosCoupon | null
  couponAmount: number
  payable: number
  payName: string
  received: number | null
  change: number
  points: number
  offline: boolean
  seq: number
}

export interface ExpiryLog {
  time: string
  title: string
  by: string
}

export interface HeldTicket {
  lines: TicketLine[]
  memberId: string | null
  couponId: string | null
}

/** 全局弹窗的判别联合，替代原先 openModal(html) 的字符串拼接 */
export type ModalState =
  | { type: 'logout' }
  | { type: 'clearTicket' }
  | { type: 'shift' }
  | { type: 'memberPicker' }
  | { type: 'couponPicker' }
  | { type: 'cash' }
  | { type: 'scan' }
  | { type: 'receipt'; receipt: Receipt }
  | { type: 'batch'; id: string; mode: 'discount' | 'cut' | 'waste' }
  | { type: 'pick'; no: string }
  | { type: 'orderDetail'; no: string }
  | { type: 'replenish'; id: string }
  | { type: 'batchTrace'; id: string }
  | { type: 'memberDetail'; id: string }
  | { type: 'issueCoupon'; id: string }
  | { type: 'memberRegister' }
