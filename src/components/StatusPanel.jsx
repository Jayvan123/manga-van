/**
 * @param {{ error?: any, message?: string, onRetry?: (() => unknown) | null, compact?: boolean }} props
 */
export default function StatusPanel({ error = null, message = '', onRetry = null, compact = false }) {
  const status = error?.response?.status
  const text = message || (status === 429
    ? 'MangaDex is receiving too many requests. Please wait a moment and retry.'
    : status === 404 ? 'The requested manga could not be found.' : 'MangaDex could not be reached right now.')

  return (
    <div className={`status-panel${compact ? ' status-panel--compact' : ''}`} role={error ? 'alert' : 'status'}>
      <span className="status-panel__icon" aria-hidden="true">{error ? '!' : '◇'}</span>
      <h2>{error ? 'Something went wrong' : 'No results'}</h2>
      <p>{text}</p>
      {onRetry && <button className="button button--secondary" onClick={onRetry} type="button">Try again</button>}
    </div>
  )
}
