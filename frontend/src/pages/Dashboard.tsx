/* ================================================================
   Dashboard Page — Main MACHINA-X predictive maintenance dashboard.
   Assembles all components, manages machine selection, and
   coordinates data flow through the useDashboard hook.
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

export default function Dashboard() {
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
      {/* ---- Header ---- */}
      <header className="app-header" id="app-header">
        <div className="app-header__brand">
          <div>
            <div className="app-header__logo">MACHINA-X</div>
            <div className="app-header__subtitle">Digital Twin Predictive Maintenance</div>
          </div>
        </div>
        <div className="app-header__controls">
          <MachineSelector
            selectedId={selectedMachineId}
            onSelect={handleMachineSelect}
          />
          <ConnectionStatus
            online={backendOnline}
            lastUpdated={lastUpdated}
          />
        </div>
      </header>

      {/* ---- Main Content ---- */}
      <main className="app-main" id="dashboard-main">
        {!selectedMachineId ? (
          <div className="full-page-loading">
            <div className="full-page-loading__title">MACHINA-X</div>
            <LoadingState message="Select a machine to begin monitoring…" />
          </div>
        ) : loading && !data.digitalTwin ? (
          <div className="full-page-loading">
            <div className="full-page-loading__title">MACHINA-X</div>
            <LoadingState message="Loading dashboard data…" />
          </div>
        ) : (
          <div className="dashboard-grid">
            {/* ---- Row 1: Status Overview ---- */}
            <section>
              <div className="section-header">
                <span className="section-header__icon">📊</span>
                <h1 className="section-header__title">System Overview</h1>
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

            {/* ---- Row 2: Live Sensor Data ---- */}
            <section>
              <div className="section-header">
                <span className="section-header__icon">📡</span>
                <h2 className="section-header__title">Live Sensor Data</h2>
              </div>
              <SensorCards
                sensors={data.digitalTwin?.latestSensors}
                loading={false}
              />
            </section>

            {/* ---- Row 3: Sensor Trends ---- */}
            <section>
              <div className="section-header">
                <span className="section-header__icon">📈</span>
                <h2 className="section-header__title">Sensor Trends</h2>
              </div>
              <SensorTrends
                machineId={selectedMachineId}
                sensors={data.sensors}
              />
            </section>

            {/* ---- Row 4: AI/ML Insights ---- */}
            <section>
              <div className="section-header">
                <span className="section-header__icon">🤖</span>
                <h2 className="section-header__title">AI / ML Insights</h2>
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

            {/* ---- Row 5: Predictive Maintenance ---- */}
            <section>
              <div className="section-header">
                <span className="section-header__icon">🔧</span>
                <h2 className="section-header__title">Predictive Maintenance</h2>
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
      </main>
    </>
  );
}
