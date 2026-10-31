export type Dive = {
  id: number
  siteId: string
  date: string
  depth: number
  duration: number
  temperature: number
  gas: string
  cylinder: number
  startPressure: number
  endPressure: number
  visibility?: number
  notes?: string
}

export type DiveSite = {
  id: string
  name: string
  coordinates: [number, number]
}
