'use client'

import { useEffect, useState } from 'react'

export type GeolocationError =
  | 'UNSUPPORTED'
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'

interface GeolocationCoords {
  lat: number
  lng: number
}

export interface GeolocationState {
  coords: GeolocationCoords | null
  loading: boolean
  error: GeolocationError | null
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 10_000,
  timeout: 15_000,
}

function mapGeolocationError(code: number): GeolocationError {
  switch (code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return 'PERMISSION_DENIED'
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return 'POSITION_UNAVAILABLE'
    case GeolocationPositionError.TIMEOUT:
      return 'TIMEOUT'
    default:
      return 'POSITION_UNAVAILABLE'
  }
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ coords: null, loading: false, error: 'UNSUPPORTED' })
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          loading: false,
          error: null,
        })
      },
      (err) => {
        setState({
          coords: null,
          loading: false,
          error: mapGeolocationError(err.code),
        })
      },
      GEOLOCATION_OPTIONS,
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return state
}
