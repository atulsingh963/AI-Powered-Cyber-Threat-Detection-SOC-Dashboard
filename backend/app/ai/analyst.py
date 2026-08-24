import httpx
import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.models.models import Incident, AIAnalysis


class AIAnalyst:
    """AI Security Analyst Service integrating Ollama LLM with evidence-grounded deterministic fallback."""

    @classmethod
    def generate_deterministic_fallback(cls, incident: Incident) -> Dict[str, Any]:
        """Produces evidence-grounded deterministic analysis when Ollama is unavailable."""
        event_count = len(incident.events)
        source_ips = list(set(e.source_ip for e in incident.events if e.source_ip))
        usernames = list(set(e.username for e in incident.events if e.username))
        event_types = list(set(e.event_type for e in incident.events))

        ip_str = ", ".join(source_ips) if source_ips else "Internal System"
        user_str = ", ".join(usernames) if usernames else "Unspecified Accounts"

        summary = (
            f"Automated Deterministic Assessment: Incident '{incident.title}' contains {event_count} correlated security events "
            f"originating from source IP(s) [{ip_str}] targeting account(s) [{user_str}]."
        )

        attack_type = incident.category or "Suspicious Network Behavior"

        reasoning = (
            f"1. Observed {event_count} security events over time window.\n"
            f"2. Primary event classifications detected: {', '.join(event_types)}.\n"
            f"3. Risk classification evaluated as {incident.severity.upper()} based on hybrid rule/anomaly scoring."
        )

        recommendations = [
            f"Immediately review authentication and access logs for source IP [{ip_str}].",
            f"Verify whether account(s) [{user_str}] experienced legitimate user activity or password compromise.",
            "Enforce temporary IP rate limiting or block source IP at firewall edge if unauthorized access is confirmed.",
            "Ensure Multi-Factor Authentication (MFA) is strictly enforced for all targeted accounts."
        ]

        return {
            "summary": summary,
            "attack_type": attack_type,
            "reasoning": reasoning,
            "recommendations": recommendations,
            "confidence": min(0.95, round(incident.confidence or 0.85, 2)),
            "model": "deterministic-fallback",
            "is_fallback": True
        }

    @classmethod
    async def analyze_incident(cls, db: Session, incident: Incident) -> AIAnalysis:
        """Invokes Ollama LLM or falls back to deterministic analysis."""
        events_summary = []
        for e in incident.events[:15]:  # Limit context payload
            events_summary.append({
                "timestamp": str(e.timestamp),
                "event_type": e.event_type,
                "source_ip": e.source_ip,
                "username": e.username,
                "message": e.message
            })

        system_prompt = (
            "You are CyberSentinel AI, an expert defensive SOC analyst. Your job is to analyze security incident evidence "
            "and provide safe, evidence-grounded defensive guidance.\n"
            "CRITICAL CONSTRAINTS:\n"
            "1. ONLY state facts present in the provided event logs. DO NOT hallucinate external IPs, commands, or details.\n"
            "2. DO NOT provide offensive exploitation material, payloads, or malware.\n"
            "3. Output MUST be valid JSON with keys: summary, attack_type, reasoning, recommendations (array of strings), confidence (float 0.0-1.0)."
        )

        user_content = json.dumps({
            "incident_id": incident.incident_id,
            "title": incident.title,
            "category": incident.category,
            "severity": incident.severity,
            "total_events": len(incident.events),
            "evidence_logs": events_summary
        }, indent=2)

        ollama_url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat"
        analysis_data = None

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(
                    ollama_url,
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": f"Analyze this security incident:\n{user_content}"}
                        ],
                        "format": "json",
                        "stream": False
                    }
                )
                if response.status_code == 200:
                    result = response.json()
                    raw_text = result.get("message", {}).get("content", "")
                    parsed = json.loads(raw_text)
                    analysis_data = {
                        "summary": parsed.get("summary", incident.description),
                        "attack_type": parsed.get("attack_type", incident.category),
                        "reasoning": parsed.get("reasoning", "LLM reasoning analysis completed."),
                        "recommendations": parsed.get("recommendations", ["Review logs and verify account safety."]),
                        "confidence": float(parsed.get("confidence", 0.90)),
                        "model": settings.OLLAMA_MODEL,
                        "is_fallback": False
                    }
        except Exception:
            # Ollama offline or error -> use evidence-grounded fallback
            pass

        if not analysis_data:
            analysis_data = cls.generate_deterministic_fallback(incident)

        db_analysis = AIAnalysis(
            incident_id=incident.id,
            summary=analysis_data["summary"],
            attack_type=analysis_data["attack_type"],
            reasoning=analysis_data["reasoning"],
            recommendations=analysis_data["recommendations"],
            confidence=analysis_data["confidence"],
            model=analysis_data["model"],
            is_fallback=analysis_data["is_fallback"]
        )
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        return db_analysis
