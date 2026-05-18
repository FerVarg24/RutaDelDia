export type StopStatus = 'PENDING' | 'COMPLETED' | 'INCIDENT' | 'SKIPPED'

export interface IncidentData {
  id: string
  description: string
  createdAt: string
}

export interface StopData {
  id: string
  order: number
  name: string
  address: string
  lat: number
  lng: number
  status: StopStatus
  notes: string | null
  photoUrl: string | null
  checkedInAt: string | null
  createdAt: string
  updatedAt: string
  incident: IncidentData | null
}

export interface RouteData {
  id: string
  date: string
  techId: string
  createdAt: string
  stops: StopData[]
}
