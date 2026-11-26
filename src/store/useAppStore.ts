import { create, type StateCreator } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { login as apiLogin, logout as apiLogout, me as apiMe } from '@/api/auth'
import { IS_API_MODE } from '@/api/env'
import { toApiError } from '@/api/http'
import { clearTokens, hasSession } from '@/api/token'
import { BATCHES, INVENTORY, MEMBERS, ORDERS } from '@/data/mock'
import { deriveBizId, submitBizApproval } from '@/lib/approvalFlow'
import { calcTotals, lineBase, lineNet, productById } from '@/lib/pricing'
import { levelOf } from '@/lib/pricing'
import { maskPhone, nowHM, pad4, round2 } from '@/lib/format'
import type {
  Batch,
  BatchStatus,
  ExpiryLog,
  HeldTicket,
  InventoryRow,
  Member,
  ModalState,
  Order,
  PayMethod,
  Receipt,
  TicketLine,
} from '@/types'

const EMPLOYEE = { id: '1', name: '王芳', code: '1001', role: '值班店长', initial: '芳' }
const STORE_NAME = '望江路店 · A01'

export interface LoginResult {
  ok: boolean
  field?: 'id' | 'pwd' | 'form'
  message?: string
  /** 业务错误码：SYS_001 账号或口令错误、SYS_003 冻结/锁定（需倒计时） */
  code?: string
}

/**
 * 演示模式下的权限全集（C-SEED@1 的 19 个权限点）。
 * 真实模式一律以 /auth/me 返回的 permissions 为准，禁止把权限码硬编码到页面。
 */
const DEMO_PERMISSIONS = [
  'sys:employee:list',
  'sys:employee:add',
  'sys:employee:edit',
  'sys:employee:leave',
  'sys:employee:reset',
  'sys:employee:grant',
  'sys:quota:update',
  'sys:role:list',
  'sys:role:add',
  'sys:role:edit',
  'sys:role:del',
  'sys:role:grant',
  'sys:perm:list',
  'sys:approval:list',
  'sys:approval:submit',
  'sys:approval:decide',
  'sys:log:list',
  'art:price:change',
  'stk:waste:record',
]

export interface ToastState {
  message: string
  error: boolean
  visible: boolean
}

interface AppStore {
  /* ---------------- 登录态 ---------------- */
  loggedIn: boolean
  employee: typeof EMPLOYEE
  storeName: string
  /** /auth/me 返回的权限码集合，页面按它控制入口显隐 */
  permissions: string[]
  /** 自身审批额度：额度设置上限、自动通过阈值 */
  approvalLimit: number
  loginAsync: (id: string, pwd: string) => Promise<LoginResult>
  signOut: () => void
  /** 刷新页面后用令牌恢复身份；无令牌或失败则视为未登录 */
  restoreSession: () => Promise<void>
  /** 权限判定：演示模式恒为 true，真实模式查 permissions */
  can: (code: string) => boolean

  /* ---------------- 全局 UI ---------------- */
  offline: boolean
  queued: number
  toggleOffline: () => void
  toast: ToastState
  showToast: (message: string, error?: boolean) => void
  hideToast: () => void
  modal: ModalState | null
  openModal: (modal: ModalState) => void
  closeModal: () => void

  /* ---------------- 业务数据 ---------------- */
  members: Member[]
  batches: Batch[]
  orders: Order[]
  inventory: InventoryRow[]
  expiryLogs: ExpiryLog[]
  addExpiryLog: (title: string, by?: string) => void

  /* ---------------- 收银台 ---------------- */
  posLines: TicketLine[]
  posMemberId: string | null
  posCouponId: string | null
  posPay: PayMethod
  posCategory: string
  posSearch: string
  currentLoose: string
  uidSeq: number
  ticketSeq: number
  held: HeldTicket | null
  lastReceipt: Receipt | null
  setPosCategory: (cat: string) => void
  setPosSearch: (kw: string) => void
  setCurrentLoose: (pid: string) => void
  addLine: (pid: string, qty?: number) => void
  addWeighLine: (net: number) => void
  changeLineQty: (uid: number, delta: number) => void
  removeLine: (uid: number) => void
  applyExpiryDiscount: () => void
  chooseMember: (id: string | null) => void
  chooseCoupon: (id: string | null) => void
  setPay: (method: PayMethod) => void
  holdTicket: () => void
  restoreTicket: () => void
  clearTicket: () => void
  finalizeSale: (method: PayMethod, received?: number) => void
  nextSale: () => void

