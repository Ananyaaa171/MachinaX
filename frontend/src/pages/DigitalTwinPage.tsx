/* ================================================================
   DigitalTwinPage.tsx — Dedicated Interactive Digital Twin Center
   Phase 10: Centerpiece page featuring vector industrial induction
   motor, real-time sensor streams, condition diagnosis, ML RUL
   forecasts, and multi-sensor telemetry history charts.
   ================================================================ */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMachine,
  getMachines,
  getDigitalTwin,
  getMachineSensors,
  getLatestMLPrediction,
  getLatestRUL,
  getLatestMaintenance,
  getLatestExplanation,
} from '../api/client';
import type {
  MachineResponse,
  MachineSensorResponse,
  DigitalTwinStateResponse,
  MLPredictionResponse,
  RULPredictionResponse,
  MaintenanceRecommendationResponse,
  ExplanationResponse,
} from '../types';
import InteractiveMotorTwin from '../components/twin/InteractiveMotorTwin';
import SensorTrends from '../components/SensorTrends';
import SHAPExplanationCard from '../components/SHAPExplanationCard';
import HealthGauge from '../components/HealthGauge';
import { useDemoUser } from '../context/DemoUserContext';

export default function DigitalTwinPage() {
  const { machineId: paramId } = useParams<{ machineId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useDemoUser();

  const [machineId, setMachineId] = useState<number>(Number(paramId) || 1);
  const [machines, setMachines] = useState<MachineResponse[]>([]);
  const [machine, setMachine] = useState<MachineResponse | null>(null);
  const [sensors, setSensors] = useState<MachineSensorResponse[]>([]);
  const [twin, setTwin] = useState<DigitalTwinStateResponse | null>(null);
  const [ml, setMl] = useState<MLPredictionResponse | null>(null);
  const [rul, setRul] = useState<RULPredictionResponse | null>(null);
  const [maint, setMaint] = useState<MaintenanceRecommendationResponse | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Update URL if param changed
  useEffect(() => {
    if (paramId && Number(paramId) !== machineId) {
      setMachineId(Number(paramId));
    }
  }, [paramId, machineId]);

  // Load machine list for top dropdown
  useEffect(() => {
    getMachines()
      .then((data) => {
        if (Array.isArray(data)) setMachines(data);
      })
      .catch(() => {});
  }, []);

  // Fetch machine + digital twin telemetry
  const fetchData = useCallback(async () => {
    try {
      const [mRes, sRes, twinRes, mlRes, rulRes, maintRes, expRes] = await Promise.allSettled([
        getMachine(machineId),
        getMachineSensors(machineId),
        getDigitalTwin(machineId),
        getLatestMLPrediction(machineId),
        getLatestRUL(machineId),
        getLatestMaintenance(machineId),
        getLatestExplanation(machineId),
      ]);

      if (mRes.status === 'fulfilled') setMachine(mRes.value);
      if (sRes.status === 'fulfilled' && Array.isArray(sRes.value)) setSensors(sRes.value);
      if (twinRes.status === 'fulfilled') setTwin(twinRes.value);
      if (mlRes.status === 'fulfilled') setMl(mlRes.value);
      if (rulRes.status === 'fulfilled') setRul(rulRes.value);
      if (maintRes.status === 'fulfilled') setMaint(maintRes.value);
      if (expRes.status === 'fulfilled') setExplanation(expRes.value);

      setLastRefreshed(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Failed to load twin data:', err);
      setLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSelectMachine = (newId: number) => {
    setMachineId(newId);
    navigate(`/machines/${newId}`);
  };

  // State calculations
  const healthScore = twin?.healthScore ?? 100;
  const operatingState = twin?.operatingState || 'NORMAL';
  const anomalyDetected = twin?.anomalyDetected ?? false;
  const currentFault = twin?.currentFaultType && twin.currentFaultType !== 'NONE'
    ? twin.currentFaultType.replace(/_/g, ' ')
    : ml?.faultType && ml.faultType !== 'NONE'
    ? ml.faultType.replace(/_/g, ' ')
    : 'None (Healthy)';

  const failureProb = ml?.faultProbability
    ? Math.round(ml.faultProbability * 100)
    : Math.round(Math.max(2, (100 - healthScore) * 0.95));

  const estimatedRULDays = rul?.estimatedRulHours
    ? Math.round(rul.estimatedRulHours / 24)
    : Math.max(1, Math.round(healthScore * 0.5));

  const riskLevel =
    anomalyDetected || operatingState === 'CRITICAL'
      ? 'HIGH'
      : operatingState === 'WARNING' || operatingState === 'WATCH' || healthScore < 70
      ? 'MEDIUM'
      : 'LOW';

  return (
    <div className="digital-twin-page" id="page-digital-twin">
      {/* Role Context Ribbon */}
      <div
        style={{
          background: 'rgba(77, 157, 224, 0.06)',
          border: '1px solid rgba(77, 157, 224, 0.18)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.1rem' }}>👤</span>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentUser.name} ({currentUser.role})
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
              — {currentUser.focusArea === 'OVERVIEW'
                ? 'Inspecting physical asset twin, telemetry health & active alarms'
                : currentUser.focusArea === 'MAINTENANCE'
                ? 'Fault investigation view — bearing acoustic emissions, thermal hotspots & work orders'
                : currentUser.focusArea === 'RELIABILITY'
                ? 'Reliability analytics view — RUL degradation trend & SHAP feature importances'
                : 'Live stream operator view — continuous 2.0s telemetry & threshold tracking'}
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: '0.62rem',
            padding: '2px 8px',
            borderRadius: 3,
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: '0.8px',
          }}
        >
          DEMONSTRATION MODE
        </span>
      </div>

      {/* Page Header & Machine Quick Selector */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            className="btn btn--secondary"
            onClick={() => navigate('/machines')}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            title="Back to Machine Fleet"
          >
            ← Back to Fleet
          </button>
          <div>
            <h1 className="page-header__title" style={{ fontSize: '1.25rem' }}>
              {machine?.name || `Motor IM-00${machineId}`}
            </h1>
            <div className="page-header__subtitle">
              S/N: {machine?.serialNumber || `IM-00${machineId}`} • Location: {machine?.location || 'Plant A - Bay 3'} • Type: {machine?.machineType?.name || '3-Phase Induction Motor'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Quick Machine Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>SELECT ASSET:</span>
            <select
              className="sidebar__select"
              value={machineId}
              onChange={(e) => handleSelectMachine(Number(e.target.value))}
              style={{
                padding: '6px 10px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 600,
                outline: 'none',
              }}
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.serialNumber})
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn--secondary"
            onClick={fetchData}
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            title="Refresh Digital Twin Telemetry"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ================================================================
          SECTION 1: THE INTERACTIVE DIGITAL TWIN VISUALIZER (SVG + CSS)
          ================================================================ */}
      <section className="section" style={{ marginBottom: 20 }}>
        <InteractiveMotorTwin
          twin={twin}
          machineStatus={machine?.status}
          onRefresh={fetchData}
        />
      </section>

      {/* ================================================================
          SECTION 2: MACHINE CONDITION & PROGNOSTIC PANEL
          ================================================================ */}
      <div className="two-col-row" style={{ marginBottom: 20 }}>
        {/* Left: Overall Condition & Diagnostics */}
        <div className="panel-card">
          <div className="panel-card__header">
            <div className="panel-card__title">
              <span>◈</span> MACHINE CONDITION DIAGNOSIS
            </div>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: 3,
                background:
                  riskLevel === 'HIGH'
                    ? 'var(--color-critical-bg)'
                    : riskLevel === 'MEDIUM'
                    ? 'var(--color-warning-bg)'
                    : 'var(--color-healthy-bg)',
                color:
                  riskLevel === 'HIGH'
                    ? 'var(--color-critical)'
                    : riskLevel === 'MEDIUM'
                    ? 'var(--color-warning)'
                    : 'var(--color-healthy)',
                fontWeight: 800,
              }}
            >
              RISK: {riskLevel}
            </span>
          </div>

          <div className="panel-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Health Score & Operating State */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <HealthGauge score={healthScore} loading={loading} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Operating State
                  </span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: operatingState === 'CRITICAL' ? 'var(--color-critical)' : operatingState === 'WARNING' || operatingState === 'WATCH' ? 'var(--color-warning)' : 'var(--color-healthy)' }}>
                    ● {operatingState}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Anomaly Detector</span>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: anomalyDetected ? 'var(--color-critical)' : 'var(--color-healthy)' }}>
                      {anomalyDetected ? '✕ DETECTED' : '✓ NORMAL'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Classified Fault</span>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: currentFault.includes('None') ? 'var(--color-healthy)' : 'var(--color-warning)' }}>
                      {currentFault}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prescriptive Recommended Action */}
            <div
              style={{
                background: 'var(--bg-inset)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `3px solid ${riskLevel === 'HIGH' ? 'var(--color-critical)' : 'var(--color-info)'}`,
              }}
            >
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                Prescriptive Maintenance Action
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: 3, fontWeight: 500 }}>
                {maint?.recommendation ||
                  (currentFault.includes('Bearing')
                    ? 'Inspect drive-end bearing and verify acoustic emission trend; schedule lubricant flush.'
                    : currentFault.includes('Stator')
                    ? 'Perform megger insulation test on stator phase windings; verify phase resistance balance.'
                    : 'System telemetry nominal. Maintain regular 2,000-hour inspection interval.')}
              </div>
            </div>
          </div>
        </div>

        {/* Right: ML Prognostics & RUL Forecast */}
        <div className="panel-card">
          <div className="panel-card__header">
            <div className="panel-card__title">
              <span>⏳</span> PROGNOSTICS & REMAINING USEFUL LIFE
            </div>
            <span
              style={{
                fontSize: '0.62rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ML MODEL: XGBOOST + RUL
            </span>
          </div>

          <div className="panel-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Failure Probability Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Failure Probability (Next 30 Days)</span>
                <span style={{ color: failureProb > 50 ? 'var(--color-critical)' : failureProb > 25 ? 'var(--color-warning)' : 'var(--color-healthy)', fontFamily: 'var(--font-mono)' }}>
                  {failureProb}%
                </span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'var(--bg-inset)', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${failureProb}%`,
                    height: '100%',
                    background:
                      failureProb > 50
                        ? 'var(--color-critical)'
                        : failureProb > 25
                        ? 'var(--color-warning)'
                        : 'var(--color-healthy)',
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
            </div>

            {/* Estimated RUL Days / Hours */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: 'var(--bg-inset)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Estimated RUL
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-info)' }}>
                  {estimatedRULDays}{' '}
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>DAYS</span>
                </div>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  ~{(estimatedRULDays * 24).toLocaleString()} operating hours
                </div>
              </div>

              <div style={{ background: 'var(--bg-inset)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Model Confidence
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-healthy)', marginTop: 2 }}>
                  {rul?.confidence || 'HIGH (96.4%)'}
                </div>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Trend: {rul?.degradationTrend || 'LINEAR ACCELERATING'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Note: Remaining Useful Life calculations are inferred via physics-guided degradation models and simulated operational profiles.
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 3: SENSOR HISTORY TELEMETRY CHARTS
          ================================================================ */}
      <section className="section" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <div className="section-header__left">
            <span className="section-header__icon">📈</span>
            <span className="section-header__title">Recent Sensor Telemetry Streams</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Polling interval: 6s • Real-time
          </span>
        </div>
        <SensorTrends machineId={machineId} sensors={sensors} />
      </section>

      {/* ================================================================
          SECTION 4: SHAP EXPLAINABILITY (AI TRANSPARENCY)
          ================================================================ */}
      {explanation && (
        <section className="section">
          <div className="section-header">
            <div className="section-header__left">
              <span className="section-header__icon">🔍</span>
              <span className="section-header__title">AI Decision Explainability (SHAP Values)</span>
            </div>
          </div>
          <SHAPExplanationCard explanation={explanation} loading={false} error={null} />
        </section>
      )}
    </div>
  );
}
