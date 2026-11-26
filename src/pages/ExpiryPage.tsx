import { Icon } from '@/components/Icon'
import { tint } from '@/lib/catalog'
import { money } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'

const FILTERS = [
  { key: '全部', label: '全部' },
  { key: '24h', label: '24 小时内' },
  { key: '48h', label: '48 小时内' },
  { key: '3d', label: '3 天内' },
]

const RULES = [
  { no: '01', title: '临期阈值：', text: '剩余效期 ≤ 品类阈值（水果默认 2 天）触发预警。' },
  { no: '02', title: '阶梯折价：', text: '按剩余效期落档，7 折 / 5 折；同批次只取一档。' },
  { no: '03', title: '成本保护线：', text: '折后价低于成本价时需店长审批，审批通过才可生效。' },
  { no: '04', title: '不叠加：', text: '临期折价不与会员价、券折扣叠加，取对顾客最优的一档。' },
  { no: '05', title: '可追溯：', text: '折价写价格计划，报损写损耗台账，动作与操作人留痕。' },
]

export default function ExpiryPage() {
  const batches = useAppStore((s) => s.batches)
  const filter = useAppStore((s) => s.expiryFilter)
  const setFilter = useAppStore((s) => s.setExpiryFilter)
  const logs = useAppStore((s) => s.expiryLogs)
  const openModal = useAppStore((s) => s.openModal)
  const showToast = useAppStore((s) => s.showToast)

  const pending = batches.filter((b) => b.status === '待处置')
  const urgent = pending.filter((b) => b.remain <= 1)
  const loss = pending.reduce((s, b) => s + b.stock * b.price * 0.3, 0)

  const countOf = (key: string) => {
    if (key === '24h') return batches.filter((b) => b.remain <= 1).length
    if (key === '48h') return batches.filter((b) => b.remain <= 2).length
    if (key === '3d') return batches.filter((b) => b.remain <= 3).length
    return batches.length
  }

  const list = batches
    .filter((b) => {
      if (filter === '24h') return b.remain <= 1
      if (filter === '48h') return b.remain <= 2
      if (filter === '3d') return b.remain <= 3
      return true
    })
    .sort((a, b) => a.remain - b.remain)

  const openEarliest = () => {
    const b = [...pending].sort((x, y) => x.remain - y.remain)[0]
    if (!b) {
      showToast('今日临期批次已全部处置')
      return
    }
    openModal({ type: 'batch', id: b.id, mode: 'discount' })
  }

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <p className="eyebrow">EXPIRY CONTROL · BR-05 / BR-13 / BR-14</p>
          <h1 className="page-title">临期处置。</h1>
          <p className="page-desc">
            按剩余效期分档处置，折后价不得低于成本保护线；低于成本线的折价需店长审批后生效。
          </p>
        </div>
        <div className="page-actions">
          <div className="page-date">
            扫描任务 <b>06:30 已执行</b>
          </div>
          <button className="btn btn-ghost" onClick={() => showToast('临期清单已刷新：新增 1 个批次，0 个过期')}>
            <Icon name="i-refresh" />
            刷新清单
          </button>
          <button className="btn btn-primary" onClick={openEarliest}>
            处置最早批次
          </button>
        </div>
      </div>

      <div className="expiry-stat-row">
        <div className="expiry-stat amber">
          <span>待处置批次</span>
          <b>
            {pending.length}
            <small>批</small>
          </b>
        </div>
        <div className="expiry-stat red">
          <span>24 小时内到期</span>
          <b>
            {urgent.length}
            <small>批</small>
          </b>
        </div>
        <div className="expiry-stat green">
          <span>预计折让金额</span>
          <b>
            ¥{Math.round(loss).toLocaleString('zh-CN')}
            <small>预估</small>
          </b>
        </div>
      </div>

      <div className="expiry-layout">
        <div className="expiry-main">
          <div className="filter-row">
            <div className="filter-chips">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`filter-chip ${filter === f.key ? 'active' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                  <span>{countOf(f.key)}</span>
                </button>
              ))}
            </div>
            <div className="filter-tools">
              <button className="btn btn-ghost btn-sm" onClick={() => showToast('已导出临期清单 CSV（演示）')}>
                <Icon name="i-receipt" />
                导出清单
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>批次 / 商品</th>
                  <th>剩余效期</th>
                  <th>在库</th>
                  <th>售价 / 成本线</th>
                  <th>建议动作</th>
                  <th>状态</th>
                  <th style={{ textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length ? (
                  list.map((b) => {
                    const isPending = b.status === '待处置'
                    const statusCls =
                      b.status === '待处置' ? 'tag-amber' : b.status === '已报损' ? 'tag-red' : 'tag-green'
                    return (
                      <tr key={b.id}>
                        <td>
                          <div className="table-prod">
                            <span className="thumb" style={{ background: tint(b.icon) }}>
                              <Icon name={`fruit-${b.icon}`} />
                            </span>
                            <div>
                              <b>{b.name}</b>
                              <span>{b.batch}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`remain-badge ${b.remain <= 1 ? 'critical' : ''}`}>{b.remain} 天</span>
                        </td>
                        <td>
                          <span className="num">{b.stock}</span>
                          <span className="sub">{b.unit}</span>
                        </td>
                        <td>
                          <span className="num">¥{money(b.price)}</span>
                          <span className="sub">成本 ¥{money(b.cost)}</span>
                        </td>
                        <td>
                          <span className={`tag ${b.suggest.includes('审批') ? 'tag-red' : 'tag-soft'}`}>
                            {b.suggest}
                          </span>
                        </td>
                        <td>
                          <span className={`tag ${statusCls}`}>{b.status}</span>
                        </td>
                        <td>
                          <div className="row-actions">
                            {isPending ? (
                              <>
                                <button
                                  className="action-link"
                                  onClick={() => openModal({ type: 'batch', id: b.id, mode: 'discount' })}
                                >
                                  折价
                                </button>
                                <button
                                  className="action-link warn"
                                  onClick={() => openModal({ type: 'batch', id: b.id, mode: 'cut' })}
                                >
                                  转果切
                                </button>
                                <button
                                  className="action-link red"
                                  onClick={() => openModal({ type: 'batch', id: b.id, mode: 'waste' })}
                                >
                                  报损
                                </button>
                              </>
                            ) : b.status === '审批中' ? (
                              <span className="status-text amber">待审批 · 留痕</span>
                            ) : (
                              <span className="status-text muted">已处置 · 留痕</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="table-empty">该筛选条件下没有批次</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="table-foot">
              <span>
                共 <b>{list.length}</b> 个批次 · 按剩余效期升序
              </span>
              <span>折价 / 报损均写入损耗台账</span>
            </div>
          </div>
        </div>

        <aside className="expiry-side">
          <div className="side-card">
            <div className="side-card-head">
              处置口径 <Icon name="i-shield" />
            </div>
            <div className="side-card-body">
              <div className="rule-list">
                {RULES.map((r) => (
                  <div className="rule-item" key={r.no}>
                    <em>{r.no}</em>
                    <span>
                      <b>{r.title}</b>
                      {r.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="side-card">
            <div className="side-card-head">
              处置记录 <Icon name="i-clock" />
            </div>
            <div className="side-card-body">
              <div className="log-list">
                {logs.slice(0, 6).map((l, idx) => (
                  <div className="log-item" key={`${l.time}-${idx}`}>
                    <time>{l.time}</time>
                    <div>
                      <b>{l.title}</b>
                      {l.by}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
