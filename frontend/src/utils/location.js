import api from '../services/api'

export async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (error) => {
        const message = error.code === 1
          ? 'Location permission was denied. Please allow location access in your browser settings and try again.'
          : error.code === 2
            ? 'Location is temporarily unavailable. Please try again in a moment.'
            : 'Location could not be captured right now. Please try again.'
        reject(new Error(message))
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    )
  })
}

export async function updateUserLocation(lat, lng) {
  await api.put('/auth/location', { latitude: lat, longitude: lng })
}

export function workTypeLabel(t, type) {
  return t(type?.toLowerCase() || 'other')
}
