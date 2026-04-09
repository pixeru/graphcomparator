import type { ParsedSeries, SeriesPoint, XKind } from '../types'

export function parseCsvSeries(csvText: string, name = 'Series'): ParsedSeries {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)

  if (lines.length < 2) {
    throw new Error(`${name} must include a header row and at least one data row.`)
  }

  const header = parseCsvRow(lines[0]).map((value) => value.trim().toLowerCase())

  if (header.length !== 2 || header[0] !== 'x' || header[1] !== 'y') {
    throw new Error(`${name} must start with an x,y header.`)
  }

  let detectedKind: XKind | null = null
  const points: SeriesPoint[] = []

  for (let index = 1; index < lines.length; index += 1) {
    const row = parseCsvRow(lines[index])

    if (row.length !== 2) {
      throw new Error(
        `${name} row ${index + 1} must contain exactly two columns.`,
      )
    }

    const xCell = row[0].trim()
    const yCell = row[1].trim()

    if (!xCell || !yCell) {
      throw new Error(`${name} row ${index + 1} is missing an x or y value.`)
    }

    const parsedX = parseXValue(xCell, detectedKind)
    detectedKind ??= parsedX.kind

    const yValue = Number(yCell)

    if (!Number.isFinite(yValue)) {
      throw new Error(`${name} row ${index + 1} has a non-numeric y value.`)
    }

    points.push({
      x: parsedX.value,
      y: yValue,
    })
  }

  if (!detectedKind) {
    throw new Error(`${name} does not contain any comparable data rows.`)
  }

  points.sort((left, right) => left.x - right.x)

  for (let index = 1; index < points.length; index += 1) {
    if (points[index].x === points[index - 1].x) {
      throw new Error(`${name} contains a duplicate x value after sorting.`)
    }
  }

  return {
    name,
    xKind: detectedKind,
    points,
  }
}

function parseXValue(rawValue: string, forcedKind: XKind | null) {
  if (forcedKind === 'number') {
    return {
      kind: 'number' as const,
      value: requireFiniteNumber(rawValue),
    }
  }

  if (forcedKind === 'datetime') {
    return {
      kind: 'datetime' as const,
      value: requireFiniteDate(rawValue),
    }
  }

  const numericValue = Number(rawValue)

  if (Number.isFinite(numericValue)) {
    return {
      kind: 'number' as const,
      value: numericValue,
    }
  }

  const dateValue = Date.parse(rawValue)

  if (!Number.isNaN(dateValue)) {
    return {
      kind: 'datetime' as const,
      value: dateValue,
    }
  }

  throw new Error(
    `Unable to parse x value "${rawValue}". Use numeric values or ISO-like datetimes.`,
  )
}

function requireFiniteNumber(rawValue: string) {
  const numericValue = Number(rawValue)

  if (!Number.isFinite(numericValue)) {
    throw new Error(`Expected a numeric x value but received "${rawValue}".`)
  }

  return numericValue
}

function requireFiniteDate(rawValue: string) {
  const dateValue = Date.parse(rawValue)

  if (Number.isNaN(dateValue)) {
    throw new Error(
      `Expected an ISO-like datetime x value but received "${rawValue}".`,
    )
  }

  return dateValue
}

function parseCsvRow(line: string) {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }

      continue
    }

    if (character === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += character
  }

  if (inQuotes) {
    throw new Error('Encountered an unclosed quote in the CSV file.')
  }

  values.push(current)
  return values
}
