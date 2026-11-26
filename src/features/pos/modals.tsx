import { useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'
import { ModalFoot, ModalHead, ModalShell } from '@/components/ModalShell'
import { POS_COUPONS } from '@/data/mock'
import { money, round2 } from '@/lib/format'
import { calcTotals, levelOf } from '@/lib/pricing'
import { useAppStore } from '@/store/useAppStore'

/* ============================ 会员识别 ============================ */

export function MemberPickerModal() {
  const members = useAppStore((s) => s.members)
  const memberId = useAppStore((s) => s.posMemberId)
  const chooseMember = useAppStore((s) => s.chooseMember)
  const closeModal = useAppStore((s) => s.closeModal)
  const [keyword, setKeyword] = useState('')

  const list = members.filter(
    (m) => !keyword || m.name.includes(keyword) || m.mask.includes(keyword) || m.phone.endsWith(keyword),
  )

  return (
    <ModalShell onClose={closeModal}>
      <ModalHead
        kicker="MEMBER IDENTIFY · 会员识别"
        title="识别会员"
        sub="支持手机号、会员卡或付款码识别；手机号已做脱敏展示。"
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="search-field" style={{ marginBottom: 9 }}>
          <Icon name="i-search" />
          <input
            className="field"
            placeholder="输入姓名或手机号后四位"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-list">
          {list.length ? (
            list.map((m) => (
              <button
                className={`pick-member ${memberId === m.id ? 'selected' : ''}`}
                key={m.id}
                onClick={() => chooseMember(m.id)}
              >
                <span className="pm-avatar">{m.name.slice(0, 1)}</span>
                <span className="pm-main">
                  <b>
                    {m.name} <span className={`level ${levelOf(m).cls}`}>{levelOf(m).short}</span>
                  </b>
                  <span>
                    {m.mask} · 积分 {m.points}
                  </span>
                </span>
                <span className="pm-right">
                  <b>{(levelOf(m).discount * 10).toFixed(1)} 折</b>券 {m.coupons} 张
                </span>
              </button>
            ))
          ) : (
            <div className="table-empty">未找到匹配会员</div>
          )}
        </div>
        <div className="notice soft" style={{ marginTop: 10 }}>
          <Icon name="i-info" />
          <span>会员识别后自动应用等级折扣并累计积分；散客按原价结算，可在本单内补录会员后重算。</span>
        </div>
      </div>
      <ModalFoot note="会员手机号全局唯一">
        <button className="btn btn-ghost" onClick={closeModal}>
          取消
        </button>
        <button className="btn btn-primary" onClick={() => chooseMember(null)}>
          按散客结算
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 优惠券 ============================ */

export function CouponPickerModal() {
  const lines = useAppStore((s) => s.posLines)
  const members = useAppStore((s) => s.members)
  const memberId = useAppStore((s) => s.posMemberId)
  const couponId = useAppStore((s) => s.posCouponId)
  const chooseCoupon = useAppStore((s) => s.chooseCoupon)
  const closeModal = useAppStore((s) => s.closeModal)

  const member = memberId ? members.find((m) => m.id === memberId) ?? null : null
  const totals = calcTotals(lines, member, couponId)

  return (
    <ModalShell onClose={closeModal}>
      <ModalHead
        kicker="COUPON · 门店渠道"
        title="选择优惠券"
        sub="仅显示可在门店收银台核销的券；线上券、互斥券会置灰说明原因。"
        onClose={closeModal}
      />
      <div className="modal-body">
        <button
          className={`coupon-pick-row ${!couponId ? 'selected' : ''}`}
          onClick={() => chooseCoupon(null)}
        >
          <span className="cp-amount">
            <b>—</b>
            <span>不使用</span>
          </span>
          <span className="cp-info">
            <b>不使用优惠券</b>
            <span>按会员价与临期折价结算</span>
          </span>
          <span className="cp-pick">{!couponId ? '已选' : '选择'}</span>
        </button>

        {POS_COUPONS.map((c) => {
          const locked = !!c.locked
          const notMet = !locked && totals.after < c.threshold
          const ok = !locked && !notMet
          const selected = couponId === c.id
          return (
            <button
              className={`coupon-pick-row ${selected ? 'selected' : ''}`}
              key={c.id}
              disabled={!ok}
              onClick={() => ok && chooseCoupon(c.id)}
            >
              <span className="cp-amount">
                <b>{c.amount ? `¥${c.amount}` : '9折'}</b>
                <span>{c.threshold ? `满 ${c.threshold}` : '品类'}</span>
              </span>
              <span className="cp-info">
                <b>{c.title}</b>
                <span>{c.scope}</span>
                {locked ? (
                  <span className="reason">{c.locked}</span>
                ) : notMet ? (
                  <span className="reason">还差 ¥{money(c.threshold - totals.after)} 可用</span>
                ) : (
                  <span style={{ color: 'var(--green)' }}>可用</span>
                )}
              </span>
              <span className="cp-pick">{selected ? '已选' : '选择'}</span>
            </button>
          )
        })}

        <div className="notice soft" style={{ marginTop: 10 }}>
          <Icon name="i-info" />
          <span>券与会员价、临期折价的叠加关系由券模板声明；本单最高优先级的优惠会实时重算。</span>
        </div>
      </div>
      <ModalFoot note="券成本计入营销费用">
        <button className="btn btn-primary" onClick={closeModal}>
          完成
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 现金收款 ============================ */

export function CashModal() {
  const lines = useAppStore((s) => s.posLines)
  const members = useAppStore((s) => s.members)
  const memberId = useAppStore((s) => s.posMemberId)
  const couponId = useAppStore((s) => s.posCouponId)
  const offline = useAppStore((s) => s.offline)
  const finalizeSale = useAppStore((s) => s.finalizeSale)
  const closeModal = useAppStore((s) => s.closeModal)
  const showToast = useAppStore((s) => s.showToast)

  const member = memberId ? members.find((m) => m.id === memberId) ?? null : null
  const totals = calcTotals(lines, member, couponId)
  const [received, setReceived] = useState(String(Math.ceil(totals.payable)))

  const value = parseFloat(received) || 0
  const change = round2(value - totals.payable)

  const confirm = () => {
    if (value < totals.payable) {
      showToast('实收金额不足，请核对找零', true)
      return
    }
    finalizeSale('cash', value)
  }

  return (
    <ModalShell onClose={closeModal} width="min(480px,100%)">
      <ModalHead
        kicker="CASH · OFFLINE READY"
        title="现金收款"
        sub="现金收款需核对找零；离线交易会本地暂存并在联网后补传。"
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="cash-due">
          <span>本单应收</span>
          <b>
            <small>¥</small>
            {money(totals.payable)}
          </b>
        </div>
        <label className="field-label">顾客实付</label>
        <input
          className="field"
          inputMode="decimal"
          value={received}
          onChange={(e) => setReceived(e.target.value)}
          style={{ fontFamily: 'var(--mono)', fontSize: 18, height: 48 }}
          autoFocus
        />
        <div className="cash-quick">
          {[50, 100, 150, 200].map((v) => (
            <button key={v} onClick={() => setReceived(String(v))}>
              ¥{v}
            </button>
          ))}
        </div>
        <div className="cash-change">
          <span>找零</span>
          <b style={{ color: change >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {change >= 0 ? `¥${money(change)}` : `还差 ¥${money(-change)}`}
          </b>
        </div>
        {offline ? (
          <div className="notice amber">
            <Icon name="i-warn" />
            <span>当前为离线模式：本笔现金交易将本地落库，恢复联网后自动补传并扣减库存。</span>
          </div>
        ) : null}
        <div className="notice soft">
          <Icon name="i-shield" />
          <span>现金收款受开班备用金校验；交班日结会核对现金应收与实收差异。</span>
        </div>
      </div>
      <ModalFoot>
        <button className="btn btn-ghost" onClick={closeModal}>
          取消
        </button>
        <button className="btn btn-primary" onClick={confirm} disabled={value < totals.payable}>
          确认收款
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 扫码收款 ============================ */

function qrCells(): boolean[] {
  const n = 21
  const cells: boolean[] = []
  const inFinder = (x: number, y: number) => (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
  const finderOn = (x: number, y: number) => {
    const lx = x > 13 ? x - 14 : x
    const ly = y > 13 ? y - 14 : y
    const ring = lx === 0 || lx === 6 || ly === 0 || ly === 6
    const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4
    return ring || core
  }
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      if (inFinder(x, y)) cells.push(finderOn(x, y))
      else cells.push((x * 7 + y * 11 + x * y * 3) % 7 < 2)
    }
  }
  return cells
}

export function ScanModal() {
  const lines = useAppStore((s) => s.posLines)
  const members = useAppStore((s) => s.members)
  const memberId = useAppStore((s) => s.posMemberId)
  const couponId = useAppStore((s) => s.posCouponId)
  const pay = useAppStore((s) => s.posPay)
  const finalizeSale = useAppStore((s) => s.finalizeSale)
  const closeModal = useAppStore((s) => s.closeModal)
  const [paying, setPaying] = useState(false)

  const member = memberId ? members.find((m) => m.id === memberId) ?? null : null
  const totals = calcTotals(lines, member, couponId)
  const method = pay === 'alipay' ? { name: '支付宝', icon: 'i-alipay' } : { name: '微信支付', icon: 'i-wechat' }
  const cells = useMemo(qrCells, [])

  const simulatePaid = () => {
    setPaying(true)
    window.setTimeout(() => finalizeSale(pay), 800)
  }

  return (
    <ModalShell onClose={closeModal} width="min(480px,100%)">
      <ModalHead
        kicker="SCAN TO PAY"
        title={`${method.name}收款`}
        sub="请让顾客扫描屏幕二维码；支付回执由渠道异步返回。"
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="qr-box">
          <div className="qr-grid">
            {cells.map((on, i) => (
              <i key={i} className={on ? 'on' : ''} />
            ))}
          </div>
          <div className="qr-brand">
            <Icon name={method.icon} />
            {method.name} · 果链鲜选 望江路店
          </div>
        </div>
        <div className="cash-due">
          <span>待支付</span>
          <b>
            <small>¥</small>
            {money(totals.payable)}
          </b>
        </div>
        <p className="qr-wait">
          等待顾客扫码…
          <br />
          支付成功后自动打印小票并扣减库存
        </p>
        <div className="notice soft">
          <Icon name="i-shield" />
          <span>支付回执超时 30 秒转「支付确认中」，由日对账兜底；重复回调按幂等键只入账一次。</span>
        </div>
      </div>
      <ModalFoot>
        <button className="btn btn-ghost" onClick={closeModal}>
          取消
        </button>
        <button className="btn btn-primary" onClick={simulatePaid} disabled={paying}>
          {paying ? '等待支付回执…' : '模拟支付成功'}
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 收款完成 · 小票 ============================ */

export function ReceiptModal() {
  const modal = useAppStore((s) => s.modal)
  const queued = useAppStore((s) => s.queued)
  const nextSale = useAppStore((s) => s.nextSale)
  const closeModal = useAppStore((s) => s.closeModal)
  const showToast = useAppStore((s) => s.showToast)

  if (modal?.type !== 'receipt') return null
  const r = modal.receipt

  return (
    <ModalShell onClose={closeModal} width="min(480px,100%)">
      <ModalHead
        kicker={`PAYMENT COMPLETE · ${r.offline ? 'OFFLINE QUEUED' : 'ONLINE'}`}
        title="收款完成"
        sub={r.offline ? '离线交易已本地暂存，恢复联网后自动补传。' : '库存已扣减，积分与券已同步更新。'}
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="receipt">
          <div className={`receipt-stamp ${r.offline ? 'offline' : ''}`}>{r.offline ? '离线 · 待补传' : '已收款'}</div>
          <div className="receipt-head">
            <h4>果链鲜选</h4>
            <p>
              望江路店 · 成都市武侯区望江路 12 号
              <br />
              电话 028-8888 2046 · 收银员 王芳
            </p>
          </div>
          <div className="receipt-meta">
            <span>小票 {r.slip}</span>
            <span>{r.time}</span>
          </div>
          <div className="receipt-meta">
            <span>会员 {r.member ? `${r.member.name} · ${levelOf(r.member).short}` : '散客'}</span>
            <span>交易 {r.trade}</span>
          </div>
          <div className="receipt-items">
            {r.items.map((i, idx) => (
              <div className="receipt-line" key={idx}>
                <div className="ri-name">
                  {i.name}
                  <span>
                    {i.meta}
                    {i.discounted ? ' · 临期7折' : ''}
                  </span>
                </div>
                <div className="ri-amt">¥{money(i.amount)}</div>
              </div>
            ))}
          </div>
          <div className="receipt-sum">
            <div>
              <span>应收</span>
              <span>¥{money(r.base)}</span>
            </div>
            <div>
              <span>会员优惠</span>
              <span>- ¥{money(r.memberSaving)}</span>
            </div>
            {r.expirySaving > 0 ? (
              <div>
                <span>临期折让</span>
                <span>- ¥{money(r.expirySaving)}</span>
              </div>
            ) : null}
            {r.coupon ? (
              <div>
                <span>券抵扣 · {r.coupon.title}</span>
                <span>- ¥{money(r.couponAmount)}</span>
              </div>
            ) : null}
            <div className="total">
              <span>实收</span>
              <b>¥{money(r.payable)}</b>
            </div>
            <div>
              <span>{r.payName}</span>
              <span>{r.received !== null ? `¥${money(r.received)}` : `¥${money(r.payable)}`}</span>
            </div>
            {r.change > 0 ? (
              <div>
                <span>找零</span>
                <span>¥{money(r.change)}</span>
              </div>
            ) : null}
          </div>
          <div className="receipt-foot">
            近效期优先出库 · 散称多退少不补
            <br />
            本单获得积分 +{r.points} · 售后 24 小时内可申请
            <br />
            谢谢光临，祝你今天好胃口。
          </div>
        </div>
      </div>
      <ModalFoot note={r.offline ? `离线待补传 ${queued} 笔` : '小票打印就绪'}>
        <button className="btn btn-ghost" onClick={() => showToast('小票已发送至 A01 小票机')}>
          <Icon name="i-print" />
          打印小票
        </button>
        <button className="btn btn-primary" onClick={nextSale}>
          完成 · 下一单
        </button>
      </ModalFoot>
    </ModalShell>
  )
}
