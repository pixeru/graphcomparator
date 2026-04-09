import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const sampleMap: Record<string, string> = {
  '/samples/close_pair_a.csv': readFileSync(
    join(process.cwd(), 'public', 'samples', 'close_pair_a.csv'),
    'utf8',
  ),
  '/samples/close_pair_b.csv': readFileSync(
    join(process.cwd(), 'public', 'samples', 'close_pair_b.csv'),
    'utf8',
  ),
  '/samples/target_91_pair_a.csv': readFileSync(
    join(process.cwd(), 'public', 'samples', 'target_91_pair_a.csv'),
    'utf8',
  ),
  '/samples/target_91_pair_b.csv': readFileSync(
    join(process.cwd(), 'public', 'samples', 'target_91_pair_b.csv'),
    'utf8',
  ),
  '/samples/medium_pair_a.csv': readFileSync(
    join(process.cwd(), 'public', 'samples', 'medium_pair_a.csv'),
    'utf8',
  ),
  '/samples/medium_pair_b.csv': readFileSync(
    join(process.cwd(), 'public', 'samples', 'medium_pair_b.csv'),
    'utf8',
  ),
  '/samples/far_pair_a.csv': readFileSync(
    join(process.cwd(), 'public', 'samples', 'far_pair_a.csv'),
    'utf8',
  ),
  '/samples/far_pair_b.csv': readFileSync(
    join(process.cwd(), 'public', 'samples', 'far_pair_b.csv'),
    'utf8',
  ),
}

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads a sample pair and renders a comparison summary', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const key =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url
      const body = sampleMap[key]

      if (!body) {
        return {
          ok: false,
          text: async () => '',
        } as Response
      }

      return {
        ok: true,
        text: async () => body,
      } as Response
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /load close pair/i }))

    await waitFor(() =>
      expect(screen.getByText(/difference area shows/i)).toBeInTheDocument(),
    )

    const resultsHeading = screen.getByRole('heading', { name: /overlay and score/i })
    const resultsPanel = resultsHeading.closest('section')

    expect(resultsPanel).not.toBeNull()
    expect(within(resultsPanel!).getAllByText(/closeness score/i).length).toBeGreaterThan(0)
    expect(within(resultsPanel!).getByText(/aligned points/i)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
