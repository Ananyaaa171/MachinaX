/* ================================================================
   ErrorState — Reusable error display for card sections.
   ================================================================ */

interface Props {
  message: string;
}

export default function ErrorState({ message }: Props) {
  return (
    <div className="error-state" role="alert">
      <span className="error-state__icon" aria-hidden="true">⚠</span>
      <span>{message}</span>
    </div>
  );
}
