"""
Reproducible Training Pipeline for MACHINA-X ML Models.

Artifacts generated:
- models/isolation_forest.joblib (Anomaly Detection)
- models/fault_classifier.joblib (Fault Mode Classification)
- models/scaler.joblib (Feature Scaler)
- models/metadata.json (Model Metadata and Version Information)
"""
import os
import sys
import json
from datetime import datetime, timezone
from pathlib import Path

# Add ml-service root to python sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from xgboost import XGBClassifier

from services.feature_extractor import feature_extractor, FEATURE_NAMES
from training.generate_dataset import generate_simulated_motor_data


LABEL_MAP = {
    "NORMAL": 0,
    "BROKEN_ROTOR_BAR": 1,
    "STATOR_SHORT": 2,
    "BEARING_DEFECT": 3,
    "ECCENTRICITY": 4
}
INV_LABEL_MAP = {v: k for k, v in LABEL_MAP.items()}


def normalize_isolation_score(decision_func_val: float) -> float:
    """
    Normalizes Isolation Forest decision_function into [0.0, 1.0].
    
    IsolationForest decision_function:
    - Positive values (> 0) represent normal inlier points (typically ~ +0.10 to +0.25).
    - Zero (~0.0) is the boundary threshold.
    - Negative values (< 0) represent anomalies (typically -0.10 to -0.35).
    
    Formula: score = clamp(0.5 - (decision_func_val * 1.5), 0.0, 1.0)
    Result:
    - High confidence normal: ~ 0.10 - 0.25
    - Boundary: 0.50
    - Strong anomaly: ~ 0.75 - 1.00
    """
    raw_score = 0.5 - (float(decision_func_val) * 1.5)
    return float(np.clip(raw_score, 0.0, 1.0))


