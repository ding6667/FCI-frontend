import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import StoreLayout from '@/layouts/StoreLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import PosPage from '@/pages/PosPage'
import ExpiryPage from '@/pages/ExpiryPage'
import OrdersPage from '@/pages/OrdersPage'
import InventoryPage from '@/pages/InventoryPage'
import MembersPage from '@/pages/MembersPage'
import { useAppStore } from '@/store/useAppStore'

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
