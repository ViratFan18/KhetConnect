export function getVisibleNotifications(notifications = []) {
  return [...notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
}
