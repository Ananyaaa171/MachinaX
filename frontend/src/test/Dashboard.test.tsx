/* ================================================================
   MACHINA-X — Dashboard Component Tests
   Verifies rendering, loading states, error states, and data display
   for all dashboard sections.
   ================================================================ */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// ---- Components Under Test ----
import DigitalTwinCard from '../components/DigitalTwinCard';
import HealthGauge from '../components/HealthGauge';
import SensorCards from '../components/SensorCards';
import MLInsightsCard from '../components/MLInsightsCard';
import SHAPExplanationCard from '../components/SHAPExplanationCard';
import RULCard from '../components/RULCard';
import MaintenanceCard from '../components/MaintenanceCard';
import ConnectionStatus from '../components/ConnectionStatus';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

// ---- Mock Data ----
import type {
  DigitalTwinStateResponse,
  MLPredictionResponse,
  ExplanationResponse,
  RULPredictionResponse,
  MaintenanceRecommendationResponse,
  LatestSensorValueDto,
} from '../types';

const mockDigitalTwin: DigitalTwinStateResponse = {
  machineId: 1,
  machineName: 'Motor IM-001',
  serialNumber: 'IM-001-2024',
  healthScore: 94,
  operatingState: 'NORMAL',
  anomalyDetected: false,
  anomalyScore: 0.12,
  currentFaultType: 'NONE',
  faultProbability: 0.05,
  latestSensors: [
    {
      sensorId: 1,
      sensorLabel: 'Drive-End Bearing Vibration',
      sensorType: 'VIBRATION',
      value: 2.15,
      unit: 'mm/s',
      status: 'NORMAL',
      normalMin: 0,
      normalMax: 4.5,
      warningMin: 4.5,
      warningMax: 7.1,
      criticalMin: 7.1,
      criticalMax: 15,
      recordedAt: '2026-09-29T09:00:00Z',
    },
    {
      sensorId: 2,
      sensorLabel: 'Stator Current',
      sensorType: 'CURRENT',
      value: 12.4,
      unit: 'A',
      status: 'NORMAL',
      normalMin: 8,
      normalMax: 16,
      warningMin: 16,
      warningMax: 20,
      criticalMin: 20,
      criticalMax: 25,
      recordedAt: '2026-09-29T09:00:00Z',
    },
  ],
  lastSensorBatchAt: '2026-09-29T09:00:00Z',
  lastUpdatedAt: '2026-09-29T09:00:00Z',
  rul: { estimatedHours: 420, confidence: 'MEDIUM', degradationTrend: 'STABLE' },
  maintenance: { priority: 'P3_MONITOR', recommendation: 'Continue monitoring' },
  explanation: { summary: 'All parameters within normal range' },
};

const mockMLPrediction: MLPredictionResponse = {
  id: 1,
  machineId: 1,
  anomalyDetected: false,
  anomalyScore: 0.12,
  faultType: 'NONE',
  faultProbability: 0.05,
  modelVersion: '1.0.0',
  modelName: 'xgboost',
  inputFeatures: null,
  output: null,
  processingTimeMs: 23,
  predictionTimestamp: '2026-09-29T09:00:00Z',
  createdAt: '2026-09-29T09:00:00Z',
};

const mockExplanation: ExplanationResponse = {
  machineId: 1,
  mlPredictionId: 1,
  faultType: 'NONE',
  faultProbability: 0.05,
  features: [
    { feature: 'vibration', value: 2.15, shapValue: 0.02, impact: 'low' },
    { feature: 'current', value: 12.4, shapValue: 0.01, impact: 'low' },
    { feature: 'temperature', value: 62.5, shapValue: 0.03, impact: 'moderate' },
    { feature: 'rpm', value: 2915, shapValue: 0.005, impact: 'low' },
  ],
  summary: 'All parameters within normal range.',
  modelVersion: '1.0.0',
};

const mockRUL: RULPredictionResponse = {
  id: 1,
  machineId: 1,
  estimatedRulHours: 420,
  unit: 'HOURS',
  confidence: 'MEDIUM',
  degradationTrend: 'STABLE',
  predictionTimestamp: '2026-09-29T09:00:00Z',
  modelVersion: '1.0.0',
};

const mockMaintenance: MaintenanceRecommendationResponse = {
  id: 1,
  machineId: 1,
  priority: 'P3_MONITOR',
  faultType: 'NONE',
  recommendation: 'Continue monitoring. All parameters within normal range.',
  generatedAt: '2026-09-29T09:00:00Z',
  status: 'ACTIVE',
};

