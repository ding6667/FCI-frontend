import { useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'
import { LogDetailModal } from '@/features/admin/modals'
import { ACTION_LABEL } from '@/data/adminMock'
import { useAdminStore } from '@/store/useAdminStore'

const MODULES = ['全部', '员工档案', '角色权限', '审批']
const PAGE_SIZE = 10

const todayStr = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function LogsPage() {
  const logs = useAdminStore((s) => s.logs)
  const employees = useAdminStore((s) => s.employees)
  const [module, setModule] = useState('全部')
  const [action, setAction] = useState('全部')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<string | null>(null)

  const empName = useMemo(() => {
    const map = new Map<string, string>()
    employees.forEach((e) => map.set(e.id, `${e.empName}（${e.empNo}）`))
    return map
  }, [employees])

  const actions = useMemo(() => Array.from(new Set(logs.map((l) => l.action))), [logs])

  const kw = keyword.trim().toLowerCase()
  const list = logs
    .filter((l) => {
      const modOK = module === '全部' || l.module === module
      const actOK = action === '全部' || l.action === action
      const kwOK =
        !kw ||
        (l.targetId ?? '').toLowerCase().includes(kw) ||
        (empName.get(l.operatorEmpId ?? '') ?? '').toLowerCase().includes(kw) ||
        l.action.toLowerCase().includes(kw)
      return modOK && actOK && kwOK
    })
    .sort((a, b) => (a.createTime < b.createTime ? 1 : -1))

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const rows = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const today = todayStr()
  const todayCount = logs.filter((l) => l.createTime.startsWith(today)).length
  const empCount = logs.filter((l) => l.module === '员工档案').length
  const approvalCount = logs.filter((l) => l.module === '审批').length

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <p className="eyebrow">AUDIT TRAIL · SYS #23</p>
          <h1 className="page-title">操作日志。</h1>
          <p className="page-desc">
            只读、不可编辑、不可删除。敏感动作的「谁、何时、改了什么」都落在这里，是门店对账与追责的依据。
          </p>
        </div>
        <div className="page-actions">
          <div className="page-date">
            共 <b>{logs.length}</b> 条 · 今日 {todayCount} 条
          </div>
          <button className="btn btn-ghost" onClick={() => window.print()}>
            <Icon name="i-print" />
            打印当前视图
          </button>
        </div>
      </div>

      <div className="member-stats">
        <div className="member-stat">
          <span>日志总数</span>
          <b>
            {logs.length}
            <small>条</small>
          </b>
        </div>
        <div className="member-stat">
          <span>今日操作</span>
          <b>
            {todayCount}
            <small>条</small>
          </b>
        </div>
        <div className="member-stat">
          <span>员工档案类</span>
          <b>
            {empCount}
            <small>条</small>
          </b>
        </div>
        <div className="member-stat">
          <span>审批类</span>
          <b>
            {approvalCount}
            <small>条</small>
          </b>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          {MODULES.map((m) => {
            const count = m === '全部' ? logs.length : logs.filter((l) => l.module === m).length
            return (
              <button
                key={m}
                className={`filter-chip ${module === m ? 'active' : ''}`}
                onClick={() => {
                  setModule(m)
                  setPage(1)
                }}
              >
                {m}
                <span>{count}</span>
              </button>
            )
          })}
        </div>
        <div className="filter-tools">
          <select
            className="field"
            style={{ width: 132, height: 34 }}
            value={action}
            onChange={(e) => {
              setAction(e.target.value)
              setPage(1)
            }}
          >
            <option value="全部">全部动作</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABEL[a] ?? a}
              </option>
            ))}
          </select>
          <div className="search-field" style={{ width: 236 }}>
            <Icon name="i-search" />
            <input
              className="field"
              style={{ height: 34 }}
              placeholder="搜索对象 / 操作人"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table dense" style={{ minWidth: 940 }}>
          <thead>
            <tr>
              <th>时间</th>
              <th>操作人</th>
              <th>模块</th>
              <th>动作</th>
              <th>对象</th>
              <th>IP</th>
              <th style={{ textAlign: 'right' }}>详情</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((l) => (
                <tr key={l.id}>
                  <td>
                    <span className="num" style={{ fontSize: 9.5 }}>
                      {l.createTime}
                    </span>
                  </td>
                  <td>{empName.get(l.operatorEmpId ?? '') ?? '系统'}</td>
                  <td>{l.module}</td>
                  <td>
                    <span className="tag tag-soft">{ACTION_LABEL[l.action] ?? l.action}</span>
                    <span className="sub">{l.action}</span>
                  </td>
                  <td>
                    <span className="num">{l.targetId ?? '—'}</span>
                    <span className="sub">{l.targetType ?? ''}</span>
                  </td>
                  <td>
                    <span className="num" style={{ fontSize: 9.5 }}>
                      {l.clientIp ?? '—'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="action-link" onClick={() => setDetail(l.id)}>
                        查看变更
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>
                  <div className="table-empty">没有匹配的日志</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="pager">
          <span>
            共 <b style={{ color: 'var(--ink-soft)' }}>{list.length}</b> 条 · 第 {safePage}/{pages} 页 · 建议各地保存 ≥ 6 个月
          </span>
          <div className="pager-btns">
            <button onClick={() => setPage(safePage - 1)} disabled={safePage <= 1}>
              上一页
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={p === safePage ? 'on' : ''} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(safePage + 1)} disabled={safePage >= pages}>
              下一页
            </button>
          </div>
        </div>
      </div>

      {detail ? <LogDetailModal logId={detail} onClose={() => setDetail(null)} /> : null}
    </section>
  )
}
