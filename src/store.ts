import { create } from 'zustand';
import { SensorStates, AlertEvent, CameraFeed, Operative } from './types';

// Extend types to handle live backend elements gracefully
export interface MLAnomalyAnalysis {
  ml_anomaly_detected: boolean;
  anomaly_score: number;
  anomaly_confidence: number;
  operational_status: string;
  framework_type: string;
}

export interface LiveTelemetryPayload {
  evaluation: {
    risk_score: number;
    risk_category: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'SAFE' | 'WARNING' | 'DANGER';
    theme_accent: string;
    explainable_ai_reasoning: string;
    active_triggers: Array<{ code: string; message: string }>;
    telemetry_inspection: {
      temperature: number;
      gas_h2s: number;
      vibration: number;
      stress_profile: string;
    };
    ml_anomaly_analysis?: MLAnomalyAnalysis;
  };
  timestamp: number;
  id: number | null;
  hazards_found: boolean;
  camera_status: string;
  camera_detections: Array<{ label: string; confidence: number; box: [number, number, number, number] }>;
}

export interface ChartDataPoint {
  timestamp: string;
  risk_score: number;
  temperature: number;
  co2_ppm: number;
  vibration: number;
}

interface SafetyState {
  // Authentication State
  user: Operative | null;
  token: string | null;
  authLoaded: boolean;
  loginError: string | null;
  
  // Real-time Gateway state
  sensorStats: SensorStates;
  liveRiskScore: number;
  liveRiskStatus: 'SAFE' | 'WARNING' | 'DANGER';
  liveRiskCategory: 'LOW' | 'MEDIUM' | 'HIGH';
  liveActiveTriggers: Array<{ code: string; message: string }>;
  liveReasoning: string;
  liveThemeAccent: string;
  cameraFeeds: CameraFeed[];
  activeDetections: Array<{ label: string; confidence: number; box: [number, number, number, number] }>;
  mlAnomaly: MLAnomalyAnalysis | null;
  
  // Alert Subsystem
  alerts: AlertEvent[];
  
  // Performance indicators / KPI Summary
  kpis: {
    avg_risk_score: number;
    total_evaluations: number;
    total_incidents: number;
    unresolved_alerts_count: number;
    high_risk_percentage: number;
    system_health_index: number;
  };

  // Trends history for charts
  historicalTrends: ChartDataPoint[];

  // WebSocket Connection Status
  wsConnected: boolean;

  // Actions & API Methods
  initAuthedSession: () => Promise<void>;
  registerUser: (username: string, password: string, role: string) => Promise<boolean>;
  loginUser: (username: string, password: string) => Promise<boolean>;
  bypassLogin: (role: string, name: string) => void;
  logout: () => void;
  
  // Real-time subscription triggers
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;

  // Database operations
  fetchSummaryKPIs: () => Promise<void>;
  fetchHistoricalTrends: () => Promise<void>;
  fetchAlertsLedger: () => Promise<void>;
  resolveAlertOnDB: (alertId: string | number) => Promise<void>;
  flagFeedEvent: (feedId: string) => void;
}

