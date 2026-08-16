import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Login from '../pages/Login'
import Register from '../pages/Register'
import RateJobModal from '../components/RateJobModal'

describe('form blocking UX', () => {
  it('keeps the login button disabled until the form is valid', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    const loginButton = screen.getByRole('button', { name: /login/i })
    expect(loginButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '9876543210' } })
    fireEvent.change(screen.getAllByLabelText(/password/i)[0], { target: { value: 'secret123' } })

    expect(loginButton).not.toBeDisabled()
  })

  it('keeps the register button disabled until all required fields are filled', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )

    const registerButton = screen.getByRole('button', { name: /register/i })
    expect(registerButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Veera' } })
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '9876543210' } })
    fireEvent.change(screen.getAllByLabelText(/password/i)[0], { target: { value: 'secret123' } })
    fireEvent.change(screen.getAllByLabelText(/password/i)[1], { target: { value: 'secret123' } })
    fireEvent.change(screen.getByLabelText(/village/i), { target: { value: 'Marripalem' } })

    expect(registerButton).not.toBeDisabled()
  })

  it('keeps the rating submit button disabled until a star is chosen', () => {
    render(
      <RateJobModal
        job={{ id: 1, title: 'Weeding work' }}
        rateeId={12}
        rateeName="Ramu"
        onClose={() => {}}
        onSuccess={() => {}}
      />
    )

    const submitButton = screen.getByRole('button', { name: /submit rating/i })
    expect(submitButton).toBeDisabled()

    fireEvent.click(screen.getAllByRole('button', { name: '★' })[0])

    expect(submitButton).not.toBeDisabled()
  })
})
