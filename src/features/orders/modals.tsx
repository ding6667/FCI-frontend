import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { ModalFoot, ModalHead, ModalShell } from '@/components/ModalShell'
import { money, round2 } from '@/lib/format'
import { productById } from '@/lib/pricing'
import { useAppStore } from '@/store/useAppStore'

/* ============================ 拣货任务 ============================ */

export function PickModal({ no }: { no: string }) {
  const orders = useAppStore((s) => s.orders)
  const confirmPick = useAppStore((s) => s.confirmPick)
  const closeModal = useAppStore((s) => s.closeModal)

  const order = orders.find((o) => o.no === no)
  const [weights, setWeights] = useState<number[]>(() =>
    (order?.items ?? []).map((it) => Number((it.weight ?? it.est ?? 0).toFixed(2))),
  )

  if (!order) return null

  let diffTotal = 0
  const rows = order.items.map((it, idx) => {
    const p = productById(it.name)
    const price = p?.price ?? 0
    if (!it.loose) {
      return {
        it,
        idx,
        price,
        diffKg: 0,
        diff: 0,
        subtotal: round2(price * it.qty),
      }
    }
    const est = it.est ?? 0
    const val = weights[idx] ?? est
    const diffKg = round2(val - est)
    const diff = round2(diffKg * (price / 0.5))
    diffTotal += diff
    return { it, idx, price, diffKg, diff, subtotal: round2(price * (val / 0.5)) }
  })
  diffTotal = round2(diffTotal)

  return (
    <ModalShell onClose={closeModal}>
      <ModalHead
        kicker={`PICKING · ${order.no}`}
        title={`拣货任务 · ${order.customer}`}
        sub={`${order.channel} · 承诺 ${order.promise} · ${order.fulfillment} · 按近效期批次优先`}
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="pick-head">
          <span>商品 / 批次 / 库位</span>
          <span>实称 / 数量</span>
          <span>差额</span>
          <span style={{ textAlign: 'right' }}>小计</span>
        </div>
        <div className="pick-summary" style={{ marginTop: 0 }}>
          {rows.map(({ it, idx, diffKg, diff, subtotal }) => (
            <div className="pick-line" key={`${it.name}-${idx}`}>
              <div>
                <span className="name">
                  {it.name}
                  {it.loose ? <span className="tag tag-amber">散称</span> : null}
                </span>
                <span className="batch">
                  {it.batch} · 库位 {it.loc}
                </span>
              </div>
              <div>
                {it.loose ? (
                  <input
                    className="field pick-weight"
                    inputMode="decimal"
                    value={Number(weights[idx] ?? 0).toFixed(2)}
                    onChange={(e) => {
                      const next = [...weights]
                      next[idx] = parseFloat(e.target.value) || 0
                      setWeights(next)
                    }}
                  />
                ) : (
                  <span className="num">× {it.qty}</span>
                )}
              </div>
              <div className={`diff ${Math.abs(diff) > 2 ? 'warn' : ''}`}>
                {it.loose ? `${diffKg >= 0 ? '+' : ''}${diffKg.toFixed(2)} kg / ¥${money(diff)}` : '按件拣货'}
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 10 }}>¥{money(subtotal)}</div>
            </div>
          ))}
        </div>

        <div className="money-summary">
          <div className="money-row">
            <span>订单预估金额</span>
            <b>¥{money(order.amount)}</b>
          </div>
          <div className="money-row">
            <span>实称差额（多退少不补）</span>
            <b style={{ color: Math.abs(diffTotal) > 2 ? 'var(--orange)' : 'var(--green)' }}>
              {diffTotal >= 0 ? '+' : ''}¥{money(diffTotal)}
            </b>
          </div>
          <div className="money-row total">
            <span>拣货后金额</span>
            <b>¥{money(round2(order.amount + diffTotal))}</b>
          </div>
        </div>

        <div className="pick-note">
          散称商品按实称净重结算；差额在阈值内自动结案（多退少不补），超阈值需顾客确认。复核后锁定批次出库。
        </div>
      </div>
      <ModalFoot note={`库存锁定中 · 幂等键 ${order.no}`}>
        <button className="btn btn-ghost" onClick={closeModal}>
          稍后处理
        </button>
        <button className="btn btn-primary" onClick={() => confirmPick(order.no, weights)}>
          <Icon name="i-print" />
          完成拣货 · 打印标签
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 订单明细 ============================ */

export function OrderDetailModal({ no }: { no: string }) {
  const orders = useAppStore((s) => s.orders)
  const closeModal = useAppStore((s) => s.closeModal)
  const showToast = useAppStore((s) => s.showToast)

  const order = orders.find((o) => o.no === no)
  if (!order) return null

  return (
    <ModalShell onClose={closeModal}>
      <ModalHead
        kicker={`ORDER · ${order.no}`}
        title="订单明细"
        sub={`${order.channel} · ${order.customer} · ${order.fulfillment} · 承诺 ${order.promise}`}
        onClose={closeModal}
      />
      <div className="modal-body">
        {order.items.map((it, idx) => {
          const price = productById(it.name)?.price ?? 0
          const qty = it.loose ? (it.weight ?? it.est ?? 0) / 0.5 : it.qty
          return (
            <div className="pick-line" key={idx} style={{ gridTemplateColumns: '1fr 90px 90px' }}>
              <div>
                <span className="name">{it.name}</span>
                <span className="batch">
                  {it.batch} · 库位 {it.loc}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                {it.loose ? `${Number(it.weight ?? it.est).toFixed(2)} kg` : `× ${it.qty}`}
              </div>
              <div style={{ textAlign: 'right' }} className="num">
                ¥{money(price * qty)}
              </div>
            </div>
          )
        })}
        <div className="money-summary">
          <div className="money-row total">
            <span>订单金额</span>
            <b>¥{money(order.amount)}</b>
          </div>
        </div>
        <div className="notice soft" style={{ marginTop: 10 }}>
          <Icon name="i-info" />
          <span>
            当前节点：{order.status} · 已按近效期批次锁定库存；批次可追溯到供应商与到货验收单。
          </span>
        </div>
      </div>
      <ModalFoot note={`订单号 ${order.no}`}>
        <button className="btn btn-ghost" onClick={closeModal}>
          关闭
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            showToast('小票已补打（演示）')
            closeModal()
          }}
        >
          补打小票
        </button>
      </ModalFoot>
    </ModalShell>
  )
}
