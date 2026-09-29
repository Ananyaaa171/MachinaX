"""
Configuration settings for the MACHINA-X Sensor Simulation Service.
Loads configuration from environment variables or .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class SimulatorSettings(BaseSettings):
    simulator_host: str = "0.0.0.0"
    simulator_port: int = 8001
    backend_url: str = "http://localhost:8080"
    machine_id: int = 1
    simulation_interval_seconds: float = 2.0
    default_mode: str = "HEALTHY"
    transmit_to_backend: bool = True
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = SimulatorSettings()
