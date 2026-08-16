import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

describe('Login experience', () => {
  it('offers password reset recovery and uses password-first auth', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /forgot password\?/i })).toBeInTheDocument()
  })
})
