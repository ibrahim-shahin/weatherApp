export function LoadingPanel() {
  return (
    <div className="skeleton" aria-hidden="true">
      <div className="card skeleton-card tall" />
      <div className="card skeleton-card" />
      <div className="card skeleton-card" />
    </div>
  )
}

export function ErrorPanel({ message, onRetry }) {
  return (
    <section className="card error-panel" role="alert">
      <h2>Something went wrong</h2>
      <p>{message}</p>
      <button type="button" className="button" onClick={onRetry}>
        Try again
      </button>
    </section>
  )
}
