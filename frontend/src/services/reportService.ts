/* ================================================================
   reportService.ts — Maintenance & Fleet Report Generator
   Phase 10.1: Generates structured, professional reports derived
   from actual fleet telemetry, machine digital twin states, and
   demo role context. Supports preview, PDF/HTML download, and history.
   ================================================================ */

import type { MachineTwinData, FleetMetrics } from '../context/FleetContext';
import type { DemoUser } from '../types/user';
import type {
  ReportConfig,
  GeneratedReport,
  RecentReportItem,
  ReportExecutiveSummary,
  ReportMachineHealthRow,
  ReportSensorSummaryRow,
  ReportFaultAlertSummary,
  ReportPredictiveRow,
  ReportMaintenanceRow,
  ReportRecommendation,
} from '../types/report';
import { demoDataService } from './demoDataService';

const REPORT_STORAGE_KEY = 'machinax_recent_reports';

export const reportService = {
  // Generate structured report object from current fleet data and user
  generateReport(
    config: ReportConfig,
    currentUser: DemoUser,
    twinData: MachineTwinData[],
    metrics: FleetMetrics
  ): GeneratedReport {
    const isSingleMachine = config.machineId !== 'ALL';
    const targetTwin = isSingleMachine
      ? twinData.find((d) => d.machine.id === Number(config.machineId))
      : null;

    const reportId = `RPT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 899 + 100)}`;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const typeLabels: Record<string, string> = {
      FLEET_HEALTH: 'Industrial Fleet Health & Reliability Report',
      MACHINE_HEALTH: 'Machine Diagnostic & Digital Twin Health Report',
      PREDICTIVE_MAINTENANCE: 'Prognostic Remaining Useful Life (RUL) Report',
      MAINTENANCE_ACTIVITY: 'Plant Maintenance Work Order & Activity Report',
      ALERT_FAULT: 'Critical Alarms & Root-Cause Fault Diagnostic Report',
    };

    const title = isSingleMachine && targetTwin
      ? `${typeLabels[config.reportType] || 'Machine Report'}: ${targetTwin.machine.name} (${targetTwin.machine.serialNumber})`
      : `${typeLabels[config.reportType] || 'Industrial Maintenance Report'} — Plant Fleet`;

    // Filter relevant dataset
    const relevantItems = isSingleMachine && targetTwin ? [targetTwin] : twinData;

    // 1. Executive Summary
    let executiveSummary: ReportExecutiveSummary | undefined;
    if (config.includeOverview) {
      executiveSummary = {
        totalMachines: isSingleMachine ? 1 : metrics.totalMachines,
        healthyCount: isSingleMachine
          ? targetTwin?.twin?.operatingState === 'NORMAL' ? 1 : 0
          : metrics.healthyCount,
        warningCount: isSingleMachine
          ? targetTwin?.twin?.operatingState === 'WARNING' || targetTwin?.twin?.operatingState === 'WATCH' ? 1 : 0
          : metrics.warningCount,
        criticalCount: isSingleMachine
          ? targetTwin?.twin?.operatingState === 'CRITICAL' ? 1 : 0
          : metrics.criticalCount,
        averageFleetHealth: isSingleMachine
          ? targetTwin?.twin?.healthScore ? Math.round(targetTwin.twin.healthScore * 10) / 10 : null
          : metrics.averageHealth,
        activeAlerts: isSingleMachine
          ? targetTwin?.twin?.anomalyDetected ? 1 : 0
          : metrics.activeAlertsCount,
        machinesRequiringMaintenance: isSingleMachine
          ? (targetTwin?.twin?.healthScore && targetTwin.twin.healthScore < 80) ? 1 : 0
          : metrics.warningCount + metrics.criticalCount,
      };
    }

    // 2. Machine Health Rows
    let machineHealth: ReportMachineHealthRow[] | undefined;
    if (config.includeOverview) {
      machineHealth = relevantItems.map((item) => {
        const { machine, twin } = item;
        const opState = twin?.operatingState || 'NORMAL';
        const health = twin?.healthScore ?? 100;
        const risk =
          opState === 'CRITICAL' || health < 60
            ? 'HIGH'
            : opState === 'WARNING' || opState === 'WATCH' || health < 80
            ? 'MEDIUM'
            : 'LOW';

        const fault =
          twin?.currentFaultType && twin.currentFaultType !== 'NONE'
            ? twin.currentFaultType.replace(/_/g, ' ')
            : item.ml?.faultType && item.ml.faultType !== 'NONE'
            ? item.ml.faultType.replace(/_/g, ' ')
            : 'None (Healthy)';

        return {
          id: machine.id,
          name: machine.name,
          type: machine.machineType?.name || '3-Phase Induction Motor',
          health: Math.round(health * 10) / 10,
          state: opState,
          risk,
          fault,
        };
      });
    }

    // 3. Sensor Summary Rows
    let sensorSummary: ReportSensorSummaryRow[] | undefined;
    if (config.includeSensors) {
      sensorSummary = relevantItems.map((item) => {
        const twin = item.twin;
        let temp = '—';
        let vib = '—';
        let curr = '—';
        let rpm = '—';
        let load = '—';

        if (twin?.latestSensors) {
          twin.latestSensors.forEach((s) => {
            const label = (s.sensorLabel || s.sensorType || '').toLowerCase();
            if (label.includes('temp')) temp = `${s.value.toFixed(1)} °C`;
            else if (label.includes('vib')) vib = `${s.value.toFixed(2)} mm/s`;
            else if (label.includes('curr')) {
              curr = `${s.value.toFixed(1)} A`;
              const ratedA = item.machine.ratedCurrentA || 28;
              load = `${Math.min(100, Math.round((s.value / ratedA) * 100))}%`;
            } else if (label.includes('rpm')) rpm = `${Math.round(s.value)} RPM`;
          });
        }

        return {
          machineName: item.machine.name,
          temperature: temp,
          vibration: vib,
          current: curr,
          rpm,
          load,
        };
      });
    }

    // 4. Fault & Alert Summary
    let faultAlerts: ReportFaultAlertSummary | undefined;
    if (config.includeAlerts) {
      const activeFaults = new Set<string>();
      relevantItems.forEach((d) => {
        if (d.twin?.currentFaultType && d.twin.currentFaultType !== 'NONE') {
          activeFaults.add(d.twin.currentFaultType.replace(/_/g, ' '));
        }
      });

      faultAlerts = {
        criticalAlerts: isSingleMachine
          ? targetTwin?.twin?.operatingState === 'CRITICAL' ? 1 : 0
          : metrics.criticalCount,
        warnings: isSingleMachine
          ? targetTwin?.twin?.operatingState === 'WARNING' ? 1 : 0
          : metrics.warningCount,
        anomaliesDetected: isSingleMachine
          ? targetTwin?.twin?.anomalyDetected ? 1 : 0
          : metrics.anomalyCount,
        activeFaultModes: Array.from(activeFaults),
      };
    }

    // 5. Predictive Maintenance & RUL
    let predictive: ReportPredictiveRow[] | undefined;
    if (config.includePredictive) {
      predictive = relevantItems.map((item) => {
        const { machine, twin, rul, ml } = item;
        const health = twin?.healthScore ?? 100;
        const opState = twin?.operatingState || 'NORMAL';

        const failureRisk =
          opState === 'CRITICAL' || health < 60
            ? 'HIGH'
            : opState === 'WARNING' || health < 80
            ? 'MEDIUM'
            : 'LOW';

        const rulDays = rul?.estimatedRulHours
          ? Math.round(rul.estimatedRulHours / 24)
          : Math.max(1, Math.round(health * 0.5));

        const predictedFault =
          ml?.faultType && ml.faultType !== 'NONE'
            ? ml.faultType.replace(/_/g, ' ')
            : twin?.currentFaultType && twin.currentFaultType !== 'NONE'
            ? twin.currentFaultType.replace(/_/g, ' ')
            : 'Normal Operating Baseline';

        let recommendedAction = 'Routine continuous condition monitoring.';
        if (opState === 'CRITICAL' || health < 50) {
          recommendedAction = 'Immediate plant intervention: schedule isolation & teardown inspection.';
        } else if (opState === 'WARNING' || health < 80) {
          recommendedAction = 'Plan non-destructive acoustic & vibration re-test during next shift maintenance.';
        }

        return {
          machineName: machine.name,
          failureRisk,
          rulDays,
          predictedFault,
          recommendedAction,
        };
      });
    }

    // 6. Maintenance Work Orders
    let maintenance: ReportMaintenanceRow[] | undefined;
    if (config.includeMaintenance) {
      const records = demoDataService.getMaintenanceRecords();
      const filtered = isSingleMachine && targetTwin
        ? records.filter((r: any) => r.machineId === targetTwin.machine.id || r.machineName.includes(targetTwin.machine.name))
        : records;

      maintenance = filtered.map((r: any) => ({
        id: r.id,
        machineName: r.machineName,
        type: r.type,
        dueDate: r.dueDate,
        priority: r.priority,
        technician: r.technician,
        status: r.status,
      }));
    }

    // 7. Actionable Condition-Based Recommendations (CRITICAL REQUIREMENT)
    // Only generate recommendations for machines with abnormal conditions
    let recommendations: ReportRecommendation[] | undefined;
    if (config.includeRecommendations) {
      recommendations = [];
      relevantItems.forEach((item) => {
        const { machine, twin } = item;
        const opState = twin?.operatingState || 'NORMAL';
        const health = twin?.healthScore ?? 100;
        const fault = twin?.currentFaultType;

        // Skip healthy machines without faults
        if (opState === 'NORMAL' && health >= 80 && (!fault || fault === 'NONE')) {
          return;
        }

        // Identify sensor specifics
        let vibVal = 0;
        let tempVal = 0;
        if (twin?.latestSensors) {
          twin.latestSensors.forEach((s) => {
            const label = (s.sensorLabel || s.sensorType || '').toLowerCase();
            if (label.includes('vib')) vibVal = s.value;
            if (label.includes('temp')) tempVal = s.value;
          });
        }

        if (opState === 'CRITICAL' || health < 50) {
          recommendations?.push({
            machineId: machine.id,
            machineName: machine.name,
            severity: 'CRITICAL',
            recommendation: `${machine.name} exhibits critical operating degradation (Health: ${health.toFixed(1)}%). Urgent physical shutdown and electrical/bearing stator inspection recommended within 12 hours.`,
            justification: `Observed vibration ${vibVal > 0 ? `${vibVal.toFixed(2)} mm/s` : 'elevated'} and winding temperature ${tempVal > 0 ? `${tempVal.toFixed(1)} °C` : 'elevated'} exceed ISO 10816 limits.`,
          });
        } else if (opState === 'WARNING' || health < 80) {
          recommendations?.push({
            machineId: machine.id,
            machineName: machine.name,
            severity: 'WARNING',
            recommendation: `${machine.name} shows progressive mechanical/thermal wear (${fault ? fault.replace(/_/g, ' ') : 'elevated harmonics'}). Schedule lubricant replenishment and bearing alignment in next planned maintenance window.`,
            justification: `Operating health is at ${health.toFixed(1)}% with anomaly status flagged by predictive twin model.`,
          });
        }
      });
    }

    const report: GeneratedReport = {
      id: reportId,
      title,
      type: config.reportType,
      machineId: config.machineId,
      machineName: isSingleMachine && targetTwin ? targetTwin.machine.name : 'All Plant Fleet Assets',
      generatedBy: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      },
      generatedAt: formattedDate,
      dateRange: config.dateRange.toUpperCase(),
      executiveSummary,
      machineHealth,
      sensorSummary,
      faultAlerts,
      predictive,
      maintenance,
      recommendations,
      config,
    };

    // Save to history
    reportService.saveToHistory(report);

    return report;
  },

  // Save report item to localStorage history
  saveToHistory(report: GeneratedReport): void {
    try {
      const history = reportService.getRecentReports();
      const newItem: RecentReportItem = {
        id: report.id,
        title: report.title,
        type: report.type,
        machineName: report.machineName || 'Fleet',
        generatedBy: report.generatedBy.name,
        generatedByRole: report.generatedBy.role,
        date: report.generatedAt,
        status: 'Ready',
        reportData: report,
      };

      const updated = [newItem, ...history.filter((h) => h.id !== report.id)].slice(0, 15);
      localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save report history:', err);
    }
  },

  // Get recent reports from localStorage or demo defaults
  getRecentReports(): RecentReportItem[] {
    try {
      const stored = localStorage.getItem(REPORT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn('Could not read reports from localStorage:', err);
    }

    // Default demonstration history
    return [
      {
        id: 'RPT-DEMO-001',
        title: 'Industrial Fleet Health & Reliability Report',
        type: 'FLEET_HEALTH',
        machineName: 'Plant Fleet (8 Assets)',
        generatedBy: 'Ananya Sharma',
        generatedByRole: 'System Administrator',
        date: '29 Sep 2026, 21:00',
        status: 'Ready',
        reportData: {} as any,
      },
      {
        id: 'RPT-DEMO-002',
        title: 'Machine Diagnostic & Digital Twin Health Report: Motor IM-003',
        type: 'MACHINE_HEALTH',
        machineName: 'Motor IM-003',
        generatedBy: 'Aryan Mishra',
        generatedByRole: 'Maintenance Engineer',
        date: '29 Sep 2026, 18:30',
        status: 'Ready',
        reportData: {} as any,
      },
      {
        id: 'RPT-DEMO-003',
        title: 'Prognostic Remaining Useful Life (RUL) Report',
        type: 'PREDICTIVE_MAINTENANCE',
        machineName: 'Plant Fleet',
        generatedBy: 'Aditya Gupta',
        generatedByRole: 'Reliability Engineer',
        date: '28 Sep 2026, 14:15',
        status: 'Ready',
        reportData: {} as any,
      },
    ];
  },

  // Export report as downloadable standalone printable HTML document
  downloadReportHtml(report: GeneratedReport): void {
    const htmlContent = reportService.renderPrintableHtml(report);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MACHINAX-${report.type}-${report.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Render standalone printable styled HTML suitable for printing to PDF
  renderPrintableHtml(report: GeneratedReport): string {
    const exec = report.executiveSummary;
    const machines = report.machineHealth || [];
    const sensors = report.sensorSummary || [];
    const predictive = report.predictive || [];
    const recommendations = report.recommendations || [];

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${report.title} — ${report.id}</title>
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a202c;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 3px solid #2b6cb0;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand { font-size: 20px; font-weight: 900; color: #2b6cb0; letter-spacing: 0.5px; }
    .brand span { color: #4a5568; font-weight: 500; font-size: 13px; margin-left: 8px; }
    .doc-meta { text-align: right; font-size: 11px; color: #718096; }
    .report-title { font-size: 18px; font-weight: 800; margin: 12px 0 6px 0; color: #1a202c; }
    .user-pill {
      display: inline-block;
      background: #ebf8ff;
      border: 1px solid #bee3f8;
      color: #2b6cb0;
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 11px;
      margin-bottom: 16px;
    }
    .section { margin-bottom: 24px; page-break-inside: avoid; }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #2d3748;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .summary-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      background: #f7fafc;
      text-align: center;
    }
    .summary-box .val { font-size: 22px; font-weight: 800; color: #2d3748; }
    .summary-box .lbl { font-size: 11px; color: #718096; text-transform: uppercase; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th { background: #edf2f7; color: #4a5568; font-weight: 700; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e0; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f7fafc; }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-healthy { background: #c6f6d5; color: #22543d; }
    .badge-warning { background: #feebc8; color: #7b341e; }
    .badge-critical { background: #fed7d7; color: #742a2a; }
    .rec-card {
      border-left: 4px solid #dd6b20;
      background: #fffaf0;
      border-top: 1px solid #feebc8;
      border-right: 1px solid #feebc8;
      border-bottom: 1px solid #feebc8;
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 10px;
    }
    .rec-card.critical { border-left-color: #e53e3e; background: #fff5f5; border-color: #fed7d7; }
    .rec-title { font-weight: 700; font-size: 12px; color: #2d3748; }
    .rec-text { font-size: 12px; margin-top: 4px; color: #4a5568; }
    .footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 32px;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #a0aec0;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">MACHINA-X <span>Industrial Predictive Maintenance Control Center</span></div>
      <div class="report-title">${report.title}</div>
      <div class="user-pill">
        Generated by: <strong>${report.generatedBy.name}</strong> (${report.generatedBy.role}) [DEMONSTRATION]
      </div>
    </div>
    <div class="doc-meta">
      <div><strong>Report ID:</strong> ${report.id}</div>
      <div><strong>Date:</strong> ${report.generatedAt}</div>
      <div><strong>Target:</strong> ${report.machineName}</div>
      <div><strong>Interval:</strong> ${report.dateRange}</div>
    </div>
  </div>

  ${
    exec
      ? `
  <div class="section">
    <div class="section-title">1. Executive Summary</div>
    <div class="summary-grid">
      <div class="summary-box">
        <div class="val">${exec.totalMachines}</div>
        <div class="lbl">Monitored Assets</div>
      </div>
      <div class="summary-box">
        <div class="val" style="color: #38a169;">${exec.healthyCount}</div>
        <div class="lbl">Healthy Machines</div>
      </div>
      <div class="summary-box">
        <div class="val" style="color: #dd6b20;">${exec.warningCount}</div>
        <div class="lbl">Warning State</div>
      </div>
      <div class="summary-box">
        <div class="val" style="color: #e53e3e;">${exec.criticalCount}</div>
        <div class="lbl">Critical Alarms</div>
      </div>
    </div>
    <div style="font-size: 12px; color: #4a5568;">
      Fleet Average Health: <strong>${exec.averageFleetHealth !== null ? `${exec.averageFleetHealth}%` : 'N/A'}</strong> |
      Active Alerts: <strong>${exec.activeAlerts}</strong> |
      Assets Requiring Maintenance Intervention: <strong>${exec.machinesRequiringMaintenance}</strong>
    </div>
  </div>
  `
      : ''
  }

  ${
    machines.length > 0
      ? `
  <div class="section">
    <div class="section-title">2. Asset Health & Operating Matrix</div>
    <table>
      <thead>
        <tr>
          <th>Asset</th>
          <th>Type</th>
          <th>Health</th>
          <th>Operating State</th>
          <th>Failure Risk</th>
          <th>Fault Classification</th>
        </tr>
      </thead>
      <tbody>
        ${machines
          .map(
            (m) => `
          <tr>
            <td><strong>${m.name}</strong></td>
            <td>${m.type}</td>
            <td><strong>${m.health}%</strong></td>
            <td>
              <span class="badge ${
                m.state === 'CRITICAL'
                  ? 'badge-critical'
                  : m.state === 'WARNING' || m.state === 'WATCH'
                  ? 'badge-warning'
                  : 'badge-healthy'
              }">
                ${m.state}
              </span>
            </td>
            <td>${m.risk}</td>
            <td>${m.fault}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  ${
    sensors.length > 0
      ? `
  <div class="section">
    <div class="section-title">3. Multi-Sensor Telemetry Summary</div>
    <table>
      <thead>
        <tr>
          <th>Machine</th>
          <th>DE Vibration</th>
          <th>Winding Temp</th>
          <th>Stator Current</th>
          <th>Rotor Speed</th>
          <th>Est. Load</th>
        </tr>
      </thead>
      <tbody>
        ${sensors
          .map(
            (s) => `
          <tr>
            <td><strong>${s.machineName}</strong></td>
            <td>${s.vibration}</td>
            <td>${s.temperature}</td>
            <td>${s.current}</td>
            <td>${s.rpm}</td>
            <td>${s.load}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  ${
    predictive.length > 0
      ? `
  <div class="section">
    <div class="section-title">4. Predictive Maintenance & Remaining Useful Life (RUL)</div>
    <table>
      <thead>
        <tr>
          <th>Machine</th>
          <th>Risk</th>
          <th>Est. RUL</th>
          <th>Predicted Defect</th>
          <th>Prognostic Recommendation</th>
        </tr>
      </thead>
      <tbody>
        ${predictive
          .map(
            (p) => `
          <tr>
            <td><strong>${p.machineName}</strong></td>
            <td>${p.failureRisk}</td>
            <td><strong>${p.rulDays} days</strong></td>
            <td>${p.predictedFault}</td>
            <td style="font-size: 11px;">${p.recommendedAction}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  ${
    recommendations.length > 0
      ? `
  <div class="section">
    <div class="section-title">5. Condition-Based Maintenance Directives</div>
    ${recommendations
      .map(
        (r) => `
      <div class="rec-card ${r.severity.toLowerCase()}">
        <div class="rec-title">[${r.severity}] ${r.machineName} Action Directive</div>
        <div class="rec-text">${r.recommendation}</div>
        <div style="font-size: 11px; color: #718096; margin-top: 4px;"><em>Justification: ${r.justification}</em></div>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : `
  <div class="section">
    <div class="section-title">5. Condition-Based Maintenance Directives</div>
    <div style="padding: 12px; background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 4px; color: #22543d; font-size: 12px;">
      ✓ All monitored machines are currently within normal baseline operational limits. No abnormal condition-based directives required at this time.
    </div>
  </div>
  `
  }

  <div class="footer">
    <div>MACHINA-X Digital Twin Maintenance System • Internal Confidential Operational Document</div>
    <div>Page 1 of 1 • System Clock: ${report.generatedAt}</div>
  </div>
</body>
</html>`;
  },
};
