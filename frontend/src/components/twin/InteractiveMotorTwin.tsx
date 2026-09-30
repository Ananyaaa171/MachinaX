/* ================================================================
   InteractiveMotorTwin.tsx — Three-Phase Induction Motor Twin Wrapper
   Phase 10.3: Bridges legacy calls to the unified DigitalTwin component.
   ================================================================ */

import React from 'react';
import type { MachineResponse, DigitalTwinStateResponse } from '../../types';
import DigitalTwin from './DigitalTwin';
import type { SensorData } from './SensorDetailModal';

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
  machineStatus = 'ACTIVE',
  machineName,
  machineSerialNumber,
  machineId = 1,
  onRefresh,
}: Props) {
  const machine: MachineResponse = {
    id: machineId || twin?.machineId || 1,
    name: machineName || twin?.machineName || `Motor IM-00${machineId}`,
    serialNumber: machineSerialNumber || twin?.serialNumber || `IM-00${machineId}`,
    location: 'Plant A - Bay 3',
    machineType: {
      id: 1,
      name: '3-Phase Induction Motor',
      manufacturer: 'Siemens Industrial',
      category: 'Electric Motor',
    },
    ratedPowerKw: 15.0,
    ratedVoltageV: 400.0,
    ratedCurrentA: 28.0,
    ratedSpeedRpm: 1480.0,
    installationDate: '2024-01-15',
    status: (machineStatus as any) || 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <DigitalTwin
      machine={machine}
      twin={twin}
      mode="full"
      onRefresh={onRefresh}
      pollingIntervalSeconds={6}
    />
  );
}
