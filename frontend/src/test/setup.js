import '@testing-library/jest-dom/vitest'
import '../i18n'
import i18n from '../i18n'

i18n.changeLanguage('en')

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
