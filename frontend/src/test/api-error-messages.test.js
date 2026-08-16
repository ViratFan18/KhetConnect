import { describe, expect, it } from 'vitest'
import { normalizeRequestError } from '../services/api'

describe('api error messages', () => {
  it('uses a short sign-in message for expired sessions', () => {
    const result = normalizeRequestError({
      response: {
        status: 401,
        data: { message: 'JWT expired' },
      },
    })

    expect(result.message.toLowerCase()).toContain('sign in')
  })

  it('maps field details to plain language messages', () => {
    const result = normalizeRequestError({
      response: {
        status: 400,
        data: {
          details: {
            phone: 'Phone number must be 10 digits',
          },
        },
      },
    })

    expect(result.message.toLowerCase()).toMatch(/phone|10|numbers/)
  })
})
