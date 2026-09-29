/* ================================================================
   InteractiveMotorTwin.tsx — Restored Live Equipment Twin Wrapper
   Phase 10.2: Replaces the generic SVG motor illustration with the
   restored original prototype LiveEquipmentTwin canvas visualization.
   ================================================================ */

import React from 'react';
import type { DigitalTwinStateResponse } from '../../types';
import LiveEquipmentTwin, { type SensorData } from './LiveEquipmentTwin';

export type { SensorData };

interface Props {
  twin: DigitalTwinStateResponse | null;
  machineStatus?: string;
  machineName?: string;
  machineSerialNumber?: string;
  machineId?: number;
  onRefresh?: () => void;
}

export default function InteractiveMotorTwin({
  twin,
  machineStatus,
  machineName,
  machineSerialNumber,
  machineId,
  onRefresh,
}: Props) {
  return (
    <LiveEquipmentTwin
      twin={twin}
      machineStatus={machineStatus}
      machineName={machineName || twin?.machineName || 'Motor IM-001'}
      machineSerialNumber={machineSerialNumber || twin?.serialNumber || 'IM-001'}
      machineId={machineId || twin?.machineId || 1}
      onRefresh={onRefresh}
      variant="full"
      pollingIntervalSeconds={6}
    />
  );
}
