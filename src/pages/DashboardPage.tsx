import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CountUp } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { tint } from '@/lib/catalog'
import { fmtDateCN, money } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'
import { useNow } from '@/hooks/useNow'

export default function DashboardPage() {
  const navigate = useNavigate()
  const now = useNow(30_000)

  const batches = useAppStore((s) => s.batches)
  const orders = useAppStore((s) => s.orders)
  const inventory = useAppStore((s) => s.inventory)
  const openModal = useAppStore((s) => s.openModal)
  const showToast = useAppStore((s) => s.showToast)

  const pendingExpiry = batches.filter((b) => b.status === '待处置')
  const inFlight = orders.filter((o) => o.status !== '已完成')
  /** 待拣 + 待打包，与导航角标口径一致 */
  const pickable = orders.filter((o) => o.status === '待拣货' || o.status === '待打包')
  const lowStock = inventory.filter((i) => {
    const avail = Math.round((i.onHand - i.locked) * 100) / 100
    return avail > 0 && avail < i.safety
  })

  const expiryList = useMemo(
    () => [...pendingExpiry].sort((a, b) => a.remain - b.remain).slice(0, 4),
    [pendingExpiry],
  )
  const queue = useMemo(
    () => [...inFlight].sort((a, b) => a.promise.localeCompare(b.promise)).slice(0, 4),
    [inFlight],
  )

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <p className="eyebrow">
            DASHBOARD · {fmtDateCN(now)} · A 班
          </p>
          <h1 className="page-title">早上好，王芳。</h1>
          <p className="page-desc">
            今天有 <b>{pickable.length}</b> 单待拣、<b>{pendingExpiry.length}</b> 个临期批次需要处置；06:00
            到仓的丹东草莓已上架。
          </p>
        </div>
        <div className="page-actions">
          <div className="page-date">
            营业中 <b>07:00 — 22:00</b>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/app/expiry')}>
            临期处置
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/app/pos')}>
            <Icon name="i-pos" />
            开始收银
          </button>
        </div>
      </div>

      {/* 工作台下的四个作业系统入口：与侧栏「工作台」展开的二级项一一对应 */}
      <div className="subsys-row" aria-label="工作台二级系统">
        <div className="subsys-lead">
          <b>SUBSYSTEMS</b>
          <span>工作台二级</span>
        </div>
        <button className="subsys-card" onClick={() => navigate('/app/pos')}>
          <span className="s-icon">
            <Icon name="i-pos" />
          </span>
          <span className="s-text">
            <b>收银台</b>
            <span className="s-meta">称重 · 收款 · 挂单</span>
          </span>
          <span className="s-count">A01</span>
        </button>
        <button className="subsys-card" onClick={() => navigate('/app/expiry')}>
          <span className="s-icon">
            <Icon name="i-expiry" />
          </span>
          <span className="s-text">
            <b>临期处置</b>
            <span className="s-meta">折价 · 报损 · 退供</span>
          </span>
          <span className="s-count">{pendingExpiry.length} 批</span>
        </button>
        <button className="subsys-card" onClick={() => navigate('/app/orders')}>
          <span className="s-icon">
            <Icon name="i-orders" />
          </span>
          <span className="s-text">
            <b>订单履约</b>
            <span className="s-meta">拣货 · 打包 · 交接</span>
          </span>
          <span className="s-count">{pickable.length} 单</span>
        </button>
        <button className="subsys-card" onClick={() => navigate('/app/inventory')}>
          <span className="s-icon">
            <Icon name="i-stock" />
          </span>
          <span className="s-text">
            <b>库存批次</b>
            <span className="s-meta">在库 · 效期 · 周转</span>
          </span>
          <span className="s-count">{inventory.length} 品</span>
        </button>
      </div>

      <div className="kpi-grid">
        <article className="kpi-card">
          <div className="kpi-label">
            今日销售额
            <Icon name="i-tag" />
          </div>
          <div className="kpi-value">
            <small>¥</small>
            <span>
              <CountUp value={12486.5} decimals={2} />
            </span>
          </div>
          <div className="kpi-foot">
            <span className="delta">↑ 12.4%</span> 较昨日同期
          </div>
          <svg className="kpi-spark" viewBox="0 0 72 26">
            <polyline points="0,20 10,17 20,18 30,12 40,14 50,8 61,10 72,3" fill="none" stroke="#2F6B49" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </article>
        <article className="kpi-card">
          <div className="kpi-label">
            今日订单数
            <Icon name="i-receipt" />
          </div>
          <div className="kpi-value">
            <span>
              <CountUp value={186} />
            </span>
            <span className="unit">单</span>
          </div>
          <div className="kpi-foot">
            <span className="delta">↑ 8 单</span> 线上 62 · 线下 124
          </div>
          <svg className="kpi-spark" viewBox="0 0 72 26">
            <polyline points="0,18 10,19 20,13 30,15 40,10 50,12 61,7 72,8" fill="none" stroke="#E1591F" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </article>
        <article className="kpi-card">
          <div className="kpi-label">
            平均客单价
            <Icon name="i-members" />
          </div>
          <div className="kpi-value">
            <small>¥</small>
            <span>
              <CountUp value={67.13} decimals={2} />
            </span>
          </div>
          <div className="kpi-foot">
            <span className="delta">↑ ¥3.20</span> 会员单占比 46%
          </div>
          <svg className="kpi-spark" viewBox="0 0 72 26">
            <polyline points="0,16 10,12 20,15 30,9 40,13 50,7 61,9 72,5" fill="none" stroke="#D69B22" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </article>
        <article className="kpi-card">
          <div className="kpi-label">
            今日损耗率
            <Icon name="i-expiry" />
          </div>
          <div className="kpi-value">
            <span>
              <CountUp value={3.8} decimals={1} />
            </span>
            <span className="unit">%</span>
          </div>
          <div className="kpi-foot">
            <span className="delta">↓ 0.6%</span> 低于目标 5.0%
          </div>
          <svg className="kpi-spark" viewBox="0 0 72 26">
            <polyline points="0,7 10,8 20,6 30,12 40,10 50,14 61,15 72,17" fill="none" stroke="#1B2A20" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </article>
      </div>

      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                <em>01</em>今日销售 · 每小时
              </div>
              <div className="panel-sub">销售额按订单支付时间聚合 · 数据截至 10:03 · 含 POS 与线上渠道</div>
            </div>
            <div className="chart-legend">
              <i />
              销售额
              <i className="dash" />
              订单数
            </div>
          </div>
          <div className="chart-wrap">
            <svg className="chart-svg" viewBox="0 0 800 250" role="img" aria-label="今日销售曲线">
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#2F6B49" stopOpacity=".24" />
                  <stop offset="1" stopColor="#2F6B49" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g stroke="#D9CFBC" strokeWidth="1">
                <line x1="48" y1="18" x2="780" y2="18" />
                <line x1="48" y1="70" x2="780" y2="70" />
                <line x1="48" y1="122" x2="780" y2="122" />
                <line x1="48" y1="174" x2="780" y2="174" />
                <line x1="48" y1="226" x2="780" y2="226" />
              </g>
              <g fill="#7B8578" fontFamily="Bahnschrift,sans-serif" fontSize="8">
                <text x="8" y="21">6k</text>
                <text x="8" y="73">4k</text>
                <text x="8" y="125">2k</text>
                <text x="8" y="177">1k</text>
                <text x="8" y="229">0</text>
                <text x="48" y="244">08:00</text>
                <text x="196" y="244">10:00</text>
                <text x="344" y="244">12:00</text>
                <text x="492" y="244">14:00</text>
                <text x="640" y="244">16:00</text>
                <text x="756" y="244">18:00</text>
              </g>
              <path
                d="M48 196 L120 182 L192 188 L264 150 L336 162 L408 120 L480 128 L552 96 L624 108 L696 70 L780 82 L780 226 L48 226Z"
                fill="url(#area)"
              />
              <path
                d="M48 196 L120 182 L192 188 L264 150 L336 162 L408 120 L480 128 L552 96 L624 108 L696 70 L780 82"
                fill="none"
                stroke="#2F6B49"
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle cx="780" cy="82" r="4" fill="#2F6B49" stroke="#FCF8EE" strokeWidth="2" />
              <path
                d="M48 208 L120 198 L192 204 L264 180 L336 188 L408 160 L480 168 L552 142 L624 152 L696 124 L780 132"
                fill="none"
                stroke="#BCB09A"
                strokeWidth="1.4"
                strokeDasharray="4 5"
              />
              <g fill="#7B8578" fontFamily="Bahnschrift,sans-serif" fontSize="8">
                <text x="318" y="34">¥12,486.50</text>
              </g>
            </svg>
          </div>
          <div className="panel-foot">
            <span>早高峰 10:00–11:00 · 销售额 ¥3,240</span>
            <span>口径版本 v1 · 与 BI 指标一致</span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                <em>02</em>晨会三件事
              </div>
              <div className="panel-sub">按优先级排好，三分钟能过完</div>
            </div>
          </div>
          <div className="morning-list">
            <button className="morning-item" onClick={() => navigate('/app/expiry')}>
              <span className="morning-icon">
                <Icon name="i-expiry" />
              </span>
              <span className="morning-main">
                <b>临期批次待处置</b>
                <span>批次 B20261028-03 剩余 2 天</span>
              </span>
              <span className="morning-count">
                {pendingExpiry.length}
                <small>批</small>
              </span>
              <span className="morning-arrow">
                <Icon name="i-chevron" />
              </span>
            </button>
            <button className="morning-item" onClick={() => navigate('/app/inventory')}>
              <span className="morning-icon">
                <Icon name="i-stock" />
              </span>
              <span className="morning-main">
                <b>低库存 SKU</b>
                <span>阳光玫瑰 · 蓝莓低于安全线</span>
              </span>
              <span className="morning-count">
                {lowStock.length}
                <small>品</small>
              </span>
              <span className="morning-arrow">
                <Icon name="i-chevron" />
              </span>
            </button>
            <button className="morning-item" onClick={() => navigate('/app/orders')}>
              <span className="morning-icon">
                <Icon name="i-orders" />
              </span>
              <span className="morning-main">
                <b>待拣货订单</b>
                <span>最早承诺 10:25 送达</span>
              </span>
              <span className="morning-count">
                {pickable.length}
                <small>单</small>
              </span>
              <span className="morning-arrow">
                <Icon name="i-chevron" />
              </span>
            </button>
          </div>
          <div className="panel-foot">
            <span>晨会 07:45 · 由值班店长主持</span>
            <button className="action-link" onClick={() => showToast('晨会已记录：临期批次按 7 折优先出库')}>
              标记已过
            </button>
          </div>
        </section>
      </div>

      <div className="dash-grid-2" style={{ marginTop: 14 }}>
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                <em>03</em>临期批次清单
              </div>
              <div className="panel-sub">按剩余效期升序 · 建议动作依据品类阈值与成本线</div>
            </div>
            <div className="panel-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/expiry')}>
                全部批次 <Icon name="i-arrow" />
              </button>
            </div>
          </div>
          {expiryList.length ? (
            <table className="mini-table">
              <thead>
                <tr>
                  <th>商品 / 批次</th>
                  <th>剩余</th>
                  <th>在库</th>
                  <th>售价</th>
                  <th style={{ textAlign: 'right' }}>处置</th>
                </tr>
              </thead>
              <tbody>
                {expiryList.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="mini-prod">
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
                      <span className={`remain ${b.remain <= 1 ? 'danger' : 'warn'}`}>{b.remain} 天</span>
                    </td>
                    <td>
                      <span className="num">
                        {b.stock} {b.unit}
                      </span>
                    </td>
                    <td>
                      <span className="num">¥{money(b.price)}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openModal({ type: 'batch', id: b.id, mode: 'discount' })}
                      >
                        去处置
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="table-empty">今日临期批次已全部处置完成</div>
          )}
          <div className="panel-foot">
            <span>临期折价不与会员价叠加</span>
            <span>扫描任务每 15 分钟刷新</span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                <em>04</em>履约排队
              </div>
              <div className="panel-sub">按承诺时间升序，超时标红</div>
            </div>
            <div className="panel-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/orders')}>
                去履约 <Icon name="i-arrow" />
              </button>
            </div>
          </div>
          <div className="queue-list">
            {queue.length ? (
              queue.map((o) => {
                const cls = o.channel === '美团' ? 'mt' : o.channel === '饿了么' ? 'ele' : ''
                const late = o.promise <= '10:05'
                return (
                  <div className="queue-item" key={o.no}>
                    <span className={`queue-channel ${cls}`}>{o.channel}</span>
                    <span className="queue-main">
                      <b>
                        {o.customer} · {o.items.length} 件
                      </b>
                      <span>{o.items.map((i) => i.name).join(' · ')}</span>
                    </span>
                    <span className={`queue-time ${late ? 'late' : ''}`}>{o.promise}</span>
                  </div>
                )
              })
            ) : (
              <div className="table-empty">履约队列已清空</div>
            )}
          </div>
          <div className="panel-foot">
            <span>{inFlight.length} 单在途 · 平均拣货 6 分钟</span>
            <span>承诺准时率 98.6%</span>
          </div>
        </section>
      </div>

      <div className="quick-strip">
        <button className="quick-btn" onClick={() => navigate('/app/pos')}>
          <span className="q-icon">
            <Icon name="i-scale" />
          </span>
          <span>
            <b>散称称重</b>
            <span>电子秤 03 · 直接进单</span>
          </span>
          <span className="q-arrow">
            <Icon name="i-arrow" />
          </span>
        </button>
        <button className="quick-btn" onClick={() => navigate('/app/expiry')}>
          <span className="q-icon">
            <Icon name="i-tag" />
          </span>
          <span>
            <b>临期折价</b>
            <span>一品一策 · 成本保护</span>
          </span>
          <span className="q-arrow">
            <Icon name="i-arrow" />
          </span>
        </button>
        <button className="quick-btn" onClick={() => navigate('/app/orders')}>
          <span className="q-icon">
            <Icon name="i-box" />
          </span>
          <span>
            <b>拣货任务</b>
            <span>4 单待拣 · 最早 10:25</span>
          </span>
          <span className="q-arrow">
            <Icon name="i-arrow" />
          </span>
        </button>
        <button className="quick-btn" onClick={() => openModal({ type: 'shift' })}>
          <span className="q-icon">
            <Icon name="i-shift" />
          </span>
          <span>
            <b>交班日结</b>
            <span>备用金 ¥500 · 差异归零</span>
          </span>
          <span className="q-arrow">
            <Icon name="i-arrow" />
          </span>
        </button>
      </div>
    </section>
  )
}
