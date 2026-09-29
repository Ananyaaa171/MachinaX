/* ================================================================
   ConnectionStatus — Shows backend online/offline + last update time.
   ================================================================ */

import { formatTimestamp } from '../utils/format';

interface Props {
  online: boolean;
  lastUpdated: Date | null;
}

export default function ConnectionStatus({ online, lastUpdated }: Props) {
  return (
    <div className="connection-status" id="connection-status">
      <span
        className={`connection-status__dot ${
          online ? 'connection-status__dot--online' : 'connection-status__dot--offline'
        }`}
        aria-hidden="true"
      />
      <span className={online ? '' : 'connection-status__text--offline'}>
        {online ? 'System Online' : 'Backend Offline'}
      </span>
      {online && lastUpdated && (
        <span className="connection-status__time">
          Polled {formatTimestamp(lastUpdated.toISOString())}
        </span>
      )}
    </div>
  );
}
