import { describe, expect, it } from 'vitest'
import { parseCsvSeries } from './csv'

describe('parseCsvSeries', () => {
  it('parses and sorts numeric rows', () => {
    const parsed = parseCsvSeries(`x,y
2,20
0,10
1,15`, 'numeric.csv')

    expect(parsed.xKind).toBe('number')
    expect(parsed.points).toEqual([
      { x: 0, y: 10 },
      { x: 1, y: 15 },
      { x: 2, y: 20 },
    ])
  })

  it('parses datetime rows', () => {
    const parsed = parseCsvSeries(`x,y
2026-01-01T00:00:00Z,4
2026-01-02T00:00:00Z,9`, 'dates.csv')

    expect(parsed.xKind).toBe('datetime')
    expect(parsed.points[0].x).toBe(Date.parse('2026-01-01T00:00:00Z'))
    expect(parsed.points[1].x).toBe(Date.parse('2026-01-02T00:00:00Z'))
  })

  it('rejects missing headers', () => {
    expect(() => parseCsvSeries(`time,value
0,1`, 'bad-header.csv')).toThrow(/x,y header/i)
  })

  it('rejects duplicate x values after sorting', () => {
    expect(() => parseCsvSeries(`x,y
1,1
0,0
1,2`, 'duplicates.csv')).toThrow(/duplicate x value/i)
  })

  it('rejects extra columns', () => {
    expect(() => parseCsvSeries(`x,y
0,1,2`, 'extra.csv')).toThrow(/exactly two columns/i)
  })
})