// ---- Utility ----
function wrap(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

// ================================================================
// Test Suites
// ================================================================

describe('LoadingState', () => {
  it('renders loading message', () => {
    render(<LoadingState message="Loading test…" />);
    expect(screen.getByText('Loading test…')).toBeInTheDocument();
  });

  it('renders default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders error message', () => {
    render(<ErrorState message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders empty message', () => {
    render(<EmptyState message="No data yet" />);
    expect(screen.getByText('No data yet')).toBeInTheDocument();
  });
});

describe('ConnectionStatus', () => {
  it('shows online status', () => {
    render(<ConnectionStatus online={true} lastUpdated={new Date()} />);
    expect(screen.getByText('System Online')).toBeInTheDocument();
  });

  it('shows offline status', () => {
    render(<ConnectionStatus online={false} lastUpdated={null} />);
    expect(screen.getByText('Backend Offline')).toBeInTheDocument();
  });
});

describe('DigitalTwinCard', () => {
  it('renders loading state', () => {
    wrap(<DigitalTwinCard data={null} loading={true} error={null} />);
    expect(screen.getByText('Loading digital twin…')).toBeInTheDocument();
  });

  it('renders error state', () => {
    wrap(<DigitalTwinCard data={null} loading={false} error={new Error('fail')} />);
    expect(screen.getByText('Digital twin data unavailable')).toBeInTheDocument();
  });

  it('renders digital twin data', () => {
    wrap(<DigitalTwinCard data={mockDigitalTwin} loading={false} error={null} />);
    expect(screen.getByText('Motor IM-001')).toBeInTheDocument();
    expect(screen.getByText('IM-001-2024')).toBeInTheDocument();
    expect(screen.getByText('NORMAL')).toBeInTheDocument();
  });

  it('renders anomaly status when detected', () => {
    const anomalyData = { ...mockDigitalTwin, anomalyDetected: true };
    wrap(<DigitalTwinCard data={anomalyData} loading={false} error={null} />);
    expect(screen.getByText('✕ Detected')).toBeInTheDocument();
  });
});

describe('HealthGauge', () => {
  it('renders loading state', () => {
    render(<HealthGauge score={null} loading={true} />);
    expect(screen.getByText('Loading health…')).toBeInTheDocument();
  });

  it('renders health score', () => {
    render(<HealthGauge score={94} loading={false} />);
    expect(screen.getByText('94')).toBeInTheDocument();
    expect(screen.getByText('/ 100')).toBeInTheDocument();
  });

  it('renders unavailable when score is null', () => {
    render(<HealthGauge score={null} loading={false} />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
});

describe('SensorCards', () => {
  it('renders loading state', () => {
    render(<SensorCards sensors={undefined} loading={true} />);
    expect(screen.getByText('Loading sensor data…')).toBeInTheDocument();
  });

  it('renders empty state when no sensors', () => {
    render(<SensorCards sensors={[]} loading={false} />);
    expect(screen.getByText('No sensor data available yet')).toBeInTheDocument();
  });

  it('renders sensor cards dynamically', () => {
    render(<SensorCards sensors={mockDigitalTwin.latestSensors} loading={false} />);
    expect(screen.getByText('Drive-End Bearing Vibration')).toBeInTheDocument();
    expect(screen.getByText('Stator Current')).toBeInTheDocument();
    expect(screen.getByText('mm/s')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});

describe('MLInsightsCard', () => {
  it('renders loading state', () => {
    render(<MLInsightsCard prediction={null} loading={true} error={null} />);
    expect(screen.getByText('Loading AI prediction…')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<MLInsightsCard prediction={null} loading={false} error={new Error('fail')} />);
    expect(screen.getByText('AI prediction temporarily unavailable')).toBeInTheDocument();
  });

  it('renders no prediction state', () => {
    render(<MLInsightsCard prediction={null} loading={false} error={null} />);
    expect(screen.getByText('No prediction available yet')).toBeInTheDocument();
  });

  it('renders ML prediction data', () => {
    render(<MLInsightsCard prediction={mockMLPrediction} loading={false} error={null} />);
    expect(screen.getByText('✓ No Anomaly')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument(); // fault type NONE -> "None"
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('renders anomaly detected state', () => {
    const anomalyPrediction = {
      ...mockMLPrediction,
      anomalyDetected: true,
      faultType: 'BEARING_DEFECT' as const,
      faultProbability: 0.89,
    };
    render(<MLInsightsCard prediction={anomalyPrediction} loading={false} error={null} />);
    expect(screen.getByText('✕ Anomaly Detected')).toBeInTheDocument();
    expect(screen.getByText('Bearing Defect')).toBeInTheDocument();
    expect(screen.getByText('89.0%')).toBeInTheDocument();
  });
});

describe('SHAPExplanationCard', () => {
  it('renders loading state', () => {
    render(<SHAPExplanationCard explanation={null} loading={true} error={null} />);
    expect(screen.getByText('Loading explanation…')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<SHAPExplanationCard explanation={null} loading={false} error={new Error('fail')} />);
    expect(screen.getByText('Explanation temporarily unavailable')).toBeInTheDocument();
  });

  it('renders SHAP features', () => {
    render(<SHAPExplanationCard explanation={mockExplanation} loading={false} error={null} />);
    expect(screen.getByText('vibration')).toBeInTheDocument();
    expect(screen.getByText('current')).toBeInTheDocument();
    expect(screen.getByText('temperature')).toBeInTheDocument();
    expect(screen.getByText('rpm')).toBeInTheDocument();
    expect(screen.getByText('All parameters within normal range.')).toBeInTheDocument();
  });

  it('includes SHAP disclaimer', () => {
    render(<SHAPExplanationCard explanation={mockExplanation} loading={false} error={null} />);
    expect(
      screen.getByText(/not physical causation/i),
    ).toBeInTheDocument();
  });
});

describe('RULCard', () => {
  it('renders loading state', () => {
    render(<RULCard rul={null} loading={true} error={null} />);
    expect(screen.getByText('Loading RUL…')).toBeInTheDocument();
  });

  it('renders RUL unavailable when null', () => {
    render(<RULCard rul={null} loading={false} error={null} />);
    expect(screen.getByText('RUL unavailable')).toBeInTheDocument();
  });

  it('renders RUL data', () => {
    render(<RULCard rul={mockRUL} loading={false} error={null} />);
    expect(screen.getByText('420')).toBeInTheDocument();
    expect(screen.getByText('hours')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('STABLE')).toBeInTheDocument();
  });

  it('includes estimate disclaimer', () => {
    render(<RULCard rul={mockRUL} loading={false} error={null} />);
    expect(
      screen.getByText(/model estimate/i),
    ).toBeInTheDocument();
  });
});

describe('MaintenanceCard', () => {
  it('renders loading state', () => {
    render(<MaintenanceCard maintenance={null} loading={true} error={null} />);
    expect(screen.getByText('Loading maintenance…')).toBeInTheDocument();
  });

  it('renders no recommendation state', () => {
    render(<MaintenanceCard maintenance={null} loading={false} error={null} />);
    expect(screen.getByText('No maintenance recommendation yet')).toBeInTheDocument();
  });

  it('renders maintenance data', () => {
    render(<MaintenanceCard maintenance={mockMaintenance} loading={false} error={null} />);
    expect(screen.getByText('P3 — Monitor')).toBeInTheDocument();
    expect(screen.getByText('Continue monitoring. All parameters within normal range.')).toBeInTheDocument();
  });

  it('includes maintenance disclaimer', () => {
    render(<MaintenanceCard maintenance={mockMaintenance} loading={false} error={null} />);
    expect(
      screen.getByText(/does not replace qualified maintenance personnel/i),
    ).toBeInTheDocument();
  });
});

// ================================================================
// API Failure Isolation Test
// ================================================================

describe('Dashboard Failure Isolation', () => {
  it('DigitalTwinCard error does not crash other components', () => {
    // Render multiple components - if DigitalTwin errors, others should still render
    const { container } = wrap(
      <>
        <DigitalTwinCard data={null} loading={false} error={new Error('fail')} />
        <HealthGauge score={94} loading={false} />
        <MLInsightsCard prediction={mockMLPrediction} loading={false} error={null} />
      </>,
    );

    expect(container).toBeTruthy();
    expect(screen.getByText('Digital twin data unavailable')).toBeInTheDocument();
    expect(screen.getByText('94')).toBeInTheDocument();
    expect(screen.getByText('✓ No Anomaly')).toBeInTheDocument();
  });

  it('ML failure shows message without crashing', () => {
    const { container } = wrap(
      <>
        <DigitalTwinCard data={mockDigitalTwin} loading={false} error={null} />
        <MLInsightsCard prediction={null} loading={false} error={new Error('ML service down')} />
      </>,
    );

    expect(container).toBeTruthy();
    expect(screen.getByText('Motor IM-001')).toBeInTheDocument();
    expect(screen.getByText('AI prediction temporarily unavailable')).toBeInTheDocument();
  });
});