  /* ---------------- 筛选条件 ---------------- */
  expiryFilter: string
  orderChannel: string
  inventoryFilter: string
  memberFilter: string
  setExpiryFilter: (f: string) => void
  setOrderChannel: (c: string) => void
  setInventoryFilter: (f: string) => void
  setMemberFilter: (f: string) => void

  /* ---------------- 领域动作 ---------------- */
  /** 折价：高于成本线直接生效，低于成本线提 PRICE 审批（BR-05 / BR-14） */
  applyBatchDiscount: (id: string, rate: number) => Promise<void>
  /** 处置：转果切直接生效，报损提 WASTE 审批（BR-07） */
  applyBatchDisposition: (
    id: string,
    type: 'cut' | 'waste',
    extra?: { reason?: string; remark?: string },
  ) => Promise<void>
  advanceOrder: (no: string) => void
  confirmPick: (no: string, weights: number[]) => void
  confirmReplenish: (id: string, qty: number) => void
  issueCoupon: (memberId: string, title: string) => void
  registerMember: (payload: { phone: string; name: string }) => string | null
}

let toastTimer: number | undefined

const PAY_NAME: Record<PayMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金',
  balance: '会员余额',
}

/** 把 /auth/me 的结果映射成登录态切片 */
function profileState(profile: {
  empId?: string
  empName: string
  empNo: string
  jobTitle?: string | null
  storeName?: string | null
  permissions?: string[]
  approvalLimit?: number
}) {
  return {
    loggedIn: true,
    employee: {
      id: String(profile.empId ?? ''),
      name: profile.empName,
      code: profile.empNo,
      role: profile.jobTitle ?? '员工',
      initial: profile.empName.slice(0, 1),
    },
    storeName: profile.storeName ?? STORE_NAME,
    permissions: profile.permissions ?? [],
    approvalLimit: Number(profile.approvalLimit ?? 0),
  }
}

