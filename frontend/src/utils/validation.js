import { MESSAGES } from './errorMessages'

const getPreferredLanguage = () => {
  if (typeof window === 'undefined') return 'en'
  return localStorage.getItem('language') || 'en'
}

const resolveMessage = (messageObj, fallback = null) => {
  if (!messageObj) return fallback
  if (typeof messageObj === 'string') return messageObj

  if (typeof messageObj === 'object') {
    const lang = getPreferredLanguage()
    return messageObj[lang] || messageObj.en || messageObj.te || fallback
  }

  return fallback
}

const toMessage = (messageObj) => resolveMessage(messageObj, null)

export const mapBackendDetailsToMessages = (details = {}) => {
  if (!details || typeof details !== 'object') return {}

  const output = {}
  const map = {
    phone: 'phone',
    password: 'password',
    confirmPassword: 'confirmPassword',
    name: 'name',
    village: 'village',
    skills: 'skills',
    dailyWageExpected: 'wage',
    wage: 'wage',
    wagePerDay: 'wage',
    workersNeeded: 'workersNeeded',
    title: 'title',
    workDate: 'workDate',
    location: 'location',
    description: 'description',
    newPassword: 'password',
    token: 'resetTokenMissing',
  }

  Object.entries(details).forEach(([key, value]) => {
    const normalizedKey = map[key] || key

    if (normalizedKey === 'phone') {
      output.phone = typeof value === 'string' && /phone/i.test(value) ? MESSAGES.phone.empty.en : MESSAGES.phone.invalid.en
      return
    }

    if (normalizedKey === 'password') {
      output.password = typeof value === 'string' && /password/i.test(value)
        ? MESSAGES.password.empty.en
        : MESSAGES.password.short.en
      return
    }

    if (normalizedKey === 'confirmPassword') {
      output.confirmPassword = MESSAGES.confirmPassword.mismatch.en
      return
    }

    if (normalizedKey === 'name') {
      output.name = MESSAGES.name.empty.en
      return
    }

    if (normalizedKey === 'village') {
      output.village = MESSAGES.village.empty.en
      return
    }

    if (normalizedKey === 'skills') {
      output.skills = MESSAGES.skills.empty.en
      return
    }

    if (normalizedKey === 'wage') {
      output.wagePerDay = MESSAGES.wage.low.en
      output.dailyWageExpected = MESSAGES.wage.low.en
      return
    }

    if (normalizedKey === 'workersNeeded') {
      output.workersNeeded = MESSAGES.workersNeeded.low.en
      return
    }

    if (normalizedKey === 'title') {
      output.title = MESSAGES.title.empty.en
      return
    }

    if (normalizedKey === 'workDate') {
      output.workDate = MESSAGES.workDate.empty.en
      return
    }

    if (normalizedKey === 'location') {
      output.location = MESSAGES.location.empty.en
      return
    }

    if (normalizedKey === 'description') {
      output.description = MESSAGES.description.tooLong.en
      return
    }

    if (normalizedKey === 'resetTokenMissing') {
      output.token = MESSAGES.resetTokenMissing.en
      return
    }

    if (typeof value === 'string') {
      output[key] = value
    }
  })

  return output
}

export const validatePhone = (value) => {
  const normalized = String(value || '').replace(/\D/g, '')
  if (!normalized) return toMessage(MESSAGES.phone.empty)
  if (!/^[6-9]\d{9}$/.test(normalized)) return toMessage(MESSAGES.phone.invalid)
  return null
}

export const validatePassword = (value, minLength = 6) => {
  const text = String(value || '').trim()
  if (!text) return toMessage(MESSAGES.password.empty)
  if (text.length < minLength) return toMessage(MESSAGES.password.short)
  return null
}

export const validateConfirmPassword = (password, confirm) => {
  if (!confirm || !String(confirm).trim()) return toMessage(MESSAGES.confirmPassword.empty)
  if (String(password) !== String(confirm)) return toMessage(MESSAGES.confirmPassword.mismatch)
  return null
}

export const validateRequired = (value, messageObj) => {
  const text = typeof value === 'string' ? value.trim() : value
  if (text === null || text === undefined || text === '' || (Array.isArray(text) && text.length === 0)) {
    return toMessage(messageObj)
  }
  return null
}

