export function validatePhone(value) {
  const normalized = value?.trim() || ''
  if (!normalized) return 'Phone number is required.'
  if (!/^[6-9]\d{9}$/.test(normalized)) return 'Enter a valid 10-digit mobile number.'
  return ''
}

export function validatePassword(value) {
  const normalized = value || ''
  if (!normalized.trim()) return 'Password is required.'
  if (normalized.length < 6) return 'Password must be at least 6 characters.'
  return ''
}

export function validateName(value) {
  const normalized = value?.trim() || ''
  if (!normalized) return 'Name is required.'
  if (normalized.length < 2) return 'Name should be at least 2 characters.'
  return ''
}

export function validateRequired(value, label) {
  const normalized = value?.toString().trim() || ''
  if (!normalized) return `${label} is required.`
  return ''
}
