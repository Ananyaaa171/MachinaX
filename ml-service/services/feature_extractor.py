"""
Feature Extraction Service for 3-Phase Induction Motor.

Provides deterministic feature extraction from sensor readings keyed by SensorType.
Features include raw values and deviation from normal baseline operation.
"""
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
from config import settings

# Explicit feature column list in strictly deterministic order
FEATURE_NAMES: List[str] = [
    "vibration",
    "current",
    "temperature",
    "rpm",
    "vibration_dev",
    "current_dev",
    "temperature_dev",
    "rpm_dev"
]


class FeatureExtractor:
    """
    Extracts structured feature vector from raw sensor readings.
    """
    def __init__(self):
        self.feature_names = FEATURE_NAMES
        self.baseline_vibration = settings.baseline_vibration
        self.baseline_current = settings.baseline_current
        self.baseline_temperature = settings.baseline_temperature
        self.baseline_rpm = settings.baseline_rpm

    def extract_features_from_dict(self, sensors: Dict[str, float]) -> Tuple[np.ndarray, Dict[str, float]]:
        """
        Extract feature vector from a dictionary mapping SensorType -> value.
        Sensors must contain VIBRATION, CURRENT, TEMPERATURE, RPM (case-insensitive).
        
        Returns:
            Tuple of (numpy 2D array of shape (1, num_features), dict of feature name -> value)
        """
        norm_sensors = {k.strip().upper(): float(v) for k, v in sensors.items()}
        
        # Verify required sensor types exist
        for req in ["VIBRATION", "CURRENT", "TEMPERATURE", "RPM"]:
            if req not in norm_sensors:
                raise ValueError(f"Missing required sensor type: {req}")

        raw_vibration = norm_sensors["VIBRATION"]
        raw_current = norm_sensors["CURRENT"]
        raw_temperature = norm_sensors["TEMPERATURE"]
        raw_rpm = norm_sensors["RPM"]

        # Deterministic deviation from normal motor baseline
        vib_dev = raw_vibration - self.baseline_vibration
        curr_dev = raw_current - self.baseline_current
        temp_dev = raw_temperature - self.baseline_temperature
        rpm_dev = raw_rpm - self.baseline_rpm

        feature_dict = {
            "vibration": raw_vibration,
            "current": raw_current,
            "temperature": raw_temperature,
            "rpm": raw_rpm,
            "vibration_dev": vib_dev,
            "current_dev": curr_dev,
            "temperature_dev": temp_dev,
            "rpm_dev": rpm_dev
        }

        feature_vector = np.array([[
            raw_vibration,
            raw_current,
            raw_temperature,
            raw_rpm,
            vib_dev,
            curr_dev,
            temp_dev,
            rpm_dev
        ]], dtype=np.float64)

        return feature_vector, feature_dict

    def extract_features_from_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extracts feature DataFrame from a DataFrame containing raw sensor columns.
        Expected columns: vibration, current, temperature, rpm
        """
        req_cols = ["vibration", "current", "temperature", "rpm"]
        for col in req_cols:
            if col not in df.columns:
                raise ValueError(f"Missing required column in dataframe: {col}")

        features_df = pd.DataFrame()
        features_df["vibration"] = df["vibration"].astype(float)
        features_df["current"] = df["current"].astype(float)
        features_df["temperature"] = df["temperature"].astype(float)
        features_df["rpm"] = df["rpm"].astype(float)

        features_df["vibration_dev"] = features_df["vibration"] - self.baseline_vibration
        features_df["current_dev"] = features_df["current"] - self.baseline_current
        features_df["temperature_dev"] = features_df["temperature"] - self.baseline_temperature
        features_df["rpm_dev"] = features_df["rpm"] - self.baseline_rpm

        return features_df[self.feature_names]


feature_extractor = FeatureExtractor()
