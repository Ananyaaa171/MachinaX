"""
MACHINA-X ML Service Configuration.
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MACHINA-X ML Service"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Model Artifact Paths
    base_dir: Path = Path(__file__).resolve().parent
    models_dir: Path = Path(__file__).resolve().parent / "models"
    isolation_forest_path: Path = Path(__file__).resolve().parent / "models" / "isolation_forest.joblib"
    fault_classifier_path: Path = Path(__file__).resolve().parent / "models" / "fault_classifier.joblib"
    scaler_path: Path = Path(__file__).resolve().parent / "models" / "scaler.joblib"
    metadata_path: Path = Path(__file__).resolve().parent / "models" / "metadata.json"
    
    # Feature ordering for 3-Phase Induction Motor
    motor_sensor_features: list[str] = ["VIBRATION", "CURRENT", "TEMPERATURE", "RPM"]
    
    # Motor Normal Baselines (from physical profiles)
    baseline_vibration: float = 1.85  # mm/s
    baseline_current: float = 12.4    # A
    baseline_temperature: float = 56.0  # °C
    baseline_rpm: float = 2915.0      # RPM

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
