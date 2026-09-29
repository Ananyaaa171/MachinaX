/* ================================================================
   EmptyState — Shown when data is not yet available.
   ================================================================ */

interface Props {
  icon?: string;
  message: string;
}

export default function EmptyState({ icon = '📊', message }: Props) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">{icon}</span>
      <span>{message}</span>
    </div>
  );
}
