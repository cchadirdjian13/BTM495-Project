import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import ClientDashboard from './pages/ClientDashboard'
import BarberDashboard from './pages/BarberDashboard'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return null // Or a stylish loader

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Landing />} />
      </Routes>
    )
  }

  // Common Layout with Navbar
  return (
    <>
      <Navbar />
      <div className="dashboard-layout" style={{ display: 'block' }}>
        {user.role === 'barber' ? (
          <Routes>
            <Route path="/" element={<BarberDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<ClientDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
