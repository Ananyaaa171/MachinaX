/* ================================================================
   AnalyticsPage.tsx — Prognostic & Fleet Reliability Analytics
   Phase 10: Fleet health trends, machine MTBF comparison,
   fault distribution, sensor cross-correlation, and risk charts.
   ================================================================ */

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { demoDataService } from '../services/demoDataService';
import { useDemoUser } from '../context/DemoUserContext';
import GenerateReportModal from '../components/report/GenerateReportModal';
import RecentReportsSection from '../components/report/RecentReportsSection';

export default function AnalyticsPage() {
  const { currentUser } = useDemoUser();
  const [analytics] = useState(() => demoDataService.getAnalyticsData());
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#fff" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={700}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="analytics-page" id="page-reliability-analytics">
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
              — {currentUser.focusArea === 'RELIABILITY'
                ? 'Lead Reliability Analyst Mode — Machine degradation trajectories, MTBF reliability curves & SHAP feature attributions'
                : currentUser.focusArea === 'OVERVIEW'
                ? 'Plant KPI summaries, fleet availability & overall uptime metrics'
                : currentUser.focusArea === 'MAINTENANCE'
                ? 'Evaluating overhaul frequency vs. recurring fault modes'
                : 'Operational health history & sensor threshold analytics'}
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
          DEMONSTRATION ANALYTICS
        </span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">PROGNOSTIC & RELIABILITY ANALYTICS</h1>
          <div className="page-header__subtitle">
            Long-term fleet health trends, failure probability distributions, and sensor correlation analysis
          </div>
        </div>
        <div className="page-header__actions">
          <button
            className="btn btn--primary"
            id="btn-analytics-generate-report"
            onClick={() => setReportModalOpen(true)}
            style={{ fontWeight: 700 }}
          >
            📊 Generate Report
          </button>
        </div>
      </div>

      {/* Analytics KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__label">Average Fleet Health</span>
            <span className="summary-card__icon summary-card__icon--healthy">♥</span>
          </div>
          <div className="summary-card__number" style={{ color: 'var(--color-healthy)' }}>
            88.4%
          </div>
          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Target: &gt; 85.0%</div>
        </div>

        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__label">Fleet MTBF</span>
            <span className="summary-card__icon summary-card__icon--total">⏳</span>
          </div>
          <div className="summary-card__number" style={{ color: 'var(--color-info)' }}>
            4,260 hrs
          </div>
          <div style={{ fontSize: '0.67rem', color: 'var(--color-healthy)' }}>▲ +5.2% vs last month</div>
        </div>

        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__label">Unplanned Downtime</span>
            <span className="summary-card__icon summary-card__icon--warning">⚡</span>
          </div>
          <div className="summary-card__number" style={{ color: 'var(--color-warning)' }}>
            0.42%
          </div>
          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>World class: &lt; 1.0%</div>
        </div>

        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__label">Predictive Accuracy</span>
            <span className="summary-card__icon summary-card__icon--alerts">🎯</span>
          </div>
          <div className="summary-card__number" style={{ color: 'var(--color-healthy)' }}>
            99.3%
          </div>
          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>XGBoost Classifier F1</div>
        </div>
      </div>

      {/* Row 1: Fleet Health Trend & Fault Distribution */}
      <div className="two-col-row" style={{ marginBottom: 20 }}>
        {/* Fleet Health Trend */}
        <div className="panel-card">
          <div className="panel-card__header">
            <div className="panel-card__title">
              <span>📈</span> FLEET HEALTH TRAJECTORY (PAST 24 HOURS)
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Hourly Average %</span>
          </div>
          <div className="panel-card__body">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.fleetHealthTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[80, 100]} stroke="#64748b" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: 4, fontSize: '0.75rem' }}
                  />
                  <Line type="monotone" dataKey="health" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} name="Fleet Health" />
                  <Line type="monotone" dataKey="baseline" stroke="#64748b" strokeDasharray="4 4" strokeWidth={1.5} name="Target (95%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Fault Mode Distribution */}
        <div className="panel-card">
          <div className="panel-card__header">
            <div className="panel-card__title">
              <span>📊</span> OBSERVED FAULT MODES DISTRIBUTION
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ML Classification Frequency</span>
          </div>
          <div className="panel-card__body">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.faultDistribution} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={110} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: 4, fontSize: '0.75rem' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {analytics.faultDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Machine Reliability Comparison & Risk Breakdown */}
      <div className="two-col-row" style={{ marginBottom: 20 }}>
        {/* Machine Reliability */}
        <div className="panel-card">
          <div className="panel-card__header">
            <div className="panel-card__title">
              <span>⚙</span> ASSET RELIABILITY & MTBF COMPARISON
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Hours to Scheduled Overhaul</span>
          </div>
          <div className="panel-card__body">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.machineReliability}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={11} unit="h" />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: 4, fontSize: '0.75rem' }}
                  />
                  <Bar dataKey="mtbfHours" fill="#38bdf8" radius={[4, 4, 0, 0]} name="MTBF (Hours)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Failure Risk Breakdown */}
        <div className="panel-card">
          <div className="panel-card__header">
            <div className="panel-card__title">
              <span>🍩</span> FLEET FAILURE RISK DISTRIBUTION
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Prognostic Risk Tiering</span>
          </div>
          <div className="panel-card__body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.failureRiskBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={85}
                    innerRadius={45}
                    dataKey="value"
                  >
                    {analytics.failureRiskBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: 4, fontSize: '0.75rem' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.72rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports Section */}
      <RecentReportsSection />

      {/* Generate Report Modal */}
      <GenerateReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
}
