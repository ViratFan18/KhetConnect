import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({ children, role }) {
  const { token, user } = useAuthStore()
  const location = useLocation()

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, prompt: 'loginRequired' }}
      />
    )
  }

  if (role && user?.role !== role) {
    const redirect = user?.role === 'FARMER' ? '/farmer' : '/labourer'
    return (
      <Navigate
        to={redirect}
        replace
        state={{ prompt: 'roleMismatch', attemptedPath: location.pathname }}
      />
    )
  }

  return children
}
