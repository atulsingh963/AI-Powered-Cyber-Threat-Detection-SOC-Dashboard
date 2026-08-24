import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix


def generate_synthetic_dataset(num_samples: int = 2000, anomaly_ratio: float = 0.1):
    """Generates synthetic security event features for normal vs malicious traffic."""
    np.random.seed(42)
    num_anomalies = int(num_samples * anomaly_ratio)
    num_normal = num_samples - num_anomalies

    # Features:
    # 0: req_freq_per_min (Normal: 1-15, Anomaly: 25-150)
    # 1: failed_login_count (Normal: 0-2, Anomaly: 5-40)
    # 2: unique_dest_ports (Normal: 1-3, Anomaly: 5-50)
    # 3: unique_usernames (Normal: 1, Anomaly: 3-15)
    # 4: bytes_transferred_kb (Normal: 2-50, Anomaly: 100-2000)
    # 5: http_4xx_5xx_ratio (Normal: 0.0-0.1, Anomaly: 0.4-1.0)
    # 6: hour_of_day (Normal: 8-18, Anomaly: 0-5)

    # Normal baseline samples
    normal_freq = np.random.poisson(lam=5, size=num_normal)
    normal_failed = np.random.binomial(n=2, p=0.1, size=num_normal)
    normal_ports = np.random.poisson(lam=1, size=num_normal) + 1
    normal_users = np.ones(num_normal, dtype=int)
    normal_bytes = np.random.exponential(scale=20, size=num_normal) + 1
    normal_err_ratio = np.random.beta(a=0.5, b=5, size=num_normal)
    normal_hours = np.random.randint(7, 20, size=num_normal)

    X_normal = np.column_stack([
        normal_freq, normal_failed, normal_ports, normal_users,
        normal_bytes, normal_err_ratio, normal_hours
    ])

    # Anomaly samples
    anom_freq = np.random.randint(25, 150, size=num_anomalies)
    anom_failed = np.random.randint(5, 50, size=num_anomalies)
    anom_ports = np.random.randint(5, 40, size=num_anomalies)
    anom_users = np.random.randint(3, 12, size=num_anomalies)
    anom_bytes = np.random.exponential(scale=500, size=num_anomalies) + 200
    anom_err_ratio = np.random.uniform(0.4, 1.0, size=num_anomalies)
    anom_hours = np.random.choice([0, 1, 2, 3, 4, 22, 23], size=num_anomalies)

    X_anom = np.column_stack([
        anom_freq, anom_failed, anom_ports, anom_users,
        anom_bytes, anom_err_ratio, anom_hours
    ])

    X = np.vstack([X_normal, X_anom])
    # Ground truth labels: 1 for normal, -1 for anomaly
    y = np.array([1] * num_normal + [-1] * num_anomalies)

    df = pd.DataFrame(X, columns=[
        "req_freq_per_min", "failed_login_count", "unique_dest_ports",
        "unique_usernames", "bytes_transferred_kb", "http_err_ratio", "hour_of_day"
    ])
    df["label"] = y

    return df, X, y


def train_model():
    print("Generating synthetic cybersecurity dataset...")
    df, X, y = generate_synthetic_dataset(num_samples=3000, anomaly_ratio=0.12)

    os.makedirs("ml/datasets", exist_ok=True)
    os.makedirs("ml/models", exist_ok=True)
    df.to_csv("ml/datasets/synthetic_security_events.csv", index=False)

    feature_cols = [
        "req_freq_per_min", "failed_login_count", "unique_dest_ports",
        "unique_usernames", "bytes_transferred_kb", "http_err_ratio", "hour_of_day"
    ]
    X_features = df[feature_cols].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_features)

    # Train Isolation Forest
    print("Training Isolation Forest model...")
    model = IsolationForest(
        n_estimators=150,
        contamination=0.12,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_scaled)

    # Predictions (-1 = anomaly, 1 = normal)
    preds = model.predict(X_scaled)

    # Convert to binary metrics (1 = anomaly, 0 = normal)
    y_true = np.where(y == -1, 1, 0)
    y_pred = np.where(preds == -1, 1, 0)

    print("\n--- Model Evaluation ---")
    print(classification_report(y_true, y_pred, target_names=["Normal", "Anomaly"]))
    cm = confusion_matrix(y_true, y_pred)
    print("Confusion Matrix:")
    print(cm)
    auc = roc_auc_score(y_true, -model.decision_function(X_scaled))
    print(f"ROC-AUC Score: {auc:.4f}")

    pipeline = {
        "scaler": scaler,
        "model": model,
        "feature_cols": feature_cols
    }
    model_path = "ml/models/isolation_forest.joblib"
    joblib.dump(pipeline, model_path)
    print(f"\nModel pipeline saved successfully to {model_path}")


if __name__ == "__main__":
    train_model()
