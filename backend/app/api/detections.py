from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import Detection, DetectionRule
from backend.app.schemas.schemas import DetectionResponse, DetectionRuleResponse, DetectionRuleUpdate
from backend.app.detection.rule_engine import RuleEngine

router = APIRouter(prefix="", tags=["Detections & Rules"])


@router.get("/detections", response_model=List[DetectionResponse])
def get_recent_detections(limit: int = 50, db: Session = Depends(get_db)):
    detections = db.query(Detection).order_by(Detection.created_at.desc()).limit(limit).all()
    return detections


@router.get("/detection-rules", response_model=List[DetectionRuleResponse])
def get_detection_rules(db: Session = Depends(get_db)):
    RuleEngine.seed_default_rules(db)
    rules = db.query(DetectionRule).all()
    return rules


@router.patch("/detection-rules/{rule_id}", response_model=DetectionRuleResponse)
def update_detection_rule(
    rule_id: str,
    update: DetectionRuleUpdate,
    db: Session = Depends(get_db)
):
    rule = db.query(DetectionRule).filter(
        (DetectionRule.rule_id == rule_id) | (DetectionRule.id == int(rule_id) if rule_id.isdigit() else False)
    ).first()

    if not rule:
        raise HTTPException(status_code=404, detail="Detection rule not found")

    if update.enabled is not None:
        rule.enabled = update.enabled
    if update.severity:
        rule.severity = update.severity
    if update.configuration:
        rule.configuration = update.configuration

    db.commit()
    db.refresh(rule)
    return rule
