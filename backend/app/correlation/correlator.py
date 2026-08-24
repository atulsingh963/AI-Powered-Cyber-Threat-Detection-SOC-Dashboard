import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.models.models import SecurityEvent, Detection, Alert, Incident, IncidentEvent


class Correlator:
    """Correlates detections & events into unified Security Incidents with Hybrid Risk Scoring (0-100)."""

    @classmethod
    def calculate_hybrid_risk_score(
        cls,
        rule_detections: List[Detection],
        ml_detection: Optional[Detection],
        event_count: int,
        is_admin_user: bool = False
    ) -> Tuple[int, str]:
        """Calculates 0-100 Hybrid Risk Score and classification."""
        # 1. Rule Score (max 45)
        rule_score = 0
        for d in rule_detections:
            if d.severity == "critical":
                rule_score += 35
            elif d.severity == "high":
                rule_score += 25
            elif d.severity == "medium":
                rule_score += 15
            else:
                rule_score += 5
        rule_score = min(45, rule_score)

        # 2. ML Anomaly Score (max 30)
        ml_score = 0
        if ml_detection:
            ml_score = int(ml_detection.confidence * 30)

        # 3. Frequency & Multi-event Score (max 15)
        freq_score = min(15, event_count * 2)

        # 4. Asset / Privileged User Criticality (max 10)
        asset_score = 10 if is_admin_user else 3

        total_score = min(100, rule_score + ml_score + freq_score + asset_score)

        if total_score >= 90:
            severity = "critical"
        elif total_score >= 75:
            severity = "high"
        elif total_score >= 50:
            severity = "medium"
        elif total_score >= 25:
            severity = "low"
        else:
            severity = "informational"

        return total_score, severity

    @classmethod
    def process_event_correlations(cls, db: Session, event: SecurityEvent, detections: List[Detection]) -> Optional[Incident]:
        """Correlates detections for an event into active or new Security Incidents."""
        if not detections:
            return None

        # 1. Create Alerts for each detection
        alerts: List[Alert] = []
        for det in detections:
            alert = Alert(
                detection_id=det.id,
                title=f"Alert: {det.rule_name or det.model_name}",
                description=det.reason,
                severity=det.severity,
                status="new",
                source_ip=event.source_ip,
                first_seen=event.timestamp,
                last_seen=event.timestamp,
                occurrence_count=1
            )
            db.add(alert)
            alerts.append(alert)

        db.flush()

        # 2. Look for existing active incident (NEW or INVESTIGATING) matching source_ip or username within last 15 minutes
        window_start = event.timestamp - timedelta(minutes=15)
        
        query = db.query(Incident).filter(
            Incident.status.in_(["NEW", "ACKNOWLEDGED", "INVESTIGATING"]),
            Incident.created_at >= window_start
        )

        matching_incident: Optional[Incident] = None
        for inc in query.all():
            for inc_evt in inc.events:
                if (event.source_ip and inc_evt.source_ip == event.source_ip) or \
                   (event.username and inc_evt.username == event.username and event.username not in [None, ""]):
                    matching_incident = inc
                    break
            if matching_incident:
                break

        rule_dets = [d for d in detections if d.detection_type == "rule_based"]
        ml_det = next((d for d in detections if d.detection_type == "ml_anomaly"), None)
        is_admin = bool(event.username and event.username.lower() in ["root", "admin", "administrator"])

        if matching_incident:
            # Attach event to existing incident
            if event not in matching_incident.events:
                matching_incident.events.append(event)
            matching_incident.last_seen = event.timestamp
            matching_incident.updated_at = datetime.now(timezone.utc)

            # Re-evaluate hybrid score
            total_events = len(matching_incident.events)
            risk_score, new_severity = cls.calculate_hybrid_risk_score(rule_dets, ml_det, total_events, is_admin)
            matching_incident.severity = new_severity
            
            # Check multi-stage escalation (e.g. Failed -> Sudo)
            event_types = [e.event_type for e in matching_incident.events]
            if "authentication_failure" in event_types and "privilege_escalation" in event_types:
                matching_incident.title = "Potential Account Compromise & Privilege Escalation"
                matching_incident.category = "Account Compromise"
                matching_incident.severity = "critical"

            db.commit()
            db.refresh(matching_incident)
            return matching_incident

        else:
            # Create brand new incident
            inc_code = f"INC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            
            # Categorize incident
            category = "Suspicious Behavior"
            title = f"Security Incident: {detections[0].rule_name or 'Anomalous Activity'}"

            det_names = [d.rule_name for d in rule_dets if d.rule_name]
            if any("Brute-Force" in name for name in det_names):
                category = "Brute Force"
                title = f"Brute-Force Authentication Attempt from {event.source_ip or 'External IP'}"
            elif any("Password Spray" in name for name in det_names):
                category = "Credential Spraying"
                title = f"Password Spraying Campaign from {event.source_ip}"
            elif any("Port Scan" in name for name in det_names):
                category = "Reconnaissance"
                title = f"Port Scanning Activity from {event.source_ip}"
            elif any("Web" in name for name in det_names):
                category = "Web Exploitation"
                title = f"Web Application Attack Pattern from {event.source_ip}"
            elif any("Privilege" in name for name in det_names):
                category = "Privilege Escalation"
                title = f"Suspicious Privilege Mutation by {event.username or 'Unknown User'}"

            risk_score, severity = cls.calculate_hybrid_risk_score(rule_dets, ml_det, event_count=1, is_admin_user=is_admin)

            new_incident = Incident(
                incident_id=inc_code,
                title=title,
                description=f"Correlated {len(detections)} detection alerts for source IP {event.source_ip or 'N/A'}. Initial reasoning: {detections[0].reason}",
                severity=severity,
                category=category,
                status="NEW",
                confidence=float(max(d.confidence for d in detections)),
                first_seen=event.timestamp,
                last_seen=event.timestamp
            )
            new_incident.events.append(event)
            db.add(new_incident)
            db.commit()
            db.refresh(new_incident)
            return new_incident
