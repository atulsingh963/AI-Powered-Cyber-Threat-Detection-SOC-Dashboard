import re
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from backend.app.schemas.schemas import SecurityEventCreate


class LogParser:
    """Normalizes heterogeneous security logs into structured SecurityEvent payloads."""

    # RegEx Patterns
    LINUX_AUTH_PATTERN = re.compile(
        r'(?P<timestamp>\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+(?P<hostname>[\w\.\-]+)\s+(?P<process>[\w\/\[\]\-\.]+):\s+(?P<message>.*)'
    )
    SSH_FAILED_PATTERN = re.compile(
        r'Failed password for (invalid user )?(?P<username>\w+) from (?P<source_ip>[\d\.]+) port (?P<port>\d+)'
    )
    SSH_ACCEPTED_PATTERN = re.compile(
        r'Accepted password for (?P<username>\w+) from (?P<source_ip>[\d\.]+) port (?P<port>\d+)'
    )
    SUDO_PATTERN = re.compile(
        r'(?P<username>\w+)\s+:\s+TTY=\w+\s+;\s+PWD=.*?\s+;\s+USER=(?P<target_user>\w+)\s+;\s+COMMAND=(?P<command>.*)'
    )

    NGINX_LOG_PATTERN = re.compile(
        r'(?P<source_ip>[\d\.]+)\s+-\s+(?P<username>[\w\-\.]*)\s+\[(?P<timestamp>.*?)\]\s+"(?P<method>\w+)\s+(?P<path>\S+)\s+HTTP\/\d\.\d"\s+(?P<status>\d{3})\s+(?P<bytes>\d+)'
    )

    @classmethod
    def parse_raw_log(cls, raw_log: str, source: str = "auto") -> SecurityEventCreate:
        raw_log_stripped = raw_log.strip()
        
        # 1. Check if input is JSON
        if raw_log_stripped.startswith("{") and raw_log_stripped.endswith("}"):
            try:
                data = json.loads(raw_log_stripped)
                return cls.normalize_json_event(data, raw_log)
            except json.JSONDecodeError:
                pass

        # 2. Try Nginx log format
        nginx_match = cls.NGINX_LOG_PATTERN.match(raw_log_stripped)
        if nginx_match:
            return cls.normalize_nginx_log(nginx_match.groupdict(), raw_log)

        # 3. Try Linux auth log format
        linux_match = cls.LINUX_AUTH_PATTERN.match(raw_log_stripped)
        if linux_match:
            return cls.normalize_linux_auth_log(linux_match.groupdict(), raw_log)

        # 4. Fallback Generic App Log / Raw Message
        return SecurityEventCreate(
            timestamp=datetime.now(timezone.utc),
            event_type="system_message",
            source=source if source != "auto" else "generic_syslog",
            severity="low",
            message=raw_log_stripped[:500],
            raw_log=raw_log,
            normalized_data={"parser": "generic_fallback"}
        )

    @classmethod
    def normalize_json_event(cls, data: Dict[str, Any], raw_log: str) -> SecurityEventCreate:
        ts = data.get("timestamp")
        parsed_ts = datetime.now(timezone.utc)
        if ts:
            try:
                if isinstance(ts, str):
                    parsed_ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                pass

        return SecurityEventCreate(
            timestamp=parsed_ts,
            event_type=data.get("event_type", "json_event"),
            source=data.get("source", "json_feed"),
            source_ip=data.get("source_ip"),
            destination_ip=data.get("destination_ip"),
            source_port=data.get("source_port"),
            destination_port=data.get("destination_port"),
            protocol=data.get("protocol", "TCP"),
            username=data.get("username"),
            hostname=data.get("hostname", "localhost"),
            process=data.get("process"),
            message=data.get("message", "JSON event received"),
            severity=data.get("severity", "low"),
            raw_log=raw_log,
            normalized_data=data
        )

    @classmethod
    def normalize_linux_auth_log(cls, groups: Dict[str, str], raw_log: str) -> SecurityEventCreate:
        hostname = groups.get("hostname", "localhost")
        process = groups.get("process", "auth")
        msg = groups.get("message", "")

        event_type = "linux_auth_event"
        severity = "low"
        username = None
        source_ip = None
        source_port = None

        # Check SSH Failed
        failed_match = cls.SSH_FAILED_PATTERN.search(msg)
        if failed_match:
            event_type = "authentication_failure"
            severity = "medium"
            username = failed_match.group("username")
            source_ip = failed_match.group("source_ip")
            source_port = int(failed_match.group("port"))

        # Check SSH Accepted
        accepted_match = cls.SSH_ACCEPTED_PATTERN.search(msg)
        if accepted_match:
            event_type = "authentication_success"
            severity = "low"
            username = accepted_match.group("username")
            source_ip = accepted_match.group("source_ip")
            source_port = int(accepted_match.group("port"))

        # Check Sudo / Privilege Escalation
        sudo_match = cls.SUDO_PATTERN.search(msg)
        if sudo_match:
            event_type = "privilege_escalation"
            severity = "high"
            username = sudo_match.group("username")
            msg = f"Sudo execution to {sudo_match.group('target_user')}: {sudo_match.group('command')}"

        return SecurityEventCreate(
            timestamp=datetime.now(timezone.utc),
            event_type=event_type,
            source="linux_auth",
            source_ip=source_ip or "127.0.0.1",
            destination_ip="10.0.0.1",
            source_port=source_port,
            destination_port=22,
            protocol="SSH",
            username=username,
            hostname=hostname,
            process=process,
            message=msg,
            severity=severity,
            raw_log=raw_log,
            normalized_data={"parsed_by": "linux_auth_adapter"}
        )

    @classmethod
    def normalize_nginx_log(cls, groups: Dict[str, str], raw_log: str) -> SecurityEventCreate:
        source_ip = groups.get("source_ip")
        status = int(groups.get("status", 200))
        path = groups.get("path", "/")
        method = groups.get("method", "GET")

        severity = "low"
        event_type = "web_request"

        if status in [401, 403]:
            event_type = "web_auth_failure"
            severity = "medium"
        elif status >= 500:
            event_type = "web_server_error"
            severity = "medium"

        # Basic signature check in web path
        lower_path = path.lower()
        if any(sqli in lower_path for sqli in ["union", "select", "' or '1'='1", "information_schema"]):
            event_type = "web_sqli_attempt"
            severity = "high"
        elif "../" in lower_path or "/etc/passwd" in lower_path:
            event_type = "web_path_traversal"
            severity = "high"

        return SecurityEventCreate(
            timestamp=datetime.now(timezone.utc),
            event_type=event_type,
            source="nginx_access",
            source_ip=source_ip,
            destination_ip="10.0.0.10",
            destination_port=80 if method != "HTTPS" else 443,
            protocol="HTTP",
            username=groups.get("username") if groups.get("username") != "-" else None,
            hostname="web-server-01",
            process="nginx",
            message=f"{method} {path} HTTP Status {status}",
            severity=severity,
            raw_log=raw_log,
            normalized_data={"http_method": method, "path": path, "status_code": status}
        )
