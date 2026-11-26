import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import ModalHost from '@/components/ModalHost'
import { useNow } from '@/hooks/useNow'
import { nowHM } from '@/lib/format'
import { useAdminStore } from '@/store/useAdminStore'
import { useAppStore } from '@/store/useAppStore'

interface NavLeaf {
  path: string
  label: string
  icon: string
  /** 入口所需权限点（C-SEED@1）；无权限则隐藏，见 employee-api.md §2.5 */
  perm?: string
}

/** 侧栏二级结构：一级是「系统」，点开才展开下面的作业页面 */
interface NavGroup {
  id: string
  label: string
  icon: string
  /** 标题自身的落地页；没有落地页的一级（人员）只负责折叠 */
  path?: string
  children: NavLeaf[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'work',
    label: '工作台',
    icon: 'i-dash',
    path: '/app/dashboard',
    children: [
      { path: '/app/pos', label: '收银台', icon: 'i-pos' },
      { path: '/app/expiry', label: '临期处置', icon: 'i-expiry', perm: 'art:price:change' },
      { path: '/app/orders', label: '订单履约', icon: 'i-orders' },
      { path: '/app/inventory', label: '库存批次', icon: 'i-stock' },
    ],
  },
  {
    id: 'staff',
    label: '人员',
    icon: 'i-members',
    children: [
      { path: '/app/members', label: '会员', icon: 'i-members' },
      { path: '/app/admin/employees', label: '员工', icon: 'i-user', perm: 'sys:employee:list' },
    ],
  },
  {
    id: 'approval',
    label: '审批中心',
    icon: 'i-shield',
    path: '/app/admin/approvals',
    children: [
      { path: '/app/admin/approvals', label: '待办审批', icon: 'i-shield', perm: 'sys:approval:list' },
      { path: '/app/admin/roles', label: '角色授权', icon: 'i-tag', perm: 'sys:role:list' },
      { path: '/app/admin/permissions', label: '权限点', icon: 'i-box', perm: 'sys:perm:list' },
      { path: '/app/admin/logs', label: '操作日志', icon: 'i-receipt', perm: 'sys:log:list' },
    ],
  },
]

export const PAGE_TITLE: Record<string, string> = {
  '/app/dashboard': '工作台',
  '/app/pos': '收银台',
  '/app/expiry': '临期处置',
  '/app/orders': '订单履约',
  '/app/inventory': '库存批次',
  '/app/members': '会员',
  '/app/admin/approvals': '审批中心',
  '/app/admin/employees': '员工管理',
  '/app/admin/roles': '角色授权',
  '/app/admin/permissions': '权限点',
  '/app/admin/logs': '操作日志',
}

/** 当前路由落在哪个一级系统下，用于面包屑与默认展开 */
function groupOf(pathname: string): NavGroup | undefined {
  return NAV_GROUPS.find((g) => g.path === pathname || g.children.some((c) => c.path === pathname))
}

/** 路由懒加载的占位：只占内容区，侧栏与顶栏保持可操作 */
function PageLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="route-spinner" aria-hidden="true" />
      <span>正在加载作业台…</span>
    </div>
  )
}

