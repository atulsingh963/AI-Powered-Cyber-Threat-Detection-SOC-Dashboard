import asyncio
import random
from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.core.database import SessionLocal
from backend.app.models.models import SecurityEvent
from backend.app.detection.parser import LogParser
from backend.app.detection.rule_engine import RuleEngine
from backend.app.detection.ml_engine import MLEngine
from backend.app.correlation.correlator import Correlator
from backend.app.core.websocket_manager import ws_manager
from simulator.generators.event_generator import SyntheticEventGenerator


class DemoSimulator:
    """Background simulator task for live SOC Demo Mode."""

    _is_running: bool = False
    _task: asyncio.Task = None

    @classmethod
    def is_running(cls) -> bool:
        return cls._is_running

    @classmethod
    async def start(cls):
        if not cls._is_running:
            cls._is_running = True
            cls._task = asyncio.create_task(cls._run_loop())

    @classmethod
    async def stop(cls):
        cls._is_running = False
        if cls._task and not cls._task.done():
            cls._task.cancel()

    @classmethod
    async def _run_loop(cls):
        scenario_idx = 0
        scenarios = ["normal", "brute_force", "normal", "port_scan", "normal", "web_attack"]

        while cls._is_running:
            try:
                db: Session = SessionLocal()
                try:
                    current_scenario = scenarios[scenario_idx % len(scenarios)]
                    scenario_idx += 1

                    events_payloads = []
                    if current_scenario == "brute_force":
                        events_payloads = SyntheticEventGenerator.generate_brute_force_sequence()
                    elif current_scenario == "port_scan":
                        events_payloads = SyntheticEventGenerator.generate_port_scan_sequence()
                    elif current_scenario == "web_attack":
                        events_payloads = SyntheticEventGenerator.generate_web_attack_sequence()
                    else:
                        events_payloads = [SyntheticEventGenerator.generate_normal_event() for _ in range(3)]

                    for evt_dict in events_payloads:
                        if not cls._is_running:
                            break

                        # 1. Ingest event to database
                        norm_event = LogParser.parse_raw_log(evt_dict.get("raw_log") or evt_dict.get("message", ""), source=evt_dict.get("source", "synthetic"))
                        
                        db_event = SecurityEvent(
                            event_type=evt_dict.get("event_type", norm_event.event_type),
                            source=evt_dict.get("source", norm_event.source),
                            source_ip=evt_dict.get("source_ip", norm_event.source_ip),
                            destination_ip=evt_dict.get("destination_ip", norm_event.destination_ip),
                            source_port=evt_dict.get("source_port", norm_event.source_port),
                            destination_port=evt_dict.get("destination_port", norm_event.destination_port),
                            protocol=evt_dict.get("protocol", norm_event.protocol),
                            username=evt_dict.get("username", norm_event.username),
                            hostname=evt_dict.get("hostname", norm_event.hostname),
                            process=evt_dict.get("process", norm_event.process),
                            message=evt_dict.get("message", norm_event.message),
                            severity=evt_dict.get("severity", norm_event.severity),
                            raw_log=evt_dict.get("raw_log", norm_event.raw_log),
                            normalized_data=norm_event.normalized_data
                        )
                        db.add(db_event)
                        db.commit()
                        db.refresh(db_event)

                        # 2. Run Rule & ML Detections
                        rule_dets = RuleEngine.evaluate_event(db, db_event)
                        ml_det = MLEngine.evaluate_anomaly(db, db_event)

                        all_dets = rule_dets.copy()
                        if ml_det:
                            all_dets.append(ml_det)

                        for d in all_dets:
                            db.add(d)
                        db.commit()

                        # 3. Correlate Events -> Incident
                        incident = Correlator.process_event_correlations(db, db_event, all_dets)

                        # 4. Broadcast live update to WebSockets
                        broadcast_payload = {
                            "type": "NEW_SECURITY_EVENT",
                            "event": {
                                "id": db_event.id,
                                "timestamp": db_event.timestamp.isoformat(),
                                "event_type": db_event.event_type,
                                "source": db_event.source,
                                "source_ip": db_event.source_ip,
                                "username": db_event.username,
                                "severity": db_event.severity,
                                "message": db_event.message
                            },
                            "detections": [
                                {
                                    "detection_type": d.detection_type,
                                    "rule_name": d.rule_name or d.model_name,
                                    "severity": d.severity,
                                    "reason": d.reason
                                } for d in all_dets
                            ],
                            "incident": {
                                "id": incident.id,
                                "incident_id": incident.incident_id,
                                "title": incident.title,
                                "severity": incident.severity,
                                "category": incident.category,
                                "status": incident.status
                            } if incident else None
                        }

                        await ws_manager.broadcast_json(broadcast_payload)
                        await asyncio.sleep(1.2)  # Delay between events for realistic SOC feed streaming

                finally:
                    db.close()

                await asyncio.sleep(2.5)  # Pause between scenario bursts

            except asyncio.CancelledError:
                break
            except Exception as e:
                await asyncio.sleep(3.0)
