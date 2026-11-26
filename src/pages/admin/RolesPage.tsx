import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { PermAssignModal, RoleDeleteModal, RoleFormModal } from '@/features/admin/modals'
import { ALL_PERMISSIONS, SCOPE_LABEL } from '@/data/adminMock'
import { useAdminStore } from '@/store/useAdminStore'
import { useAppStore } from '@/store/useAppStore'

type RoleModal = { kind: 'form'; roleId?: string } | { kind: 'perm'; roleId: string } | { kind: 'delete'; roleId: string }

export default function RolesPage() {
  const roles = useAdminStore((s) => s.roles)
  const employees = useAdminStore((s) => s.employees)
  const can = useAppStore((s) => s.can)
  const [modal, setModal] = useState<RoleModal | null>(null)
  const close = () => setModal(null)

  const countOf = (roleId: string) => employees.filter((e) => e.roles.some((r) => r.id === roleId)).length
  const builtin = roles.filter((r) => r.isBuiltin === 1).length
  const custom = roles.length - builtin
  const covered = new Set(roles.flatMap((r) => r.permIds)).size

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <p className="eyebrow">ROLE &amp; GRANT · SYS #13 — #18</p>
          <h1 className="page-title">角色授权。</h1>
          <p className="page-desc">
            角色是权限点的集合，权限点只有一套字典。给角色勾选权限 → 员工绑角色 → 菜单与按钮按权限码显隐。
          </p>
        </div>
        <div className="page-actions">
          <div className="page-date">
            已覆盖 <b>{covered} / {ALL_PERMISSIONS.length}</b> 个权限点
          </div>
          {can('sys:role:add') ? (
            <button className="btn btn-primary" onClick={() => setModal({ kind: 'form' })}>
              <Icon name="i-plus" />
              新建角色
            </button>
          ) : null}
        </div>
      </div>

      <div className="member-stats">
        <div className="member-stat">
          <span>角色总数</span>
          <b>
            {roles.length}
            <small>个</small>
          </b>
        </div>
        <div className="member-stat">
          <span>内置角色</span>
          <b>
            {builtin}
            <small>个</small>
          </b>
        </div>
        <div className="member-stat">
          <span>自定义角色</span>
          <b>
            {custom}
            <small>个</small>
          </b>
        </div>
        <div className="member-stat">
          <span>未被任何角色引用</span>
          <b>
            {ALL_PERMISSIONS.length - covered}
            <small>项</small>
          </b>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table dense" style={{ minWidth: 1000 }}>
          <thead>
            <tr>
              <th>角色</th>
              <th>编码</th>
              <th>数据范围</th>
              <th>员工数</th>
              <th>权限点</th>
              <th>状态</th>
              <th>职责说明</th>
              <th style={{ textAlign: 'right' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <td>
                  <b style={{ fontSize: 11, color: 'var(--ink)' }}>{r.roleName}</b>
                  {r.isBuiltin === 1 ? <span className="tag tag-soft" style={{ marginLeft: 6 }}>内置</span> : null}
                </td>
                <td>
                  <span className="num">{r.roleCode}</span>
                </td>
                <td>{SCOPE_LABEL[r.dataScope]}</td>
                <td>
                  <span className="num">{countOf(r.id)}</span>
                  <span className="sub">人</span>
                </td>
                <td>
                  <span className="num">{r.permIds.length}</span>
                  <span className="sub">/ {ALL_PERMISSIONS.length}</span>
                </td>
                <td>
                  <span className={`tag ${r.status === 1 ? 'tag-green' : 'tag-soft'}`}>{r.status === 1 ? '启用' : '停用'}</span>
                </td>
                <td style={{ maxWidth: 260 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{r.remark ?? '—'}</span>
                </td>
                <td>
                  <div className="row-actions">
                    {can('sys:role:grant') ? (
                      <button className="action-link" onClick={() => setModal({ kind: 'perm', roleId: r.id })}>
                        授权
                      </button>
                    ) : null}
                    {can('sys:role:edit') ? (
                      <button className="action-link" onClick={() => setModal({ kind: 'form', roleId: r.id })}>
                        编辑
                      </button>
                    ) : null}
                    {can('sys:role:del') ? (
                      <button
                        className="action-link red"
                        onClick={() => setModal({ kind: 'delete', roleId: r.id })}
                        disabled={r.isBuiltin === 1}
                        title={r.isBuiltin === 1 ? '内置角色不可删除（SYS_009）' : undefined}
                      >
                        删除
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-foot">
          <span>内置角色不可删除、编码不可改；如需调整职责请新建角色后迁移</span>
          <span>授权变更后权限缓存最长 300 秒过期</span>
        </div>
      </div>

      {modal?.kind === 'form' ? <RoleFormModal roleId={modal.roleId} onClose={close} /> : null}
      {modal?.kind === 'perm' ? <PermAssignModal roleId={modal.roleId} onClose={close} /> : null}
      {modal?.kind === 'delete' ? <RoleDeleteModal roleId={modal.roleId} onClose={close} /> : null}
    </section>
  )
}
