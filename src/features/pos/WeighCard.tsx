import { useEffect, useState, type RefObject } from 'react'
import { Icon } from '@/components/Icon'
import { round2 } from '@/lib/format'
import { PRODUCTS } from '@/data/mock'
import { money } from '@/lib/format'
import { productById } from '@/lib/pricing'
import { useAppStore } from '@/store/useAppStore'

interface WeighCardProps {
  grossRef: RefObject<HTMLInputElement | null>
}

/**
 * 散称称重区：毛重、皮重、净重三段式录入。
 * 校验口径与原设计一致（STR_002）：皮重不得大于毛重、净重不超过 50kg。
 */
export function WeighCard({ grossRef }: WeighCardProps) {
  const currentLoose = useAppStore((s) => s.currentLoose)
  const setCurrentLoose = useAppStore((s) => s.setCurrentLoose)
  const addWeighLine = useAppStore((s) => s.addWeighLine)
  const showToast = useAppStore((s) => s.showToast)

  const product = productById(currentLoose)
  const [grossText, setGrossText] = useState('1.260')
  const [tareText, setTareText] = useState('0.020')

  useEffect(() => {
    const p = productById(currentLoose)
    if (p) setTareText(Number(p.tare ?? 0).toFixed(3))
  }, [currentLoose])

  const gross = Math.max(0, parseFloat(grossText) || 0)
  const tare = Math.max(0, parseFloat(tareText) || 0)
  const net = Math.max(0, round2(gross - tare))
  const amount = round2((product?.price ?? 0) * (net / 0.5))

  const looseProducts = PRODUCTS.filter((p) => p.loose)

  const handleAdd = () => {
    if (gross <= 0) {
      showToast('毛重必须大于 0', true)
      return
    }
    if (tare >= gross) {
      showToast('皮重不能大于毛重，请复秤（STR_002）', true)
      return
    }
    if (net > 50) {
      showToast('净重超出秤量范围 50kg（STR_002）', true)
      return
    }
    if (net <= 0) {
      showToast('净重异常，请复秤', true)
      return
    }
    addWeighLine(net)
    setGrossText('0.000')
    setTareText(Number(product?.tare ?? 0).toFixed(3))
  }

  return (
    <div className="weigh-card">
      <div className="weigh-head">
        <div className="weigh-title">
          <Icon name="i-scale" />
          散称称重
          <span>电子秤 03 · 已稳定</span>
        </div>
        <button onClick={() => showToast('复秤已记录：原称重记录保留，新增一条复秤流水')}>
          <Icon name="i-refresh" />
          复秤留痕
        </button>
      </div>
      <div className="weigh-grid">
        <label className="weigh-field">
          <span>散称商品</span>
          <select value={currentLoose} onChange={(e) => setCurrentLoose(e.target.value)}>
            {looseProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · ¥{p.price.toFixed(1)}/500g
              </option>
            ))}
          </select>
        </label>
        <label className="weigh-field">
          <span>毛重 / kg</span>
          <input ref={grossRef} inputMode="decimal" value={grossText} onChange={(e) => setGrossText(e.target.value)} />
        </label>
        <label className="weigh-field">
          <span>皮重 / kg</span>
          <input inputMode="decimal" value={tareText} onChange={(e) => setTareText(e.target.value)} />
        </label>
        <div className="weigh-readout">
          <span>净重</span>
          <b>{net.toFixed(3)}</b>
          <small>kg</small>
        </div>
        <div className="weigh-readout amount">
          <span>计价金额</span>
          <b>¥{money(amount)}</b>
        </div>
        <button className="weigh-add" onClick={handleAdd}>
          <Icon name="i-plus" />
          加入清单
        </button>
      </div>
    </div>
  )
}
