import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import axios from 'axios'
import Navbar from './components/Navbar'
import Spinner from './components/Spinner'
import { ProtectedRoute, ManagerRoute } from './components/ProtectedRoute'
import { useAuthStore } from './store/auth'

import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import HotelDetails from './pages/HotelDetails'
import BookingGuests from './pages/BookingGuests'
import PaymentResult from './pages/PaymentResult'
import MyBookings from './pages/MyBookings'
import Profile from './pages/Profile'

import AdminLayout from './pages/admin/AdminLayout'
import AdminHotels from './pages/admin/AdminHotels'
import HotelForm from './pages/admin/HotelForm'
import AdminRooms from './pages/admin/AdminRooms'
import RoomForm from './pages/admin/RoomForm'
import AdminInventory from './pages/admin/AdminInventory'
import AdminBookings from './pages/admin/AdminBookings'
import AdminReports from './pages/admin/AdminReports'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

export default function App() {
  const [hydrating, setHydrating] = useState(true)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)

  // On first load, try a silent refresh using the httpOnly refresh cookie
  // (set by /auth/login). This keeps the user signed in across page reloads
  // even though the access token itself only lives in memory.
  useEffect(() => {
    axios
      .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => setAccessToken(res.data?.data?.accessToken))
      .catch(() => {})
      .finally(() => setHydrating(false))
  }, [])

  if (hydrating) return <Spinner label="Waking up HostHub" />

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/hotels/:hotelId" element={<HotelDetails />} />
          <Route path="/payments/success" element={<PaymentResult status="success" />} />
          <Route path="/payments/failure" element={<PaymentResult status="failure" />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/bookings/:bookingId/guests" element={<BookingGuests />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<ManagerRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHotels />} />
              <Route path="hotels/new" element={<HotelForm />} />
              <Route path="hotels/:hotelId/edit" element={<HotelForm />} />
              <Route path="hotels/:hotelId/rooms" element={<AdminRooms />} />
              <Route path="hotels/:hotelId/rooms/new" element={<RoomForm />} />
              <Route path="hotels/:hotelId/rooms/:roomId/edit" element={<RoomForm />} />
              <Route path="hotels/:hotelId/bookings" element={<AdminBookings />} />
              <Route path="hotels/:hotelId/reports" element={<AdminReports />} />
              <Route path="inventory/:roomId" element={<AdminInventory />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <footer className="border-t border-brass/10 py-6 text-center text-xs text-muted">
        HostHub — a boutique booking engine.
      </footer>
    </div>
  )
}

function NotFound() {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <h1 className="font-display text-4xl text-ivory mb-3">404</h1>
      <p className="text-muted">This page hasn't been built yet.</p>
    </div>
  )
}
