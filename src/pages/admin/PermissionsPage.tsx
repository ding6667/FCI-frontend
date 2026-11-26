import { Icon } from '@/components/Icon'
import { ALL_PERMISSIONS, PERMISSION_TREE } from '@/data/adminMock'
import { useAdminStore } from '@/store/useAdminStore'

const TYPE_LABEL: Record<number, string> = { 1: '菜单', 2: '按钮', 3: '接口' }

export default function PermissionsPage() {
  const roles = useAdminStore((s) => s.roles)
  const total = ALL_PERMISSIONS.length
  const roots = PERMISSION_TREE.length
  const covered = new Set(roles.flatMap((r) => r.permIds)).size

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <p className="eyebrow">PERMISSION CATALOG · SYS #18</p>
          <h1 className="page-title">权限点。</h1>
          <p className="page-desc">
            权限字典是服务端下发的固定集合，前端只读。页面拿权限码做显隐，不硬编码角色名。
          </p>
        </div>
        <div className="page-actions">
          <div className="page-date">
            <b>{total}</b> 个权限点 · {roots} 个业务域
          </div>
          <button className="btn btn-ghost" onClick={() => window.print()}>
            <Icon name="i-print" />
            打印字典
          </button>
        </div>
      </div>

      <div className="member-stats">
        <div className="member-stat">
          <span>权限点总数</span>
          <b>
            {total}
            <small>个</small>
          </b>
        </div>
        <div className="member-stat">
          <span>业务域分组</span>
          <b>
            {roots}
            <small>组</small>
          </b>
        </div>
        <div className="member-stat">
          <span>已被角色引用</span>
          <b>
            {covered}
            <small>项</small>
          </b>
        </div>
        <div className="member-stat">
          <span>尚未被引用</span>
          <b>
            {total - covered}
            <small>项</small>
          </b>
        </div>
      </div>

      <div className="notice soft" style={{ marginTop: 0, marginBottom: 12 }}>
        <Icon name="i-info" />
        <span>
          <b>employee-api.md §2.5</b>：登录后从 <code style={{ fontFamily: 'var(--mono)' }}>/auth/me</code> 的 permissions
          构建本地集合，用 <code style={{ fontFamily: 'var(--mono)' }}>can(code)</code> 控制入口。业务域权限点
          （临期改价、报损登记）由员工系统签发，实际校验在各业务域接口上。
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14, alignItems: 'start' }}>
        {PERMISSION_TREE.map((g) => (
          <div className="panel" key={g.id}>
            <div className="panel-head">
              <div>
                <div className="panel-title">
                  {g.permName}
                  <em>{g.permCode}</em>
                </div>
                <p className="panel-sub">
                  共 {g.children.length} 个权限点，父节点 {g.id}
                </p>
              </div>
              <div className="panel-actions">
                <span className="tag tag-soft">{g.children.length}</span>
              </div>
            </div>
            <div className="panel-body" style={{ padding: '4px 0' }}>
              {g.children.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderBottom: '1px solid rgba(217,207,188,.6)',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--ink)', minWidth: 84 }}>{p.permName}</span>
                  <code style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--green)' }}>{p.permCode}</code>
                  <span style={{ flex: 1 }} />
                  <span className="tag-mini">{TYPE_LABEL[p.permType]}</span>
                  <span
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 8.5,
                      color: 'var(--muted)',
                      maxWidth: 150,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={p.apiPath ?? ''}
                  >
                    {p.apiPath ?? '—'}
                  </span>
                </div>
              ))}
            </div>
            <div className="panel-foot">
              <span>父节点 {g.permCode}</span>
              <span>sortOrder {g.sortOrder}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
