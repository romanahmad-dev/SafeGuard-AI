export type Severity = 'info' | 'warning' | 'critical';

export interface Operative {
  id: string;
  name: string;
  email: string;
  accessLevel: string;
  station: string;
  lastSignIn: string;
  status: 'ACTIVE' | 'OFFLINE';
}

export interface SensorStates {
  temperature: number;
  temperatureMaxTrigger: number;
  gasH2S: number;
  vibration: number;
  humidity: number;
}

export interface AlertEvent {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  timestamp: string;
  location: string;
  confidence: number;
  imageUrl: string;
  imageThumb?: string;
  recommendation: string[];
  operatorActionTaken?: string;
  status: 'ACTIVE' | 'INVESTIGATED' | 'FALSE_ALARM' | 'RESOLVED';
}

export interface CameraFeed {
  id: string;
  name: string;
  live: boolean;
  statusText: 'LIVE' | 'ALERT' | 'OFFLINE';
  imageUrl: string;
  detectionLabel: string;
  detectionStatus: string;
  overlayStyle: {
    top: string;
    left: string;
    width: string;
    height: string;
    type: 'danger' | 'warning' | 'safe';
  };
}

export interface NotificationRule {
  id: string;
  severity: Severity;
  title: string;
  description: string;
}
