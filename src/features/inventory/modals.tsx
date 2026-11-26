import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { ModalFoot, ModalHead, ModalShell } from '@/components/ModalShell'
import { formatQty, round2 } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'

/** 可用量 = 在库 − 锁定；状态按可用量与水线判定（BR-03 / BR-18） */
export const inventoryStatus = (row: { onHand: number; locked: number; safety: number }) => {
  const avail = round2(row.onHand - row.locked)
  if (avail <= 0) return '缺货'
  if (avail < row.safety) return '偏紧'
  return '正常'
}

export const replenishQty = (row: { onHand: number; locked: number; safety: number; transit: number }) => {
  const avail = round2(row.onHand - row.locked)
  return Math.max(0, Math.ceil(row.safety * 1.5 - avail - row.transit))
}

/* ============================ 补货申请 ============================ */

export function ReplenishModal({ id }: { id: string }) {
  const inventory = useAppStore((s) => s.inventory)
  const confirmReplenish = useAppStore((s) => s.confirmReplenish)
  const closeModal = useAppStore((s) => s.closeModal)

  const row = inventory.find((x) => x.id === id)
  const [qty, setQty] = useState(() => (row ? Math.max(1, replenishQty(row)) : 1))

  if (!row) return null
  const avail = round2(row.onHand - row.locked)

  return (
    <ModalShell onClose={closeModal} width="min(480px,100%)">
      <ModalHead
        kicker="REPLENISH · BR-03"
        title={`补货申请 · ${row.name}`}
        sub={`${row.batch} · 可用 ${formatQty(avail)} ${row.unit} · 安全线 ${row.safety} ${row.unit}`}
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="form-grid">
          <label>
            <span className="field-label">建议补货量</span>
            <input
              className="field"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
            />
          </label>
          <label>
            <span className="field-label">预计到货</span>
            <input className="field" value="明天 06:00" readOnly />
          </label>
          <label className="full">
            <span className="field-label">补货备注</span>
            <textarea className="field" placeholder="选填：供应商 / 车辆 / 温区要求" />
          </label>
        </div>
        <div className="notice soft" style={{ marginTop: 10 }}>
          <Icon name="i-info" />
          <span>
            补货申请推送采购；入库后按批次登记并同步渠道可售量。可售量 = 在库 − 锁定，不产生负库存。
          </span>
        </div>
      </div>
      <ModalFoot note="采购建议依据近 7 日销量">
        <button className="btn btn-ghost" onClick={closeModal}>
          取消
        </button>
        <button className="btn btn-primary" onClick={() => confirmReplenish(row.id, qty)}>
          提交补货申请
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 批次明细 ============================ */

export function BatchTraceModal({ id }: { id: string }) {
  const inventory = useAppStore((s) => s.inventory)
  const openModal = useAppStore((s) => s.openModal)
  const closeModal = useAppStore((s) => s.closeModal)

  const row = inventory.find((x) => x.id === id)
  if (!row) return null
  const avail = round2(row.onHand - row.locked)
  const status = inventoryStatus(row)

  return (
    <ModalShell onClose={closeModal} width="min(480px,100%)">
      <ModalHead
        kicker={`BATCH TRACE · ${row.batch}`}
        title={`${row.name} · 批次明细`}
        sub="批次为最小管理单位；库存、锁定、在途与渠道可售量实时联动。"
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="batch-detail-grid">
          <div className="batch-detail">
            <span>在库 / 锁定</span>
            <b>
              {formatQty(row.onHand)} / {formatQty(row.locked)} {row.unit}
            </b>
          </div>
          <div className="batch-detail">
            <span>可用量</span>
            <b>
              {formatQty(avail)} {row.unit}
            </b>
          </div>
          <div className="batch-detail">
            <span>安全库存</span>
            <b>
              {row.safety} {row.unit}
            </b>
          </div>
          <div className="batch-detail">
            <span>在途</span>
            <b>
              {row.transit} {row.unit}
            </b>
          </div>
          <div className="batch-detail">
            <span>小程序 / 美团 / 饿了么</span>
            <b className="sans">
              {row.channel.mp} / {row.channel.mt} / {row.channel.ele}
            </b>
          </div>
          <div className="batch-detail">
            <span>渠道同步</span>
            <b className="sans">{row.sync}</b>
          </div>
        </div>
        <div className="money-summary">
          <div className="money-row">
            <span>可用量公式</span>
            <b>
              在库 {formatQty(row.onHand)} − 锁定 {formatQty(row.locked)} = {formatQty(avail)}
            </b>
          </div>
          <div className="money-row">
            <span>批次状态</span>
            <b>{status}</b>
          </div>
        </div>
        <div className="notice soft" style={{ marginTop: 10 }}>
          <Icon name="i-shield" />
          <span>
            渠道可售量按保守值下发（BR-18）；同步失败时宁可少卖不超卖。批次可追溯到验收单与供应商。
          </span>
        </div>
      </div>
      <ModalFoot note="最近同步 10:02:48">
        <button className="btn btn-ghost" onClick={closeModal}>
          关闭
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            closeModal()
            openModal({ type: 'replenish', id: row.id })
          }}
        >
          发起补货
        </button>
      </ModalFoot>
    </ModalShell>
  )
}
