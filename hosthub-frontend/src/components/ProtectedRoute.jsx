import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export function ProtectedRoute() {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}

export function ManagerRoute() {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!user.isHotelManager) return <Navigate to="/" replace />
  return <Outlet />
}
