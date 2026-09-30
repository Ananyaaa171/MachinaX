/* ================================================================
   ErrorState — Reusable error display for card sections.
   ================================================================ */

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="error-state" role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="error-state__icon" aria-hidden="true">⚠</span>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          className="btn btn--secondary"
          onClick={onRetry}
          style={{ fontSize: '0.72rem', padding: '3px 10px', marginTop: 4 }}
        >
          🔄 Try Again
        </button>
      )}
    </div>
  );
}
