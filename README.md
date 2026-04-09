# Graph Comparator

Graph Comparator is a React app and CLI for comparing two CSV series and measuring how closely one follows the other.

You upload two files with an `x,y` header, the app overlays both curves on a shared chart, interpolates them across the overlapping x-range, and reports a `0-100` closeness score along with supporting metrics.

## Features

- Compare two CSV inputs directly in the browser
- Run the same comparison from the command line
- Accept numeric or ISO-like datetime `x` values
- Align mismatched sample positions with linear interpolation
- Show an overlaid graph with a shaded difference region
- Report closeness score, RMSE, MAE, overlap window, and aligned point count
- Load bundled example pairs for close, medium, and far comparisons

## How It Works

1. Upload two CSV files, one for Series A and one for Series B.
2. The app validates the files and sorts rows by `x`.
3. It finds the shared x-domain between both series.
4. It builds a comparison grid from the union of both files' x-values inside that shared range.
5. Missing points are filled by linear interpolation.
6. It computes a few summary numbers:

- `Closeness score` (`0` to `100`): the main "how similar are these two lines?" score. Higher is better. `100` means they match perfectly in the shared part of the chart.
- `Score label`: a quick plain-English reading of the score, such as `Very close`.
- `MAE`: the average gap between the two lines at the compared points. Lower is better.
- `RMSE`: similar to MAE, but it gives extra weight to larger misses. Lower is better.
- `Aligned points`: how many x-axis positions were actually compared after both files were lined up.

If you only look at one number, look at the `Closeness score` first.

Internally, the score is based on RMSE compared with the shared `y` range, so it still makes sense when charts use different scales.

If the shared `y` range is zero, the app falls back to exact-match behavior:

- identical flat lines score `100`
- different flat lines score `0`

## CSV Format

Each file must:

- contain exactly two columns
- use the header `x,y`
- contain numeric `y` values
- use either numeric `x` values or ISO-like datetime `x` values
- avoid duplicate `x` values

Both files must use the same `x` type.

### Numeric Example

```csv
x,y
0,10
1,13
2,17
3,22
```

### Datetime Example

```csv
x,y
2026-01-01T00:00:00Z,10
2026-01-02T00:00:00Z,13
2026-01-03T00:00:00Z,17
```

## Score Labels

The UI maps the numeric score to a quick label:

- `Very close`: `>= 80`
- `Moderately close`: `>= 55` and `< 80`
- `Far apart`: `< 55`

## Reading the Metrics

Here is a plain-English way to read the result cards:

- `Closeness score: 85.5` and `Very close` means the two lines stay fairly close to each other overall.
- `RMSE: 2.46` means the typical mismatch is a bit under `2.5` y-units, with bigger misses counting extra.
- `MAE: 2.13` means the average gap between the two lines is about `2.1` y-units.
- `Aligned points: 21` means the comparison used `21` shared x-axis sample positions.

In short: start with the closeness score for the big picture, then use `MAE` and `RMSE` if you want to know how large the gaps are.

## Sample Data

Bundled sample CSVs live in `public/samples/`:

- `close_pair_a.csv` / `close_pair_b.csv`
- `target_91_pair_a.csv` / `target_91_pair_b.csv`
- `medium_pair_a.csv` / `medium_pair_b.csv`
- `far_pair_a.csv` / `far_pair_b.csv`

These can be loaded directly from the app UI.

## CLI Usage

Run the CLI with two CSV paths:

```bash
npm run compare -- path/to/series-a.csv path/to/series-b.csv
```

Print the result as JSON:

```bash
npm run compare -- path/to/series-a.csv path/to/series-b.csv --json
```

Use the bundled examples:

```bash
npm run compare -- public/samples/close_pair_a.csv public/samples/close_pair_b.csv
```

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Quality Checks

Run tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run linting:

```bash
npm run lint
```

## Project Structure

- `src/App.tsx`: main application flow and UI composition
- `src/cli.ts`: CLI entrypoint
- `src/lib/cli.ts`: CLI argument handling and output formatting
- `src/lib/csv.ts`: CSV parsing and validation
- `src/lib/compare.ts`: interpolation and closeness calculation
- `src/components/ComparisonChart.tsx`: chart rendering
- `src/components/UploadSlot.tsx`: upload controls
- `public/samples/`: bundled example CSV files

## Tech Stack

- React 19
- TypeScript
- Vite
- Vitest
- Testing Library

## Notes

- The web app is fully client-side and does not require a backend.
- No data is uploaded to a server by this project itself.
- This version compares one series per file, not multiple series in a single CSV.
