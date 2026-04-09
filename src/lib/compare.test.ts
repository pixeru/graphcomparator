import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compareSeries } from './compare'
import { parseCsvSeries } from './csv'

describe('compareSeries', () => {
  it('interpolates shifted x positions across the shared grid', () => {
    const left = parseCsvSeries(`x,y
0,0
10,10`, 'left.csv')
    const right = parseCsvSeries(`x,y
0,0
5,5
10,10`, 'right.csv')

    const result = compareSeries(left, right)

    expect(result.pointCount).toBe(3)
    expect(result.closenessScore).toBe(100)
    expect(result.rmse).toBe(0)
  })

  it('scores identical series at 100', () => {
    const series = parseCsvSeries(`x,y
0,3
4,8
8,11`, 'same.csv')

    const result = compareSeries(series, series)

    expect(result.closenessScore).toBe(100)
    expect(result.label).toBe('Very close')
  })

  it('rejects mixed x types', () => {
    const numeric = parseCsvSeries(`x,y
0,1
1,2`, 'numeric.csv')
    const datetime = parseCsvSeries(`x,y
2026-01-01T00:00:00Z,1
2026-01-02T00:00:00Z,2`, 'datetime.csv')

    expect(() => compareSeries(numeric, datetime)).toThrow(/same x-value format/i)
  })

  it('handles the zero-range flat-line edge case', () => {
    const left = parseCsvSeries(`x,y
0,5
2,5
4,5`, 'flat-left.csv')
    const right = parseCsvSeries(`x,y
0,5
2,5
4,5`, 'flat-right.csv')

    const result = compareSeries(left, right)

    expect(result.rmse).toBe(0)
    expect(result.closenessScore).toBe(100)
  })

  it('ranks bundled samples from close to far', () => {
    const closeScore = scoreSamplePair('close_pair')
    const mediumScore = scoreSamplePair('medium_pair')
    const farScore = scoreSamplePair('far_pair')

    expect(closeScore).toBeGreaterThan(mediumScore)
    expect(mediumScore).toBeGreaterThan(farScore)
  })

  it('keeps the calibrated 91-score sample inside the requested range', () => {
    const score = scoreSamplePair('target_91_pair')

    expect(score).toBeGreaterThanOrEqual(90)
    expect(score).toBeLessThanOrEqual(92)
  })
})

function scoreSamplePair(
  pairName: 'close_pair' | 'target_91_pair' | 'medium_pair' | 'far_pair',
) {
  const left = readFileSync(
    join(process.cwd(), 'public', 'samples', `${pairName}_a.csv`),
    'utf8',
  )
  const right = readFileSync(
    join(process.cwd(), 'public', 'samples', `${pairName}_b.csv`),
    'utf8',
  )

  return compareSeries(
    parseCsvSeries(left, `${pairName}_a.csv`),
    parseCsvSeries(right, `${pairName}_b.csv`),
  ).closenessScore
}
