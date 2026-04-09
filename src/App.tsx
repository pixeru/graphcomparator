import { useState, type ChangeEvent } from 'react'
import './App.css'
import { ComparisonChart } from './components/ComparisonChart'
import { UploadSlot } from './components/UploadSlot'
import { compareSeries } from './lib/compare'
import { parseCsvSeries } from './lib/csv'
import {
  formatDomainValue,
  formatMetricValue,
  formatScore,
  formatXKindLabel,
} from './lib/format'
import { samplePairs, type SamplePair } from './lib/samplePairs'
import type { ComparisonResult, LoadedSeries, SlotKey, XKind } from './types'

function App() {
  const [leftInput, setLeftInput] = useState<LoadedSeries | null>(null)
  const [rightInput, setRightInput] = useState<LoadedSeries | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  async function handleFileChange(
    slot: SlotKey,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setIsBusy(true)
    setLoadError(null)

    try {
      const csvText = await file.text()
      const parsedSeries = parseCsvSeries(csvText, file.name)
      const nextInput: LoadedSeries = {
        label: file.name,
        origin: 'upload',
        series: parsedSeries,
      }

      if (slot === 'left') {
        setLeftInput(nextInput)
      } else {
        setRightInput(nextInput)
      }

      setLoadError(null)
      setActiveSampleId(null)
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleLoadSamplePair(pair: SamplePair) {
    setIsBusy(true)
    setLoadError(null)

    try {
      const [leftResponse, rightResponse] = await Promise.all([
        fetch(pair.leftPath),
        fetch(pair.rightPath),
      ])

      if (!leftResponse.ok || !rightResponse.ok) {
        throw new Error('Unable to load the selected sample pair.')
      }

      const [leftCsv, rightCsv] = await Promise.all([
        leftResponse.text(),
        rightResponse.text(),
      ])

      const leftSeries = parseCsvSeries(leftCsv, pair.leftName)
      const rightSeries = parseCsvSeries(rightCsv, pair.rightName)

      setLeftInput({
        label: pair.leftName,
        origin: 'sample',
        sampleId: pair.id,
        series: leftSeries,
      })
      setRightInput({
        label: pair.rightName,
        origin: 'sample',
        sampleId: pair.id,
        series: rightSeries,
      })
      setLoadError(null)
      setActiveSampleId(pair.id)
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setIsBusy(false)
    }
  }

  function handleClearSlot(slot: SlotKey) {
    if (slot === 'left') {
      setLeftInput(null)
    } else {
      setRightInput(null)
    }

    setLoadError(null)
    setActiveSampleId(null)
  }

  function handleClearAll() {
    setLeftInput(null)
    setRightInput(null)
    setLoadError(null)
    setActiveSampleId(null)
  }

  let comparison: ComparisonResult | null = null
  let comparisonError: string | null = null

  if (leftInput && rightInput) {
    try {
      comparison = compareSeries(leftInput.series, rightInput.series)
    } catch (error) {
      comparisonError = getErrorMessage(error)
    }
  }

  const activeError = loadError ?? comparisonError
  const isWorking = isBusy
  const activeXKind: XKind =
    leftInput?.series.xKind ?? rightInput?.series.xKind ?? 'number'

  const metricCards = comparison
    ? [
        {
          label: 'Closeness score',
          value: formatScore(comparison.closenessScore),
          helper: comparison.label,
          emphasized: true,
        },
        {
          label: 'RMSE',
          value: formatMetricValue(comparison.rmse),
          helper: 'Normalized against shared y-range',
          emphasized: false,
        },
        {
          label: 'MAE',
          value: formatMetricValue(comparison.mae),
          helper: 'Average absolute difference',
          emphasized: false,
        },
        {
          label: 'Aligned points',
          value: comparison.pointCount.toString(),
          helper: `${formatXKindLabel(activeXKind)} samples`,
          emphasized: false,
        },
      ]
    : []

  const overlapSummary =
    comparison &&
    `${formatDomainValue(comparison.overlapStart, activeXKind)} to ${formatDomainValue(
      comparison.overlapEnd,
      activeXKind,
    )}`

  const statusMessage = isWorking
    ? 'Parsing, aligning, and comparing the two series...'
    : activeError
      ? activeError
      : comparison
        ? `Compared ${comparison.pointCount} aligned points across the shared domain.`
        : leftInput || rightInput
          ? 'One series is loaded. Add the second CSV to compute closeness.'
          : 'Upload two x,y CSV files or load one of the bundled sample pairs.'

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="hero-panel panel">
        <div className="hero-copy">
          <p className="eyebrow">Static CSV graph comparator</p>
          <h1>See how tightly one curve tracks another.</h1>
          <p className="hero-text">
            Upload two headered <code>x,y</code> CSV files, overlay them on the
            same chart, and get a normalized <code>0-100</code> closeness score
            based on interpolated RMSE across the shared x-range.
          </p>
          <div className="hero-tags" aria-label="Capabilities">
            <span>Browser only</span>
            <span>Numeric or datetime x-axis</span>
            <span>Linear interpolation</span>
            <span>Sample pairs included</span>
          </div>
        </div>

        <aside className="formula-card">
          <p className="formula-label">Closeness model</p>
          <strong>max(0, 100 * (1 - RMSE / y-range))</strong>
          <p>
            When the shared y-range is zero, the tool falls back to exact-match
            handling for flat lines.
          </p>
        </aside>
      </header>

      <main className="workspace">
        <section className="control-panel panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Inputs</p>
              <h2>Load two CSV files</h2>
            </div>
            <button className="ghost-button" type="button" onClick={handleClearAll}>
              Clear both
            </button>
          </div>

          <div className="status-strip" data-tone={activeError ? 'error' : 'neutral'}>
            <span className="status-dot" aria-hidden="true" />
            <p>{statusMessage}</p>
          </div>

          <div className="sample-section">
            <div className="sample-header">
              <div>
                <h3>Bundled examples</h3>
                <p>Load a prebuilt pair to see close, medium, and far matches.</p>
              </div>
              {activeSampleId ? (
                <span className="sample-active">
                  Active sample: {activeSampleId.replace('_', ' ')}
                </span>
              ) : null}
            </div>

            <div className="sample-grid">
              {samplePairs.map((pair) => (
                <button
                  key={pair.id}
                  className="sample-card"
                  type="button"
                  onClick={() => void handleLoadSamplePair(pair)}
                  aria-pressed={activeSampleId === pair.id}
                >
                  <span className="sample-title">Load {pair.label}</span>
                  <span className="sample-blurb">{pair.blurb}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="upload-grid">
            <UploadSlot
              tone="left"
              title="Series A"
              hint="Baseline or reference CSV"
              loaded={leftInput}
              busy={isWorking}
              onChange={(event) => void handleFileChange('left', event)}
              onClear={() => handleClearSlot('left')}
            />
            <UploadSlot
              tone="right"
              title="Series B"
              hint="Comparison or target CSV"
              loaded={rightInput}
              busy={isWorking}
              onChange={(event) => void handleFileChange('right', event)}
              onClear={() => handleClearSlot('right')}
            />
          </div>

          <div className="contract-card">
            <h3>CSV contract</h3>
            <ul>
              <li>
                Header must be exactly two columns: <code>x,y</code>.
              </li>
              <li>
                <code>y</code> must be numeric in every row.
              </li>
              <li>
                <code>x</code> may be numeric or ISO-like datetime, but both
                files must match.
              </li>
              <li>Duplicate x-values are rejected after sorting.</li>
            </ul>
          </div>
        </section>

        <section className="results-panel panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Results</p>
              <h2>Overlay and score</h2>
            </div>
            {comparison ? (
              <span className="score-pill" data-tone={comparison.label}>
                {comparison.label}
              </span>
            ) : null}
          </div>

          {activeError ? (
            <div className="feedback-card feedback-error" role="alert">
              <h3>Comparison blocked</h3>
              <p>{activeError}</p>
            </div>
          ) : comparison ? (
            <>
              <div className="score-band">
                <div>
                  <p className="score-band-label">Closeness score</p>
                  <h3>{formatScore(comparison.closenessScore)}</h3>
                </div>
                <div className="score-band-meta">
                  <p>Overlap window</p>
                  <strong>{overlapSummary}</strong>
                </div>
              </div>

              <div className="metric-grid">
                {metricCards.map((metric) => (
                  <article
                    key={metric.label}
                    className="metric-card"
                    data-emphasis={metric.emphasized ? 'true' : 'false'}
                  >
                    <p>{metric.label}</p>
                    <strong>{metric.value}</strong>
                    <span>{metric.helper}</span>
                  </article>
                ))}
              </div>

              <ComparisonChart
                comparison={comparison}
                xKind={activeXKind}
                leftLabel={leftInput?.label ?? 'Series A'}
                rightLabel={rightInput?.label ?? 'Series B'}
              />
            </>
          ) : (
            <div className="feedback-card feedback-empty">
              <h3>Waiting on two valid inputs</h3>
              <p>
                Once both files are loaded, the app will align them over their
                shared domain, interpolate any missing positions, and score how
                close they are.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while reading the CSV input.'
}
