# Graph Comparator

A browser-only tool for comparing two `x,y` CSV files. It overlays both series, aligns them over their shared domain with linear interpolation, and reports a `0-100` closeness score based on normalized RMSE.

## CSV contract

Each file must:

- contain exactly two columns with the header `x,y`
- use numeric `y` values
- use either numeric `x` values or ISO-like datetime `x` values
- avoid duplicate `x` values

## Commands

```bash
npm install
npm run dev
```

Additional checks:

```bash
npm run test
npm run build
npm run lint
```

## Sample data

Bundled sample pairs live in `public/samples/` and can be loaded directly from the UI:

- `close_pair`
- `medium_pair`
- `far_pair`
