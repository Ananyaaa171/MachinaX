/* ================================================================
   ThreePhaseDigitalTwin.test.tsx — Phase 10.3 Comprehensive Tests
   Verifies:
   - 1 MACHINE = 1 DIGITAL TWIN (1, 2, 3, 8 machines)
   - Zero machine fallback ("NO MACHINES AVAILABLE")
   - Three-phase electrical lines (L1, L2, L3) and Induction Motor SVG
   - Independent states (NORMAL vs WARNING vs CRITICAL)
   - Fault-specific rendering (BEARING_DEFECT, STATOR_SHORT)
   - Interactive sensor hotspots
   - Fleet tab filtering (ALL, NORMAL, WARNING, CRITICAL)
   ================================================================ */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DigitalTwin from '../components/twin/DigitalTwin';
import FleetDigitalTwinView from '../components/dashboard/FleetDigitalTwinView';
import type { MachineResponse, DigitalTwinStateResponse, MachineStatus, OperatingState } from '../types';
import type { MachineTwinData } from '../context/FleetContext';

const makeMockMachine = (id: number, name: string, status: MachineStatus = 'ACTIVE'): MachineResponse => ({
  id,
  name,
  serialNumber: `SN-IM-00${id}`,
  location: `Bay ${id}`,
  status,
  ratedPowerKw: 15.0,
  ratedVoltageV: 400.0,
  ratedCurrentA: 28.0,
  ratedSpeedRpm: 1480,
  installationDate: '2024-01-15T00:00:00Z',
  createdAt: '2026-09-29T00:00:00Z',
  updatedAt: '2026-09-29T00:00:00Z',
  machineType: {
    id: 1,
    name: 'Three-Phase Induction Motor',
    category: 'ROTATING_EQUIPMENT',
    manufacturer: 'Siemens Industrial',
  },
});

const makeMockTwin = (
  id: number,
  state: OperatingState,
  health: number,
  fault: string
): DigitalTwinStateResponse => ({
  machineId: id,
  machineName: `Motor IM-00${id}`,
  serialNumber: `SN-IM-00${id}`,
  healthScore: health,
  operatingState: state,
  anomalyDetected: state === 'CRITICAL' || state === 'WARNING',
  anomalyScore: state === 'CRITICAL' ? 0.85 : state === 'WARNING' ? 0.45 : 0.05,
  currentFaultType: fault as any,
  faultProbability: state === 'CRITICAL' ? 0.92 : state === 'WARNING' ? 0.45 : 0.02,
  latestSensors: [
    {
      sensorId: 1,
      sensorLabel: 'DE Bearing Vibration',
      sensorType: 'VIBRATION',
      value: state === 'CRITICAL' ? 6.4 : state === 'WARNING' ? 4.8 : 1.8,
      unit: 'mm/s',
      status: state === 'CRITICAL' ? 'CRITICAL' : state === 'WARNING' ? 'WARNING' : 'NORMAL',
      normalMin: 0,
      normalMax: 4.5,
      warningMin: 4.5,
      warningMax: 7.1,
      criticalMin: 7.1,
      criticalMax: 15.0,
      recordedAt: '2026-09-30T00:00:00Z',
    },
    {
      sensorId: 2,
      sensorLabel: 'Stator Winding Temp',
      sensorType: 'TEMPERATURE',
      value: state === 'CRITICAL' ? 84.5 : state === 'WARNING' ? 71.0 : 54.0,
      unit: '°C',
      status: state === 'CRITICAL' ? 'CRITICAL' : state === 'WARNING' ? 'WARNING' : 'NORMAL',
      normalMin: 20,
      normalMax: 75,
      warningMin: 75,
      warningMax: 90,
      criticalMin: 90,
      criticalMax: 130,
      recordedAt: '2026-09-30T00:00:00Z',
    },
    {
      sensorId: 3,
      sensorLabel: 'Shaft Speed RPM',
      sensorType: 'SPEED',
      value: 1480,
      unit: 'RPM',
      status: 'NORMAL',
      normalMin: 1400,
      normalMax: 1500,
      warningMin: 1300,
      warningMax: 1550,
      criticalMin: 1200,
      criticalMax: 1600,
      recordedAt: '2026-09-30T00:00:00Z',
    },
  ],
  lastSensorBatchAt: '2026-09-30T00:00:00Z',
  lastUpdatedAt: '2026-09-30T00:00:00Z',
  rul: null,
  maintenance: null,
  explanation: null,
});

