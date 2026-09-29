"""
Motor Simulator Engine for 3-Phase Induction Motor.

Maintains continuous physical state, applies fault signatures, performs smooth
inter-state thermal and mechanical transitions, and outputs structured sensor batches.
"""
from datetime import datetime, timezone
import math
import numpy as np
from typing import Optional

from models import FaultMode, SensorReading, SensorBatch
from fault_profiles import get_fault_profile, FaultProfile


class MotorSimulator:
    """Stateful simulation engine for a 3-phase induction motor."""

    def __init__(self, machine_id: int = 1, initial_mode: FaultMode = FaultMode.HEALTHY):
        self.machine_id = machine_id
        self.current_mode: FaultMode = initial_mode
        self.target_mode: FaultMode = initial_mode
        self.transition_progress: float = 1.0

        # Physical state variables (starts near healthy baseline)
        self.temperature: float = 54.5
        self.vibration: float = 1.85
        self.current: float = 12.4
        self.rpm: float = 2915.0

        # Simulation clock & tracking
        self.sim_time: float = 0.0
        self.step_count: int = 0
        self.total_generated: int = 0
        self.total_transmitted: int = 0
        self.total_failed: int = 0
        self.last_batch: Optional[SensorBatch] = None
        self.last_transmission_status: Optional[str] = None
        self.is_running: bool = True

        # Random number generator with deterministic seed support if needed
        self._rng = np.random.default_rng()

    def set_mode(self, new_mode: FaultMode) -> None:
        """Initiate a smooth transition to a new fault mode."""
        if new_mode != self.target_mode:
            self.target_mode = new_mode
            self.transition_progress = 0.0

    def step(self, dt: float = 1.0) -> SensorBatch:
        """
        Advance motor simulation clock by dt seconds and produce a batch of readings.
        """
        self.sim_time += dt
        self.step_count += 1
        self.total_generated += 1

        # Handle smooth mode transition
        current_profile = get_fault_profile(self.current_mode)
        target_profile = get_fault_profile(self.target_mode)

        if self.transition_progress < 1.0:
            # Advance transition progress smoothly
            self.transition_progress = min(1.0, self.transition_progress + 0.20)
            if self.transition_progress >= 1.0:
                self.current_mode = self.target_mode

        alpha = self.transition_progress

        # Blend target physics parameters between current and target profiles
        target_vib = (1.0 - alpha) * current_profile.target_vibration + alpha * target_profile.target_vibration
        target_curr = (1.0 - alpha) * current_profile.target_current + alpha * target_profile.target_current
        target_temp = (1.0 - alpha) * current_profile.target_temperature + alpha * target_profile.target_temperature
        target_rpm = (1.0 - alpha) * current_profile.target_rpm + alpha * target_profile.target_rpm

        vib_noise_std = (1.0 - alpha) * current_profile.vibration_noise_std + alpha * target_profile.vibration_noise_std
        curr_noise_std = (1.0 - alpha) * current_profile.current_noise_std + alpha * target_profile.current_noise_std
        thermal_rate = (1.0 - alpha) * current_profile.thermal_rate + alpha * target_profile.thermal_rate
        rpm_noise_std = (1.0 - alpha) * current_profile.rpm_noise_std + alpha * target_profile.rpm_noise_std

        mod_freq = (1.0 - alpha) * current_profile.modulation_freq + alpha * target_profile.modulation_freq
        mod_depth = (1.0 - alpha) * current_profile.modulation_depth + alpha * target_profile.modulation_depth

        # ---------------------------------------------------------------------
        # 1. TEMPERATURE (°C) — First-order thermal inertia model
        # ---------------------------------------------------------------------
        temp_drift = (target_temp - self.temperature) * min(1.0, thermal_rate * dt)
        temp_noise = float(self._rng.normal(0, current_profile.temp_noise_std))
        self.temperature = float(np.clip(self.temperature + temp_drift + temp_noise, 35.0, 140.0))

        # ---------------------------------------------------------------------
        # 2. VIBRATION (mm/s RMS) — Base + Harmonic/Fault Modulation + Noise
        # ---------------------------------------------------------------------
        vib_mod = mod_depth * math.sin(2.0 * math.pi * mod_freq * self.sim_time) if mod_freq > 0 else 0.0
        vib_noise = float(self._rng.normal(0, vib_noise_std))
        self.vibration = float(max(0.2, target_vib + vib_mod + vib_noise))

        # ---------------------------------------------------------------------
        # 3. CURRENT (A RMS) — Base + Sideband Modulation + Noise
        # ---------------------------------------------------------------------
        curr_mod = 0.5 * mod_depth * math.sin(2.0 * math.pi * (mod_freq * 0.5) * self.sim_time) if mod_freq > 0 else 0.0
        curr_noise = float(self._rng.normal(0, curr_noise_std))
        self.current = float(max(1.0, target_curr + curr_mod + curr_noise))

        # ---------------------------------------------------------------------
        # 4. RPM (Rotational Speed) — Base + Load Fluctuation + Noise
        # ---------------------------------------------------------------------
        rpm_slow_drift = 2.0 * math.sin(0.15 * self.sim_time)
        rpm_noise = float(self._rng.normal(0, rpm_noise_std))
        self.rpm = float(np.clip(target_rpm + rpm_slow_drift + rpm_noise, 2400.0, 3100.0))

        # Timestamp in UTC ISO-8601 format
        now_iso = datetime.now(timezone.utc).isoformat()

        batch = SensorBatch(
            machineId=self.machine_id,
            mode=self.target_mode,
            timestamp=now_iso,
            readings=[
                SensorReading(
                    sensorType="VIBRATION",
                    value=round(self.vibration, 4),
                    unit="mm/s",
                    quality="GOOD",
                    source="SIMULATED",
                    recordedAt=now_iso
                ),
                SensorReading(
                    sensorType="CURRENT",
                    value=round(self.current, 4),
                    unit="A",
                    quality="GOOD",
                    source="SIMULATED",
                    recordedAt=now_iso
                ),
                SensorReading(
                    sensorType="TEMPERATURE",
                    value=round(self.temperature, 2),
                    unit="°C",
                    quality="GOOD",
                    source="SIMULATED",
                    recordedAt=now_iso
                ),
                SensorReading(
                    sensorType="RPM",
                    value=round(self.rpm, 1),
                    unit="rpm",
                    quality="GOOD",
                    source="SIMULATED",
                    recordedAt=now_iso
                )
            ]
        )

        self.last_batch = batch
        return batch
