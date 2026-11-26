import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { ModalFoot, ModalHead, ModalShell } from '@/components/ModalShell'
import type { DataScope, EmployeeStatus, PermissionVO } from '@/api/types'
import { ALL_PERMISSIONS, ACTION_LABEL, APPROVE_LABEL, BIZ_LABEL, PERMISSION_TREE, SCOPE_LABEL, STATUS_LABEL } from '@/data/adminMock'
import { money } from '@/lib/format'
import { useAdminStore } from '@/store/useAdminStore'
import { useAppStore } from '@/store/useAppStore'

const PHONE_RE = /^1[3-9]\d{9}$/

const nowDate = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/* ============================ 员工新增 / 编辑 #6 #7 ============================ */

export function EmployeeFormModal({ empId, onClose }: { empId?: string; onClose: () => void }) {
  const employees = useAdminStore((s) => s.employees)
  const roles = useAdminStore((s) => s.roles)
  const saveEmployee = useAdminStore((s) => s.saveEmployee)
  const showToast = useAppStore((s) => s.showToast)

  const editing = empId ? employees.find((e) => e.id === empId) : undefined
  const [form, setForm] = useState({
    empNo: editing?.empNo ?? '',
    empName: editing?.empName ?? '',
    phone: editing?.phone ?? '',
    loginName: editing?.loginName ?? '',
    jobTitle: editing?.jobTitle ?? '',
    entryDate: editing?.entryDate ?? nowDate(),
    healthCertNo: editing?.healthCertNo ?? '',
    healthCertExpire: editing?.healthCertExpire ?? '',
    password: '',
  })
  const [roleIds, setRoleIds] = useState<string[]>(editing?.roles.map((r) => r.id) ?? [])
  const [err, setErr] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErr((e) => ({ ...e, [k]: '' }))
  }

  const submit = async () => {
    const next: Record<string, string> = {}
    if (!form.empNo.trim()) next.empNo = '请填写工号'
    else if (!editing && employees.some((e) => e.empNo === form.empNo.trim())) next.empNo = '工号已存在'
    if (!form.empName.trim()) next.empName = '请填写姓名'
    if (!PHONE_RE.test(form.phone.trim())) next.phone = '手机号格式不正确'
    if (!form.loginName.trim()) next.loginName = '请填写登录账号'
    if (!editing && form.password.length < 6) next.password = '初始密码至少 6 位'
    if (form.healthCertExpire && form.healthCertExpire < nowDate()) next.healthCertExpire = '健康证已过期，不能录入'
    if (Object.keys(next).length) {
      setErr(next)
      return
    }
    setSaving(true)
    try {
      await saveEmployee(
        {
          empNo: form.empNo.trim(),
          empName: form.empName.trim(),
          phone: form.phone.trim(),
          loginName: form.loginName.trim(),
          jobTitle: form.jobTitle.trim() || undefined,
          entryDate: form.entryDate || undefined,
          healthCertNo: form.healthCertNo.trim() || undefined,
          healthCertExpire: form.healthCertExpire || undefined,
          password: editing ? undefined : form.password,
          roleIds,
        },
        empId,
      )
      showToast(editing ? `已更新 ${form.empName} 的员工档案` : `已入职：${form.empName}（${form.empNo}），请提醒其首次登录修改密码`)
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '保存失败，请重试', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell onClose={onClose} width="min(680px,100%)">
      <ModalHead
        kicker={editing ? 'EMPLOYEE · UPDATE' : 'EMPLOYEE · ONBOARD'}
        title={editing ? `编辑员工 · ${editing.empName}` : '员工入职'}
        sub="工号、登录账号创建后不可随意变更，涉及考勤与操作留痕的追溯。"
        onClose={onClose}
      />
      <div className="modal-body">
        <div className="form-block">
          <div className="form-cols">
            <div>
              <label className="field-label">工号 *</label>
              <input className="field" value={form.empNo} disabled={Boolean(editing)} onChange={(e) => set('empNo', e.target.value)} placeholder="1001" />
              <span className="field-err">{err.empNo}</span>
            </div>
            <div>
              <label className="field-label">姓名 *</label>
              <input className="field" value={form.empName} onChange={(e) => set('empName', e.target.value)} placeholder="王芳" />
              <span className="field-err">{err.empName}</span>
            </div>
            <div>
              <label className="field-label">手机号 *</label>
              <input className="field" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="13800132046" />
              <span className="field-err">{err.phone}</span>
            </div>
            <div>
              <label className="field-label">登录账号 *</label>
              <input className="field" value={form.loginName} onChange={(e) => set('loginName', e.target.value)} placeholder="wangfang" />
              <span className="field-err">{err.loginName}</span>
            </div>
            <div>
              <label className="field-label">岗位</label>
              <input className="field" value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} placeholder="值班店长 / 收银员 / 库管" />
            </div>
            <div>
              <label className="field-label">入职日期</label>
              <input className="field" type="date" value={form.entryDate} onChange={(e) => set('entryDate', e.target.value)} />
            </div>
            {!editing ? (
              <div className="full">
                <label className="field-label">初始密码 *（至少 6 位，首次登录需修改）</label>
                <input className="field" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••" />
                <span className="field-err">{err.password}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="form-block">
          <div className="form-cols">
            <div>
              <label className="field-label">健康证号</label>
              <input className="field" value={form.healthCertNo} onChange={(e) => set('healthCertNo', e.target.value)} placeholder="JK2025-08812" />
            </div>
            <div>
              <label className="field-label">健康证到期</label>
              <input className="field" type="date" value={form.healthCertExpire} onChange={(e) => set('healthCertExpire', e.target.value)} />
              <span className="field-err">{err.healthCertExpire}</span>
            </div>
          </div>
          <div className="notice soft">
            <Icon name="i-info" />
            <span>食品岗位必须持有效健康证；到期前 30 天系统会提醒，过期后该员工无法登录收银台。</span>
          </div>
        </div>

        <div className="form-block">
          <label className="field-label">角色（可多选，决定登录后的菜单与按钮）</label>
          <div className="tag-row" style={{ maxWidth: 'none', gap: 6 }}>
            {roles.map((r) => {
              const on = roleIds.includes(r.id)
              return (
                <button
                  key={r.id}
                  className={on ? 'filter-chip active' : 'filter-chip'}
                  onClick={() => setRoleIds((ids) => (on ? ids.filter((x) => x !== r.id) : [...ids, r.id]))}
                >
                  {r.roleName}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <ModalFoot note={editing ? '保存后立即生效，权限缓存最长 300 秒刷新' : '创建后请把工号与初始密码告知员工'}>
        <button className="btn btn-ghost" onClick={onClose}>
          取消
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? '保存中…' : editing ? '保存修改' : '确认入职'}
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 员工详情 ============================ */

export type EmployeeAction = 'edit' | 'reset' | 'quota' | 'roles' | 'freeze' | 'unfreeze' | 'leave'

export function EmployeeDetailModal({
  empId,
  onClose,
  onAction,
  can,
}: {
  empId: string
  onClose: () => void
  onAction: (action: EmployeeAction) => void
  can: (code: string) => boolean
}) {
  const emp = useAdminStore((s) => s.employees.find((e) => e.id === empId))
  if (!emp) return null
  const expired = emp.healthCertExpire ? emp.healthCertExpire < nowDate() : false

  return (
    <ModalShell onClose={onClose} width="min(640px,100%)">
      <ModalHead kicker="EMPLOYEE · PROFILE" title={emp.empName} sub={`工号 ${emp.empNo} · ${emp.loginName}`} onClose={onClose} />
      <div className="modal-body">
        <div className="kv-grid">
          <div className="kv">
            <span>所属门店</span>
            <b>{emp.storeName ?? '—'}</b>
          </div>
          <div className="kv">
            <span>岗位</span>
            <b>{emp.jobTitle ?? '—'}</b>
          </div>
          <div className="kv">
            <span>手机号</span>
            <b className="mono">{emp.phone}</b>
          </div>
          <div className="kv">
            <span>状态</span>
            <b>
              <span className={`tag ${emp.status === 1 ? 'tag-green' : emp.status === 2 ? 'tag-amber' : 'tag-soft'}`}>
                {STATUS_LABEL[emp.status]}
              </span>
            </b>
          </div>
          <div className="kv">
            <span>审批额度</span>
            <b className="mono">¥{money(emp.approvalLimit)}</b>
          </div>
          <div className="kv">
            <span>入职日期</span>
            <b className="mono">{emp.entryDate ?? '—'}</b>
          </div>
          <div className="kv">
            <span>健康证</span>
            <b className="mono">{emp.healthCertNo ?? '—'}</b>
          </div>
          <div className="kv">
            <span>健康证到期</span>
            <b className={expired ? 'mono' : 'mono'} style={expired ? { color: 'var(--red)' } : undefined}>
              {emp.healthCertExpire ?? '—'}
            </b>
          </div>
          <div className="kv">
            <span>最近登录</span>
            <b className="mono">{emp.lastLoginTime ?? '从未登录'}</b>
          </div>
          <div className="kv">
            <span>角色</span>
            <b>{emp.roles.length ? emp.roles.map((r) => r.roleName).join('、') : '未分配'}</b>
          </div>
        </div>
        {expired ? (
          <div className="notice red">
            <Icon name="i-warn" />
            <span>健康证已于 {emp.healthCertExpire} 到期，按食品安全要求该员工不应继续从事直接接触食品的岗位。</span>
          </div>
        ) : null}
      </div>
      <ModalFoot note={`empId ${emp.id}`}>
        {can('sys:employee:reset') ? (
          <button className="btn btn-ghost" onClick={() => onAction('reset')}>
            重置密码
          </button>
        ) : null}
        {emp.status === 1 && can('sys:employee:edit') ? (
          <button className="btn btn-ghost" onClick={() => onAction('freeze')}>
            冻结账号
          </button>
        ) : null}
        {emp.status === 2 && can('sys:employee:edit') ? (
          <button className="btn btn-ghost" onClick={() => onAction('unfreeze')}>
            解除冻结
          </button>
        ) : null}
        {emp.status !== 0 && can('sys:employee:leave') ? (
          <button className="btn btn-danger" onClick={() => onAction('leave')}>
            离职停用
          </button>
        ) : null}
        <button className="btn btn-primary" onClick={onClose}>
          关闭
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 重置密码 #8 ============================ */

export function ResetPwdModal({ empId, onClose }: { empId: string; onClose: () => void }) {
  const emp = useAdminStore((s) => s.employees.find((e) => e.id === empId))
  const resetPassword = useAdminStore((s) => s.resetPassword)
  const showToast = useAppStore((s) => s.showToast)
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (pwd.length < 6) return setErr('新密码至少 6 位')
    if (pwd !== confirm) return setErr('两次输入不一致')
    setSaving(true)
    try {
      await resetPassword(empId, pwd)
      showToast(`已重置 ${emp?.empName ?? ''} 的登录密码，员工下次登录需重新设置`)
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '重置失败', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell onClose={onClose} width="min(480px,100%)">
      <ModalHead kicker="PASSWORD · RESET" title="重置登录密码" sub={emp ? `${emp.empName} · 工号 ${emp.empNo}` : undefined} onClose={onClose} />
      <div className="modal-body">
        <label className="field-label">新密码</label>
        <input className="field" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="至少 6 位" />
        <label className="field-label" style={{ marginTop: 10, display: 'block' }}>
          确认新密码
        </label>
        <input className="field" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="再次输入" />
        <span className="field-err">{err}</span>
        <div className="notice amber">
          <Icon name="i-shield" />
          <span>重置立即生效，旧密码作废；该操作会写入操作日志（PWD_RESET），不可撤销。</span>
        </div>
      </div>
      <ModalFoot>
        <button className="btn btn-ghost" onClick={onClose}>
          取消
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? '提交中…' : '确认重置'}
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 调整审批额度 #11 ============================ */

export function QuotaModal({ empId, onClose }: { empId: string; onClose: () => void }) {
  const emp = useAdminStore((s) => s.employees.find((e) => e.id === empId))
  const updateQuota = useAdminStore((s) => s.updateQuota)
  const myLimit = useAppStore((s) => s.approvalLimit)
  const showToast = useAppStore((s) => s.showToast)
  const [limit, setLimit] = useState(String(emp?.approvalLimit ?? 0))
  const [saving, setSaving] = useState(false)

  const value = Number(limit)
  const invalid = Number.isNaN(value) || value < 0
  const over = value > myLimit

  const submit = async () => {
    if (invalid) return
    setSaving(true)
    try {
      await updateQuota(empId, value)
      showToast(`已把 ${emp?.empName ?? ''} 的审批额度调整为 ¥${money(value)}`)
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '调整失败', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell onClose={onClose} width="min(500px,100%)">
      <ModalHead
        kicker="APPROVAL · QUOTA"
        title="调整审批额度"
        sub={emp ? `${emp.empName} · 当前 ¥${money(emp.approvalLimit)}` : undefined}
        onClose={onClose}
      />
      <div className="modal-body">
        <label className="field-label">新的额度上限（元）</label>
        <input className="field" inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} />
        <div className="filter-chips" style={{ marginTop: 8 }}>
          {[0, 500, 3000, 5000, 20000].map((v) => (
            <button key={v} className={`filter-chip ${value === v ? 'active' : ''}`} onClick={() => setLimit(String(v))}>
              {v === 0 ? '无额度' : `¥${v.toLocaleString('zh-CN')}`}
            </button>
          ))}
        </div>
        <span className="field-err">{invalid ? '请填写不小于 0 的金额' : ''}</span>
        <div className="notice soft">
          <Icon name="i-info" />
          <span>
            额度决定「改价、报损、退款」是否需上级审批：申请金额 ≤ 额度时系统直接放行并留痕，超出则进入待审。
            你自己的额度为 ¥{money(myLimit)}。
          </span>
        </div>
        {over ? (
          <div className="notice amber">
            <Icon name="i-warn" />
            <span>新额度高于你自身的 ¥{money(myLimit)}，超出部分仍需上级审批，请确认是否符合授权政策。</span>
          </div>
        ) : null}
      </div>
      <ModalFoot>
        <button className="btn btn-ghost" onClick={onClose}>
          取消
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={invalid || saving}>
          {saving ? '提交中…' : '确认调整'}
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 分配角色 #12 ============================ */

export function RoleAssignModal({ empId, onClose }: { empId: string; onClose: () => void }) {
  const emp = useAdminStore((s) => s.employees.find((e) => e.id === empId))
  const roles = useAdminStore((s) => s.roles)
  const assignRoles = useAdminStore((s) => s.assignRoles)
  const showToast = useAppStore((s) => s.showToast)
  const [ids, setIds] = useState<string[]>(emp?.roles.map((r) => r.id) ?? [])
  const [saving, setSaving] = useState(false)

  const toggle = (id: string) =>
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const submit = async () => {
    setSaving(true)
    try {
      await assignRoles(empId, ids)
      showToast(`已更新 ${emp?.empName ?? ''} 的角色，权限在下次进入页面时生效`)
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '分配失败', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell onClose={onClose} width="min(560px,100%)">
      <ModalHead kicker="ROLE · ASSIGN" title="分配角色" sub={emp ? `${emp.empName} · 工号 ${emp.empNo}` : undefined} onClose={onClose} />
      <div className="modal-body">
        <div className="modal-list">
          {roles.map((r) => {
            const on = ids.includes(r.id)
            return (
              <label key={r.id} className="perm-item" style={{ borderRadius: 7, border: '1px solid var(--line)' }}>
                <input type="checkbox" checked={on} onChange={() => toggle(r.id)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 11.5 }}>{r.roleName}</b>
                  <span style={{ display: 'block', fontSize: 8.5, color: 'var(--muted)', marginTop: 2 }}>
                    {r.roleCode} · {SCOPE_LABEL[r.dataScope]} · {r.permIds.length} 个权限点
                  </span>
                </div>
                {r.status === 0 ? <span className="tag tag-soft">已停用</span> : null}
              </label>
            )
          })}
        </div>
        <div className="notice soft">
          <Icon name="i-info" />
          <span>角色决定可见菜单与按钮；权限变更后缓存最长 300 秒过期，无需强制员工重新登录。</span>
        </div>
      </div>
      <ModalFoot note={`已选 ${ids.length} 个角色`}>
        <button className="btn btn-ghost" onClick={onClose}>
          取消
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? '提交中…' : '保存'}
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 冻结 / 解冻 / 离职 #9 #10 ============================ */

export function EmployeeStatusModal({
  empId,
  mode,
  onClose,
}: {
  empId: string
  mode: 'freeze' | 'unfreeze' | 'leave'
  onClose: () => void
}) {
  const emp = useAdminStore((s) => s.employees.find((e) => e.id === empId))
  const updateStatus = useAdminStore((s) => s.updateStatus)
  const disableOnLeave = useAdminStore((s) => s.disableOnLeave)
  const showToast = useAppStore((s) => s.showToast)
  const [saving, setSaving] = useState(false)

  if (!emp) return null

  const copy = {
    freeze: { kicker: 'EMPLOYEE · FREEZE', title: '冻结该员工账号？', desc: '冻结后无法登录门店台，历史操作与审批记录保留；可随时解冻。', btn: '确认冻结', cls: 'btn-danger' },
    unfreeze: { kicker: 'EMPLOYEE · UNFREEZE', title: '解除冻结？', desc: '解冻后员工可立即用原密码登录，权限按现有角色恢复。', btn: '确认解冻', cls: 'btn-primary' },
    leave: { kicker: 'EMPLOYEE · LEAVE', title: '办理离职停用？', desc: '离职为终态：账号停用且不可再解冻，仅保留审计追溯，请确认已完成交接。', btn: '确认离职', cls: 'btn-danger' },
  }[mode]

  const submit = async () => {
    setSaving(true)
    try {
      if (mode === 'leave') await disableOnLeave(empId, nowDate())
      else await updateStatus(empId, (mode === 'freeze' ? 2 : 1) as Extract<EmployeeStatus, 1 | 2>)
      showToast(mode === 'leave' ? `已为 ${emp.empName} 办理离职停用` : mode === 'freeze' ? `已冻结 ${emp.empName} 的账号` : `已解冻 ${emp.empName}`)
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '操作失败', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell onClose={onClose} width="min(470px,100%)">
      <ModalHead kicker={copy.kicker} title={copy.title} sub={`${emp.empName} · 工号 ${emp.empNo}`} onClose={onClose} />
      <div className="modal-body">
        <div className={mode === 'unfreeze' ? 'notice green' : 'notice amber'}>
          <Icon name={mode === 'unfreeze' ? 'i-check' : 'i-warn'} />
          <span>{copy.desc}</span>
        </div>
        <div className="kv-grid" style={{ marginTop: 12 }}>
          <div className="kv">
            <span>当前状态</span>
            <b>{STATUS_LABEL[emp.status]}</b>
          </div>
          <div className="kv">
            <span>角色</span>
            <b>{emp.roles.map((r) => r.roleName).join('、') || '未分配'}</b>
          </div>
        </div>
      </div>
      <ModalFoot note="操作写入审计日志">
        <button className="btn btn-ghost" onClick={onClose}>
          取消
        </button>
        <button className={`btn ${copy.cls}`} onClick={submit} disabled={saving}>
          {saving ? '处理中…' : copy.btn}
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 角色新增 / 编辑 #14 #15 ============================ */

const SCOPES: DataScope[] = ['ALL', 'REGION', 'STORE', 'SELF']

export function RoleFormModal({ roleId, onClose }: { roleId?: string; onClose: () => void }) {
  const roles = useAdminStore((s) => s.roles)
  const saveRole = useAdminStore((s) => s.saveRole)
  const showToast = useAppStore((s) => s.showToast)
  const editing = roleId ? roles.find((r) => r.id === roleId) : undefined

  const [form, setForm] = useState({
    roleCode: editing?.roleCode ?? '',
    roleName: editing?.roleName ?? '',
    dataScope: (editing?.dataScope ?? 'STORE') as DataScope,
    remark: editing?.remark ?? '',
    status: editing?.status ?? 1,
  })
  const [err, setErr] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const next: Record<string, string> = {}
    if (!/^[A-Z][A-Z0-9_]{2,29}$/.test(form.roleCode)) next.roleCode = '编码用大写字母、数字与下划线，3–30 位'
    if (!form.roleName.trim()) next.roleName = '请填写角色名称'
    if (!editing && roles.some((r) => r.roleCode === form.roleCode)) next.roleCode = '编码已存在'
    if (Object.keys(next).length) return setErr(next)
    setSaving(true)
    try {
      await saveRole(
        {
          roleCode: form.roleCode,
          roleName: form.roleName.trim(),
          dataScope: form.dataScope,
          remark: form.remark.trim() || undefined,
          status: form.status,
        },
        roleId,
      )
      showToast(editing ? `已更新角色 ${form.roleName}` : `已创建角色 ${form.roleName}，记得下一步勾选权限点`)
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '保存失败', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell onClose={onClose} width="min(540px,100%)">
      <ModalHead
        kicker={editing ? 'ROLE · UPDATE' : 'ROLE · CREATE'}
        title={editing ? `编辑角色 · ${editing.roleName}` : '新建角色'}
        sub="角色是权限点的集合；数据范围决定该角色能看哪些门店的数据。"
        onClose={onClose}
      />
      <div className="modal-body">
        <div className="form-cols">
          <div>
            <label className="field-label">角色编码 *</label>
            <input
              className="field"
              value={form.roleCode}
              disabled={Boolean(editing?.isBuiltin)}
              onChange={(e) => setForm((f) => ({ ...f, roleCode: e.target.value.toUpperCase() }))}
              placeholder="STORE_MANAGER"
            />
            <span className="field-err">{err.roleCode}</span>
          </div>
          <div>
            <label className="field-label">角色名称 *</label>
            <input className="field" value={form.roleName} onChange={(e) => setForm((f) => ({ ...f, roleName: e.target.value }))} placeholder="值班店长" />
            <span className="field-err">{err.roleName}</span>
          </div>
          <div>
            <label className="field-label">数据范围</label>
            <select className="field" value={form.dataScope} onChange={(e) => setForm((f) => ({ ...f, dataScope: e.target.value as DataScope }))}>
              {SCOPES.map((s) => (
                <option key={s} value={s}>
                  {SCOPE_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">状态</label>
            <select className="field" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: Number(e.target.value) }))}>
              <option value={1}>启用</option>
              <option value={0}>停用</option>
            </select>
          </div>
          <div className="full">
            <label className="field-label">备注</label>
            <textarea className="field" value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} placeholder="说明该角色的职责边界" />
          </div>
        </div>
        {editing?.isBuiltin ? (
          <div className="notice amber">
            <Icon name="i-warn" />
            <span>内置角色不可删除，编码也不可修改；如需调整职责，请复制为新角色后重新授权。</span>
          </div>
        ) : null}
      </div>
      <ModalFoot>
        <button className="btn btn-ghost" onClick={onClose}>
          取消
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? '保存中…' : editing ? '保存修改' : '创建角色'}
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 角色授权 #17 ============================ */

export function PermAssignModal({ roleId, onClose }: { roleId: string; onClose: () => void }) {
  const role = useAdminStore((s) => s.roles.find((r) => r.id === roleId))
  const assignPermissions = useAdminStore((s) => s.assignPermissions)
  const showToast = useAppStore((s) => s.showToast)
  const [ids, setIds] = useState<string[]>(role?.permIds ?? [])
  const [saving, setSaving] = useState(false)

  if (!role) return null

  const toggle = (list: string[], on: boolean) =>
    setIds((prev) => (on ? Array.from(new Set([...prev, ...list])) : prev.filter((x) => !list.includes(x))))

  const submit = async () => {
    setSaving(true)
    try {
      await assignPermissions(roleId, ids)
      showToast(`已更新「${role.roleName}」的权限，共 ${ids.length} 个权限点`)
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '授权失败', true)
    } finally {
      setSaving(false)
    }
  }

  const selectedNames = ALL_PERMISSIONS.filter((p) => ids.includes(p.id)).map((p) => p.permName)

  return (
    <ModalShell onClose={onClose} width="min(720px,100%)">
      <ModalHead
        kicker="ROLE · PERMISSIONS"
        title={`授权 · ${role.roleName}`}
        sub={`${role.roleCode} · ${SCOPE_LABEL[role.dataScope]} · 已选 ${ids.length} / ${ALL_PERMISSIONS.length}`}
        onClose={onClose}
      />
      <div className="modal-body">
        <div className="perm-tree">
          {PERMISSION_TREE.map((g: PermissionVO) => {
            const gids = g.children.map((c) => c.id)
            const allOn = gids.every((id) => ids.includes(id))
            const someOn = !allOn && gids.some((id) => ids.includes(id))
            return (
              <div className="perm-group" key={g.id}>
                <div className="perm-group-head">
                  <input
                    type="checkbox"
                    checked={allOn}
                    ref={(el) => {
                      if (el) el.indeterminate = someOn
                    }}
                    onChange={() => toggle(gids, !allOn)}
                    style={{ accentColor: 'var(--green)' }}
                  />
                  <b>{g.permName}</b>
                  <span className="cnt">
                    {gids.filter((id) => ids.includes(id)).length}/{gids.length}
                  </span>
                  <span className="spacer" />
                  <span className="cnt">{g.permCode}</span>
                </div>
                <div className="perm-items">
                  {g.children.map((p) => {
                    const on = ids.includes(p.id)
                    return (
                      <label key={p.id} className={`perm-item ${on ? 'on' : ''}`}>
                        <input type="checkbox" checked={on} onChange={() => toggle([p.id], !on)} />
                        {p.permName}
                        <code>{p.permCode}</code>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <div className="notice soft">
          <Icon name="i-shield" />
          <span>
            {selectedNames.length ? `已授权：${selectedNames.slice(0, 6).join('、')}${selectedNames.length > 6 ? ` 等 ${selectedNames.length} 项` : ''}` : '尚未勾选任何权限点，该角色登录后看不到业务菜单。'}
          </span>
        </div>
      </div>
      <ModalFoot note="权限缓存最长 300 秒后自动刷新">
        <button className="btn btn-ghost" onClick={onClose}>
          取消
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? '保存中…' : '保存授权'}
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 删除角色 #16 ============================ */

export function RoleDeleteModal({ roleId, onClose }: { roleId: string; onClose: () => void }) {
  const role = useAdminStore((s) => s.roles.find((r) => r.id === roleId))
  const employees = useAdminStore((s) => s.employees)
  const removeRole = useAdminStore((s) => s.removeRole)
  const showToast = useAppStore((s) => s.showToast)
  const [saving, setSaving] = useState(false)

  if (!role) return null
  const used = employees.filter((e) => e.roles.some((r) => r.id === roleId))

  const submit = async () => {
    setSaving(true)
    try {
      await removeRole(roleId)
      showToast(`已删除角色 ${role.roleName}`)
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '删除失败', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell onClose={onClose} width="min(470px,100%)">
      <ModalHead kicker="ROLE · DELETE" title={`删除角色「${role.roleName}」？`} sub={`${role.roleCode} · 关联 ${used.length} 名员工`} onClose={onClose} />
      <div className="modal-body">
        {used.length ? (
          <div className="notice red">
            <Icon name="i-warn" />
            <span>
              仍有 {used.map((e) => e.empName).join('、')} 持有该角色。删除后他们对应的菜单与按钮会立即失效，请先把人换绑到其他角色。
            </span>
          </div>
        ) : (
          <div className="notice amber">
            <Icon name="i-warn" />
            <span>删除不可撤销；若只是暂时停用，建议把角色状态改为「停用」保留授权配置。</span>
          </div>
        )}
      </div>
      <ModalFoot>
        <button className="btn btn-ghost" onClick={onClose}>
          取消
        </button>
        <button className="btn btn-danger" onClick={submit} disabled={saving}>
          {saving ? '删除中…' : '确认删除'}
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 审批裁决 #20 ============================ */

export function ApprovalDecideModal({
  approvalNo,
  initial,
  onClose,
}: {
  approvalNo: string
  initial: 'PASS' | 'REJECT'
  onClose: () => void
}) {
  const approval = useAdminStore((s) => s.approvals.find((a) => a.approvalNo === approvalNo))
  const decide = useAdminStore((s) => s.decide)
  const showToast = useAppStore((s) => s.showToast)
  const [result, setResult] = useState<'PASS' | 'REJECT'>(initial)
  const [remark, setRemark] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  if (!approval) return null

  const snapshot = (() => {
    try {
      return approval.snapshotJson ? (JSON.parse(approval.snapshotJson) as Record<string, unknown>) : null
    } catch {
      return null
    }
  })()

  const submit = async () => {
    if (result === 'REJECT' && !remark.trim()) return setErr('驳回必须填写理由，会同步通知申请人')
    if (remark.trim().length > 200) return setErr('理由不超过 200 字')
    setSaving(true)
    try {
      await decide(approvalNo, result, remark.trim())
      showToast(result === 'PASS' ? `已通过 ${approvalNo}` : `已驳回 ${approvalNo}，理由已通知申请人`)
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '裁决失败', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell onClose={onClose} width="min(580px,100%)">
      <ModalHead
        kicker="APPROVAL · DECIDE"
        title={result === 'PASS' ? '通过该审批？' : '驳回该审批？'}
        sub={`${approval.approvalNo} · ${BIZ_LABEL[approval.bizType] ?? approval.bizType} · 申请人 ${approval.applyEmpName ?? approval.applyEmpId}`}
        onClose={onClose}
      />
      <div className="modal-body">
        <div className="seg" style={{ marginBottom: 12 }}>
          <button className={result === 'PASS' ? 'on' : ''} onClick={() => setResult('PASS')}>
            通过
          </button>
          <button className={result === 'REJECT' ? 'on' : ''} onClick={() => setResult('REJECT')}>
            驳回
          </button>
        </div>

        <div className="kv-grid">
          <div className="kv">
            <span>业务单号</span>
            <b className="mono">{approval.bizNo ?? approval.bizId}</b>
          </div>
          <div className="kv">
            <span>申请金额</span>
            <b className="mono">¥{money(approval.applyAmount)}</b>
          </div>
          <div className="kv">
            <span>审批层级</span>
            <b>{approval.needLevel === 1 ? '额度内自动通过' : '需上级审批'}</b>
          </div>
          <div className="kv">
            <span>提交时间</span>
            <b className="mono">{approval.createTime}</b>
          </div>
        </div>

        {snapshot ? (
          <div className="notice soft" style={{ display: 'block' }}>
            <div className="eyebrow" style={{ marginBottom: 7 }}>
              业务快照
            </div>
            <div className="kv-grid" style={{ gap: '7px 16px' }}>
              {Object.entries(snapshot).map(([k, v]) => (
                <div className="kv" key={k}>
                  <span>{k}</span>
                  <b className="mono">{String(v)}</b>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <label className="field-label" style={{ marginTop: 12, display: 'block' }}>
          审批意见 {result === 'REJECT' ? '*（必填）' : '（选填）'}
        </label>
        <textarea
          className="field"
          value={remark}
          onChange={(e) => {
            setRemark(e.target.value)
            setErr('')
          }}
          placeholder={result === 'REJECT' ? '说明驳回原因，例如：复核小票重量与标签一致，无需改重' : '例如：凭证齐全，同意入损耗台账'}
        />
        <span className="field-err">{err}</span>

        <div className={result === 'PASS' ? 'notice green' : 'notice red'}>
          <Icon name={result === 'PASS' ? 'i-check' : 'i-warn'} />
          <span>
            {result === 'PASS'
              ? '通过后业务侧会在写入前调用校验接口确认放行，并留下审批单号；涉及库存与损耗的单据会同步入账。'
              : '驳回后申请人需重新提交，原单号保留在审计日志中，不可再次裁决。'}
          </span>
        </div>
      </div>
      <ModalFoot note="裁决留痕：APPROVAL_DECIDE">
        <button className="btn btn-ghost" onClick={onClose}>
          取消
        </button>
        <button className={result === 'PASS' ? 'btn btn-primary' : 'btn btn-danger'} onClick={submit} disabled={saving}>
          {saving ? '提交中…' : result === 'PASS' ? '确认通过' : '确认驳回'}
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 审批详情 ============================ */

export function ApprovalDetailModal({ approvalNo, onClose }: { approvalNo: string; onClose: () => void }) {
  const approval = useAdminStore((s) => s.approvals.find((a) => a.approvalNo === approvalNo))
  if (!approval) return null

  const snapshot = (() => {
    try {
      return approval.snapshotJson ? (JSON.parse(approval.snapshotJson) as Record<string, unknown>) : null
    } catch {
      return null
    }
  })()

  const done = approval.approveResult === 1
  const rejected = approval.approveResult === 2

  return (
    <ModalShell onClose={onClose} width="min(600px,100%)">
      <ModalHead
        kicker="APPROVAL · DETAIL"
        title={approval.approvalNo}
        sub={`${BIZ_LABEL[approval.bizType] ?? approval.bizType} · ${approval.bizNo ?? approval.bizId}`}
        onClose={onClose}
      />
      <div className="modal-body">
        <div className="timeline">
          <div className="tl-node done">
            <b>提交申请</b>
            <span>
              {approval.applyEmpName ?? approval.applyEmpId} · {approval.createTime} · 申请金额 ¥{money(approval.applyAmount)}
            </span>
          </div>
          <div className={`tl-node ${done ? 'done' : rejected ? 'reject' : 'wait'}`}>
            <b>{done ? '审批通过' : rejected ? '审批驳回' : '等待审批'}</b>
            <span>
              {approval.approveResult === 0
                ? approval.needLevel === 1
                  ? '额度内可直接放行，等待业务侧校验'
                  : '已进入待办，等待有额度的审批人处理'
                : `${approval.approverEmpName ?? '系统'} · ${approval.approveTime ?? ''}${approval.approveRemark ? ` · ${approval.approveRemark}` : ''}`}
            </span>
          </div>
          <div className={`tl-node ${done ? 'done' : ''}`}>
            <b>业务入账</b>
            <span>{done ? '写入前已通过校验接口，单据状态同步至业务台账' : '未放行，业务侧不会写入库存与损耗'}</span>
          </div>
        </div>

        {snapshot ? (
          <div className="form-block">
            <label className="field-label">业务快照</label>
            <pre
              style={{
                margin: 0,
                padding: '10px 12px',
                border: '1px solid var(--line)',
                borderRadius: 7,
                background: 'var(--surface-2)',
                fontFamily: 'var(--mono)',
                fontSize: 9.5,
                lineHeight: 1.8,
                color: 'var(--ink-soft)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {JSON.stringify(snapshot, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
      <ModalFoot note={`状态：${APPROVE_LABEL[approval.approveResult]}`}>
        <button className="btn btn-primary" onClick={onClose}>
          关闭
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 日志详情 ============================ */

export function LogDetailModal({ logId, onClose }: { logId: string; onClose: () => void }) {
  const log = useAdminStore((s) => s.logs.find((l) => l.id === logId))
  if (!log) return null

  const pretty = (raw?: string | null) => {
    if (!raw) return '—'
    try {
      return JSON.stringify(JSON.parse(raw), null, 2)
    } catch {
      return raw
    }
  }

  return (
    <ModalShell onClose={onClose} width="min(640px,100%)">
      <ModalHead
        kicker={`AUDIT · ${log.action}`}
        title={ACTION_LABEL[log.action] ?? log.action}
        sub={`${log.module} · ${log.createTime}`}
        onClose={onClose}
      />
      <div className="modal-body">
        <div className="kv-grid">
          <div className="kv">
            <span>操作对象</span>
            <b>
              {log.targetType ?? '—'} {log.targetId ? `· ${log.targetId}` : ''}
            </b>
          </div>
          <div className="kv">
            <span>客户端 IP</span>
            <b className="mono">{log.clientIp ?? '—'}</b>
          </div>
        </div>
        <div className="form-block">
          <div className="diff">
            <div className="diff-col">
              <span>变更前</span>
              <pre>{pretty(log.beforeJson)}</pre>
            </div>
            <div className="diff-col after">
              <span>变更后</span>
              <pre>{pretty(log.afterJson)}</pre>
            </div>
          </div>
        </div>
      </div>
      <ModalFoot note="日志不可编辑、不可删除">
        <button className="btn btn-primary" onClick={onClose}>
          关闭
        </button>
      </ModalFoot>
    </ModalShell>
  )
}
