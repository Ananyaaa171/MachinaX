/* ================================================================
   LoadingState — Reusable loading indicator for card sections.
   ================================================================ */

interface Props {
  message?: string;
}

export default function LoadingState({ message = 'Loading…' }: Props) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true" />
      <span className="loading-state__text">{message}</span>
    </div>
  );
}
