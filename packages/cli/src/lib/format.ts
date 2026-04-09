import type { XKind } from '../types'

const metricFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

const scoreFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
})

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
})

export function formatMetricValue(value: number) {
  return metricFormatter.format(value)
}

export function formatScore(value: number) {
  return scoreFormatter.format(value)
}

export function formatDomainValue(value: number, xKind: XKind) {
  if (xKind === 'datetime') {
    return dateFormatter.format(value)
  }

  return numberFormatter.format(value)
}

export function formatXKindLabel(xKind: XKind) {
  return xKind === 'datetime' ? 'Datetime x-axis' : 'Numeric x-axis'
}