const makeTwinData = (machine: MachineResponse, twin: DigitalTwinStateResponse): MachineTwinData => ({
  machine,
  twin,
  rul: null,
  ml: null,
  loading: false,
  error: false,
});

const fleet8: MachineTwinData[] = [
  makeTwinData(makeMockMachine(1, 'Motor IM-001'), makeMockTwin(1, 'NORMAL', 100, 'NONE')),
  makeTwinData(makeMockMachine(2, 'Motor IM-002'), makeMockTwin(2, 'CRITICAL', 40, 'BEARING_DEFECT')),
  makeTwinData(makeMockMachine(3, 'Motor IM-003'), makeMockTwin(3, 'CRITICAL', 0, 'STATOR_SHORT')),
  makeTwinData(makeMockMachine(4, 'Motor IM-004'), makeMockTwin(4, 'NORMAL', 100, 'NONE')),
  makeTwinData(makeMockMachine(5, 'Motor IM-005'), makeMockTwin(5, 'WARNING', 70, 'NONE')),
  makeTwinData(makeMockMachine(6, 'Motor IM-006'), makeMockTwin(6, 'CRITICAL', 10, 'UNCLASSIFIED')),
  makeTwinData(makeMockMachine(7, 'Motor IM-007'), makeMockTwin(7, 'NORMAL', 100, 'NONE')),
  makeTwinData(makeMockMachine(8, 'Motor IM-008'), makeMockTwin(8, 'NORMAL', 100, 'NONE')),
];

