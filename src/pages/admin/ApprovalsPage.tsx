import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { ApprovalDecideModal, ApprovalDetailModal } from '@/features/admin/modals'
import { APPROVE_LABEL, BIZ_LABEL } from '@/data/adminMock'
import { money } from '@/lib/format'
import { useAdminStore } from '@/store/useAdminStore'
import { useAppStore } from '@/store/useAppStore'

type Seg = 'pending' | 'passed' | 'rejected' | 'all'

const SEGS: { key: Seg; label: string; value: number | null }[] = [
  { key: 'pending', label: '待审', value: 0 },
  { key: 'passed', label: '已通过', value: 1 },
  { key: 'rejected', label: '已驳回', value: 2 },
  { key: 'all', label: '全部', value: null },
]

const BIZ_TYPES = ['PRICE', 'WASTE', 'REFUND', 'RETURN', 'WEIGHT', 'TRANSFER', 'PURCHASE', 'EXPIRY', 'INVOICE']

export default function ApprovalsPage() {
  const approvals = useAdminStore((s) => s.approvals)
  const can = useAppStore((s) => s.can)
  const [seg, setSeg] = useState<Seg>('pending')
  const [bizType, setBizType] = useState('全部')
  const [keyword, setKeyword] = useState('')
  const [decide, setDecide] = useState<{ no: string; initial: 'PASS' | 'REJECT' } | null>(null)
  const [detail, setDetail] = useState<string | null>(null)

  const active = SEGS.find((s) => s.key === seg)
  const kw = keyword.trim().toLowerCase()

  const list = approvals
    .filter((a) => {
      const segOK = active?.value == null || a.approveResult === active.value
      const bizOK = bizType === '全部' || a.bizType === bizType
      const kwOK =
        !kw ||
        a.approvalNo.toLowerCase().includes(kw) ||
        (a.bizNo ?? '').toLowerCase().includes(kw) ||
        (a.applyEmpName ?? '').includes(kw)
      return segOK && bizOK && kwOK
    })
    .sort((a, b) => (a.createTime < b.createTime ? 1 : -1))

  const pending = approvals.filter((a) => a.approveResult === 0)
  const pendingAmount = pending.reduce((sum, a) => sum + a.applyAmount, 0)
  const passed = approvals.filter((a) => a.approveResult === 1).length
  const rejected = approvals.filter((a) => a.approveResult === 2).length

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <p className="eyebrow">APPROVAL DESK · SYS #19 — #22</p>
          <h1 className="page-title">审批中心。</h1>
          <p className="page-desc">
            一套审批能力服务所有敏感动作：改价、报损、退款、改重、采购。额度内系统自动放行，超出才进这里。
          </p>
        </div>
        <div className="page-actions">
          <div className="page-date">
            待审 <b>{pending.length} 笔</b> · 涉及 ¥{money(pendingAmount)}
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setSeg('pending')
              setBizType('全部')
              setKeyword('')
            }}
          >
            <Icon name="i-filter" />
            只看待办
          </button>
        </div>
      </div>

      <div className="member-stats">
        <div className="member-stat">
          <span>待审</span>
          <b>
            {pending.length}
            <small>笔</small>
          </b>
        </div>
        <div className="member-stat">
          <span>待审金额</span>
          <b>
            ¥{money(pendingAmount)}
          </b>
        </div>
        <div className="member-stat">
          <span>已通过</span>
          <b>
            {passed}
            <small>笔</small>
          </b>
        </div>
        <div className="member-stat">
          <span>已驳回</span>
          <b>
            {rejected}
            <small>笔</small>
          </b>
        </div>
      </div>

      <div className="filter-row">
        <div className="seg">
          {SEGS.map((s) => {
            const count = s.value == null ? approvals.length : approvals.filter((a) => a.approveResult === s.value).length
            return (
              <button key={s.key} className={seg === s.key ? 'on' : ''} onClick={() => setSeg(s.key)}>
                {s.label}
                <em>{count}</em>
              </button>
            )
          })}
        </div>
        <div className="filter-tools">
          <select className="field" style={{ width: 132, height: 34 }} value={bizType} onChange={(e) => setBizType(e.target.value)}>
            <option value="全部">全部业务</option>
            {BIZ_TYPES.map((b) => (
              <option key={b} value={b}>
                {BIZ_LABEL[b]}
              </option>
            ))}
          </select>
          <div className="search-field" style={{ width: 236 }}>
            <Icon name="i-search" />
            <input
              className="field"
              style={{ height: 34 }}
              placeholder="搜索单号 / 业务单号 / 申请人"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table dense" style={{ minWidth: 1020 }}>
          <thead>
            <tr>
              <th>审批单号</th>
              <th>业务</th>
              <th>业务单号</th>
              <th>申请人</th>
              <th>申请金额</th>
              <th>层级</th>
              <th>状态</th>
              <th>提交时间</th>
              <th style={{ textAlign: 'right' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length ? (
              list.map((a) => (
                <tr key={a.approvalNo}>
                  <td>
                    <span className="num">{a.approvalNo}</span>
                  </td>
                  <td>
                    <span className={`tag ${a.bizType === 'WASTE' || a.bizType === 'REFUND' ? 'tag-orange' : 'tag-soft'}`}>
                      {BIZ_LABEL[a.bizType] ?? a.bizType}
                    </span>
                  </td>
                  <td>
                    <span className="num">{a.bizNo ?? a.bizId}</span>
                  </td>
                  <td>{a.applyEmpName ?? a.applyEmpId}</td>
                  <td>
                    <span className="num">¥{money(a.applyAmount)}</span>
                  </td>
                  <td>
                    <span className="sub" style={{ marginTop: 0 }}>
                      {a.needLevel === 1 ? '额度内' : '需上级'}
                    </span>
                  </td>
                  <td>
                    <span className={`tag ${a.approveResult === 1 ? 'tag-green' : a.approveResult === 2 ? 'tag-red' : 'tag-amber'}`}>
                      {APPROVE_LABEL[a.approveResult]}
                    </span>
                    {a.approveRemark ? <span className="sub">{a.approveRemark}</span> : null}
                  </td>
                  <td>
                    <span className="num" style={{ fontSize: 9.5 }}>
                      {a.createTime}
                    </span>
                    {a.approverEmpName ? <span className="sub">审批人 {a.approverEmpName}</span> : null}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="action-link" onClick={() => setDetail(a.approvalNo)}>
                        详情
                      </button>
                      {a.approveResult === 0 && can('sys:approval:decide') ? (
                        <>
                          <button className="action-link" onClick={() => setDecide({ no: a.approvalNo, initial: 'PASS' })}>
                            通过
                          </button>
                          <button className="action-link red" onClick={() => setDecide({ no: a.approvalNo, initial: 'REJECT' })}>
                            驳回
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9}>
                  <div className="table-empty">
                    {seg === 'pending' ? '当前没有待办，额度内的申请已被系统自动放行' : '没有匹配的审批记录'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-foot">
          <span>共 {list.length} 条 · 驳回必须填写理由并通知申请人</span>
          <span>bizType + bizId 幂等，重复提交返回原单号</span>
        </div>
      </div>

      {decide ? (
        <ApprovalDecideModal approvalNo={decide.no} initial={decide.initial} onClose={() => setDecide(null)} />
      ) : null}
      {detail ? <ApprovalDetailModal approvalNo={detail} onClose={() => setDetail(null)} /> : null}
    </section>
  )
}
