"""
SIMULATED TRAINING DATA GENERATOR for 3-Phase Induction Motor.

NOTE ON DATASET PROVENANCE:
This dataset is generated based on electro-mechanical physical simulation profiles
of a 3-phase induction motor (5.5 kW, 400V, 50Hz, 2-pole nominal speed 2915 RPM).
This is strictly SIMULATED TRAINING DATA for architectural demonstration and pipeline
validation. It is NOT real industrial vibration/current sensor data.

Operating Profiles:
- HEALTHY: normal baseline operating parameters
- BROKEN_ROTOR_BAR: current modulation and moderate vibration rise
- STATOR_SHORT: high current spike, steep temperature elevation
- BEARING_DEFECT: high vibration (BPFO impact frequencies), elevated bearing temperature
- ECCENTRICITY: dynamic rotational vibration and air-gap current asymmetry
"""
import numpy as np
import pandas as pd


def generate_simulated_motor_data(
    samples_per_class: int = 1000,
    random_state: int = 42
) -> pd.DataFrame:
    """
    Generates a balanced simulated dataset of motor sensor readings.
    
    Args:
        samples_per_class: Number of samples generated per fault mode.
        random_state: Random seed for deterministic reproducibility.
        
    Returns:
        pd.DataFrame containing columns: [vibration, current, temperature, rpm, fault_type, is_anomaly]
    """
    rng = np.random.RandomState(random_state)
    
    records = []
    
    # 1. HEALTHY (Normal Operation)
    # Target: Vib ~1.85 mm/s, Curr ~12.4 A, Temp ~56.0 °C, RPM ~2915
    for _ in range(samples_per_class * 2):  # Oversample normal to provide rich baseline for Isolation Forest
        vib = rng.normal(1.85, 0.12)
        curr = rng.normal(12.40, 0.30)
        temp = rng.normal(56.0, 1.5)
        rpm = rng.normal(2915.0, 5.0)
        records.append({
            "vibration": max(0.5, vib),
            "current": max(8.0, curr),
            "temperature": max(20.0, temp),
            "rpm": max(2500.0, rpm),
            "fault_type": "NORMAL",
            "is_anomaly": 0
        })

    # 2. BROKEN_ROTOR_BAR
    # Target: Vib ~2.35 mm/s, Curr ~14.8 A (slip sidebands), Temp ~64.5 °C, RPM ~2885
    for _ in range(samples_per_class):
        vib = rng.normal(2.35, 0.18)
        curr = rng.normal(14.80, 0.60)
        temp = rng.normal(64.5, 2.0)
        rpm = rng.normal(2885.0, 8.0)
        records.append({
            "vibration": max(0.5, vib),
            "current": max(8.0, curr),
            "temperature": max(20.0, temp),
            "rpm": max(2500.0, rpm),
            "fault_type": "BROKEN_ROTOR_BAR",
            "is_anomaly": 1
        })

    # 3. STATOR_SHORT
    # Target: Vib ~1.98 mm/s, Curr ~17.5 A (phase imbalance), Temp ~78.0 °C (severe heating), RPM ~2890
    for _ in range(samples_per_class):
        vib = rng.normal(1.98, 0.15)
        curr = rng.normal(17.50, 0.80)
        temp = rng.normal(78.0, 3.5)
        rpm = rng.normal(2890.0, 7.0)
        records.append({
            "vibration": max(0.5, vib),
            "current": max(8.0, curr),
            "temperature": max(20.0, temp),
            "rpm": max(2500.0, rpm),
            "fault_type": "STATOR_SHORT",
            "is_anomaly": 1
        })

    # 4. BEARING_DEFECT
    # Target: Vib ~3.45 mm/s (bearing impacts), Curr ~13.2 A, Temp ~71.0 °C, RPM ~2905
    for _ in range(samples_per_class):
        vib = rng.normal(3.45, 0.35)
        curr = rng.normal(13.20, 0.40)
        temp = rng.normal(71.0, 2.5)
        rpm = rng.normal(2905.0, 6.0)
        records.append({
            "vibration": max(0.5, vib),
            "current": max(8.0, curr),
            "temperature": max(20.0, temp),
            "rpm": max(2500.0, rpm),
            "fault_type": "BEARING_DEFECT",
            "is_anomaly": 1
        })

    # 5. ECCENTRICITY
    # Target: Vib ~2.15 mm/s (rotational 1x/2x harmonics), Curr ~13.6 A, Temp ~59.5 °C, RPM ~2910
    for _ in range(samples_per_class):
        vib = rng.normal(2.15, 0.16)
        curr = rng.normal(13.60, 0.45)
        temp = rng.normal(59.5, 1.8)
        rpm = rng.normal(2910.0, 5.5)
        records.append({
            "vibration": max(0.5, vib),
            "current": max(8.0, curr),
            "temperature": max(20.0, temp),
            "rpm": max(2500.0, rpm),
            "fault_type": "ECCENTRICITY",
            "is_anomaly": 1
        })

    df = pd.DataFrame(records)
    # Shuffle dataset
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
    return df


if __name__ == "__main__":
    df = generate_simulated_motor_data(500)
    print(f"Generated {len(df)} samples across classes:")
    print(df["fault_type"].value_counts())
