export type XKind = 'number' | 'datetime'

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
