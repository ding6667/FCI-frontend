import { useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'
import {
  EmployeeDetailModal,
  EmployeeFormModal,
  EmployeeStatusModal,
  QuotaModal,
  ResetPwdModal,
  RoleAssignModal,
  type EmployeeAction,
} from '@/features/admin/modals'
import { STATUS_LABEL } from '@/data/adminMock'
import { maskPhone } from '@/lib/format'
import { useAdminStore } from '@/store/useAdminStore'
import { useAppStore } from '@/store/useAppStore'

type EmpModal =
  | { kind: 'form'; empId?: string }
  | { kind: 'detail'; empId: string }
  | { kind: 'reset'; empId: string }
  | { kind: 'quota'; empId: string }
  | { kind: 'roles'; empId: string }
  | { kind: 'status'; empId: string; mode: 'freeze' | 'unfreeze' | 'leave' }

const STATUS_FILTERS = [
  { key: '全部', value: null },
  { key: '在职', value: 1 },
  { key: '冻结', value: 2 },
  { key: '离职', value: 0 },
] as const

const PAGE_SIZE = 8

export default function EmployeesPage() {
  const employees = useAdminStore((s) => s.employees)
  const can = useAppStore((s) => s.can)

  const [modal, setModal] = useState<EmpModal | null>(null)
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]['key']>('全部')
  const [jobTitle, setJobTitle] = useState('全部')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  const close = () => setModal(null)

  const jobTitles = useMemo(
    () => Array.from(new Set(employees.map((e) => e.jobTitle).filter((t): t is string => Boolean(t)))),
    [employees],
  )

  const active = STATUS_FILTERS.find((f) => f.key === status)
  const kw = keyword.trim().toLowerCase()

  const list = employees.filter((e) => {
    const statusOK = active?.value == null || e.status === active.value
    const jobOK = jobTitle === '全部' || e.jobTitle === jobTitle
    const kwOK =
      !kw ||
      e.empName.toLowerCase().includes(kw) ||
      e.empNo.includes(kw) ||
      e.phone.includes(kw) ||
      e.loginName.toLowerCase().includes(kw)
    return statusOK && jobOK && kwOK
  })

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const rows = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const onCardAction = (empId: string, action: EmployeeAction) => {
    if (action === 'leave' || action === 'freeze' || action === 'unfreeze') {
      setModal({ kind: 'status', empId, mode: action })
    } else if (action === 'reset') {
      setModal({ kind: 'reset', empId })
    } else if (action === 'quota') {
      setModal({ kind: 'quota', empId })
    } else if (action === 'roles') {
      setModal({ kind: 'roles', empId })
    } else {
      setModal({ kind: 'form', empId })
    }
  }

  const onDuty = employees.filter((e) => e.status === 1).length
  const frozen = employees.filter((e) => e.status === 2).length
  const left = employees.filter((e) => e.status === 0).length

  const certSoon = employees.filter((e) => {
    if (!e.healthCertExpire || e.status !== 1) return false
    const days = (new Date(e.healthCertExpire).getTime() - Date.now()) / 86400000
    return days <= 30
  }).length

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <p className="eyebrow">STAFF · SYS #4 — #12</p>
          <h1 className="page-title">员工。</h1>
          <p className="page-desc">
            工号即身份：登录、审批额度、操作留痕都挂在同一条档案上。离职为终态，冻结可逆。
          </p>
        </div>
        <div className="page-actions">
          <div className="page-date">
            在职 <b>{onDuty} 人</b> · 本店编制 {employees.length}
          </div>
          {can('sys:employee:add') ? (
            <button className="btn btn-primary" onClick={() => setModal({ kind: 'form' })}>
              <Icon name="i-plus" />
              员工入职
            </button>
          ) : null}
        </div>
      </div>

      <div className="member-stats">
        <div className="member-stat">
          <span>在职</span>
          <b>
            {onDuty}
            <small>人</small>
          </b>
        </div>
        <div className="member-stat">
          <span>冻结中</span>
          <b>
            {frozen}
            <small>人</small>
          </b>
        </div>
        <div className="member-stat">
          <span>已离职</span>
          <b>
            {left}
            <small>人</small>
          </b>
        </div>
        <div className="member-stat">
          <span>健康证 30 天内到期</span>
          <b>
            {certSoon}
            <small>人</small>
          </b>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          {STATUS_FILTERS.map((f) => {
            const count = f.value == null ? employees.length : employees.filter((e) => e.status === f.value).length
            return (
              <button
                key={f.key}
                className={`filter-chip ${status === f.key ? 'active' : ''}`}
                onClick={() => {
                  setStatus(f.key)
                  setPage(1)
                }}
              >
                {f.key}
                <span>{count}</span>
              </button>
            )
          })}
        </div>
        <div className="filter-tools">
          <select className="field" style={{ width: 132, height: 34 }} value={jobTitle} onChange={(e) => { setJobTitle(e.target.value); setPage(1) }}>
            <option value="全部">全部岗位</option>
            {jobTitles.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="search-field" style={{ width: 240 }}>
            <Icon name="i-search" />
            <input
              className="field"
              style={{ height: 34 }}
              placeholder="搜索姓名 / 工号 / 手机号 / 账号"
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
        <table className="data-table dense" style={{ minWidth: 1060 }}>
          <thead>
            <tr>
              <th>员工</th>
              <th>工号 / 账号</th>
              <th>门店 · 岗位</th>
              <th>角色</th>
              <th>审批额度</th>
              <th>健康证</th>
              <th>状态</th>
              <th>最近登录</th>
              <th style={{ textAlign: 'right' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((e) => {
                const soon = e.healthCertExpire && e.status === 1 && (new Date(e.healthCertExpire).getTime() - Date.now()) / 86400000 <= 30
                return (
                  <tr key={e.id}>
                    <td>
                      <div className="member-cell">
                        <span className="mc-avatar">{e.empName.slice(0, 1)}</span>
                        <div>
                          <b>{e.empName}</b>
                          <span>{maskPhone(e.phone)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="num">{e.empNo}</span>
                      <span className="sub">{e.loginName}</span>
                    </td>
                    <td>
                      {e.jobTitle ?? '—'}
                      <span className="sub">{e.storeName ?? '区域'}</span>
                    </td>
                    <td>
                      <div className="tag-row">
                        {e.roles.length ? (
                          e.roles.map((r) => (
                            <span className="tag-mini" key={r.id}>
                              {r.roleName}
                            </span>
                          ))
                        ) : (
                          <span className="status-text muted">未分配</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="num">{e.approvalLimit ? `¥${e.approvalLimit.toLocaleString('zh-CN')}` : '无额度'}</span>
                      <span className="sub">{e.approvalLimit ? '额度内自动放行' : '笔笔需审批'}</span>
                    </td>
                    <td>
                      <span className="num" style={soon ? { color: 'var(--red)' } : undefined}>
                        {e.healthCertExpire ?? '—'}
                      </span>
                      <span className="sub">{e.healthCertNo ?? '未登记'}</span>
                    </td>
                    <td>
                      <span className={`tag ${e.status === 1 ? 'tag-green' : e.status === 2 ? 'tag-amber' : 'tag-soft'}`}>
                        {STATUS_LABEL[e.status]}
                      </span>
                    </td>
                    <td>
                      <span className="num" style={{ fontSize: 9.5 }}>
                        {e.lastLoginTime ?? '从未登录'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="action-link" onClick={() => setModal({ kind: 'detail', empId: e.id })}>
                          详情
                        </button>
                        {can('sys:employee:edit') ? (
                          <button className="action-link" onClick={() => setModal({ kind: 'form', empId: e.id })}>
                            编辑
                          </button>
                        ) : null}
                        {can('sys:employee:grant') ? (
                          <button className="action-link" onClick={() => setModal({ kind: 'roles', empId: e.id })}>
                            角色
                          </button>
                        ) : null}
                        {can('sys:quota:update') ? (
                          <button className="action-link warn" onClick={() => setModal({ kind: 'quota', empId: e.id })}>
                            额度
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={9}>
                  <div className="table-empty">没有匹配的员工，换个筛选条件试试</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="pager">
          <span>
            共 <b style={{ color: 'var(--ink-soft)' }}>{list.length}</b> 人 · 第 {safePage}/{pages} 页 ·
            变更全部写入审计日志
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

      {modal?.kind === 'form' ? <EmployeeFormModal empId={modal.empId} onClose={close} /> : null}
      {modal?.kind === 'detail' ? (
        <EmployeeDetailModal
          empId={modal.empId}
          onClose={close}
          can={can}
          onAction={(action) => onCardAction(modal.empId, action)}
        />
      ) : null}
      {modal?.kind === 'reset' ? <ResetPwdModal empId={modal.empId} onClose={close} /> : null}
      {modal?.kind === 'quota' ? <QuotaModal empId={modal.empId} onClose={close} /> : null}
      {modal?.kind === 'roles' ? <RoleAssignModal empId={modal.empId} onClose={close} /> : null}
      {modal?.kind === 'status' ? <EmployeeStatusModal empId={modal.empId} mode={modal.mode} onClose={close} /> : null}
    </section>
  )
}
