import type { ChangeEventHandler } from 'react'
import { formatDomainValue, formatXKindLabel } from '../lib/format'
import type { LoadedSeries } from '../types'

interface UploadSlotProps {
  title: string
  hint: string
  tone: 'left' | 'right'
  loaded: LoadedSeries | null
  busy: boolean
  onChange: ChangeEventHandler<HTMLInputElement>
  onClear: () => void
}

export function UploadSlot({
  title,
  hint,
  tone,
  loaded,
  busy,
  onChange,
  onClear,
}: UploadSlotProps) {
  const inputId = `${tone}-file-input`
  const pointCount = loaded?.series.points.length ?? 0
  const domainStart = loaded?.series.points[0]?.x
  const domainEnd = loaded
    ? loaded.series.points[loaded.series.points.length - 1]?.x
    : undefined

  return (
    <article className="upload-slot" data-tone={tone}>
      <div className="slot-heading">
        <div>
          <h3>{title}</h3>
          <p>{hint}</p>
        </div>
        {loaded ? (
          <span className="slot-badge" data-origin={loaded.origin}>
            {loaded.origin}
          </span>
        ) : null}
      </div>

      {loaded ? (
        <div className="slot-file">
          <strong>{loaded.label}</strong>
          <p>
            {domainStart !== undefined && domainEnd !== undefined
              ? `${formatDomainValue(domainStart, loaded.series.xKind)} to ${formatDomainValue(domainEnd, loaded.series.xKind)}`
              : 'No domain detected'}
          </p>
          <div className="slot-meta">
            <span>{formatXKindLabel(loaded.series.xKind)}</span>
            <span>{pointCount} points</span>
          </div>
        </div>
      ) : (
        <div className="slot-file">
          <strong>No file loaded yet</strong>
          <p>Select a CSV file with an x,y header.</p>
        </div>
      )}

      <div className="slot-actions">
        <label className="upload-cta" htmlFor={inputId}>
          {loaded ? 'Replace CSV' : 'Choose CSV'}
        </label>
        <input
          id={inputId}
          className="upload-input"
          type="file"
          accept=".csv,text/csv"
          onChange={onChange}
          disabled={busy}
        />
        <button
          className="clear-button"
          type="button"
          onClick={onClear}
          disabled={!loaded || busy}
        >
          Clear slot
        </button>
      </div>
    </article>
  )
}