// Map database static cameras
const INITIAL_CAMERA_FEEDS: CameraFeed[] = [
  {
    id: 'CAM_01_DOCK_N',
    name: 'CAM_01_DOCK_N (Core Dock)',
    live: true,
    statusText: 'LIVE',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvIyyxOVezZIyEOqKu5I2uD654nfDjbzc-cPbDiSvQZk-fzaFV6tvh5FNS2jixuWrMbF3xIJtDFazpnTPuDuPH-xmQAyCRo7I8b2peBiDI9RxSv8NChwdwusHcd9epHEBGAuLLEHYGWFqTFcU8iqepddtaaZPhXOJEYp4RF2ecAPepPV1arvcO-AVeb65g2DJWFHvLBNfhLT4bkji4upgAhtP7JM7EYEjf6OMZejN3KwuRxJCTkiUwRICgoaxKoo3Ktk2WxlROSME',
    detectionLabel: 'Personnel Safety Checked',
    detectionStatus: 'SAFE_ZONE',
    overlayStyle: { top: '22%', left: '32%', width: '110px', height: '170px', type: 'safe' }
  },
  {
    id: 'CAM_02_MACH_S',
    name: 'CAM_02_MACH_S (Main Turbine)',
    live: true,
    statusText: 'LIVE',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_HqdUWia4QuIFG0iln5gBDjSrC-gLZcsLoiM9k_aqeUcKkJhtShHKZ0N-Y9D7ZicnS9KjNysd51Q4Id31pFDIteiIwhPZTu-Bkn8oF7lBrlK-uaTXrvKM3yX0tkYuxJyjVpJzHMiFcDfmnZ9dVWoxGdFUPpzIABXtv4dvsyN92jkf-7sd-rVfndWICw6XBpF7UEE236sXrZ4p4hH0HYhO6ICH9yN4sDYOM8eEkrQ35gGUvlta1I10VcXKlvr_LYXfo8zFcn9eO64',
    detectionLabel: 'Mechanical Bearing Probe',
    detectionStatus: 'NOMINAL',
    overlayStyle: { top: '38%', left: '45%', width: '140px', height: '140px', type: 'safe' }
  },
  {
    id: 'CAM_03_CHEM_W',
    name: 'CAM_03_CHEM_W (Suppression Unit)',
    live: true,
    statusText: 'LIVE',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyaHfBVDYbHKy0HJpjY6sNFFNzkyxikyt-9MauyzC1B6qvE1fi1a9G2dgg1a5i3wf90OnktIXmybcsbU6WT72pB6SQMDGqELaVxNpvjGoWHE0HHIW1PUV9vqdB0s8sMjoeXapVeSjhu7wZmKsFNX6jVQCiuOu5bzLEoBtAo9BBy4TtHsS10KAfXXxEKFhXJneMJ3A8GTA-s1tNWoavZQkXZCiQSZPaNLi1GZVbI0GlC1Cm4Yqie8ptQRJPW8aSJNkm01eYxqRkscU',
    detectionLabel: 'Fluid Pressure Overheat Risk',
    detectionStatus: 'SAFE_ZONE',
    overlayStyle: { top: '28%', left: '18%', width: '200px', height: '140px', type: 'safe' }
  },
  {
    id: 'CAM_04_CORR_E',
    name: 'CAM_04_CORR_E (Perimeter)',
    live: true,
    statusText: 'LIVE',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtjSbkleZdAfcesrgBm74qP7mAqPn8-IQq0rn7AkeGhPFqiN3lumwusb8kY9nYI3k82B7sZiu6na2yBdNfrIiPmIvVhsbRFj-bQGLoi7bYZRD-h7LKqHbWHowSRvnVBIskAZkvZVBWOXLVHlCqeX361q8TwKHASVtN1IuJS5B5D79XxhRPK_DAiwuDmPaYU5EzOpjcidQrmIfGDg3OhC76vOSA1er0r0xA0RupvjzGF5bv1EFL09YxLqxF7Pnh5PijBjhvy7y7Ooc',
    detectionLabel: 'Exclusion Boundary Safe',
    detectionStatus: 'PPE_OK',
    overlayStyle: { top: '24%', left: '58%', width: '90px', height: '120px', type: 'safe' }
  }
];

let wsInstance: WebSocket | null = null;
let reconnectTimer: any = null;

