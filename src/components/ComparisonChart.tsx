import { formatAxisValue, formatMetricValue } from '../lib/format'
import type { ComparedPoint, ComparisonResult, XKind } from '../types'

interface ComparisonChartProps {
  comparison: ComparisonResult
  xKind: XKind
  leftLabel: string
  rightLabel: string
}

const VIEWBOX_WIDTH = 760
const VIEWBOX_HEIGHT = 360
const CHART_MARGIN = {
  top: 26,
  right: 20,
  bottom: 44,
  left: 62,
}

export function ComparisonChart({
  comparison,
  xKind,
  leftLabel,
  rightLabel,
}: ComparisonChartProps) {
  const points = comparison.comparedPoints
  const chartWidth = VIEWBOX_WIDTH - CHART_MARGIN.left - CHART_MARGIN.right
  const chartHeight = VIEWBOX_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom
  const xMin = points[0]?.x ?? comparison.overlapStart
  const xMax = points[points.length - 1]?.x ?? comparison.overlapEnd

  let yMin = comparison.yMin
  let yMax = comparison.yMax

  if (yMin === yMax) {
    yMin -= 1
    yMax += 1
  }

  const scaleX = (xValue: number) =>
    CHART_MARGIN.left +
    (xMax === xMin ? chartWidth / 2 : ((xValue - xMin) / (xMax - xMin)) * chartWidth)

  const scaleY = (yValue: number) =>
    CHART_MARGIN.top + chartHeight - ((yValue - yMin) / (yMax - yMin)) * chartHeight

  const yTicks = buildTicks(yMin, yMax, 5)
  const xTicks = buildTicks(xMin, xMax, points.length === 1 ? 1 : 5)
  const differencePath =
    points.length > 1 ? buildDifferencePath(points, scaleX, scaleY) : ''
  const leftPath = points.length > 1 ? buildLinePath(points, 'seriesA', scaleX, scaleY) : ''
  const rightPath =
    points.length > 1 ? buildLinePath(points, 'seriesB', scaleX, scaleY) : ''
  const showPointMarkers = points.length <= 60

  return (
    <figure className="chart-shell">
      <div className="chart-legend">
        <span className="legend-chip">
          <span className="legend-swatch left" aria-hidden="true" />
          {leftLabel}
        </span>
        <span className="legend-chip">
          <span className="legend-swatch right" aria-hidden="true" />
          {rightLabel}
        </span>
        <span className="legend-chip">
          <span className="legend-swatch diff" aria-hidden="true" />
          Difference area
        </span>
      </div>

      <svg
        className="chart-svg"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-labelledby="comparison-chart-title comparison-chart-desc"
      >
        <title id="comparison-chart-title">Overlaid comparison chart</title>
        <desc id="comparison-chart-desc">
          Two line graphs overlaid over the shared x-range with a shaded region
          between them.
        </desc>

        <defs>
          <linearGradient id="comparison-diff-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#ea7a39" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#39b0ad" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        <text className="chart-title" x={CHART_MARGIN.left} y={18}>
          Shared x-range with interpolated alignment
        </text>

        {yTicks.map((tick) => {
          const y = scaleY(tick)
          return (
            <g key={`y-${tick}`}>
              <line
                className="chart-grid-line"
                x1={CHART_MARGIN.left}
                x2={VIEWBOX_WIDTH - CHART_MARGIN.right}
                y1={y}
                y2={y}
              />
              <text className="chart-label" x={12} y={y + 4}>
                {formatMetricValue(tick)}
              </text>
            </g>
          )
        })}

        {xTicks.map((tick) => {
          const x = scaleX(tick)
          return (
            <g key={`x-${tick}`}>
              <line
                className="chart-grid-line"
                x1={x}
                x2={x}
                y1={CHART_MARGIN.top}
                y2={VIEWBOX_HEIGHT - CHART_MARGIN.bottom}
              />
              <text
                className="chart-label"
                x={x}
                y={VIEWBOX_HEIGHT - 12}
                textAnchor="middle"
              >
                {formatAxisValue(tick, xKind)}
              </text>
            </g>
          )
        })}

        <line
          className="chart-axis-line"
          x1={CHART_MARGIN.left}
          x2={CHART_MARGIN.left}
          y1={CHART_MARGIN.top}
          y2={VIEWBOX_HEIGHT - CHART_MARGIN.bottom}
        />
        <line
          className="chart-axis-line"
          x1={CHART_MARGIN.left}
          x2={VIEWBOX_WIDTH - CHART_MARGIN.right}
          y1={VIEWBOX_HEIGHT - CHART_MARGIN.bottom}
          y2={VIEWBOX_HEIGHT - CHART_MARGIN.bottom}
        />

        {differencePath ? <path className="chart-area" d={differencePath} /> : null}
        {leftPath ? <path className="chart-line chart-line-left" d={leftPath} /> : null}
        {rightPath ? <path className="chart-line chart-line-right" d={rightPath} /> : null}

        {showPointMarkers
          ? points.map((point) => (
              <g key={`point-${point.x}`}>
                <circle
                  className="chart-point chart-point-left"
                  cx={scaleX(point.x)}
                  cy={scaleY(point.seriesA)}
                  r={4.3}
                />
                <circle
                  className="chart-point chart-point-right"
                  cx={scaleX(point.x)}
                  cy={scaleY(point.seriesB)}
                  r={4.3}
                />
              </g>
            ))
          : null}
      </svg>

      <figcaption>
        Difference area shows where the curves pull apart after interpolation on
        the shared x-grid.
      </figcaption>
    </figure>
  )
}

function buildLinePath(
  points: ComparedPoint[],
  key: 'seriesA' | 'seriesB',
  scaleX: (xValue: number) => number,
  scaleY: (yValue: number) => number,
) {
  return points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command}${scaleX(point.x).toFixed(2)},${scaleY(point[key]).toFixed(2)}`
    })
    .join(' ')
}

function buildDifferencePath(
  points: ComparedPoint[],
  scaleX: (xValue: number) => number,
  scaleY: (yValue: number) => number,
) {
  const topPath = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command}${scaleX(point.x).toFixed(2)},${scaleY(point.seriesA).toFixed(2)}`
    })
    .join(' ')

  const bottomPath = [...points]
    .reverse()
    .map(
      (point) =>
        `L${scaleX(point.x).toFixed(2)},${scaleY(point.seriesB).toFixed(2)}`,
    )
    .join(' ')

  return `${topPath} ${bottomPath} Z`
}

function buildTicks(min: number, max: number, count: number) {
  if (min === max || count <= 1) {
    return [min]
  }

  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, index) => min + step * index)
}