export const validateWage = (value, min = 100) => {
  const numeric = Number(value)
  if (value === '' || value === null || value === undefined) return toMessage(MESSAGES.wage.empty)
  if (Number.isNaN(numeric) || numeric < min) return toMessage(MESSAGES.wage.low)
  return null
}

export const validateWorkersNeeded = (value) => {
  const numeric = Number(value)
  if (value === '' || value === null || value === undefined) return toMessage(MESSAGES.workersNeeded.empty)
  if (!Number.isFinite(numeric) || numeric < 1) return toMessage(MESSAGES.workersNeeded.low)
  return null
}

export const validateWorkDate = (value) => {
  if (!value) return toMessage(MESSAGES.workDate.empty)
  const selected = new Date(`${value}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (selected < today) return toMessage(MESSAGES.workDate.past)
  return null
}

export const validateSkills = (skills = []) => {
  if (!Array.isArray(skills) || skills.length === 0) return toMessage(MESSAGES.skills.empty)
  return null
}

export const validateJobForm = (formState = {}, locationStatus = 'idle') => {
  const errors = {}

  const titleError = validateRequired(formState.title, MESSAGES.title.empty)
  if (titleError) errors.title = titleError

  const villageError = validateRequired(formState.village, MESSAGES.village.empty)
  if (villageError) errors.village = villageError

  const workDateError = validateWorkDate(formState.workDate)
  if (workDateError) errors.workDate = workDateError

  const wageError = validateWage(formState.wagePerDay, 100)
  if (wageError) errors.wagePerDay = wageError

  const workerError = validateWorkersNeeded(formState.workersNeeded)
  if (workerError) errors.workersNeeded = workerError

  if (locationStatus !== 'ready') {
    errors.location = toMessage(MESSAGES.location.empty)
  }

  if (formState.description && formState.description.length > 300) {
    errors.description = toMessage(MESSAGES.description.tooLong)
  }

  return errors
}

export const validateLoginForm = (formState = {}) => {
  const errors = {}

  const phoneError = validatePhone(formState.phone)
  if (phoneError) errors.phone = phoneError

  const passwordError = validatePassword(formState.password)
  if (passwordError) errors.password = passwordError

  return errors
}

export const validateRegisterForm = (formState = {}) => {
  const errors = {}

  const nameError = validateRequired(formState.name, MESSAGES.name.empty)
  if (nameError) errors.name = nameError

  const phoneError = validatePhone(formState.phone)
  if (phoneError) errors.phone = phoneError

  const passwordError = validatePassword(formState.password)
  if (passwordError) errors.password = passwordError

  if (formState.role === 'FARMER') {
    const villageError = validateRequired(formState.village, MESSAGES.village.empty)
    if (villageError) errors.village = villageError
  }

  if (formState.role === 'LABOURER') {
    const skillError = validateSkills(formState.skills)
    if (skillError) errors.skills = skillError

    if (formState.dailyWageExpected !== undefined && formState.dailyWageExpected !== '') {
      const wageError = validateWage(formState.dailyWageExpected, 100)
      if (wageError) errors.dailyWageExpected = wageError
    }
  }

  if (formState.confirmPassword !== undefined) {
    const confirmPasswordError = validateConfirmPassword(formState.password, formState.confirmPassword)
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError
  }

  return errors
}

export const validateResetPasswordForm = (formState = {}) => {
  const errors = {}

  if (!formState.token) errors.token = toMessage(MESSAGES.resetTokenMissing)

  const passwordError = validatePassword(formState.newPassword)
  if (passwordError) errors.newPassword = passwordError

  const confirmError = validateConfirmPassword(formState.newPassword, formState.confirmPassword)
  if (confirmError) errors.confirmPassword = confirmError

  return errors
}

export const validateProfileForm = (formState = {}, role) => {
  const errors = {}

  const nameError = validateRequired(formState.name, MESSAGES.name.empty)
  if (nameError) errors.name = nameError

  if (role === 'FARMER') {
    const villageError = validateRequired(formState.village, MESSAGES.village.empty)
    if (villageError) errors.village = villageError
  }

  if (role === 'LABOURER') {
    const skillError = validateSkills(formState.skills)
    if (skillError) errors.skills = skillError

    if (formState.dailyWageExpected !== undefined && formState.dailyWageExpected !== '') {
      const wageError = validateWage(formState.dailyWageExpected, 100)
      if (wageError) errors.dailyWageExpected = wageError
    }
  }

  return errors
}
