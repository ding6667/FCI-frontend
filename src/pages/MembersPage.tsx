import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { money } from '@/lib/format'
import { levelOf } from '@/lib/pricing'
import { useAppStore } from '@/store/useAppStore'

const FILTERS: { key: string; label: string; level?: string }[] = [
  { key: '全部', label: '全部' },
  { key: '金卡', label: '金卡', level: 'GOLD' },
  { key: '银卡', label: '银卡', level: 'SILVER' },
  { key: '普通', label: '普通会员', level: 'NORMAL' },
]

export default function MembersPage() {
  const members = useAppStore((s) => s.members)
  const filter = useAppStore((s) => s.memberFilter)
  const setFilter = useAppStore((s) => s.setMemberFilter)
  const openModal = useAppStore((s) => s.openModal)
  const showToast = useAppStore((s) => s.showToast)
  const [keyword, setKeyword] = useState('')

  const kw = keyword.trim()
  const active = FILTERS.find((f) => f.key === filter)
  const list = members.filter((m) => {
    const filterOK = !active?.level || m.level === active.level
    const kwOK = !kw || m.name.includes(kw) || m.mask.includes(kw) || m.phone.endsWith(kw)
    return filterOK && kwOK
  })

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <p className="eyebrow">MEMBER DESK · BR-04 / BR-31</p>
          <h1 className="page-title">会员。</h1>
          <p className="page-desc">
            线上线下共用同一会员账户；门店可代注册、查权益、发券，手机号全局唯一并脱敏展示。
          </p>
        </div>
        <div className="page-actions">
          <div className="page-date">
            本月新增 <b>86 位会员</b>
          </div>
          <button className="btn btn-ghost" onClick={() => showToast('会员台接待记录已更新')}>
            <Icon name="i-members" />
            接待记录
          </button>
          <button className="btn btn-primary" onClick={() => openModal({ type: 'memberRegister' })}>
            <Icon name="i-plus" />
            代客注册
          </button>
        </div>
      </div>

      <div className="member-stats">
        <div className="member-stat">
          <span>会员总数</span>
          <b>
            3,486<small>人</small>
          </b>
        </div>
        <div className="member-stat">
          <span>今日新增</span>
          <b>
            18<small>人</small>
          </b>
        </div>
        <div className="member-stat">
          <span>金卡及以上</span>
          <b>
            526<small>人</small>
          </b>
        </div>
        <div className="member-stat">
          <span>本月券核销率</span>
          <b>
            41.2<small>%</small>
          </b>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-chip ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="filter-tools">
          <div className="search-field" style={{ width: 250 }}>
            <Icon name="i-search" />
            <input
              className="field"
              placeholder="搜索姓名 / 手机号后四位"
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
              <th>会员</th>
              <th>手机号</th>
              <th>等级</th>
              <th>积分</th>
              <th>券</th>
              <th>近 30 天消费</th>
              <th>标签</th>
              <th style={{ textAlign: 'right' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length ? (
              list.map((m) => {
                const level = levelOf(m)
                return (
                  <tr key={m.id}>
                    <td>
                      <div className={`member-cell ${m.level === 'NORMAL' ? 'bronze' : ''}`}>
                        <span className="mc-avatar">{m.name.slice(0, 1)}</span>
                        <div>
                          <b>{m.name}</b>
                          <span>最近到店 {m.last}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="num">{m.mask}</span>
                    </td>
                    <td>
                      <span className={`level ${level.cls}`}>{level.short}</span>
                      {level.discount < 1 ? <span className="sub">{(level.discount * 10).toFixed(1)} 折</span> : null}
                    </td>
                    <td>
                      <span className="num">{m.points}</span>
                    </td>
                    <td>
                      <span className="num">{m.coupons}</span>
                    </td>
                    <td>
                      <span className="num">¥{money(m.monthSpend)}</span>
                      <span className="sub">{m.monthOrders} 单</span>
                    </td>
                    <td>
                      <div className="tag-row">
                        {m.tags.map((t) => (
                          <span className="tag-mini" key={t}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="action-link"
                          onClick={() => openModal({ type: 'memberDetail', id: m.id })}
                        >
                          详情
                        </button>
                        <button
                          className="action-link warn"
                          onClick={() => openModal({ type: 'issueCoupon', id: m.id })}
                        >
                          发券
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={8}>
                  <div className="table-empty">没有匹配的会员</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-foot">
          <span>手机号展示脱敏，变更全部留痕</span>
          <span>储值功能本期未开通</span>
        </div>
      </div>
    </section>
  )
}
