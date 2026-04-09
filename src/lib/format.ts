import type { XKind } from '../types'

const metricFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

const scoreFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
})

const numberAxisFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

const dateAxisFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

const dateDomainFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

const dateTimeDomainFormatter = new Intl.DateTimeFormat('en-US', {
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

export function formatAxisValue(value: number, xKind: XKind) {
  if (xKind === 'datetime') {
    return dateAxisFormatter.format(value)
  }

  return numberAxisFormatter.format(value)
}

export function formatDomainValue(value: number, xKind: XKind) {
  if (xKind === 'datetime') {
    const date = new Date(value)
    const hasTime =
      date.getUTCHours() !== 0 ||
      date.getUTCMinutes() !== 0 ||
      date.getUTCSeconds() !== 0 ||
      date.getUTCMilliseconds() !== 0

    return hasTime
      ? dateTimeDomainFormatter.format(value)
      : dateDomainFormatter.format(value)
  }

  return numberAxisFormatter.format(value)
}

export function formatXKindLabel(xKind: XKind) {
  return xKind === 'datetime' ? 'Datetime x-axis' : 'Numeric x-axis'
}
