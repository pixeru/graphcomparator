# Graph Comparator Web Tool

## Summary
Build a static client-side web app that accepts two CSV uploads, plots both series on one chart, and reports how close they are with a simple `0-100` similarity score plus supporting stats.

## Key Changes
- Scaffold a small React + TypeScript + Vite app with no backend; all parsing and comparison runs in the browser.
- Add a two-file upload flow with clear states: empty, parsing, validation error, comparison result.
- Define the v1 CSV contract:
  - Each file must contain exactly one 2-column series with headers `x,y`.
  - `y` must be numeric.
  - `x` may be numeric or ISO-like datetime, but both files must use the same `x` type.
  - Rows are sorted by `x` after parsing; duplicate `x` values are treated as invalid input.
- Implement comparison behavior:
  - Use the overlapping `x` domain only.
  - Build a comparison grid from the union of both files’ `x` values within the shared domain.
  - Linearly interpolate missing points on each series so mismatched `x` positions can still be compared.
  - Compute primary score as normalized RMSE mapped to closeness: `closeness = max(0, 100 * (1 - rmse / yRange))`.
  - Also show secondary stats: RMSE, MAE, overlap start/end, and compared point count.
  - If the shared `y` range is zero, fall back to exact-match handling: identical series score `100`, otherwise `0`.
- Add result visuals:
  - Overlay line chart for both series.
  - Shaded or otherwise clear difference region between the curves.
  - Summary card with closeness label bands such as `Very close`, `Moderately close`, `Far apart`.
- Generate bundled example data under a `samples/` folder and expose them in the UI with “Load sample” actions:
  - `close_pair`: same base curve with small noise.
  - `medium_pair`: same general shape with offset/amplitude changes.
  - `far_pair`: visibly different curve.
- Keep the app static-deployable and runnable locally with standard npm scripts.

## Public Interfaces / Types
- CSV input contract: headered `x,y` files only.
- Internal parsed series type: ordered array of `{ x: number, y: number }` plus metadata for original `x` kind (`number` or `datetime`).
- Comparison result type should expose at least:
  - `closenessScore`
  - `rmse`
  - `mae`
  - `overlapStart`
  - `overlapEnd`
  - `pointCount`
  - `label`

## Test Plan
- Parse valid numeric `x,y` CSVs and valid datetime `x,y` CSVs.
- Reject malformed files: missing headers, extra columns, non-numeric `y`, duplicate `x`, mixed `x` types across files, and no overlapping domain.
- Verify interpolation works when one file has denser or shifted `x` positions.
- Verify exact identical inputs score `100`.
- Verify close, medium, and far bundled samples produce descending scores in that order.
- Verify zero-range edge case behavior for flat lines.
- Smoke test the browser flow: upload both files, load samples, render chart, and show stats without a backend.

## Assumptions
- v1 is browser-only and fully client-side.
- v1 supports one series per file, not multi-series comparison.
- “How close” means pointwise value similarity over the shared `x` range, not trend-only correlation.
- Example samples will be synthetic CSVs included in the repo and loadable from the UI.
