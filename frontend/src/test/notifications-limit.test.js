import { describe, expect, it } from 'vitest'
import { getVisibleNotifications } from '../utils/notifications'

describe('notification visibility', () => {
  it('keeps only the 5 most recent notifications', () => {
    const notifications = Array.from({ length: 7 }, (_, index) => ({
      id: index + 1,
      title: `Notification ${index + 1}`,
      body: 'Body',
      read: false,
      createdAt: new Date(Date.now() - (6 - index) * 60_000).toISOString(),
    }))

    const visible = getVisibleNotifications(notifications)

    expect(visible).toHaveLength(5)
    expect(visible.map((n) => n.id)).toEqual([7, 6, 5, 4, 3])
  })
})
