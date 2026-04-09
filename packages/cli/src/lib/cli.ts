import { basename, resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { compareSeries } from './compare'
import { parseCsvSeries } from './csv'
import {
  formatDomainValue,
  formatMetricValue,
  formatScore,
  formatXKindLabel,
} from './format'
import type { ComparisonResult, ParsedSeries } from '../types'

export interface CliIo {
  readTextFile: (filePath: string) => Promise<string>
  stdout: (message: string) => void
  stderr: (message: string) => void
  resolvePath: (filePath: string) => string
}

export async function runCli(
  argv: string[],
  io: CliIo = createDefaultCliIo(),
) {
  const parsedArgs = parseCliArgs(argv)

  if (parsedArgs.help) {
    io.stdout(getUsageText())
    return 0
  }

  if (parsedArgs.error) {
    io.stderr(`${parsedArgs.error}\n\n${getUsageText()}`)
    return 1
  }

  const [leftPath, rightPath] = parsedArgs.paths

  try {
    const [leftCsv, rightCsv] = await Promise.all([
      io.readTextFile(leftPath),
      io.readTextFile(rightPath),
    ])

    const leftSeries = parseCsvSeries(leftCsv, basename(leftPath))
    const rightSeries = parseCsvSeries(rightCsv, basename(rightPath))
    const comparison = compareSeries(leftSeries, rightSeries)

    if (parsedArgs.json) {
      io.stdout(
        JSON.stringify(
          createJsonReport(
            io.resolvePath(leftPath),
            io.resolvePath(rightPath),
            leftSeries,
            comparison,
          ),
          null,
          2,
        ),
      )
    } else {
      io.stdout(createTextReport(leftPath, rightPath, leftSeries, comparison))
    }

    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown CLI error.'
    io.stderr(`Comparison failed: ${message}`)
    return 1
  }
}

export function getUsageText() {
  return [
    'Graph Comparator CLI',
    '',
    'Usage:',
    '  graph-compare <series-a.csv> <series-b.csv> [--json]',
    '',
    'Options:',
    '  --json    Print the comparison result as JSON',
    '  --help    Show this help message',
    '  -h        Show this help message',
  ].join('\n')
}

function parseCliArgs(argv: string[]) {
  const json = argv.includes('--json')
  const help = argv.includes('--help') || argv.includes('-h')
  const positional = argv.filter((arg) => !arg.startsWith('-'))
  const unknownFlags = argv.filter(
    (arg) => arg.startsWith('-') && !['--json', '--help', '-h'].includes(arg),
  )

  if (unknownFlags.length > 0) {
    return {
      help: false,
      json,
      paths: [] as string[],
      error: `Unknown option: ${unknownFlags[0]}`,
    }
  }

  if (help) {
    return {
      help: true,
      json,
      paths: [] as string[],
      error: null,
    }
  }

  if (positional.length !== 2) {
    return {
      help: false,
      json,
      paths: [] as string[],
      error: 'Expected exactly two CSV file paths.',
    }
  }

  return {
    help: false,
    json,
    paths: positional,
    error: null,
  }
}

function createTextReport(
  leftPath: string,
  rightPath: string,
  parsedSeries: ParsedSeries,
  comparison: ComparisonResult,
) {
  return [
    'Graph Comparator CLI',
    `Series A: ${leftPath}`,
    `Series B: ${rightPath}`,
    `X axis: ${formatXKindLabel(parsedSeries.xKind)}`,
    `Closeness score: ${formatScore(comparison.closenessScore)} (${comparison.label})`,
    `RMSE: ${formatMetricValue(comparison.rmse)}`,
    `MAE: ${formatMetricValue(comparison.mae)}`,
    `Overlap: ${formatDomainValue(comparison.overlapStart, parsedSeries.xKind)} to ${formatDomainValue(comparison.overlapEnd, parsedSeries.xKind)}`,
    `Aligned points: ${comparison.pointCount}`,
  ].join('\n')
}

function createJsonReport(
  resolvedLeftPath: string,
  resolvedRightPath: string,
  parsedSeries: ParsedSeries,
  comparison: ComparisonResult,
) {
  return {
    seriesA: resolvedLeftPath,
    seriesB: resolvedRightPath,
    xKind: parsedSeries.xKind,
    closenessScore: comparison.closenessScore,
    label: comparison.label,
    rmse: comparison.rmse,
    mae: comparison.mae,
    overlapStart: comparison.overlapStart,
    overlapEnd: comparison.overlapEnd,
    pointCount: comparison.pointCount,
  }
}

function createDefaultCliIo(): CliIo {
  return {
    readTextFile: (filePath) => readFile(filePath, 'utf8'),
    stdout: (message) => {
      process.stdout.write(`${message}\n`)
    },
    stderr: (message) => {
      process.stderr.write(`${message}\n`)
    },
    resolvePath: (filePath) => resolve(filePath),
  }
}
