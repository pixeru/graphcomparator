import { describe, expect, it, vi } from 'vitest'
import { getUsageText, runCli, type CliIo } from './cli'

describe('runCli', () => {
  it('prints a text summary for a valid comparison', async () => {
    const io = createMockIo({
      'left.csv': `x,y
0,10
1,12
2,14`,
      'right.csv': `x,y
0,10.2
1.2,12.1
2,13.8`,
    })

    const exitCode = await runCli(['left.csv', 'right.csv'], io)

    expect(exitCode).toBe(0)
    expect(io.stdout).toHaveBeenCalledWith(expect.stringContaining('Graph Comparator CLI'))
    expect(io.stdout).toHaveBeenCalledWith(expect.stringContaining('Closeness score:'))
    expect(io.stdout).toHaveBeenCalledWith(expect.stringContaining('Aligned points:'))
  })

  it('prints json when requested', async () => {
    const io = createMockIo({
      'left.csv': `x,y
0,5
1,6`,
      'right.csv': `x,y
0,5
1,6`,
    })

    const exitCode = await runCli(['left.csv', 'right.csv', '--json'], io)

    expect(exitCode).toBe(0)
    expect(io.stdout).toHaveBeenCalledTimes(1)
    expect(JSON.parse(getSingleMessage(io.stdout))).toMatchObject({
      seriesA: 'resolved:left.csv',
      seriesB: 'resolved:right.csv',
      closenessScore: 100,
      label: 'Very close',
      pointCount: 2,
    })
  })

  it('shows help text', async () => {
    const io = createMockIo({})

    const exitCode = await runCli(['--help'], io)

    expect(exitCode).toBe(0)
    expect(io.stdout).toHaveBeenCalledWith(getUsageText())
  })

  it('returns an error for invalid arguments', async () => {
    const io = createMockIo({})

    const exitCode = await runCli(['left.csv'], io)

    expect(exitCode).toBe(1)
    expect(io.stderr).toHaveBeenCalledWith(
      expect.stringContaining('Expected exactly two CSV file paths.'),
    )
  })

  it('returns an error when comparison fails', async () => {
    const io = createMockIo({
      'left.csv': `x,y
0,1
1,2`,
      'right.csv': `x,y
2026-01-01T00:00:00Z,1
2026-01-02T00:00:00Z,2`,
    })

    const exitCode = await runCli(['left.csv', 'right.csv'], io)

    expect(exitCode).toBe(1)
    expect(io.stderr).toHaveBeenCalledWith(
      expect.stringContaining('Both CSV files must use the same x-value format.'),
    )
  })
})

function createMockIo(fileMap: Record<string, string>) {
  return {
    readTextFile: vi.fn(async (filePath: string) => {
      if (!(filePath in fileMap)) {
        throw new Error(`Missing file: ${filePath}`)
      }

      return fileMap[filePath]
    }),
    stdout: vi.fn(),
    stderr: vi.fn(),
    resolvePath: (filePath: string) => `resolved:${filePath}`,
  } satisfies CliIo
}

function getSingleMessage(mockFn: ReturnType<typeof vi.fn>) {
  const calls = mockFn.mock.calls as string[][]
  return calls[0][0]
}
