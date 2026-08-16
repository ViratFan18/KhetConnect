import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({ children, role }) {
  const { token, user } = useAuthStore()
  const location = useLocation()

  // No token - redirect to login
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ 
          from: location.pathname,
          prompt: 'loginRequired',
          returnUrl: location.pathname,
        }}
      />
    )
  }

  // Token exists but role doesn't match
  if (role && user?.role !== role) {
    const redirect = user?.role === 'FARMER' ? '/farmer' : '/labourer'
    return (
      <Navigate
        to={redirect}
        replace
        state={{ 
          prompt: 'roleMismatch',
          attemptedPath: location.pathname,
          userRole: user?.role,
          requiredRole: role,
        }}
      />
    )
  }

  // All checks passed - render children
  return children
}
