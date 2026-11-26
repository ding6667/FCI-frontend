import { Icon } from '@/components/Icon'
import { money } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'
import type { Order, OrderStatus } from '@/types'

const CHANNELS = ['全部', '小程序', '美团', '饿了么', 'POS']

interface Column {
  key: OrderStatus
  cls: string
  action: string
  primary?: boolean
}

const COLUMNS: Column[] = [
  { key: '待拣货', cls: '', action: '开始拣货', primary: true },
  { key: '待打包', cls: 'pack', action: '交接出库' },
  { key: '配送中', cls: '', action: '确认送达' },
  { key: '已完成', cls: 'done', action: '查看明细' },
]

const channelClass = (channel: string): string => {
  if (channel === '美团') return 'mt'
  if (channel === '饿了么') return 'ele'
  if (channel === 'POS') return 'pos'
  return ''
}

const itemsSummary = (order: Order): string =>
  order.items
    .map((i) => (i.loose ? `${i.name} ${Number(i.weight ?? i.est ?? 0).toFixed(2)}kg` : `${i.name} ×${i.qty}`))
    .join(' · ')

export default function OrdersPage() {
  const orders = useAppStore((s) => s.orders)
  const channel = useAppStore((s) => s.orderChannel)
  const setChannel = useAppStore((s) => s.setOrderChannel)
  const advanceOrder = useAppStore((s) => s.advanceOrder)
  const openModal = useAppStore((s) => s.openModal)
  const showToast = useAppStore((s) => s.showToast)

  const filtered = orders.filter((o) => channel === '全部' || o.channel === channel)
  const lateCount = orders.filter((o) => o.status !== '已完成' && o.promise <= '10:05').length

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <p className="eyebrow">FULFILLMENT · BR-11 / BR-15 / BR-19</p>
          <h1 className="page-title">订单履约。</h1>
          <p className="page-desc">
            按承诺时间推进拣货、打包与交接；散称商品实称后差额多退少不补，拣货按近效期批次优先。
          </p>
        </div>
        <div className="page-actions">
          <div className="page-date">
            最早承诺 <b>10:25 送达</b>
          </div>
          <button className="btn btn-ghost" onClick={() => showToast('拣货任务已刷新，当前 4 单待拣')}>
            <Icon name="i-refresh" />
            刷新
          </button>
          <button className="btn btn-primary" onClick={() => showToast('拣货汇总单已发送至打印机（演示）')}>
            <Icon name="i-print" />
            打印拣货单
          </button>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          {CHANNELS.map((c) => (
            <button
              key={c}
              className={`filter-chip ${channel === c ? 'active' : ''}`}
              onClick={() => setChannel(c)}
            >
              {c === 'POS' ? '门店 POS' : c}
            </button>
          ))}
        </div>
        <div className="filter-tools">
          <span className="status-pill">
            <span className="dot" />
            承诺准时率 98.6%
          </span>
          <span className="status-pill warn">
            <span className="dot" />
            {lateCount} 单临近超时
          </span>
        </div>
      </div>

      <div className="kanban">
        {COLUMNS.map((col) => {
          const list = filtered.filter((o) => o.status === col.key)
          return (
            <section className="kanban-col" key={col.key}>
              <div className="kanban-head">
                <div className="kanban-title">
                  <span className="dot" />
                  {col.key}
                </div>
                <span className="kanban-count">{list.length}</span>
              </div>
              {list.length ? (
                list.map((o) => {
                  const chCls = channelClass(o.channel)
                  const late = o.status !== '已完成' && o.promise <= '10:05'
                  const onClick = () => {
                    if (o.status === '待拣货') openModal({ type: 'pick', no: o.no })
                    else if (o.status === '已完成') openModal({ type: 'orderDetail', no: o.no })
                    else advanceOrder(o.no)
                  }
                  return (
                    <article className={`order-card ${chCls} ${col.cls}`.trim()} key={o.no}>
                      <div className="oc-top">
                        <span className={`channel-badge ${chCls}`}>{o.channel}</span>
                        <span className={`oc-promise ${late ? 'warn' : ''}`}>
                          <Icon name="i-clock" />
                          承诺 {o.promise}
                        </span>
                      </div>
                      <div className="oc-customer">
                        {o.customer}
                        <span>
                          {o.memberLevel} · {o.time}
                        </span>
                      </div>
                      <div className="oc-items">{itemsSummary(o)}</div>
                      <div className="oc-meta">
                        <span className="fulfill">{o.fulfillment}</span>
                        <span className="amount">¥{money(o.amount)}</span>
                      </div>
                      <button className={`oc-action ${col.primary ? 'primary' : ''}`} onClick={onClick}>
                        {col.action}
                      </button>
                    </article>
                  )
                })
              ) : (
                <div className="kanban-empty">暂无{col.key}订单</div>
              )}
            </section>
          )
        })}
      </div>
    </section>
  )
}
