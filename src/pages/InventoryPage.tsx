import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { inventoryStatus, replenishQty } from '@/features/inventory/modals'
import { tint } from '@/lib/catalog'
import { formatQty, round2 } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'

const FILTERS = ['全部', '低库存', '临期', '缺货']

export default function InventoryPage() {
  const inventory = useAppStore((s) => s.inventory)
  const batches = useAppStore((s) => s.batches)
  const filter = useAppStore((s) => s.inventoryFilter)
  const setFilter = useAppStore((s) => s.setInventoryFilter)
  const openModal = useAppStore((s) => s.openModal)
  const showToast = useAppStore((s) => s.showToast)
  const [keyword, setKeyword] = useState('')

  const kw = keyword.trim().toLowerCase()
  const nearBatches = new Set(batches.filter((b) => b.status === '待处置').map((b) => b.batch))
  const list = inventory.filter((row) => {
    const st = inventoryStatus(row)
    const filterOK =
      filter === '全部' ||
      (filter === '低库存' && st === '偏紧') ||
      (filter === '缺货' && st === '缺货') ||
      (filter === '临期' && nearBatches.has(row.batch))
    const kwOK = !kw || row.name.toLowerCase().includes(kw) || row.batch.toLowerCase().includes(kw)
    return filterOK && kwOK
  })

  const lowCount = inventory.filter((i) => inventoryStatus(i) === '偏紧').length
  const shortCount = inventory.filter((i) => inventoryStatus(i) === '缺货').length
  const nearExpiry = nearBatches.size

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <p className="eyebrow">INVENTORY · BR-03 / BR-10 / BR-18</p>
          <h1 className="page-title">库存批次。</h1>
          <p className="page-desc">
            以「SKU + 批次 + 库位」为最小单位；可用量 = 在库量 − 锁定量，任何操作不产生负库存。
          </p>
        </div>
        <div className="page-actions">
          <div className="page-date">
            最近同步 <b>10:02:48</b>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => showToast('渠道可售量同步完成：小程序 / 美团 / 饿了么')}
          >
            <Icon name="i-refresh" />
            同步渠道
          </button>
          <button className="btn btn-primary" onClick={() => openModal({ type: 'batchTrace', id: 'i1' })}>
            <Icon name="i-stock" />
            查看批次
          </button>
        </div>
      </div>

      <div className="stock-stat-grid">
        <div className="stock-stat">
          <div className="ss-icon">
            <Icon name="i-stock" />
          </div>
          <div>
            <b>128</b>
            <span>在库 SKU</span>
          </div>
        </div>
        <div className="stock-stat warn">
          <div className="ss-icon">
            <Icon name="i-warn" />
          </div>
          <div>
            <b>{lowCount}</b>
            <span>低库存 SKU</span>
          </div>
        </div>
        <div className="stock-stat amber">
          <div className="ss-icon">
            <Icon name="i-expiry" />
          </div>
          <div>
            <b>{nearExpiry}</b>
            <span>临期批次</span>
          </div>
        </div>
        <div className="stock-stat red">
          <div className="ss-icon">
            <Icon name="i-box" />
          </div>
          <div>
            <b>{shortCount}</b>
            <span>缺货 SKU</span>
          </div>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="filter-tools">
          <div className="search-field" style={{ width: 230 }}>
            <Icon name="i-search" />
            <input
              className="field"
              placeholder="搜索商品 / 批次号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>商品 / 批次</th>
              <th>在库</th>
              <th>锁定</th>
              <th>可用量</th>
              <th>安全线</th>
              <th>渠道可售</th>
              <th>状态</th>
              <th style={{ textAlign: 'right' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length ? (
              list.map((row) => {
                const avail = round2(row.onHand - row.locked)
                const st = inventoryStatus(row)
                const stCls = st === '缺货' ? 'tag-red' : st === '偏紧' ? 'tag-amber' : 'tag-green'
                const pct = Math.max(0, Math.min(100, Math.round((avail / (row.safety || 1)) * 100)))
                const suggest = replenishQty(row)
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="table-prod">
                        <span className="thumb" style={{ background: tint(row.icon) }}>
                          <Icon name={`fruit-${row.icon}`} />
                        </span>
                        <div>
                          <b>{row.name}</b>
                          <span>{row.batch}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="num">
                        {formatQty(row.onHand)} {row.unit}
                      </span>
                    </td>
                    <td>
                      <span className="num">{formatQty(row.locked)}</span>
                    </td>
                    <td>
                      <span
                        className={`num ${avail <= 0 ? 'qty-low' : avail < row.safety ? 'qty-warn' : 'qty-ok'}`}
                      >
                        {formatQty(avail)} {row.unit}
                      </span>
                    </td>
                    <td>
                      <div className="stock-health">
                        <span className="mini-bar">
                          <i
                            style={{ width: `${pct}%` }}
                            className={st === '缺货' ? 'danger' : st === '正常' ? '' : 'warn'}
                          />
                        </span>
                        <span>{row.safety}</span>
                      </div>
                    </td>
                    <td>
                      <div className="channel-matrix">
                        <span className="channel-mini">
                          小程序 <b>{row.channel.mp}</b>
                        </span>
                        <span className="channel-mini">
                          美团 <b>{row.channel.mt}</b>
                        </span>
                        <span className="channel-mini">
                          饿了么 <b>{row.channel.ele}</b>
                        </span>
                      </div>
                      <span className="sub">
                        <span className={`sync-dot ${row.sync === '待同步' ? 'wait' : ''}`} />
                        {row.sync}
                        {row.transit ? ` · 在途 ${row.transit}` : ''}
                      </span>
                    </td>
                    <td>
                      <span className={`tag ${stCls}`}>{st}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {suggest > 0 ? (
                          <button className="action-link" onClick={() => openModal({ type: 'replenish', id: row.id })}>
                            补货 {suggest}
                          </button>
                        ) : null}
                        <button className="action-link" onClick={() => openModal({ type: 'batchTrace', id: row.id })}>
                          明细
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={8}>
                  <div className="table-empty">没有匹配的库存批次</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-foot">
          <span>可用量强一致，不允许负库存；渠道同步延迟 ≤ 1 分钟</span>
          <span>在途与锁定分列，防止“有货卖不出”误判</span>
        </div>
      </div>
    </section>
  )
}
