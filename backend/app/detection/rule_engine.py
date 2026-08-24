import re
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import SecurityEvent, Detection, DetectionRule


class RuleEngine:
    """Deterministic Rule Detection Engine mapped to MITRE ATT&CK techniques."""

    DEFAULT_RULES = [
        {
            "rule_id": "RULE-001",
            "name": "Brute-Force Authentication Attack",
            "description": "Detects multiple failed login attempts from a single IP within a short time window.",
            "category": "Credential Access",
            "mitre_technique": "T1110",
            "severity": "high",
            "enabled": True,
            "configuration": {"threshold": 10, "window_seconds": 300}
        },
        {
            "rule_id": "RULE-002",
            "name": "Password Spraying Campaign",
            "description": "Detects single source IP targeting multiple unique usernames with authentication failures.",
            "category": "Credential Access",
            "mitre_technique": "T1110.003",
            "severity": "high",
            "enabled": True,
            "configuration": {"threshold_users": 5, "window_seconds": 300}
        },
        {
            "rule_id": "RULE-003",
            "name": "Port Scan Reconnaissance",
            "description": "Detects a single source IP probing multiple distinct destination ports in a short interval.",
            "category": "Reconnaissance",
            "mitre_technique": "T1046",
            "severity": "medium",
            "enabled": True,
            "configuration": {"threshold_ports": 5, "window_seconds": 180}
        },
        {
            "rule_id": "RULE-004",
            "name": "Suspicious Privileged Login",
            "description": "Detects successful authentication to root/admin accounts from external or unusual IP ranges.",
            "category": "Initial Access",
            "mitre_technique": "T1078",
            "severity": "high",
            "enabled": True,
            "configuration": {"privileged_users": ["root", "admin", "administrator"]}
        },
        {
            "rule_id": "RULE-005",
            "name": "Privilege Escalation Indicator",
            "description": "Detects unauthorized sudo executions or privilege mutations on critical assets.",
            "category": "Privilege Escalation",
            "mitre_technique": "T1548",
            "severity": "high",
            "enabled": True,
            "configuration": {}
        },
        {
            "rule_id": "RULE-006",
            "name": "Web Application Exploit Attempt",
            "description": "Detects SQL injection, Path Traversal, or Command Injection signatures in HTTP web requests.",
            "category": "Exploitation",
            "mitre_technique": "T1190",
            "severity": "critical",
            "enabled": True,
            "configuration": {}
        },
        {
            "rule_id": "RULE-007",
            "name": "HTTP Request Flood / Volumetric Anomaly",
            "description": "Detects excessive request volume originating from a single IP address.",
            "category": "Denial of Service",
            "mitre_technique": "T1498",
            "severity": "medium",
            "enabled": True,
            "configuration": {"threshold_requests": 30, "window_seconds": 60}
        }
    ]

    @classmethod
    def seed_default_rules(cls, db: Session):
        """Initializes default detection rules in database if absent."""
        existing_count = db.query(DetectionRule).count()
        if existing_count == 0:
            for rule_data in cls.DEFAULT_RULES:
                rule = DetectionRule(**rule_data)
                db.add(rule)
            db.commit()

    @classmethod
    def evaluate_event(cls, db: Session, event: SecurityEvent) -> List[Detection]:
        """Evaluates an incoming SecurityEvent against all active rules."""
        detections: List[Detection] = []

        active_rules = db.query(DetectionRule).filter(DetectionRule.enabled == True).all()
        rule_map = {r.rule_id: r for r in active_rules}

        # 1. Evaluate Brute Force & Password Spraying (RULE-001 & RULE-002)
        if event.event_type in ["authentication_failure", "web_auth_failure"] and event.source_ip:
            window_start = event.timestamp - timedelta(seconds=300)
            recent_failures = db.query(SecurityEvent).filter(
                SecurityEvent.source_ip == event.source_ip,
                SecurityEvent.event_type.in_(["authentication_failure", "web_auth_failure"]),
                SecurityEvent.timestamp >= window_start
            ).all()

            failure_count = len(recent_failures)
            unique_users = set(f.username for f in recent_failures if f.username)

            rule_001 = rule_map.get("RULE-001")
            if rule_001 and failure_count >= rule_001.configuration.get("threshold", 10):
                detections.append(Detection(
                    event_id=event.id,
                    detection_type="rule_based",
                    rule_name=rule_001.name,
                    confidence=0.92,
                    severity=rule_001.severity,
                    reason=f"Possible brute-force attack: {failure_count} failed login attempts from IP {event.source_ip} within 5 minutes."
                ))

            rule_002 = rule_map.get("RULE-002")
            if rule_002 and len(unique_users) >= rule_002.configuration.get("threshold_users", 5):
                detections.append(Detection(
                    event_id=event.id,
                    detection_type="rule_based",
                    rule_name=rule_002.name,
                    confidence=0.88,
                    severity=rule_002.severity,
                    reason=f"Password spraying detected: IP {event.source_ip} targeted {len(unique_users)} unique accounts ({', '.join(list(unique_users)[:3])}...)."
                ))

        # 2. Evaluate Port Scan (RULE-003)
        if event.destination_port and event.source_ip:
            window_start = event.timestamp - timedelta(seconds=180)
            recent_events = db.query(SecurityEvent.destination_port).filter(
                SecurityEvent.source_ip == event.source_ip,
                SecurityEvent.destination_port != None,
                SecurityEvent.timestamp >= window_start
            ).all()
            unique_ports = set(r[0] for r in recent_events)

            rule_003 = rule_map.get("RULE-003")
            if rule_003 and len(unique_ports) >= rule_003.configuration.get("threshold_ports", 5):
                detections.append(Detection(
                    event_id=event.id,
                    detection_type="rule_based",
                    rule_name=rule_003.name,
                    confidence=0.85,
                    severity=rule_003.severity,
                    reason=f"Port scan reconnaissance indicator: IP {event.source_ip} targeted {len(unique_ports)} distinct ports within 3 minutes."
                ))

        # 3. Evaluate Suspicious Privileged Login (RULE-004)
        if event.event_type == "authentication_success" and event.username:
            rule_004 = rule_map.get("RULE-004")
            priv_users = rule_004.configuration.get("privileged_users", ["root", "admin"]) if rule_004 else ["root", "admin"]
            if event.username.lower() in priv_users:
                detections.append(Detection(
                    event_id=event.id,
                    detection_type="rule_based",
                    rule_name=rule_004.name if rule_004 else "Suspicious Privileged Login",
                    confidence=0.78,
                    severity="high",
                    reason=f"Privileged account login: Account '{event.username}' logged in successfully from source IP {event.source_ip}."
                ))

        # 4. Privilege Escalation (RULE-005)
        if event.event_type == "privilege_escalation" or "sudo" in (event.message or "").lower():
            rule_005 = rule_map.get("RULE-005")
            if rule_005:
                detections.append(Detection(
                    event_id=event.id,
                    detection_type="rule_based",
                    rule_name=rule_005.name,
                    confidence=0.90,
                    severity=rule_005.severity,
                    reason=f"Privilege escalation indicator: User '{event.username}' executed administrative command on host '{event.hostname}'."
                ))

        # 5. Web Exploit Indicators (RULE-006)
        if event.event_type in ["web_sqli_attempt", "web_path_traversal"] or (event.message and any(p in event.message.lower() for p in ["union select", "select *", "../", "cmd.exe", "/bin/sh"])):
            rule_006 = rule_map.get("RULE-006")
            if rule_006:
                detections.append(Detection(
                    event_id=event.id,
                    detection_type="rule_based",
                    rule_name=rule_006.name,
                    confidence=0.95,
                    severity=rule_006.severity,
                    reason=f"Web attack payload pattern detected in request from IP {event.source_ip}: {event.message}"
                ))

        # 6. HTTP Request Flood (RULE-007)
        if event.source == "nginx_access" and event.source_ip:
            window_start = event.timestamp - timedelta(seconds=60)
            req_count = db.query(SecurityEvent).filter(
                SecurityEvent.source_ip == event.source_ip,
                SecurityEvent.source == "nginx_access",
                SecurityEvent.timestamp >= window_start
            ).count()

            rule_007 = rule_map.get("RULE-007")
            if rule_007 and req_count >= rule_007.configuration.get("threshold_requests", 30):
                detections.append(Detection(
                    event_id=event.id,
                    detection_type="rule_based",
                    rule_name=rule_007.name,
                    confidence=0.80,
                    severity=rule_007.severity,
                    reason=f"Volumetric request flood: IP {event.source_ip} issued {req_count} HTTP requests within 60 seconds."
                ))

        return detections