export default function StoreLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const now = useNow()

  const employee = useAppStore((s) => s.employee)
  const storeName = useAppStore((s) => s.storeName)
  const offline = useAppStore((s) => s.offline)
  const queued = useAppStore((s) => s.queued)
  const batches = useAppStore((s) => s.batches)
  const orders = useAppStore((s) => s.orders)
  const toggleOffline = useAppStore((s) => s.toggleOffline)
  const openModal = useAppStore((s) => s.openModal)
  const can = useAppStore((s) => s.can)
  const approvals = useAdminStore((s) => s.approvals)

  const pendingExpiry = batches.filter((b) => b.status === '待处置').length
  const pendingOrders = orders.filter((o) => o.status === '待拣货' || o.status === '待打包').length

  const badgeOf = (path: string): number | null => {
    if (path === '/app/expiry') return pendingExpiry
    if (path === '/app/orders') return pendingOrders
    if (path === '/app/admin/approvals') return approvals.filter((a) => a.approveResult === 0).length
    return null
  }

  // 当前路由所在的一级默认展开；切页时自动展开，不强制收拢用户手动展开的其他组
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const current = groupOf(pathname)
    return current ? { [current.id]: true } : { work: true }
  })
  useEffect(() => {
    const current = groupOf(pathname)
    if (!current) return
    setOpenGroups((prev) => (prev[current.id] ? prev : { ...prev, [current.id]: true }))
  }, [pathname])

  const renderLeaf = (item: NavLeaf) => {
    const badge = badgeOf(item.path)
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) => `rail-item rail-sub ${isActive ? 'active' : ''}`}
      >
        <Icon name={item.icon} />
        <span className="rail-name">{item.label}</span>
        {item.path === '/app/pos' ? (
          <span className="rail-badge rail-badge-soft">A01</span>
        ) : badge !== null ? (
          <span className="rail-badge">{badge}</span>
        ) : null}
      </NavLink>
    )
  }

  const renderGroup = (group: NavGroup) => {
    const leaves = group.children.filter((item) => !item.perm || can(item.perm))
    // 一个子项都看不到的一级直接不显示（如收银员看不到审批中心）
    if (!leaves.length) return null
    const open = Boolean(openGroups[group.id])
    const active = group.path === pathname || leaves.some((l) => l.path === pathname)
    // 落地页：一级自身的页面（工作台总览 / 待办审批），无权访问时退回第一个可见子项
    const landingChild = group.children.find((c) => c.path === group.path)
    const landing = group.path && (!landingChild || leaves.includes(landingChild)) ? group.path : leaves[0].path

    return (
      <div className={`rail-group ${open ? 'open' : ''} ${active ? 'active' : ''}`} key={group.id}>
        <div className="rail-parent-row">
          <button
            type="button"
            className="rail-item rail-parent"
            onClick={() => {
              // 点名称：进入一级落地页并确保展开，能看到下面的二级系统
              setOpenGroups((prev) => ({ ...prev, [group.id]: true }))
              if (landing !== pathname) navigate(landing)
            }}
          >
            <Icon name={group.icon} />
            <span className="rail-name">{group.label}</span>
          </button>
          <button
            type="button"
            className="rail-caret-btn"
            aria-expanded={open}
            aria-label={`${open ? '收起' : '展开'}${group.label}`}
            onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !open }))}
          >
            <Icon name="i-chevron" className="rail-caret" />
          </button>
        </div>
        {open ? <div className="rail-children">{leaves.map(renderLeaf)}</div> : null}
      </div>
    )
  }

  return (
    <div className="app">
      <aside className="rail">
        <div className="rail-brand">
          <div className="brand-leaf">
            <Icon name="i-leaf" />
          </div>
          <div>
            <div className="brand-name">果链智联</div>
            <div className="brand-sub">STORE COUNTER · 门店台</div>
          </div>
        </div>

        <nav className="rail-nav" aria-label="门店台导航">
          <p className="rail-label">STORE OPERATIONS</p>
          {NAV_GROUPS.map(renderGroup)}
        </nav>

        <div className="rail-foot">
          <div className="rail-shift">
            <div>
              <span>SHIFT · A班</span>
              <b>07:00 — 15:00</b>
            </div>
            <button onClick={() => openModal({ type: 'shift' })}>交班</button>
          </div>
          <div className="user-card">
            <div className="user-avatar">{employee.initial}</div>
            <div className="user-meta">
              <b>{employee.name}</b>
              <span>
                {employee.role} · 工号 {employee.code}
              </span>
            </div>
            <button className="logout" onClick={() => openModal({ type: 'logout' })}>
              退出
            </button>
          </div>
        </div>
      </aside>

      <div className="shell">
        <header className="topbar">
          <div className="crumbs">
            {(() => {
              const groupLabel = groupOf(pathname)?.label ?? '门店作业'
              const title = PAGE_TITLE[pathname] ?? '工作台'
              // 一级与页面同名时（工作台 / 审批中心）不重复显示
              return groupLabel === title ? (
                <b>{title}</b>
              ) : (
                <>
                  <span>{groupLabel}</span>
                  <span className="sep">/</span>
                  <b>{title}</b>
                </>
              )
            })()}
            <span className="crumb-store">
              <span className="dot" />
              {storeName}
            </span>
          </div>
          <div className="top-actions">
            <button
              className={`net-toggle ${offline ? 'offline' : ''}`}
              onClick={toggleOffline}
              title="切换离线演示"
            >
              <span className="dot" />
              <span>{offline ? '离线' : '在线'}</span>
            </button>
            <div className="clock">
              {nowHM(now)}
              <small>A班 · 07:00–15:00</small>
            </div>
            <button className="shift-chip" onClick={() => openModal({ type: 'shift' })}>
              <Icon name="i-shift" style={{ width: 12, height: 12 }} />
              <b>交班日结</b>
            </button>
            <div className="top-user">
              <div className="user-avatar">{employee.initial}</div>
              <div>
                <b>{employee.name}</b>
                <span>{employee.role}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="workspace">
          {offline ? (
            <div className="offline-banner">
              <div className="ob-left">
                <Icon name="i-warn" />
                离线收银中
                <span>本地已缓存价格与优惠券，联网后自动补传；仅支持现金收款。</span>
              </div>
              <div className="ob-right">
                待补传 <b>{queued}</b> 笔 · 已启用
              </div>
            </div>
          ) : null}

          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <ModalHost />
    </div>
  )
}
