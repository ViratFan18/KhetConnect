import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import JobCard from './JobCard'
import useAuthStore from '../store/authStore'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}))

beforeEach(() => {
  useAuthStore.setState({ user: { role: 'LABOURER' } })
})

describe('JobCard', () => {
  it('calls the quick apply mutation and shows the applied state', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ data: { ok: true } })

    render(
      <MemoryRouter>
        <JobCard
          job={{
            id: 1,
            title: 'Rice Harvest',
            workType: 'HARVESTING',
            status: 'OPEN',
            wagePerDay: 500,
            workDate: '2026-08-20',
            village: 'Madhapur',
            farmerName: 'Ramu',
            farmerRating: 4.5,
            acceptedCount: 0,
            pendingCount: 1,
            myApplicationStatus: null,
          }}
          onApplyMutation={{ mutateAsync }}
        />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Quick Apply/i }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ jobId: 1 }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Applied/i })).toBeDisabled())
  })

  it('handles quick apply rejection without crashing', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Nope'))

    render(
      <MemoryRouter>
        <JobCard
          job={{
            id: 2,
            title: 'Planting',
            workType: 'PLANTING',
            status: 'OPEN',
            wagePerDay: 450,
            workDate: '2026-08-22',
            village: 'Kondapur',
            farmerName: 'Sita',
            farmerRating: 0,
            acceptedCount: 0,
            pendingCount: 0,
            myApplicationStatus: null,
          }}
          onApplyMutation={{ mutateAsync }}
        />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Quick Apply/i }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByRole('button', { name: /Applied/i })).toBeDisabled())
  })

  it('avoids nested buttons inside the card shell', () => {
    const { container } = render(
      <MemoryRouter>
        <JobCard
          job={{
            id: 3,
            title: 'Harvesting',
            workType: 'HARVESTING',
            status: 'COMPLETED',
            wagePerDay: 500,
            workDate: '2026-08-15',
            village: 'Guntur',
            farmerName: 'Virat',
            farmerRating: 5,
            acceptedCount: 1,
            pendingCount: 0,
            myApplicationStatus: null,
          }}
        />
      </MemoryRouter>
    )

    expect(container.querySelector('button button')).toBeNull()
  })
})