const storeCreator: StateCreator<AppStore> = (set, get) => ({
  /* ---------------- 登录态 ---------------- */
  loggedIn: false,
  employee: EMPLOYEE,
  storeName: STORE_NAME,
  permissions: IS_API_MODE ? [] : DEMO_PERMISSIONS,
  approvalLimit: IS_API_MODE ? 0 : 5000,

  loginAsync: async (id, pwd) => {
    const account = id.trim()
    if (!account) return { ok: false, field: 'id', message: '请输入工号或手机号' }
    if (!pwd) return { ok: false, field: 'pwd', message: '请输入登录密码' }

    if (!IS_API_MODE) {
      if (account !== '1001' && account !== '13800132046') {
        return { ok: false, field: 'form', message: '未找到该员工账号，请联系门店管理员' }
      }
      if (pwd !== '123456') {
        return { ok: false, field: 'pwd', message: '密码错误，请重试（演示密码 123456）' }
      }
      set({ loggedIn: true, permissions: DEMO_PERMISSIONS, approvalLimit: 5000 })
      return { ok: true }
    }

    try {
      const profile = await apiLogin(account, pwd)
      set(profileState(profile))
      return { ok: true }
    } catch (error) {
      const apiError = toApiError(error)
      return { ok: false, field: 'form', message: apiError.message, code: apiError.code }
    }
  },

  signOut: () => {
    if (IS_API_MODE) {
      void apiLogout().catch(() => clearTokens())
    }
    set({
      loggedIn: false,
      modal: null,
      permissions: IS_API_MODE ? [] : DEMO_PERMISSIONS,
      approvalLimit: 0,
    })
  },

  restoreSession: async () => {
    if (!IS_API_MODE) return
    if (!hasSession()) {
      set({ loggedIn: false })
      return
    }
    try {
      const profile = await apiMe()
      set(profileState(profile))
    } catch {
      clearTokens()
      set({ loggedIn: false, permissions: [] })
    }
  },

  can: (code) => !IS_API_MODE || get().permissions.includes(code),

  /* ---------------- 全局 UI ---------------- */
  offline: false,
  queued: 0,
  toggleOffline: () => {
    const { offline, queued, posPay } = get()
    if (offline && queued > 0) {
      set({ offline: false, queued: 0 })
      get().showToast(`网络已恢复，${queued} 笔离线交易已补传成功`)
    } else {
      set({ offline: !offline })
      get().showToast(offline ? '已恢复在线模式' : '已切换离线模式：仅支持现金收款，交易本地暂存')
    }
    if (!offline && posPay !== 'cash') set({ posPay: 'cash' })
  },
  toast: { message: '', error: false, visible: false },
  showToast: (message, error = false) => {
    set({ toast: { message, error, visible: true } })
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => {
      set((s) => ({ toast: { ...s.toast, visible: false } }))
    }, 2400)
  },
  hideToast: () => set((s) => ({ toast: { ...s.toast, visible: false } })),
  modal: null,
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),

  /* ---------------- 业务数据 ---------------- */
  members: MEMBERS.map((m) => ({ ...m })),
  batches: BATCHES.map((b) => ({ ...b })),
  orders: ORDERS.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) })),
  inventory: INVENTORY.map((i) => ({ ...i })),
  expiryLogs: [
    { time: '09:58', title: 'B20261028-03 已加入今日处置清单', by: '效期扫描 · 系统' },
    { time: '07:46', title: 'B20261024-02 已报损 2 盒，损耗 ¥86.40', by: '王芳 · 值班店长' },
  ],
  addExpiryLog: (title, by = '王芳 · 值班店长') =>
    set((s) => ({ expiryLogs: [{ time: nowHM(), title, by }, ...s.expiryLogs].slice(0, 12) })),

  /* ---------------- 收银台 ---------------- */
  posLines: [
    { uid: 1, pid: 'apple', qty: 1, weight: 1.24 },
    { uid: 2, pid: 'strawberry', qty: 1 },
    { uid: 3, pid: 'cut', qty: 1 },
  ],
  posMemberId: 'm1',
  posCouponId: 'pos1',
  posPay: 'wechat',
  posCategory: '全部',
  posSearch: '',
  currentLoose: 'apple',
  uidSeq: 4,
  ticketSeq: 187,
  held: null,
  lastReceipt: null,
  setPosCategory: (cat) => set({ posCategory: cat }),
  setPosSearch: (kw) => set({ posSearch: kw.trim().toLowerCase() }),
  setCurrentLoose: (pid) => {
    const p = productById(pid)
    if (!p?.loose) return
    set({ currentLoose: pid })
  },
  addLine: (pid, qty = 1) => {
    const p = productById(pid)
    if (!p) return
    if (p.loose) {
      set({ currentLoose: pid })
      return
    }
    set((s) => {
      const existing = s.posLines.find((l) => l.pid === pid && !productById(l.pid)?.loose)
      if (existing) {
        return {
          posLines: s.posLines.map((l) => (l.uid === existing.uid ? { ...l, qty: Math.min(9, l.qty + qty) } : l)),
        }
      }
      return { posLines: [...s.posLines, { uid: s.uidSeq, pid, qty }], uidSeq: s.uidSeq + 1 }
    })
  },
  addWeighLine: (net) => {
    const { currentLoose, uidSeq } = get()
    const p = productById(currentLoose)
    if (!p) return
    set((s) => ({
      posLines: [...s.posLines, { uid: uidSeq, pid: p.id, qty: 1, weight: net }],
      uidSeq: s.uidSeq + 1,
    }))
    get().showToast(`${p.name} ${net.toFixed(3)}kg 已加入清单`)
  },
  changeLineQty: (uid, delta) =>
    set((s) => ({
      posLines: s.posLines.map((l) => {
        if (l.uid !== uid) return l
        const p = productById(l.pid)
        if (!p || p.loose) return l
        return { ...l, qty: Math.max(1, Math.min(9, l.qty + delta)) }
      }),
    })),
  removeLine: (uid) => {
    set((s) => ({ posLines: s.posLines.filter((l) => l.uid !== uid) }))
    get().showToast('已从清单移除')
  },
  applyExpiryDiscount: () => {
    let count = 0
    set((s) => ({
      posLines: s.posLines.map((l) => {
        const p = productById(l.pid)
        if (p?.nearExpiry && !l.discounted) {
          count += 1
          return { ...l, discounted: true }
        }
        return l
      }),
    }))
    get().showToast(`已应用临期 7 折：${count} 行 · 会员价不叠加`)
  },
  chooseMember: (id) => {
    const member = id ? get().members.find((m) => m.id === id) ?? null : null
    set({ posMemberId: member?.id ?? null })
    get().closeModal()
    get().showToast(member ? `已识别会员：${member.name} · ${levelOf(member).short}` : '已按散客结算')
  },
  chooseCoupon: (id) => {
    set({ posCouponId: id })
    get().closeModal()
    get().showToast(id ? '优惠券已应用，实收金额已重算' : '已取消使用优惠券')
  },
  setPay: (method) => {
    const { offline } = get()
    if (method === 'balance') {
      get().showToast('会员储值功能本期未开通', true)
      return
    }
    if (offline && method !== 'cash') {
      get().showToast('离线模式仅支持现金收款', true)
      return
    }
    set({ posPay: method })
  },
  holdTicket: () => {
    const { posLines, held, posMemberId, posCouponId } = get()
    if (!posLines.length) {
      get().showToast('购物单为空，无法挂单', true)
      return
    }
    if (held) {
      get().showToast('已有一笔挂单，请先取单', true)
      return
    }
    set({
      held: {
        lines: posLines.map((l) => ({ ...l })),
        memberId: posMemberId,
        couponId: posCouponId,
      },
      posLines: [],
      posMemberId: null,
      posCouponId: null,
    })
    get().showToast('已挂单 1 笔，购物单已清空')
  },
  restoreTicket: () => {
    const { held } = get()
    if (!held) return
    set({
      posLines: held.lines.map((l) => ({ ...l })),
      posMemberId: held.memberId,
      posCouponId: held.couponId,
      held: null,
    })
    get().showToast('已取回挂单')
  },
  clearTicket: () => {
    set({ posLines: [], posMemberId: null, posCouponId: null })
    get().closeModal()
    get().showToast('购物单已清空')
  },
  finalizeSale: (method, received = 0) => {
    const s = get()
    if (!s.posLines.length) {
      s.showToast('购物单为空', true)
      return
    }
    const member = s.posMemberId ? s.members.find((m) => m.id === s.posMemberId) ?? null : null
    const totals = calcTotals(s.posLines, member, s.posCouponId)
    const seq = s.ticketSeq
    const slip = `A01-${pad4(seq)}`
    const now = new Date()
    const trade = `T${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${pad4(seq)}`

    const items = s.posLines.map((l) => {
      const p = productById(l.pid)
      if (!p) return { name: '未知商品', meta: '', amount: 0, discounted: false }
      const meta = p.loose
        ? `${Number(l.weight).toFixed(3)}kg × ¥${p.price.toFixed(2)}/500g`
        : `× ${l.qty} · ${p.batch}`
      return { name: p.name, meta, amount: lineNet(l), discounted: !!(p.nearExpiry && l.discounted) }
    })

    const change = method === 'cash' ? Math.max(0, round2(received - totals.payable)) : 0
    const receipt: Receipt = {
      slip,
      trade,
      time: nowHM(),
      member: member ? { ...member } : null,
      items,
      base: totals.base,
      memberSaving: totals.memberSaving,
      expirySaving: totals.expirySaving,
      coupon: totals.couponOK && totals.coupon ? totals.coupon : null,
      couponAmount: totals.couponAmount,
      payable: totals.payable,
      payName: PAY_NAME[method],
      received: method === 'cash' ? received : null,
      change,
      points: totals.points,
      offline: s.offline,
      seq,
    }

    set((state) => ({
      ticketSeq: seq + 1,
      lastReceipt: receipt,
      queued: state.offline ? state.queued + 1 : state.queued,
      members: member
        ? state.members.map((m) =>
            m.id === member.id
              ? {
                  ...m,
                  points: m.points + totals.points,
                  coupons: totals.couponOK ? Math.max(0, m.coupons - 1) : m.coupons,
                }
              : m,
          )
        : state.members,
      modal: { type: 'receipt', receipt },
    }))
  },
  nextSale: () => {
    const { offline } = get()
    set({
      posLines: [],
      posMemberId: null,
      posCouponId: null,
      posPay: offline ? 'cash' : 'wechat',
      modal: null,
    })
    get().showToast('已开启新销售单')
  },

  /* ---------------- 筛选条件 ---------------- */
  expiryFilter: '全部',
  orderChannel: '全部',
  inventoryFilter: '全部',
  memberFilter: '全部',
  setExpiryFilter: (f) => set({ expiryFilter: f }),
  setOrderChannel: (c) => set({ orderChannel: c }),
  setInventoryFilter: (f) => set({ inventoryFilter: f }),
  setMemberFilter: (f) => set({ memberFilter: f }),

  /* ---------------- 领域动作 ---------------- */
  applyBatchDiscount: async (id, rate) => {
    const b = get().batches.find((x) => x.id === id)
    if (!b) return
    const newPrice = round2(b.price * rate)
    const below = newPrice < b.cost
    const rateText = `${Math.round(rate * 10)} 折`

    // 高于成本保护线：直接生效，不需要审批
    if (!below) {
      set((s) => ({
        batches: s.batches.map((x) =>
          x.id === id ? { ...x, newPrice, appliedRate: rate, status: '已折价' as BatchStatus } : x,
        ),
      }))
      get().addExpiryLog(`${b.name} ${b.batch} 已折价（${rateText}），新价 ¥${newPrice.toFixed(2)}`)
      get().closeModal()
      get().showToast(`已折价：${b.name} 新价 ¥${newPrice.toFixed(2)}`)
      return
    }

    // 低于成本线：提交 PRICE 审批；让利额在额度内会自动通过（§4.5 #19）
    const amount = round2((b.price - newPrice) * b.stock)
    try {
      const outcome = await submitBizApproval({
        bizType: 'PRICE',
        bizId: deriveBizId(b.batch),
        bizNo: b.batch,
        applyEmpId: get().employee.id,
        applyAmount: amount,
        limit: get().approvalLimit,
        snapshot: {
          batchId: b.id,
          batchNo: b.batch,
          name: b.name,
          oldPrice: b.price,
          newPrice,
          rate,
          stock: b.stock,
          unit: b.unit,
          costLine: b.cost,
          discountAmount: amount,
        },
      })
      const status: BatchStatus = outcome.passed ? '已折价' : '审批中'
      set((s) => ({
        batches: s.batches.map((x) => (x.id === id ? { ...x, newPrice, appliedRate: rate, status } : x)),
      }))
      get().addExpiryLog(
        outcome.passed
          ? `${b.name} ${b.batch} 折价 ${rateText} 已通过审批（${outcome.approvalNo}），新价 ¥${newPrice.toFixed(2)}`
          : `${b.name} ${b.batch} 折价 ${rateText} 低于成本线，已提交审批（${outcome.approvalNo}）`,
      )
      get().closeModal()
      get().showToast(
        outcome.passed
          ? `审批已通过（${outcome.approvalNo}）：${b.name} 新价 ¥${newPrice.toFixed(2)}`
          : `已提交店长审批（${outcome.approvalNo}），审核通过后自动生效`,
      )
    } catch (error) {
      // 失败不关弹窗，保留用户输入便于重试（bizType+bizId 幂等，重提安全）
      get().showToast(toApiError(error).message, true)
    }
  },
  applyBatchDisposition: async (id, type, extra) => {
    const b = get().batches.find((x) => x.id === id)
    if (!b) return

    // 转果切：加工领料，不涉及金额审批
    if (type === 'cut') {
      set((s) => ({ batches: s.batches.map((x) => (x.id === id ? { ...x, status: '已转果切' } : x)) }))
      get().addExpiryLog(`${b.name} ${b.batch} 已转果切，原料 ${b.stock} ${b.unit} 出库`)
      get().closeModal()
      get().showToast(`已转果切：${b.name}，加工领料单已生成`)
      return
    }

    // 报损：损耗金额走 WASTE 审批，通过后才落损耗台账
    const amount = round2(b.cost * b.stock)
    try {
      const outcome = await submitBizApproval({
        bizType: 'WASTE',
        bizId: deriveBizId(b.batch),
        bizNo: b.batch,
        applyEmpId: get().employee.id,
        applyAmount: amount,
        limit: get().approvalLimit,
        snapshot: {
          batchId: b.id,
          batchNo: b.batch,
          name: b.name,
          qty: b.stock,
          unit: b.unit,
          cost: b.cost,
          lossAmount: amount,
          reason: extra?.reason ?? '品质下降 · 不可售',
          remark: extra?.remark ?? '',
        },
      })
      const status: BatchStatus = outcome.passed ? '已报损' : '审批中'
      set((s) => ({ batches: s.batches.map((x) => (x.id === id ? { ...x, status } : x)) }))
      const reason = extra?.reason ?? '品质下降 · 不可售'
      get().addExpiryLog(
        outcome.passed
          ? `${b.name} ${b.batch} 已报损 ${b.stock} ${b.unit}（${reason}），损耗 ¥${amount.toFixed(2)}（${outcome.approvalNo}）`
          : `${b.name} ${b.batch} 报损 ¥${amount.toFixed(2)} 已提交审批（${outcome.approvalNo}）`,
      )
      get().closeModal()
      get().showToast(
        outcome.passed
          ? `已报损：${b.name}，损耗 ¥${amount.toFixed(2)} · 单号 ${outcome.approvalNo}`
          : `报损已提交审批（${outcome.approvalNo}），通过后扣减批次库存`,
      )
    } catch (error) {
      get().showToast(toApiError(error).message, true)
    }
  },
  advanceOrder: (no) => {
    const o = get().orders.find((x) => x.no === no)
    if (!o) return
    if (o.status === '待打包') {
      set((s) => ({ orders: s.orders.map((x) => (x.no === no ? { ...x, status: '配送中' } : x)) }))
      get().showToast(`${no} 已交接出库，骑手已接单`)
    } else if (o.status === '配送中') {
      set((s) => ({ orders: s.orders.map((x) => (x.no === no ? { ...x, status: '已完成' } : x)) }))
      get().showToast(`${no} 已确认送达，顾客将收到评价邀请`)
    }
  },
  confirmPick: (no, weights) => {
    const o = get().orders.find((x) => x.no === no)
    if (!o) return
    if (weights.some((w) => w <= 0)) {
      get().showToast('实称重量必须大于 0', true)
      return
    }
    let diff = 0
    const items = o.items.map((it, idx) => {
      if (!it.loose) return it
      const p = productById(it.name)
      const price = p?.price ?? 0
      const est = it.est ?? 0
      const v = weights[idx] ?? est
      diff += round2((v - est) * (price / 0.5))
      return { ...it, weight: v }
    })
    diff = round2(diff)
    set((s) => ({
      orders: s.orders.map((x) =>
        x.no === no ? { ...x, items, amount: round2(x.amount + diff), status: '待打包' } : x,
      ),
    }))
    get().closeModal()
    get().showToast(
      `拣货完成 · 已转待打包${Math.abs(diff) > 0.01 ? `，差额 ${diff > 0 ? '+' : ''}¥${diff.toFixed(2)}` : ''}`,
    )
  },
  confirmReplenish: (id, qty) => {
    const i = get().inventory.find((x) => x.id === id)
    if (!i) return
    if (qty <= 0) {
      get().showToast('补货量必须大于 0', true)
      return
    }
    set((s) => ({
      inventory: s.inventory.map((x) => (x.id === id ? { ...x, transit: x.transit + qty, sync: '待同步' } : x)),
    }))
    get().closeModal()
    get().showToast(`已提交补货 ${qty} ${i.unit}，预计明天 06:00 到店`)
  },
  issueCoupon: (memberId, title) => {
    const m = get().members.find((x) => x.id === memberId)
    if (!m) return
    set((s) => ({
      members: s.members.map((x) => (x.id === memberId ? { ...x, coupons: x.coupons + 1 } : x)),
      modal: { type: 'memberDetail', id: memberId },
    }))
    get().showToast(`已向 ${m.name} 发放「${title}」，券包共 ${m.coupons + 1} 张`)
  },
  registerMember: ({ phone, name }) => {
    const s = get()
    if (s.members.some((m) => m.phone === phone)) return '该手机号已注册，请直接识别会员（MBR_002）'
    if (!name || name.length > 50) return '昵称需为 1–50 个字'
    const member: Member = {
      id: `m${Date.now()}`,
      name,
      phone,
      mask: maskPhone(phone),
      level: 'NORMAL',
      points: 0,
      coupons: 2,
      growth: 0,
      monthOrders: 0,
      monthSpend: 0,
      tags: ['新会员', '门店注册'],
      last: '刚刚',
      joined: new Date().toISOString().slice(0, 10),
    }
    set({ members: [member, ...s.members], modal: null })
    get().showToast(`会员注册成功：${name}，2 张新人券已入券包`)
    return null
  },
})

/**
 * 门店终端场景：仅持久化登录态，避免刷新丢失当班会话；
 * 业务数据仍以服务端为准，不落本地存储。
 */
export const useAppStore = create<AppStore>()(
  persist(storeCreator, {
    name: 'fci:session',
    // 门店共用终端：会话只落 sessionStorage，禁止 localStorage（employee-api.md §1.3）
    storage: createJSONStorage(() => sessionStorage),
    partialize: (state) =>
      ({
        loggedIn: state.loggedIn,
        employee: state.employee,
        storeName: state.storeName,
        permissions: state.permissions,
        approvalLimit: state.approvalLimit,
      }) as AppStore,
  }),
)

/** 供页面复用的派生计算：当前购物单小计 */
export const selectPosTotals = (s: AppStore) => {
  const member = s.posMemberId ? s.members.find((m) => m.id === s.posMemberId) ?? null : null
  return calcTotals(s.posLines, member, s.posCouponId)
}

/** 行原价（用于临期折价提示） */
export { lineBase, lineNet }
