import os
import joblib
import numpy as np
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import SecurityEvent, Detection


class MLEngine:
    """Machine Learning Anomaly Detection Service using Isolation Forest."""

    MODEL_PATH = "ml/models/isolation_forest.joblib"
    _pipeline = None

    @classmethod
    def load_pipeline(cls):
        if cls._pipeline is None:
            if os.path.exists(cls.MODEL_PATH):
                cls._pipeline = joblib.load(cls.MODEL_PATH)
            else:
                cls._pipeline = None
        return cls._pipeline

    @classmethod
    def extract_features(cls, db: Session, event: SecurityEvent) -> np.ndarray:
        """Extracts continuous feature vector for the given event context."""
        now = event.timestamp or datetime.now(timezone.utc)
        window_start = now - timedelta(seconds=300)

        source_ip = event.source_ip or "127.0.0.1"

        # 1. Request frequency per minute in 5m window
        req_count = db.query(SecurityEvent).filter(
            SecurityEvent.source_ip == source_ip,
            SecurityEvent.timestamp >= window_start
        ).count()
        req_freq_per_min = max(1.0, req_count / 5.0)

        # 2. Failed login count in 5m window
        failed_count = db.query(SecurityEvent).filter(
            SecurityEvent.source_ip == source_ip,
            SecurityEvent.event_type.in_(["authentication_failure", "web_auth_failure"]),
            SecurityEvent.timestamp >= window_start
        ).count()

        # 3. Unique destination ports
        ports = db.query(SecurityEvent.destination_port).filter(
            SecurityEvent.source_ip == source_ip,
            SecurityEvent.destination_port != None,
            SecurityEvent.timestamp >= window_start
        ).distinct().all()
        unique_dest_ports = max(1, len(ports))

        # 4. Unique usernames targeted
        users = db.query(SecurityEvent.username).filter(
            SecurityEvent.source_ip == source_ip,
            SecurityEvent.username != None,
            SecurityEvent.timestamp >= window_start
        ).distinct().all()
        unique_usernames = max(1, len(users))

        # 5. Estimated bytes transferred KB
        raw_len = len(event.raw_log or event.message or "")
        bytes_transferred_kb = (raw_len + 200) / 1024.0

        # 6. HTTP Error ratio
        http_errs = db.query(SecurityEvent).filter(
            SecurityEvent.source_ip == source_ip,
            SecurityEvent.event_type.in_(["web_auth_failure", "web_server_error", "web_sqli_attempt", "web_path_traversal"]),
            SecurityEvent.timestamp >= window_start
        ).count()
        http_err_ratio = min(1.0, http_errs / max(1.0, float(req_count)))

        # 7. Hour of day
        hour_of_day = now.hour

        return np.array([[
            req_freq_per_min, failed_count, unique_dest_ports,
            unique_usernames, bytes_transferred_kb, http_err_ratio, hour_of_day
        ]])

    @classmethod
    def evaluate_anomaly(cls, db: Session, event: SecurityEvent) -> Optional[Detection]:
        pipeline = cls.load_pipeline()
        if not pipeline:
            return None

        scaler = pipeline["scaler"]
        model = pipeline["model"]

        try:
            features = cls.extract_features(db, event)
            features_scaled = scaler.transform(features)

            # decision_function returns lower values for anomalies (typically -0.5 to 0.5)
            raw_score = model.decision_function(features_scaled)[0]
            prediction = model.predict(features_scaled)[0]  # -1 = anomaly, 1 = normal

            # Convert raw score to 0.0 - 1.0 anomaly score (higher = more anomalous)
            anomaly_score = float(np.clip(0.5 - raw_score, 0.0, 1.0))

            if prediction == -1 or anomaly_score >= 0.55:
                if anomaly_score >= 0.85:
                    classification = "critical"
                    risk_label = "Critical Anomaly"
                elif anomaly_score >= 0.70:
                    classification = "high"
                    risk_label = "High Risk Anomaly"
                else:
                    classification = "medium"
                    risk_label = "Medium Risk Anomaly"

                confidence = round(min(0.99, anomaly_score + 0.10), 2)

                return Detection(
                    event_id=event.id,
                    detection_type="ml_anomaly",
                    model_name="IsolationForest_v1",
                    confidence=confidence,
                    severity=classification,
                    reason=f"ML Anomaly Detected: {risk_label} (Anomaly Score: {anomaly_score:.2f}, Confidence: {confidence*100:.0f}%)."
                )

        except Exception as e:
            # Fallback safely if feature extraction or inference fails
            pass

        return None
