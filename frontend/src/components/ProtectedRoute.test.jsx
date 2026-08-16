import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import useAuthStore from '../store/authStore'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}))

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null })
})

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/protected" element={<ProtectedRoute><div>Secret page</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects to farmer dashboard when a labourer hits a farmer route', () => {
    useAuthStore.setState({ token: 'abc', user: { role: 'LABOURER' } })

    render(
      <MemoryRouter initialEntries={['/farmer']}>
        <Routes>
          <Route path="/farmer" element={<ProtectedRoute role="FARMER"><div>Farmer page</div></ProtectedRoute>} />
          <Route path="/labourer" element={<div>Labourer page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Labourer page')).toBeInTheDocument()
  })
})
