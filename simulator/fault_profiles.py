"""
Fault Profiles for 3-Phase Induction Motor Simulation.

Defines the physical characteristics, baseline values, noise characteristics,
and dynamic signatures for healthy operation and simulated fault modes.
"""
from dataclasses import dataclass
from models import FaultMode


@dataclass(frozen=True)
class FaultProfile:
    mode: FaultMode
    description: str
    target_vibration: float     # mm/s RMS
    vibration_noise_std: float  # Gaussian noise standard deviation
    target_current: float       # Amperes RMS
    current_noise_std: float    # Gaussian noise standard deviation
    target_temperature: float   # Degrees Celsius
    thermal_rate: float         # Temperature approach rate (fraction per step)
    temp_noise_std: float       # Thermal noise standard deviation
    target_rpm: float           # Revolutions per minute
    rpm_noise_std: float        # Speed noise standard deviation
    modulation_freq: float      # Primary oscillation / fault frequency (Hz)
    modulation_depth: float     # Modulation amplitude scaling factor


PROFILES: dict[FaultMode, FaultProfile] = {
    FaultMode.HEALTHY: FaultProfile(
        mode=FaultMode.HEALTHY,
        description="Normal healthy motor baseline within standard operating tolerances",
        target_vibration=1.85,
        vibration_noise_std=0.06,
        target_current=12.4,
        current_noise_std=0.15,
        target_temperature=56.0,
        thermal_rate=0.05,
        temp_noise_std=0.08,
        target_rpm=2915.0,
        rpm_noise_std=2.5,
        modulation_freq=0.0,
        modulation_depth=0.0
    ),
    FaultMode.BROKEN_ROTOR_BAR: FaultProfile(
        mode=FaultMode.BROKEN_ROTOR_BAR,
        description="Broken rotor bar causing current sidebands (+-2sf) and +15-30% vibration",
        target_vibration=2.35,
        vibration_noise_std=0.10,
        target_current=14.8,
        current_noise_std=0.35,
        target_temperature=64.5,
        thermal_rate=0.04,
        temp_noise_std=0.10,
        target_rpm=2885.0,
        rpm_noise_std=4.0,
        modulation_freq=2.8,  # Typical 2 * slip * line frequency (2 * 0.028 * 50Hz)
        modulation_depth=0.18
    ),
    FaultMode.STATOR_SHORT: FaultProfile(
        mode=FaultMode.STATOR_SHORT,
        description="Turn-to-turn stator winding short causing rapid thermal rise and severe current asymmetry",
        target_vibration=1.98,
        vibration_noise_std=0.08,
        target_current=17.2,
        current_noise_std=0.45,
        target_temperature=78.0,
        thermal_rate=0.12,  # Rapid thermal escalation
        temp_noise_std=0.15,
        target_rpm=2890.0,
        rpm_noise_std=3.0,
        modulation_freq=100.0,  # 2 * supply frequency (negative sequence component)
        modulation_depth=0.25
    ),
    FaultMode.BEARING_DEFECT: FaultProfile(
        mode=FaultMode.BEARING_DEFECT,
        description="Drive-end bearing race/ball spalling defect causing +40-80% vibration and elevated temperature",
        target_vibration=3.45,
        vibration_noise_std=0.25,
        target_current=13.2,
        current_noise_std=0.20,
        target_temperature=71.0,
        thermal_rate=0.06,
        temp_noise_std=0.12,
        target_rpm=2905.0,
        rpm_noise_std=3.5,
        modulation_freq=120.0,  # Ball pass outer raceway frequency (BPFO) signature
        modulation_depth=0.35
    ),
    FaultMode.ECCENTRICITY: FaultProfile(
        mode=FaultMode.ECCENTRICITY,
        description="Dynamic/static air-gap eccentricity causing rotational vibration and current modulation",
        target_vibration=2.15,
        vibration_noise_std=0.12,
        target_current=13.6,
        current_noise_std=0.25,
        target_temperature=59.5,
        thermal_rate=0.04,
        temp_noise_std=0.09,
        target_rpm=2910.0,
        rpm_noise_std=3.0,
        modulation_freq=48.5,  # Rotational frequency harmonic (fr = ~48.5 Hz)
        modulation_depth=0.15
    )
}


def get_fault_profile(mode: FaultMode) -> FaultProfile:
    """Retrieve fault profile configuration by mode enum."""
    return PROFILES.get(mode, PROFILES[FaultMode.HEALTHY])
