import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import StoreLayout from '@/layouts/StoreLayout'
import LoginPage from '@/pages/LoginPage'
import { useAppStore } from '@/store/useAppStore'

/**
 * 业务页按路由懒加载：
 * 登录页首屏必须同步加载（否则白屏绕一圈），其余六页拆成独立 chunk，
 * 首屏只加载当前页，避免把 antd 全量算进首包。
 */
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const PosPage = lazy(() => import('@/pages/PosPage'))
const ExpiryPage = lazy(() => import('@/pages/ExpiryPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const InventoryPage = lazy(() => import('@/pages/InventoryPage'))
const MembersPage = lazy(() => import('@/pages/MembersPage'))

function RequireAuth({ children }: { children: ReactNode }) {
  const loggedIn = useAppStore((s) => s.loggedIn)
  if (!loggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <StoreLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="expiry" element={<ExpiryPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="members" element={<MembersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  )
}
