export type XKind = 'number' | 'datetime'

export type SlotKey = 'left' | 'right'

export interface SeriesPoint {
  x: number
  y: number
}

export interface ParsedSeries {
  name: string
  xKind: XKind
  points: SeriesPoint[]
}

export interface ComparedPoint {
  x: number
  seriesA: number
  seriesB: number
  diff: number
}

export interface ComparisonResult {
  closenessScore: number
  rmse: number
  mae: number
  overlapStart: number
  overlapEnd: number
  pointCount: number
  label: string
  yMin: number
  yMax: number
  comparedPoints: ComparedPoint[]
}

export interface LoadedSeries {
  label: string
  origin: 'upload' | 'sample'
  sampleId?: string
  series: ParsedSeries
}
