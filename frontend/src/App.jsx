import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'
import ErrorPage from './components/ErrorPage'
import ProtectedRoute from './components/ProtectedRoute'
import useAuthStore from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import FarmerDashboard from './pages/FarmerDashboard'
import LabourDashboard from './pages/LabourDashboard'
import PostJob from './pages/PostJob'
import Bookings from './pages/Bookings'
import NearbyJobs from './pages/NearbyJobs'
import JobDetail from './pages/JobDetail'
import MyJobs from './pages/MyJobs'
import FarmerHistory, { LabourHistoryPage } from './pages/History'
import Profile from './pages/Profile'
import NotificationsPage from './pages/NotificationsPage'
import ServerError from './pages/ServerError'
import Unauthorized from './pages/Unauthorized'

function HistoryRouter() {
  const { user } = useAuthStore()
  return user?.role === 'FARMER' ? <FarmerHistory /> : <LabourHistoryPage />
}

function HomeRedirect() {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'FARMER' ? '/farmer' : '/labourer'} replace />
}

function ErrorBoundaryWithLocation({ children }) {
  const location = useLocation()
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>
}

export default function App() {
  const { t } = useTranslation()

  return (
    <BrowserRouter>
      <ErrorBoundaryWithLocation>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/farmer" element={<ProtectedRoute role="FARMER"><FarmerDashboard /></ProtectedRoute>} />
          <Route path="/labourer" element={<ProtectedRoute role="LABOURER"><LabourDashboard /></ProtectedRoute>} />
          <Route path="/post-job" element={<ProtectedRoute role="FARMER"><PostJob /></ProtectedRoute>} />
          
          <Route path="/my-jobs" element={<ProtectedRoute role="FARMER"><MyJobs /></ProtectedRoute>} />
          <Route path="/nearby-jobs" element={<ProtectedRoute role="LABOURER"><NearbyJobs /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryRouter /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/error" element={<ServerError />} />
          <Route
            path="*"
            element={
              <ErrorPage
                title={t('notFoundTitle')}
                message={t('notFoundMessage')}
                buttonText={t('goHome')}
                link="/"
              />
            }
          />
        </Routes>
      </ErrorBoundaryWithLocation>
    </BrowserRouter>
  )
}