describe('Phase 10.3 — Three-Phase Induction Motor Digital Twin Tests', () => {
  it('renders technical Three-Phase Induction Motor components (stator, rotor, shaft, cooling fan, bearings, L1/L2/L3)', () => {
    const machine = makeMockMachine(1, 'Motor IM-001');
    const twin = makeMockTwin(1, 'NORMAL', 95, 'NONE');

    const { container } = render(
      <BrowserRouter>
        <DigitalTwin machine={machine} twin={twin} mode="compact" />
      </BrowserRouter>
    );

    // Motor Card & Header
    expect(screen.getByText('MOTOR IM-001')).toBeInTheDocument();
    expect(screen.getByText(/Three-Phase Induction Motor/i)).toBeInTheDocument();
    expect(screen.getByText(/● NORMAL/i)).toBeInTheDocument();

    // Technical 3-phase SVG elements & recognizable induction motor anatomy
    expect(container.querySelector('.motor-svg')).toBeInTheDocument();
    expect(container.querySelector('#motor-cooling-fan-shroud')).toBeInTheDocument();
    expect(container.querySelector('#motor-shaft')).toBeInTheDocument();
    expect(container.querySelector('#motor-stator-body')).toBeInTheDocument();
    expect(container.querySelector('#internal-core-rotor')).toBeInTheDocument();
    expect(container.querySelector('#bearing-de')).toBeInTheDocument();
    expect(container.querySelector('#bearing-nde')).toBeInTheDocument();
    expect(container.querySelector('#three-phase-terminal-box')).toBeInTheDocument();

    expect(screen.getAllByText('L1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('L2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('L3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('3Φ TERMINAL')).toBeInTheDocument();
    expect(screen.getByText('FAN COWL')).toBeInTheDocument();
    expect(screen.getByText('DE BRG')).toBeInTheDocument();
    expect(screen.getByText('NDE BRG')).toBeInTheDocument();

    // Telemetry strip
    expect(screen.getByText(/54(\.0)?°C/)).toBeInTheDocument();
    expect(screen.getByText(/1\.8(0)? mm\/s/)).toBeInTheDocument();
    expect(screen.getByText(/1480/)).toBeInTheDocument();
  });

  it('renders interactive sensor modal on clicking a physical sensor point or telemetry strip', () => {
    const machine = makeMockMachine(1, 'Motor IM-001');
    const twin = makeMockTwin(1, 'NORMAL', 95, 'NONE');

    render(
      <BrowserRouter>
        <DigitalTwin machine={machine} twin={twin} mode="full" />
      </BrowserRouter>
    );

    // Click Temperature inspector in telemetry strip
    const tempHotspot = screen.getByTitle(/Click to inspect Temperature/i);
    fireEvent.click(tempHotspot);

    // Modal popup reveals technical details
    expect(screen.getByText(/Current Live Reading/i)).toBeInTheDocument();
    expect(screen.getByText(/Operating Threshold Ranges/i)).toBeInTheDocument();
    expect(screen.getByText(/Embedded Pt100 RTD/i)).toBeInTheDocument();
  });

  describe('1 MACHINE = 1 DIGITAL TWIN Rule', () => {
    it('CASE 1: renders exactly 1 twin when 1 machine exists', () => {
      render(
        <BrowserRouter>
          <FleetDigitalTwinView twinData={fleet8.slice(0, 1)} />
        </BrowserRouter>
      );

      const twinCards = screen.getAllByTestId('digital-twin-card');
      expect(twinCards).toHaveLength(1);
      expect(screen.getByText('MOTOR IM-001')).toBeInTheDocument();
      expect(screen.queryByText('MOTOR IM-002')).not.toBeInTheDocument();
    });

    it('CASE 2: renders exactly 2 twins when 2 machines exist', () => {
      render(
        <BrowserRouter>
          <FleetDigitalTwinView twinData={fleet8.slice(0, 2)} />
        </BrowserRouter>
      );

      const twinCards = screen.getAllByTestId('digital-twin-card');
      expect(twinCards).toHaveLength(2);
      expect(screen.getByText('MOTOR IM-001')).toBeInTheDocument();
      expect(screen.getByText('MOTOR IM-002')).toBeInTheDocument();
      expect(screen.queryByText('MOTOR IM-003')).not.toBeInTheDocument();
    });

    it('CASE 3: renders exactly 3 twins when 3 machines exist', () => {
      render(
        <BrowserRouter>
          <FleetDigitalTwinView twinData={fleet8.slice(0, 3)} />
        </BrowserRouter>
      );

      const twinCards = screen.getAllByTestId('digital-twin-card');
      expect(twinCards).toHaveLength(3);
      expect(screen.getByText('MOTOR IM-001')).toBeInTheDocument();
      expect(screen.getByText('MOTOR IM-002')).toBeInTheDocument();
      expect(screen.getByText('MOTOR IM-003')).toBeInTheDocument();
    });

    it('CASE 4: renders exactly 8 twins for the complete 8-machine fleet', () => {
      render(
        <BrowserRouter>
          <FleetDigitalTwinView twinData={fleet8} />
        </BrowserRouter>
      );

      const twinCards = screen.getAllByTestId('digital-twin-card');
      expect(twinCards).toHaveLength(8);
      for (let i = 1; i <= 8; i++) {
        expect(screen.getByText(`MOTOR IM-00${i}`)).toBeInTheDocument();
      }
    });

    it('CASE 5: twin count decreases automatically when machines are removed', () => {
      const { rerender } = render(
        <BrowserRouter>
          <FleetDigitalTwinView twinData={fleet8.slice(0, 4)} />
        </BrowserRouter>
      );

      expect(screen.getAllByTestId('digital-twin-card')).toHaveLength(4);

      // Remove 1 machine
      rerender(
        <BrowserRouter>
          <FleetDigitalTwinView twinData={fleet8.slice(0, 3)} />
        </BrowserRouter>
      );

      expect(screen.getAllByTestId('digital-twin-card')).toHaveLength(3);
    });

    it('CASE 6: displays clean empty state when 0 machines exist', () => {
      render(
        <BrowserRouter>
          <FleetDigitalTwinView twinData={[]} />
        </BrowserRouter>
      );

      expect(screen.queryByTestId('digital-twin-card')).not.toBeInTheDocument();
      expect(screen.getByText('NO MACHINES AVAILABLE')).toBeInTheDocument();
      expect(
        screen.getByText(/No machines are currently registered in the system/i)
      ).toBeInTheDocument();
    });
  });

  describe('Independent Machine State Visualization', () => {
    it('renders independent visual states for NORMAL (IM-001), CRITICAL (IM-002), and WARNING (IM-005)', () => {
      const { container } = render(
        <BrowserRouter>
          <FleetDigitalTwinView twinData={fleet8} />
        </BrowserRouter>
      );

      // IM-001 is NORMAL
      const card1 = container.querySelector('#digital-twin-machine-1');
      expect(card1).toBeInTheDocument();
      expect(card1).toHaveAttribute('data-state', 'NORMAL');

      // IM-002 is CRITICAL with Bearing Defect
      const card2 = container.querySelector('#digital-twin-machine-2');
      expect(card2).toBeInTheDocument();
      expect(card2).toHaveAttribute('data-state', 'CRITICAL');
      expect(screen.getByText(/Bearing Degradation/i)).toBeInTheDocument();

      // IM-003 is CRITICAL with Stator Short
      const card3 = container.querySelector('#digital-twin-machine-3');
      expect(card3).toBeInTheDocument();
      expect(card3).toHaveAttribute('data-state', 'CRITICAL');
      expect(screen.getByText(/Stator Winding Inter-Turn Short/i)).toBeInTheDocument();

      // IM-005 is WARNING
      const card5 = container.querySelector('#digital-twin-machine-5');
      expect(card5).toBeInTheDocument();
      expect(card5).toHaveAttribute('data-state', 'WARNING');
    });
  });

  describe('Fleet Digital Twin Filtering', () => {
    it('filters twins and maintains strictly accurate count badges', () => {
      const { container } = render(
        <BrowserRouter>
          <FleetDigitalTwinView twinData={fleet8} />
        </BrowserRouter>
      );

      // Verify counts in tab badges
      const tabAll = container.querySelector('#twin-filter-all')!;
      const tabNormal = container.querySelector('#twin-filter-normal')!;
      const tabWarning = container.querySelector('#twin-filter-warning')!;
      const tabCritical = container.querySelector('#twin-filter-critical')!;

      expect(tabAll).toHaveTextContent('8');
      expect(tabNormal).toHaveTextContent('4');
      expect(tabWarning).toHaveTextContent('1');
      expect(tabCritical).toHaveTextContent('3');

      // Click WARNING tab
      fireEvent.click(tabWarning);
      const warningCards = screen.getAllByTestId('digital-twin-card');
      expect(warningCards).toHaveLength(1);
      expect(screen.getByText('MOTOR IM-005')).toBeInTheDocument();

      // Click CRITICAL tab
      fireEvent.click(tabCritical);
      const criticalCards = screen.getAllByTestId('digital-twin-card');
      expect(criticalCards).toHaveLength(3);
      expect(screen.getByText('MOTOR IM-002')).toBeInTheDocument();
      expect(screen.getByText('MOTOR IM-003')).toBeInTheDocument();
      expect(screen.getByText('MOTOR IM-006')).toBeInTheDocument();

      // Click ALL tab to restore
      fireEvent.click(tabAll);
      expect(screen.getAllByTestId('digital-twin-card')).toHaveLength(8);
    }, 25000);
  });
});