export const useSafetyStore = create<SafetyState>((set, get) => ({
  // Auth state defaults
  user: null,
  token: localStorage.getItem('safeguard_token'),
  authLoaded: false,
  loginError: null,

  // Live sensor metrics defaults
  sensorStats: {
    temperature: 40.0,
    temperatureMaxTrigger: 85.0,
    gasH2S: 0.15,
    vibration: 1.2,
    humidity: 45
  },
  liveRiskScore: 12,
  liveRiskStatus: 'SAFE',
  liveRiskCategory: 'LOW',
  liveActiveTriggers: [],
  liveReasoning: 'All industrial system controls verified stable. Anomaly engine report green.',
  liveThemeAccent: '#4ADE80',
  cameraFeeds: INITIAL_CAMERA_FEEDS,
  activeDetections: [],
  mlAnomaly: null,

  // Alarm logs entries
  alerts: [],

  // KPI metadata cards
  kpis: {
    avg_risk_score: 12.0,
    total_evaluations: 1,
    total_incidents: 0,
    unresolved_alerts_count: 0,
    high_risk_percentage: 0,
    system_health_index: 100.0
  },

  historicalTrends: [],
  wsConnected: false,

  // Verify token and download user details
  initAuthedSession: async () => {
    const { token } = get();
    if (!token) {
      set({ authLoaded: true });
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userDetails = await response.json();
        const opUser: Operative = {
          id: `OP-${userDetails.id}`,
          name: userDetails.username,
          email: `${userDetails.username}@safeguard.ai`,
          accessLevel: userDetails.role,
          station: 'SYS_GATEWAY',
          lastSignIn: new Date().toLocaleTimeString() + ' UTC',
          status: 'ACTIVE'
        };
        set({ user: opUser, authLoaded: true });
        
        // Connect live subscriptions immediately
        get().connectWebSocket();
        get().fetchAlertsLedger();
        get().fetchSummaryKPIs();
        get().fetchHistoricalTrends();
      } else {
        localStorage.removeItem('safeguard_token');
        set({ token: null, user: null, authLoaded: true });
      }
    } catch (e) {
      console.error('Error verifying JWT session token', e);
      set({ authLoaded: true });
    }
  },

  registerUser: async (username, password, role) => {
    set({ loginError: null });
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      if (!response.ok) {
        const err = await response.json();
        set({ loginError: err.detail || 'Failed to complete registration.' });
        return false;
      }
      return true;
    } catch (e) {
      set({ loginError: 'Server pipeline unreachable. Inspect local connection.' });
      return false;
    }
  },

  loginUser: async (username, password) => {
    set({ loginError: null });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const err = await response.json();
        set({ loginError: err.detail || 'Authorization credentials supplied are incorrect.' });
        return false;
      }

      const data = await response.json();
      localStorage.setItem('safeguard_token', data.access_token);
      
      const opUser: Operative = {
        id: `OP-${data.username.slice(0,3).toUpperCase()}`,
        name: data.username,
        email: `${data.username}@safeguard.ai`,
        accessLevel: data.role,
        station: 'COMMAND_CTRL',
        lastSignIn: new Date().toLocaleTimeString() + ' UTC',
        status: 'ACTIVE'
      };

      set({ token: data.access_token, user: opUser });
      
      // Fire connection queries
      get().connectWebSocket();
      get().fetchAlertsLedger();
      get().fetchSummaryKPIs();
      get().fetchHistoricalTrends();
      return true;
    } catch (e) {
      set({ loginError: 'Factory authorization gateway is currently offline.' });
      return false;
    }
  },

  bypassLogin: (role, name) => {
    const defaultUser: Operative = {
      id: `BYPASS-${role.substring(0,3).toUpperCase()}`,
      name: name,
      email: `${name.toLowerCase()}@safeguard.ai`,
      accessLevel: role,
      station: 'LOCAL_KBD_BYPASS',
      lastSignIn: 'LOCALBYPASS UTC',
      status: 'ACTIVE'
    };
    set({ user: defaultUser, authLoaded: true });
    get().connectWebSocket();
    get().fetchAlertsLedger();
    get().fetchSummaryKPIs();
    get().fetchHistoricalTrends();
  },

  logout: () => {
    localStorage.removeItem('safeguard_token');
    get().disconnectWebSocket();
    set({ token: null, user: null });
  },

  // Central WebSocket Manager connecting directly to backend
  connectWebSocket: () => {
    if (wsInstance) return;

    // Resolve dynamic path matching either dev iframe or direct tab
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;
    console.log('Synchronizing pipeline overlay websocket target:', wsUrl);

    try {
      wsInstance = new WebSocket(wsUrl);

      wsInstance.onopen = () => {
        console.log('Live multi-channel telemetry websocket stream synchronized successful.');
        set({ wsConnected: true });
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };

      wsInstance.onmessage = (event) => {
        try {
          const payload: LiveTelemetryPayload = JSON.parse(event.data);
          const evalNode = payload.evaluation;
          const inspect = evalNode.telemetry_inspection;
          
          // Map backend coordinates to frontend states
          set(state => {
            // Generate temperature trigger dynamically relative to state max trigger limit
            const temperatureMaxTrigger = state.sensorStats.temperatureMaxTrigger;
            
            // Map camera live overlay detections dynamically
            const updatedFeeds = state.cameraFeeds.map(feed => {
              // Map camera detections dynamically 
              if (feed.id === 'CAM_03_CHEM_W' && payload.camera_detections.length > 0) {
                const primaryDet = payload.camera_detections[0];
                return {
                  ...feed,
                  statusText: 'ALERT' as const,
                  detectionLabel: `${primaryDet.label} (${Math.round(primaryDet.confidence * 100)}%)`,
                  detectionStatus: 'HAZARD_FLAGGED',
                  overlayStyle: {
                    top: '25%',
                    left: '25%',
                    width: '180px',
                    height: '140px',
                    type: 'danger' as const
                  }
                };
              }
              // Normalise other feeds
              return feed;
            });

            // Map and parse live coordinates
            const updatedSensorStats: SensorStates = {
              temperature: inspect.temperature,
              temperatureMaxTrigger,
              gasH2S: inspect.gas_h2s, // keeps fractional gas ratio
              vibration: inspect.vibration,
              humidity: state.sensorStats.humidity // keep simulated baseline or fluctuate slightly
            };

            // Feed Recharts data timeline buffer with dynamic incoming records (limit 35 samples max for performance)
            const newTimelinePoint: ChartDataPoint = {
              timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 8),
              risk_score: evalNode.risk_score,
              temperature: inspect.temperature,
              co2_ppm: inspect.gas_h2s * 2000.0, // Convert H2S proportional index back to CO2 PPM analogical
              vibration: inspect.vibration
            };

            let revisedTrends = [...state.historicalTrends, newTimelinePoint];
            if (revisedTrends.length > 35) {
              revisedTrends.shift();
            }

            return {
              sensorStats: updatedSensorStats,
              liveRiskScore: evalNode.risk_score,
              liveRiskStatus: evalNode.status,
              liveRiskCategory: evalNode.risk_category,
              liveReasoning: evalNode.explainable_ai_reasoning,
              liveActiveTriggers: evalNode.active_triggers,
              liveThemeAccent: evalNode.theme_accent,
              activeDetections: payload.camera_detections,
              mlAnomaly: evalNode.ml_anomaly_analysis || null,
              cameraFeeds: updatedFeeds,
              historicalTrends: revisedTrends
            };
          });

          // Fetch fresh metrics after receiving alerts or dangerous event mutations
          if (evalNode.status === 'DANGER' || evalNode.risk_category === 'HIGH') {
            get().fetchAlertsLedger();
            get().fetchSummaryKPIs();
          }
        } catch (err) {
          console.error('Failed parsing live socket channel snapshot', err);
        }
      };

      wsInstance.onclose = () => {
        console.warn('Websocket closed. Commencing self-healing retry session...');
        set({ wsConnected: false });
        wsInstance = null;
        
        // Attempt reconnection after absolute exponential backoff delay of 3 seconds
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            get().connectWebSocket();
          }, 3000);
        }
      };

      wsInstance.onerror = (e) => {
        console.error('Socket encounter error pipeline constraint:', e);
        wsInstance?.close();
      };

    } catch (err) {
      console.error('Unable to configure secure socket subscription link', err);
    }
  },

  disconnectWebSocket: () => {
    if (wsInstance) {
      wsInstance.close();
      wsInstance = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    set({ wsConnected: false });
  },

  // Pull database records via HTTP REST
  fetchSummaryKPIs: async () => {
    try {
      const response = await fetch('/api/analytics/summary');
      if (response.ok) {
        const data = await response.json();
        set({ kpis: data });
      }
    } catch (e) {
      console.error('Failed downloading analytical KPI metrics', e);
    }
  },

  fetchHistoricalTrends: async () => {
    try {
      const response = await fetch('/api/analytics/trends?limit=30');
      if (response.ok) {
        const dbTrends = await response.json();
        // Format to ChartDataPoint
        const formatted: ChartDataPoint[] = dbTrends.map((t: any) => ({
          timestamp: t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : '00:00:00',
          risk_score: t.risk_score || 0,
          temperature: t.temperature || 0,
          co2_ppm: t.co2_ppm || 0,
          vibration: t.vibration_mm_s || 0
        }));
        set({ historicalTrends: formatted });
      }
    } catch (e) {
      console.error('Failed retrieving telemetry trends database logs', e);
    }
  },

  fetchAlertsLedger: async () => {
    try {
      const response = await fetch('/api/alerts?limit=50');
      if (response.ok) {
        const dbAlerts = await response.json();
        // Convert to client AlertEvent structure
        const mappedAlerts: AlertEvent[] = dbAlerts.map((a: any) => {
          const rulesCodeList = a.triggered_rules ? a.triggered_rules.split(',') : [];
          return {
            id: String(a.id),
            title: `Alert [Code: ${a.triggered_rules || 'GENERAL'}]: Category ${a.risk_category}`,
            message: a.reasoning || 'Hazard condition breached configured limit safety arrays.',
            severity: a.risk_category === 'HIGH' ? 'critical' : a.risk_category === 'MEDIUM' ? 'warning' : 'info',
            timestamp: new Date(a.timestamp).toLocaleTimeString() + ' | SQLite',
            location: 'Sector G Compound Grid',
            confidence: Math.round(a.risk_score),
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPRCA2qLrvE5wwFerp8TNCFAEg6_syhM1EYzS3H9h_b5ogwARXGVf7pH6xpYeKvMAbX_zbctzA0LQpPzAOGyU0eluYNoCk6-naA43F2IQihAaeTFfPL2XCzndxyRh5kbfgnBaXXiO5nYTo6iOUspjo7fGoQWsoiK3WWxlOVIU2NVVF25X1Zpvyusux86Ua0WQ8H3CUmbpo9IPLb2oPieyzZGtkhMPajS6CalVWX7q7RJWIBoGUiI2drZgKuIS6FmpAubtPHPo2LHA',
            recommendation: rulesCodeList.map((code: string) => `Review specific failure criteria for Code: ${code}. Verify physical relief valve metrics.`),
            status: a.resolved ? 'RESOLVED' : 'ACTIVE'
          };
        });
        set({ alerts: mappedAlerts });
      }
    } catch (e) {
      console.error('Error contacting Database Alarms Ledger', e);
    }
  },

  resolveAlertOnDB: async (alertId) => {
    const { token } = get();
    // Resolve locally if unauthenticated demo mode is bypass active
    if (!token) {
      set(state => ({
        alerts: state.alerts.map(a => a.id === String(alertId) ? { ...a, status: 'RESOLVED', operatorActionTaken: 'Bypassed offline' } : a)
      }));
      return;
    }

    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        set(state => ({
          alerts: state.alerts.map(a => a.id === String(alertId) ? { ...a, status: 'RESOLVED' } : a)
        }));
        // Reload indicators
        get().fetchSummaryKPIs();
        get().fetchAlertsLedger();
      } else {
        alert('Verification failure. Only authorized Safety Officers, Managers, or Admins can resolve critical anomalies.');
      }
    } catch (e) {
      console.error('Request resolve incident failed:', e);
    }
  },

  flagFeedEvent: (feedId) => {
    const { user, cameraFeeds } = get();
    const feed = cameraFeeds.find(f => f.id === feedId);
    if (!feed) return;

    const flaggedEvent: AlertEvent = {
      id: `alert-flag-${Math.floor(Math.random() * 900 + 100)}`,
      title: `Notice: Operator Flagged ${feed.name}`,
      message: `Supervisor ${user?.name || 'Reyes'} flagged visual marker on ${feed.name}. Feed frame cataloged dynamically.`,
      severity: 'info',
      timestamp: `${new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5)} | LOCAL`,
      location: `${feed.name} CCTV Matrix`,
      confidence: 100,
      imageUrl: feed.imageUrl,
      recommendation: [
        'Examine telemetry timeline patterns surrounding the manual flag event.',
        'Inform safety personnel to execute standard clearance sweep.'
      ],
      status: 'ACTIVE'
    };

    set(state => ({
      alerts: [flaggedEvent, ...state.alerts]
    }));
  }
}));
