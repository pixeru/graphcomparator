# Graph Comparator CLI

`graph-comparator-cli` is a standalone command-line tool for comparing two `x,y` CSV files and measuring how closely one series follows the other.

## Install

From a local tarball:

```bash
npm install -g graph-comparator-cli-0.1.0.tgz
```

Or from the package source folder:

```bash
npm install
npm run build
```

## Usage

```bash
graph-compare <series-a.csv> <series-b.csv>
graph-compare <series-a.csv> <series-b.csv> --json
graph-compare --help
```

## Output

The default output prints:

- closeness score
- score label
- RMSE
- MAE
- overlap window
- aligned point count

Use `--json` for machine-readable output.

## CSV Rules

Each file must:

- use the header `x,y`
- contain exactly two columns
- use numeric `y` values
- use numeric or ISO-like datetime `x` values
- avoid duplicate `x` values

Both files must use the same `x` type.

## Build Package

Create the distributable tarball:

```bash
npm pack
```