def train_and_save_models():
    models_dir = Path(__file__).resolve().parent.parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("MACHINA-X ML PIPELINE: MODEL TRAINING")
    print("=" * 60)
    print("NOTE: Training dataset is generated from physical simulation profiles.")
    print("DATASET TYPE: SIMULATED TRAINING DATA\n")
    
    # 1. Generate Training & Validation Data
    print("[1/5] Generating simulated motor dataset...")
    df = generate_simulated_motor_data(samples_per_class=1200, random_state=42)
    print(f"Generated {len(df)} total samples.")
    print("Class distribution:\n", df["fault_type"].value_counts().to_string())
    
    # 2. Extract Deterministic Features
    print("\n[2/5] Extracting deterministic features...")
    X_df = feature_extractor.extract_features_from_dataframe(df)
    y_str = df["fault_type"]
    y_clf = y_str.map(LABEL_MAP).values
    is_anomaly = df["is_anomaly"].values
    
    print(f"Features ({len(FEATURE_NAMES)}): {FEATURE_NAMES}")
    
    # Train / Test Split (80% train, 20% test) with stratified sampling
    X_train_df, X_test_df, y_train, y_test, is_anom_train, is_anom_test = train_test_split(
        X_df, y_clf, is_anomaly, test_size=0.20, random_state=42, stratify=y_clf
    )
    
    # Fit Feature Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_df)
    X_test_scaled = scaler.transform(X_test_df)
    
    # 3. Train Isolation Forest (Anomaly Detection)
    print("\n[3/5] Training Isolation Forest for Anomaly Detection...")
    # Baseline for normal operating region: train only on HEALTHY (NORMAL) samples
    normal_mask_train = (y_train == LABEL_MAP["NORMAL"])
    X_train_normal_scaled = X_train_scaled[normal_mask_train]
    
    iso_forest = IsolationForest(
        n_estimators=150,
        contamination=0.03,
        max_samples="auto",
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_train_normal_scaled)
    
    # Evaluate Isolation Forest on test set
    iso_test_raw_decisions = iso_forest.decision_function(X_test_scaled)
    iso_test_scores = np.array([normalize_isolation_score(d) for d in iso_test_raw_decisions])
    iso_test_preds = (iso_test_scores >= 0.50).astype(int)
    
    iso_normal_scores = iso_test_scores[is_anom_test == 0]
    iso_fault_scores = iso_test_scores[is_anom_test == 1]
    
    print(f"Isolation Forest Test Results:")
    print(f"  - Mean Healthy Score (Normal): {np.mean(iso_normal_scores):.4f} (Max: {np.max(iso_normal_scores):.4f})")
    print(f"  - Mean Fault Score (Anomaly):   {np.mean(iso_fault_scores):.4f} (Min: {np.min(iso_fault_scores):.4f})")
    print(f"  - Anomaly Detection Accuracy:   {accuracy_score(is_anom_test, iso_test_preds):.4f}")
    
    # 4. Train XGBoost Classifier (Fault Classification)
    print("\n[4/5] Training XGBoost Fault Classifier...")
    xgb_clf = XGBClassifier(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        eval_metric="mlogloss",
        n_jobs=-1
    )
    xgb_clf.fit(X_train_scaled, y_train)
    
    # Evaluate XGBoost Classifier
    y_pred = xgb_clf.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted")
    rec = recall_score(y_test, y_pred, average="weighted")
    f1 = f1_score(y_test, y_pred, average="weighted")
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    target_names = [INV_LABEL_MAP[i] for i in range(len(LABEL_MAP))]
    print(f"\nXGBoost Fault Classifier Evaluation Metrics:")
    print(f"  - Accuracy:  {acc:.4f}")
    print(f"  - Precision: {prec:.4f}")
    print(f"  - Recall:    {rec:.4f}")
    print(f"  - F1 Score:  {f1:.4f}")
    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred, target_names=target_names))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # 5. Save Artifacts & Metadata
    print("\n[5/5] Saving model artifacts to disk...")
    iso_path = models_dir / "isolation_forest.joblib"
    xgb_path = models_dir / "fault_classifier.joblib"
    scaler_path = models_dir / "scaler.joblib"
    metadata_path = models_dir / "metadata.json"
    
    joblib.dump(iso_forest, iso_path)
    joblib.dump(xgb_clf, xgb_path)
    joblib.dump(scaler, scaler_path)
    
    metadata = {
        "modelName": "MACHINA-X Motor ML Engine",
        "modelVersion": "1.0",
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "machineType": "THREE_PHASE_INDUCTION_MOTOR",
        "dataType": "SIMULATED TRAINING DATA",
        "dataProvenance": "Generated from electro-mechanical physical simulation profiles",
        "features": FEATURE_NAMES,
        "classes": target_names,
        "classMapping": LABEL_MAP,
        "metrics": {
            "xgboost": {
                "accuracy": round(float(acc), 4),
                "precision": round(float(prec), 4),
                "recall": round(float(rec), 4),
                "f1Score": round(float(f1), 4),
                "confusionMatrix": cm
            },
            "isolationForest": {
                "meanNormalScore": round(float(np.mean(iso_normal_scores)), 4),
                "meanFaultScore": round(float(np.mean(iso_fault_scores)), 4),
                "accuracy": round(float(accuracy_score(is_anom_test, iso_test_preds)), 4)
            }
        },
        "limitations": [
            "Trained on simulated motor data; does not represent real industrial measurements.",
            "Predictions are probabilistic indicators, not definitive physical guarantees.",
            "Real-world deployment requires training on labeled industrial accelerometer and current sensor records."
        ]
    }
    
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"\nModel artifacts successfully saved to: {models_dir}")
    print("Artifact files:")
    print(f"  - {iso_path.name}")
    print(f"  - {xgb_path.name}")
    print(f"  - {scaler_path.name}")
    print(f"  - {metadata_path.name}")
    print("\nTraining completed successfully.")


if __name__ == "__main__":
    train_and_save_models()
