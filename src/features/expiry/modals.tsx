import { Icon } from '@/components/Icon'
import { money, round2 } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'
import { useState } from 'react'
import { ModalFoot, ModalHead, ModalShell } from '@/components/ModalShell'

/* ============================ 临期折价 ============================ */

export function BatchDiscountModal({ id }: { id: string }) {
  const batches = useAppStore((s) => s.batches)
  const applyBatchDiscount = useAppStore((s) => s.applyBatchDiscount)
  const closeModal = useAppStore((s) => s.closeModal)
  const [rate, setRate] = useState(0.7)

  const b = batches.find((x) => x.id === id)
  if (!b) return null

  const newPrice = round2(b.price * rate)
  const below = newPrice < b.cost

  return (
    <ModalShell onClose={closeModal} width="min(480px,100%)">
      <ModalHead
        kicker="NEAR EXPIRY · BR-05 / BR-14"
        title={`临期折价 · ${b.name}`}
        sub={`${b.batch} · 剩余 ${b.remain} 天 · 在库 ${b.stock} ${b.unit} · 成本线 ¥${money(b.cost)}`}
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="radio-cards">
          <button className={`radio-card ${rate === 0.7 ? 'active' : ''}`} onClick={() => setRate(0.7)}>
            <b>7 折</b>
            <span>
              新价 ¥{money(b.price * 0.7)} / {b.unit}
              <br />
              适合剩余 2–3 天
            </span>
          </button>
          <button className={`radio-card ${rate === 0.5 ? 'active' : ''}`} onClick={() => setRate(0.5)}>
            <b>5 折</b>
            <span>
              新价 ¥{money(b.price * 0.5)} / {b.unit}
              <br />
              适合 24 小时内到期
            </span>
          </button>
        </div>

        <div className="money-summary" style={{ marginTop: 10 }}>
          <div className="money-row">
            <span>原售价</span>
            <b>¥{money(b.price)}</b>
          </div>
          <div className="money-row">
            <span>折后价</span>
            <b style={{ color: 'var(--orange)' }}>¥{money(newPrice)}</b>
          </div>
          <div className="money-row">
            <span>成本保护线</span>
            <b>¥{money(b.cost)}</b>
          </div>
          <div className="money-row total">
            <span>预估让利 / {b.unit}</span>
            <b>¥{money(b.price - newPrice)}</b>
          </div>
        </div>

        {below ? (
          <div className="notice amber">
            <Icon name="i-warn" />
            <span>
              折后价 ¥{money(newPrice)} 低于成本保护线 ¥{money(b.cost)}，将提交店长审批后生效（BR-14）。
            </span>
          </div>
        ) : (
          <div className="notice green">
            <Icon name="i-shield" />
            <span>折后价高于成本保护线，可直接生效。</span>
          </div>
        )}

        <div className="notice soft">
          <Icon name="i-info" />
          <span>
            折价后写入价格计划（price_type=4），临期批次状态转为“折价中”；折后价不得低于成本保护线，低于成本需店长审批。
          </span>
        </div>
      </div>
      <ModalFoot note="动作将写入处置记录">
        <button className="btn btn-ghost" onClick={closeModal}>
          取消
        </button>
        <button
          className={below ? 'btn btn-orange' : 'btn btn-primary'}
          onClick={() => applyBatchDiscount(id, rate)}
        >
          {below ? '提交审批' : `确认 ${rate === 0.7 ? '7' : '5'} 折`}
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 转果切 ============================ */

export function BatchCutModal({ id }: { id: string }) {
  const batches = useAppStore((s) => s.batches)
  const applyBatchDisposition = useAppStore((s) => s.applyBatchDisposition)
  const closeModal = useAppStore((s) => s.closeModal)

  const b = batches.find((x) => x.id === id)
  if (!b) return null

  return (
    <ModalShell onClose={closeModal} width="min(480px,100%)">
      <ModalHead
        kicker="RE-PROCESS"
        title={`转果切 · ${b.name}`}
        sub={`${b.batch} · 在库 ${b.stock} ${b.unit} · 剩余 ${b.remain} 天`}
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="notice green">
          <Icon name="i-check" />
          <span>转果切可继续销售并减少报损；操作后生成加工领料单，原料按批次出库。</span>
        </div>
        <div className="batch-detail-grid">
          <div className="batch-detail">
            <span>预计出品</span>
            <b className="sans">{Math.floor(b.stock * 0.8)} 盒</b>
          </div>
          <div className="batch-detail">
            <span>加工损耗</span>
            <b className="sans">约 20%</b>
          </div>
          <div className="batch-detail">
            <span>执行人</span>
            <b className="sans">王芳 · 值班店长</b>
          </div>
          <div className="batch-detail">
            <span>库存动作</span>
            <b className="sans">原料出库 → 成品入库</b>
          </div>
        </div>
      </div>
      <ModalFoot note="成品需重新登记批次">
        <button className="btn btn-ghost" onClick={closeModal}>
          取消
        </button>
        <button className="btn btn-primary" onClick={() => applyBatchDisposition(id, 'cut')}>
          确认转果切
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 报损 ============================ */

export function BatchWasteModal({ id }: { id: string }) {
  const batches = useAppStore((s) => s.batches)
  const applyBatchDisposition = useAppStore((s) => s.applyBatchDisposition)
  const closeModal = useAppStore((s) => s.closeModal)
  const [reason, setReason] = useState('品质下降 · 不可售')

  const b = batches.find((x) => x.id === id)
  if (!b) return null

  return (
    <ModalShell onClose={closeModal} width="min(480px,100%)">
      <ModalHead
        kicker="WASTE · BR-07"
        title={`报损 · ${b.name}`}
        sub={`${b.batch} · 在库 ${b.stock} ${b.unit} · 成本 ¥${money(b.cost * b.stock)}`}
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="notice red">
          <Icon name="i-warn" />
          <span>报损将写入损耗台账并扣减批次库存；需值班店长审批，差异超过授权额度时需上传凭证。</span>
        </div>
        <label className="field-label" style={{ marginTop: 10, display: 'block' }}>
          报损原因
        </label>
        <select className="field" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option>品质下降 · 不可售</option>
          <option>过期未售</option>
          <option>运损</option>
          <option>盘点差异</option>
        </select>
        <label className="field-label" style={{ marginTop: 9, display: 'block' }}>
          备注
        </label>
        <textarea className="field" placeholder="选填：处置说明与凭证编号" />
      </div>
      <ModalFoot note="审批人：王芳（值班店长）">
        <button className="btn btn-ghost" onClick={closeModal}>
          取消
        </button>
        <button className="btn btn-danger" onClick={() => applyBatchDisposition(id, 'waste')}>
          确认报损
        </button>
      </ModalFoot>
    </ModalShell>
  )
}
