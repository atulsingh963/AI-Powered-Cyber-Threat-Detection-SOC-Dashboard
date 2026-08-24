export type Severity = 'informational' | 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';

export interface SecurityEvent {
  id: number;
  timestamp: string;
  event_type: string;
  source: string;
  source_ip?: string;
  destination_ip?: string;
  source_port?: number;
  destination_port?: number;
  protocol?: string;
  username?: string;
  hostname?: string;
  process?: string;
  message?: string;
  severity: Severity;
  raw_log?: string;
  normalized_data?: Record<string, any>;
  created_at: string;
}

export interface Detection {
  id: number;
  event_id: number;
  detection_type: string;
  rule_name?: string;
  model_name?: string;
  confidence: number;
  severity: Severity;
  reason: string;
  created_at: string;
}

export interface Alert {
  id: number;
  detection_id: number;
  title: string;
  description?: string;
  severity: Severity;
  status: string;
  source_ip?: string;
  first_seen: string;
  last_seen: string;
  occurrence_count: number;
  created_at: string;
}

export interface InvestigationNote {
  id: number;
  incident_id: number;
  author_id?: number;
  author_name: string;
  note: string;
  created_at: string;
}

export interface AIAnalysis {
  id: number;
  incident_id: number;
  summary: string;
  attack_type: string;
  reasoning: string;
  recommendations: string[];
  confidence: number;
  model: string;
  is_fallback: boolean;
  created_at: string;
}

export interface Incident {
  id: number;
  incident_id: string;
  title: string;
  description?: string;
  severity: Severity;
  category: string;
  status: IncidentStatus;
  assigned_to?: string;
  confidence: number;
  first_seen: string;
  last_seen: string;
  event_count: number;
  created_at: string;
  updated_at: string;
  events?: SecurityEvent[];
  notes?: InvestigationNote[];
  ai_analyses?: AIAnalysis[];
}

export interface DetectionRule {
  id: number;
  rule_id: string;
  name: string;
  description?: string;
  category: string;
  mitre_technique?: string;
  severity: Severity;
  enabled: boolean;
  configuration?: Record<string, any>;
}

export interface AnalyticsOverview {
  total_events: number;
  active_alerts: number;
  critical_incidents: number;
  high_risk_events: number;
  detection_accuracy: number;
  mean_time_to_respond_mins: number;
  severity_distribution: Record<string, number>;
  attack_categories: Record<string, number>;
  top_source_ips: { ip: string; count: number }[];
  timeline: { time: string; events: number; incidents: number }[];
}

export interface HealthStatus {
  status: string;
  api: string;
  database: string;
  redis: string;
  ml_service: string;
  ollama: string;
  simulator: string;
}
