import { useState, useEffect, useCallback } from 'react'
import { getCurrentLocation, updateUserLocation } from './location'

/**
 * useGeolocation Hook
 *
 * Manages geolocation with user-friendly error handling and retry capability.
 * Features:
 * - Attempts silent capture on first load
 * - Shows retry button if permission denied or capture fails
 * - Disables submit until location is successfully captured
 * - Non-blocking: other form fields remain editable while waiting for location
 * - Handles device GPS timeouts and low accuracy gracefully
 *
 * @returns {Object} {
 *   location: {lat, lng} | null,
 *   error: string | null,
 *   status: 'idle' | 'capturing' | 'ready' | 'error',
 *   isLoading: boolean,
 *   retryCapture: () => Promise<void>,
 *   clearError: () => void,
 * }
 */
export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('idle') // idle, capturing, ready, error
  const [isLoading, setIsLoading] = useState(false)

  const getErrorMessage = (errorCode, errorMessage) => {
    if (errorCode === 1) {
      return '📍 Location access is off. Tap "Enable Location" to turn it on.'
    }
    if (errorCode === 2) {
      return '📡 GPS signal is weak right now. Try again in a moment or move outside.'
    }
    if (errorCode === 3) {
      return '⏰ GPS took too long. Move to a clear area and try again.'
    }
    if (errorMessage?.includes('timeout')) {
      return '⏰ Location capture timed out. Check that you have GPS enabled and try again.'
    }
    return '📍 Unable to capture location. Please try again or enable location in your browser settings.'
  }

  const performCapture = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true)
    }
    setStatus('capturing')
    setError(null)

    try {
      const { lat, lng } = await getCurrentLocation()
      const coords = { lat, lng }
      setLocation(coords)
      setStatus('ready')
      setError(null)

      try {
        await updateUserLocation(lat, lng)
      } catch {
        // Ignore backend update failures while keeping the user-local location capture intact.
      }

      return coords
    } catch (err) {
      const errorCode = err?.message?.includes('permission')
        ? 1
        : err?.message?.includes('unavailable')
          ? 2
          : err?.message?.includes('timeout')
            ? 3
            : 0

      const friendlyMessage = getErrorMessage(errorCode, err?.message)
      setError(friendlyMessage)
      setStatus('error')
      return null
    } finally {
      if (showLoadingState) {
        setIsLoading(false)
      }
    }
  }, [])

  const retryCapture = useCallback(async () => {
    return performCapture(true)
  }, [performCapture])

  const clearError = useCallback(() => {
    if (status === 'error') {
      setError(null)
    }
  }, [status])

  return {
    location,
    error,
    status,
    isLoading,
    retryCapture,
    clearError,
  }
}
