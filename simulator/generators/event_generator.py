import random
import time
from datetime import datetime, timezone
from typing import Dict, Any, List


class SyntheticEventGenerator:
    """Generates realistic synthetic security events for local safe attack simulation."""

    SOURCE_IPS = [
        "192.168.1.105", "10.0.4.12", "185.220.101.5", "198.51.100.42",
        "203.0.113.88", "45.33.32.156", "172.16.0.44", "192.168.1.88"
    ]
    TARGET_HOSTS = ["server-prod-auth", "web-gateway-01", "db-cluster-node1", "app-api-server"]
    USERNAMES = ["root", "admin", "service_acc", "jdoe", "asmith", "deployer", "operator", "guest"]

    @classmethod
    def generate_normal_event(cls) -> Dict[str, Any]:
        source_ip = random.choice(["192.168.1.105", "10.0.4.12", "172.16.0.44"])
        username = random.choice(["jdoe", "asmith", "deployer", "operator"])
        host = random.choice(cls.TARGET_HOSTS)

        event_type = random.choice(["authentication_success", "web_request", "system_message"])
        if event_type == "authentication_success":
            msg = f"Accepted password for {username} from {source_ip} port {random.randint(40000, 65000)} ssh2"
            raw = f"Aug 25 10:{random.randint(10,59):02d}:{random.randint(10,59):02d} {host} sshd[1234]: {msg}"
            source = "linux_auth"
        elif event_type == "web_request":
            path = random.choice(["/dashboard", "/api/v1/health", "/profile", "/assets/app.js", "/index.html"])
            msg = f"GET {path} HTTP Status 200"
            raw = f'{source_ip} - {username} [25/Aug/2026:10:30:00 +0000] "GET {path} HTTP/1.1" 200 {random.randint(300, 4000)}'
            source = "nginx_access"
        else:
            msg = f"Cron job executed successfully by {username}"
            raw = f"Aug 25 10:30:00 {host} CRON[5678]: {msg}"
            source = "app_log"

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "source": source,
            "source_ip": source_ip,
            "destination_ip": "10.0.0.1",
            "source_port": random.randint(40000, 65000),
            "destination_port": 22 if source == "linux_auth" else 80,
            "protocol": "SSH" if source == "linux_auth" else "HTTP",
            "username": username,
            "hostname": host,
            "process": "sshd" if source == "linux_auth" else "nginx",
            "message": msg,
            "severity": "low",
            "raw_log": raw
        }

    @classmethod
    def generate_brute_force_sequence(cls) -> List[Dict[str, Any]]:
        source_ip = random.choice(["185.220.101.5", "198.51.100.42", "45.33.32.156"])
        host = "server-prod-auth"
        events = []

        # 12 Failed logins
        for i in range(12):
            user = random.choice(["root", "admin", "test", "administrator"])
            port = random.randint(40000, 65000)
            msg = f"Failed password for {user} from {source_ip} port {port} ssh2"
            raw = f"Aug 25 10:30:{i:02d} {host} sshd[9999]: {msg}"
            events.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": "authentication_failure",
                "source": "linux_auth",
                "source_ip": source_ip,
                "destination_ip": "10.0.0.1",
                "source_port": port,
                "destination_port": 22,
                "protocol": "SSH",
                "username": user,
                "hostname": host,
                "process": "sshd",
                "message": msg,
                "severity": "medium",
                "raw_log": raw
            })

        # 1 Successful login followed by sudo
        events.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "authentication_success",
            "source": "linux_auth",
            "source_ip": source_ip,
            "destination_ip": "10.0.0.1",
            "source_port": 54321,
            "destination_port": 22,
            "protocol": "SSH",
            "username": "root",
            "hostname": host,
            "process": "sshd",
            "message": f"Accepted password for root from {source_ip} port 54321 ssh2",
            "severity": "high",
            "raw_log": f"Aug 25 10:31:00 {host} sshd[9999]: Accepted password for root from {source_ip} port 54321 ssh2"
        })

        events.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "privilege_escalation",
            "source": "linux_auth",
            "source_ip": source_ip,
            "destination_ip": "10.0.0.1",
            "source_port": 54321,
            "destination_port": 22,
            "protocol": "SSH",
            "username": "root",
            "hostname": host,
            "process": "sudo",
            "message": "root : TTY=pts/1 ; PWD=/root ; USER=root ; COMMAND=/bin/bash",
            "severity": "critical",
            "raw_log": f"Aug 25 10:31:05 {host} sudo: root : TTY=pts/1 ; PWD=/root ; USER=root ; COMMAND=/bin/bash"
        })

        return events

    @classmethod
    def generate_port_scan_sequence(cls) -> List[Dict[str, Any]]:
        source_ip = random.choice(["203.0.113.88", "45.33.32.156"])
        host = "web-gateway-01"
        ports = [21, 22, 23, 25, 80, 443, 1433, 3306, 3389, 5432, 8080, 6379]
        events = []

        for p in ports:
            events.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": "port_scan_probe",
                "source": "network_tap",
                "source_ip": source_ip,
                "destination_ip": "10.0.0.10",
                "source_port": random.randint(40000, 60000),
                "destination_port": p,
                "protocol": "TCP",
                "username": None,
                "hostname": host,
                "process": "iptables",
                "message": f"Connection probe to destination port {p} from {source_ip}",
                "severity": "medium",
                "raw_log": f"TCP SYN probe from {source_ip} to 10.0.0.10:{p}"
            })

        return events

    @classmethod
    def generate_web_attack_sequence(cls) -> List[Dict[str, Any]]:
        source_ip = random.choice(["185.220.101.5", "198.51.100.42"])
        host = "web-gateway-01"

        payloads = [
            ("web_sqli_attempt", "GET /api/users?id=1%20UNION%20SELECT%20username,password%20FROM%20users HTTP Status 500", 500),
            ("web_path_traversal", "GET /download?file=../../../../etc/passwd HTTP Status 403", 403),
            ("web_sqli_attempt", "POST /api/v1/auth/login ' OR '1'='1 HTTP Status 401", 401)
        ]

        events = []
        for evt_type, msg, status in payloads:
            events.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": evt_type,
                "source": "nginx_access",
                "source_ip": source_ip,
                "destination_ip": "10.0.0.10",
                "source_port": random.randint(40000, 60000),
                "destination_port": 443,
                "protocol": "HTTPS",
                "username": "admin",
                "hostname": host,
                "process": "nginx",
                "message": msg,
                "severity": "high",
                "raw_log": f'{source_ip} - admin [25/Aug/2026:10:30:00 +0000] "{msg}" {status} 128'
            })

        return events
