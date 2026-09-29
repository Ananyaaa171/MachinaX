/* ================================================================
   MachinePage.tsx — Machine detail / drill-down view.
   Replaces the old Dashboard.tsx with the new shell layout.
   Preserves all existing components intact.
   ================================================================ */

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import MachineSelector from '../components/MachineSelector';
import ConnectionStatus from '../components/ConnectionStatus';
import DigitalTwinCard from '../components/DigitalTwinCard';
import HealthGauge from '../components/HealthGauge';
import SensorCards from '../components/SensorCards';
import SensorTrends from '../components/SensorTrends';
import MLInsightsCard from '../components/MLInsightsCard';
import SHAPExplanationCard from '../components/SHAPExplanationCard';
import RULCard from '../components/RULCard';
import MaintenanceCard from '../components/MaintenanceCard';
import LoadingState from '../components/LoadingState';

export default function MachinePage() {
  const { machineId: paramMachineId } = useParams<{ machineId: string }>();
  const navigate = useNavigate();

  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(
    paramMachineId ? Number(paramMachineId) : null,
  );

  const handleMachineSelect = useCallback(
    (id: number) => {
      setSelectedMachineId(id);
      navigate(`/dashboard/${id}`, { replace: true });
    },
    [navigate],
  );

  const { data, errors, loading, lastUpdated, backendOnline } =
    useDashboard(selectedMachineId);

  return (
    <>
      {/* ---- Machine page header ---- */}
      <div className="machine-detail-header">
        <div className="machine-detail-title">
          <div
            className="machine-detail-title__back"
            onClick={() => navigate('/dashboard')}
            title="Back to Fleet Overview"
            role="button"
            tabIndex={0}
            id="btn-back-to-fleet"
          >
            ←
          </div>
          <div>
            <div className="machine-detail-title__name">
              {data.digitalTwin?.machineName || 'Machine Detail'}
            </div>
            {data.digitalTwin && (
              <div className="machine-detail-title__serial">
                S/N: {data.digitalTwin.serialNumber}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MachineSelector
            selectedId={selectedMachineId}
            onSelect={handleMachineSelect}
          />
          <ConnectionStatus
            online={backendOnline}
            lastUpdated={lastUpdated}
          />
        </div>
      </div>

      {/* ---- Content ---- */}
      {!selectedMachineId ? (
        <div className="full-page-loading">
          <LoadingState message="Select a machine to begin monitoring…" />
        </div>
      ) : loading && !data.digitalTwin ? (
        <div className="full-page-loading">
          <LoadingState message="Loading machine data…" />
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Row 1: Status Overview */}
          <section>
            <div className="section-header">
              <div className="section-header__left">
                <span className="section-header__icon">📊</span>
                <h2
                  className="section-header__title"
                  style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-secondary)' }}
                >
                  System Overview
                </h2>
              </div>
            </div>
            <div className="dashboard-grid__row--status">
              <DigitalTwinCard
                data={data.digitalTwin}
                loading={false}
                error={errors.digitalTwin}
              />
              <HealthGauge
                score={data.digitalTwin?.healthScore}
                loading={false}
              />
            </div>
          </section>

          {/* Row 2: Live Sensor Data */}
          <section>
            <div className="section-header">
              <div className="section-header__left">
                <span className="section-header__icon">📡</span>
                <h2
                  className="section-header__title"
                  style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-secondary)' }}
                >
                  Live Sensor Data
                </h2>
              </div>
            </div>
            <SensorCards
              sensors={data.digitalTwin?.latestSensors}
              loading={false}
            />
          </section>

          {/* Row 3: Sensor Trends */}
          <section>
            <div className="section-header">
              <div className="section-header__left">
                <span className="section-header__icon">📈</span>
                <h2
                  className="section-header__title"
                  style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-secondary)' }}
                >
                  Sensor Trends
                </h2>
              </div>
            </div>
            <SensorTrends
              machineId={selectedMachineId}
              sensors={data.sensors}
            />
          </section>

          {/* Row 4: AI/ML Insights */}
          <section>
            <div className="section-header">
              <div className="section-header__left">
                <span className="section-header__icon">🤖</span>
                <h2
                  className="section-header__title"
                  style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-secondary)' }}
                >
                  AI / ML Insights
                </h2>
              </div>
            </div>
            <div className="dashboard-grid__row--insights">
              <MLInsightsCard
                prediction={data.mlPrediction}
                loading={false}
                error={errors.mlPrediction}
              />
              <SHAPExplanationCard
                explanation={data.explanation}
                loading={false}
                error={errors.explanation}
              />
            </div>
          </section>

          {/* Row 5: Predictive Maintenance */}
          <section>
            <div className="section-header">
              <div className="section-header__left">
                <span className="section-header__icon">🔧</span>
                <h2
                  className="section-header__title"
                  style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-secondary)' }}
                >
                  Predictive Maintenance
                </h2>
              </div>
            </div>
            <div className="dashboard-grid__row--insights">
              <RULCard
                rul={data.rul}
                loading={false}
                error={errors.rul}
              />
              <MaintenanceCard
                maintenance={data.maintenance}
                loading={false}
                error={errors.maintenance}
              />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
