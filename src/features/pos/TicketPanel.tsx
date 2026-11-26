import { Icon } from '@/components/Icon'
import { useNow } from '@/hooks/useNow'
import { tint } from '@/lib/catalog'
import { money, nowHM, pad4 } from '@/lib/format'
import { calcTotals, couponById, levelOf, lineBase, lineNet, productById } from '@/lib/pricing'
import { useAppStore } from '@/store/useAppStore'
import type { PayMethod } from '@/types'

const PAY_METHODS: { key: PayMethod; label: string; icon: string }[] = [
  { key: 'wechat', label: '微信', icon: 'i-wechat' },
  { key: 'alipay', label: '支付宝', icon: 'i-alipay' },
  { key: 'cash', label: '现金', icon: 'i-cash' },
  { key: 'balance', label: '余额', icon: 'i-wallet' },
]

export function TicketPanel({ onStartPayment }: { onStartPayment: () => void }) {
  const now = useNow(10_000)

  const lines = useAppStore((s) => s.posLines)
  const members = useAppStore((s) => s.members)
  const memberId = useAppStore((s) => s.posMemberId)
  const couponId = useAppStore((s) => s.posCouponId)
  const pay = useAppStore((s) => s.posPay)
  const held = useAppStore((s) => s.held)
  const ticketSeq = useAppStore((s) => s.ticketSeq)
  const offline = useAppStore((s) => s.offline)
  const employee = useAppStore((s) => s.employee)
  const openModal = useAppStore((s) => s.openModal)
  const setPay = useAppStore((s) => s.setPay)
  const changeLineQty = useAppStore((s) => s.changeLineQty)
  const removeLine = useAppStore((s) => s.removeLine)
  const applyExpiryDiscount = useAppStore((s) => s.applyExpiryDiscount)
  const holdTicket = useAppStore((s) => s.holdTicket)
  const restoreTicket = useAppStore((s) => s.restoreTicket)
  const showToast = useAppStore((s) => s.showToast)

  const member = memberId ? members.find((m) => m.id === memberId) ?? null : null
  const totals = calcTotals(lines, member, couponId)
  const coupon = couponById(couponId)
  const level = levelOf(member)

  const pendingExpiry = lines.filter((l) => {
    const p = productById(l.pid)
    return p?.nearExpiry && !l.discounted
  })

  return (
    <aside className="ticket">
      <div className="ticket-head">
        <div>
          <div className="ticket-title">
            <Icon name="i-receipt" />
            销售单
          </div>
          <div className="ticket-no">
            A01-{pad4(ticketSeq)} · {nowHM(now)} · 收银员 {employee.name}
          </div>
        </div>
        <div className="ticket-head-actions">
          <button onClick={holdTicket}>挂单</button>
          {held ? <button onClick={restoreTicket}>取单 (1)</button> : null}
        </div>
      </div>

      <button
        className={`member-strip ${member ? '' : 'guest'}`}
        onClick={() => openModal({ type: 'memberPicker' })}
      >
        {member ? (
          <>
            <span className="ms-avatar">{member.name.slice(0, 1)}</span>
            <span className="ms-main">
              <b>
                {member.name} <span className="tag tag-green">{level.short}</span>
              </b>
              <span>
                {level.discount < 1 ? `${(level.discount * 10).toFixed(1)} 折` : '无折扣'} · 积分 {member.points} · 券{' '}
                {member.coupons} 张
              </span>
            </span>
            <span className="ms-action">
              换会员 <Icon name="i-chevron" />
            </span>
          </>
        ) : (
          <>
            <span className="ms-avatar">客</span>
            <span className="ms-main">
              <b>散客</b>
              <span>识别会员可享会员价与积分</span>
            </span>
            <span className="ms-action">
              识别会员 <Icon name="i-chevron" />
            </span>
          </>
        )}
      </button>

      <div className="ticket-lines">
        {!lines.length ? (
          <div className="ticket-empty">
            <Icon name="i-pos" />
            <b>购物单还是空的</b>
            <p>
              扫描商品条码，或从左侧点选；
              <br />
              散称商品先在称重区录入。
            </p>
          </div>
        ) : (
          lines.map((l) => {
            const p = productById(l.pid)
            if (!p) return null
            const base = lineBase(l)
            const net = lineNet(l)
            const discounted = p.nearExpiry && l.discounted
            const meta = p.loose
              ? `${p.batch} · 去皮 ${Number(l.weight).toFixed(3)}kg`
              : `${p.batch} · 剩余 ${p.remain} 天`
            return (
              <div className="ticket-line" key={l.uid}>
                <div className="tl-top">
                  <span className="tl-thumb" style={{ background: tint(p.icon) }}>
                    <Icon name={`fruit-${p.icon}`} />
                  </span>
                  <div className="tl-main">
                    <div className="tl-name">
                      {p.name}
                      {p.nearExpiry ? <span className="tag tag-amber">临期</span> : null}
                    </div>
                    <div className="tl-meta">{meta}</div>
                  </div>
                  <div className="tl-price">¥{money(net)}</div>
                </div>
                <div className="tl-actions">
                  <div>
                    {p.loose ? (
                      <span className="tl-weight">净重 {Number(l.weight).toFixed(3)} kg</span>
                    ) : (
                      <div className="tl-qty">
                        <button onClick={() => changeLineQty(l.uid, -1)} aria-label="减少">
                          <Icon name="i-minus" />
                        </button>
                        <span>{l.qty}</span>
                        <button onClick={() => changeLineQty(l.uid, 1)} aria-label="增加">
                          <Icon name="i-plus" />
                        </button>
                      </div>
                    )}
                  </div>
                  <button className="tl-remove" onClick={() => removeLine(l.uid)}>
                    移除
                  </button>
                </div>
                {discounted ? (
                  <div className="tl-discount">
                    临期 7 折已应用：¥{money(base)} → ¥{money(net)} · 不再叠加会员价
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </div>

      {pendingExpiry.length ? (
        <div className="expiry-alert">
          <div className="ea-text">
            <b>
              批次 {productById(pendingExpiry[0].pid)?.batch} · 剩余 {productById(pendingExpiry[0].pid)?.remain} 天
            </b>
            可一键转 7 折：¥{money(lineBase(pendingExpiry[0]))} → ¥{money(lineBase(pendingExpiry[0]) * 0.7)}
          </div>
          <button onClick={applyExpiryDiscount}>一键 7 折</button>
        </div>
      ) : null}

      <button className="ticket-coupon" onClick={() => openModal({ type: 'couponPicker' })}>
        <span className="tc-left">
          <Icon name="i-ticket" />
          优惠券 <b>{coupon ? coupon.title : '不使用优惠券'}</b>
        </span>
        <span className="tc-right">
          {coupon
            ? totals.couponOK
              ? `- ¥${money(totals.couponAmount)}`
              : coupon.locked || '未满门槛'
            : '选择'}
          <Icon name="i-chevron" />
        </span>
      </button>

      <div className="ticket-totals">
        <div className="tt-row">
          <span>应收（原价）</span>
          <b>¥{money(totals.base)}</b>
        </div>
        <div className="tt-row">
          <span>
            会员优惠{' '}
            {member ? `· ${level.short} ${(level.discount * 10).toFixed(1)} 折` : ''}
          </span>
          <b className="neg">- ¥{money(totals.memberSaving)}</b>
        </div>
        {totals.expirySaving > 0 ? (
          <div className="tt-row">
            <span>临期折让</span>
            <b className="neg">- ¥{money(totals.expirySaving)}</b>
          </div>
        ) : null}
        <div className="tt-row">
          <span>优惠券抵扣</span>
          <b className="neg">- ¥{money(totals.couponAmount)}</b>
        </div>
        <div className="tt-row main">
          <span>实收</span>
          <b>¥{money(totals.payable)}</b>
        </div>
      </div>

      <div className="pay-methods">
        {PAY_METHODS.map((m) => {
          const disabled = offline ? m.key !== 'cash' : m.key === 'balance'
          const title = offline && m.key !== 'cash' ? '离线模式仅支持现金收款' : m.key === 'balance' ? '储值功能未开通' : ''
          return (
            <button
              key={m.key}
              className={`pay-method ${pay === m.key ? 'selected' : ''}`}
              onClick={() => setPay(m.key)}
              disabled={disabled}
              title={title}
            >
              <Icon name={m.icon} />
              {m.label}
            </button>
          )
        })}
      </div>

      <button className="collect-btn" onClick={onStartPayment} disabled={!lines.length}>
        <Icon name="i-cash" style={{ width: 17, height: 17 }} />
        <span>完成收款</span>
        <span className="amt">¥{money(totals.payable)}</span>
        <span className="kbd">F2</span>
      </button>

      <div className="ticket-actions">
        <button onClick={() => showToast('整单折扣需值班经理授权（BR-07），演示环境不开放')}>整单折扣</button>
        <button className="danger" onClick={() => openModal({ type: 'clearTicket' })}>
          整单取消
        </button>
      </div>

      <div className="ticket-foot">
        <span>离线现金可用 · 自动补传</span>
        <span>称重留痕 · 近效期优先</span>
      </div>
    </aside>
  )
}
