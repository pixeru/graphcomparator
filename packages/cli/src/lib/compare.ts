import type {
  ComparedPoint,
  ComparisonResult,
  ParsedSeries,
  SeriesPoint,
} from '../types'

export function compareSeries(
  seriesA: ParsedSeries,
  seriesB: ParsedSeries,
): ComparisonResult {
  if (seriesA.xKind !== seriesB.xKind) {
    throw new Error('Both CSV files must use the same x-value format.')
  }

  const overlapStart = Math.max(seriesA.points[0].x, seriesB.points[0].x)
  const overlapEnd = Math.min(
    seriesA.points[seriesA.points.length - 1].x,
    seriesB.points[seriesB.points.length - 1].x,
  )

  if (overlapStart > overlapEnd) {
    throw new Error('The two CSV files do not overlap on the x-axis.')
  }

  const grid = buildComparisonGrid(
    seriesA.points,
    seriesB.points,
    overlapStart,
    overlapEnd,
  )

  const comparedPoints = grid
    .map((xValue) => {
      const yA = interpolateY(seriesA.points, xValue)
      const yB = interpolateY(seriesB.points, xValue)

      if (yA === null || yB === null) {
        return null
      }

      return {
        x: xValue,
        seriesA: yA,
        seriesB: yB,
        diff: yA - yB,
      } satisfies ComparedPoint
    })
    .filter((point): point is ComparedPoint => point !== null)

  if (comparedPoints.length === 0) {
    throw new Error('The shared x-range did not produce any comparable points.')
  }

  const absoluteDiffs = comparedPoints.map((point) => Math.abs(point.diff))
  const squaredDiffs = comparedPoints.map((point) => point.diff ** 2)
  const mae = average(absoluteDiffs)
  const rmse = Math.sqrt(average(squaredDiffs))

  const allYValues = comparedPoints.flatMap((point) => [point.seriesA, point.seriesB])
  const yMin = Math.min(...allYValues)
  const yMax = Math.max(...allYValues)
  const yRange = yMax - yMin

  const closenessScore =
    yRange === 0
      ? comparedPoints.every((point) => point.diff === 0)
        ? 100
        : 0
      : Math.max(0, 100 * (1 - rmse / yRange))

  return {
    closenessScore,
    rmse,
    mae,
    overlapStart,
    overlapEnd,
    pointCount: comparedPoints.length,
    label: scoreToLabel(closenessScore),
    yMin,
    yMax,
    comparedPoints,
  }
}

export function interpolateY(points: SeriesPoint[], xValue: number) {
  if (points.length === 0) {
    return null
  }

  if (xValue < points[0].x || xValue > points[points.length - 1].x) {
    return null
  }

  let low = 0
  let high = points.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const point = points[mid]

    if (point.x === xValue) {
      return point.y
    }

    if (point.x < xValue) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  const rightPoint = points[low]
  const leftPoint = points[high]

  if (!leftPoint || !rightPoint) {
    return null
  }

  const progress = (xValue - leftPoint.x) / (rightPoint.x - leftPoint.x)
  return leftPoint.y + (rightPoint.y - leftPoint.y) * progress
}

function buildComparisonGrid(
  pointsA: SeriesPoint[],
  pointsB: SeriesPoint[],
  overlapStart: number,
  overlapEnd: number,
) {
  const combined = [...pointsA, ...pointsB]
    .map((point) => point.x)
    .filter((xValue) => xValue >= overlapStart && xValue <= overlapEnd)

  combined.push(overlapStart, overlapEnd)

  return [...new Set(combined)].sort((left, right) => left - right)
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length
}

function scoreToLabel(score: number) {
  if (score >= 80) {
    return 'Very close'
  }

  if (score >= 55) {
    return 'Moderately close'
  }

  return 'Far apart'
}
