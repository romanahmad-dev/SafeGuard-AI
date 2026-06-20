import React, { useState, useEffect, useRef } from 'react';
import { Severity, Operative, SensorStates, AlertEvent, CameraFeed, NotificationRule } from './types';
import { useSafetyStore } from './store';

// Component imports
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import SurveillanceView from './components/SurveillanceView';
import SensorsView from './components/SensorsView';
import AlertsView from './components/AlertsView';
import SettingsView from './components/SettingsView';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'surveillance' | 'sensors' | 'alerts' | 'settings'>('dashboard');
  
  // Connect centralized Zustand state hooks
  const user = useSafetyStore(state => state.user);
  const token = useSafetyStore(state => state.token);
  const authLoaded = useSafetyStore(state => state.authLoaded);
  const initAuthedSession = useSafetyStore(state => state.initAuthedSession);
  const logout = useSafetyStore(state => state.logout);

  const sensorStats = useSafetyStore(state => state.sensorStats);
  const alerts = useSafetyStore(state => state.alerts);
  const cameraFeeds = useSafetyStore(state => state.cameraFeeds);
  const flagFeedEvent = useSafetyStore(state => state.flagFeedEvent);
  const resolveAlertOnDB = useSafetyStore(state => state.resolveAlertOnDB);
  const wsConnected = useSafetyStore(state => state.wsConnected);

  // Maintain local simulated components from template
  const [operatives, setOperatives] = useState<Operative[]>([
    {
      id: "AJ-12",
      name: "Arthur Jenkins",
      email: "jenkins.a@safeguard.ai",
      accessLevel: "Admin",
      station: "CENTER_04_A",
      lastSignIn: "04:12:00 UTC",
      status: "ACTIVE"
    }
  ]);
  const [notificationRules] = useState<NotificationRule[]>([
    { id: 'nr-1', severity: 'critical', title: 'Critical Failures', description: 'SMS + Voice Call (All Officers)' },
    { id: 'nr-2', severity: 'warning', title: 'Warning Thresholds', description: 'System Push + Email' },
    { id: 'nr-3', severity: 'info', title: 'Log Diagnostics', description: 'Silent Log Entry Only' }
  ]);

  // Emergency Stop Mechanism
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [estopHoldProgress, setEstopHoldProgress] = useState(0);
  const estopTimerRef = useRef<number | null>(null);

  // AI Assistant Modal state
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [customReportPrompt, setCustomReportPrompt] = useState('Standard Industrial EPA Evacuation Directive');
  const [generatedReportText, setGeneratedReportText] = useState<string | null>(null);

  // Toast notification alert state
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string; severity: Severity } | null>(null);

  // Establish sessions upon applet component mount
  useEffect(() => {
    initAuthedSession();
  }, [initAuthedSession]);

  // Check if server is running in critical state to trigger visual telemetry warning toast alerts
  useEffect(() => {
    if (!user || emergencyActive) return;

    // Check if temperature or vibration exceeds triggers
    const criticalTemp = sensorStats.temperature > sensorStats.temperatureMaxTrigger;
    const criticalVib = sensorStats.vibration > 7.0;

    if (criticalTemp) {
      triggerLocalWarning('Thermal Overheat Warning', `Core thermal sensor crossed safety barrier at ${sensorStats.temperature.toFixed(1)}°C. Check secondary loops.`);
    } else if (criticalVib) {
      triggerLocalWarning('Mechanical Oscillation Peak', `Oscillating vibration reading exceeded tolerance ceiling. Current value: ${sensorStats.vibration.toFixed(1)} MM/S.`);
    }
  }, [sensorStats, user, emergencyActive]);

  const triggerLocalWarning = (title: string, message: string) => {
    if (activeToast && activeToast.title === title) return;
    setActiveToast({
      id: `toast-${Math.floor(Math.random() * 1000)}`,
      title: `Critical: ${title}`,
      message,
      severity: 'critical'
    });
    setTimeout(() => {
      setActiveToast(null);
    }, 5000);
  };

  // ESTOP triggers
  const startEstopHold = () => {
    setEstopHoldProgress(0);
    const step = 5;
    
    if (estopTimerRef.current) clearInterval(estopTimerRef.current);

    estopTimerRef.current = setInterval(() => {
      setEstopHoldProgress(prev => {
        if (prev >= 100) {
          if (estopTimerRef.current) clearInterval(estopTimerRef.current);
          setEmergencyActive(true);
          setEstopHoldProgress(0);
          alert('🚨 EMERGENCY STOP PROTOCOL INITIATED!\nALL WORKSPACE MOTORS AND FLUID SUPPRESSION SYSTEMS SUSPENDED.');
          return 0;
        }
        return prev + step;
      });
    }, 150) as unknown as number;
  };

  const cancelEstopHold = () => {
    if (estopTimerRef.current) {
      clearInterval(estopTimerRef.current);
      estopTimerRef.current = null;
    }
    setEstopHoldProgress(0);
  };

  const handleUpdateAlertStatus = async (alertId: string, status: AlertEvent['status'], actionText?: string) => {
    // Resolve directly on the centralized SQLite database
    await resolveAlertOnDB(alertId);
  };

  const handleGenerateAIReport = () => {
    setIsGeneratingReport(true);
    setGeneratedReportText(null);

    // Dynamic compilation of system risks to present in Gemini report text!
    setTimeout(() => {
      setIsGeneratingReport(false);
      const activeAnomalyLines = alerts
        .filter(a => a.status === 'ACTIVE')
        .map(a => `- **Anomaly [${a.id}]**: ${a.title} (Confidence: ${a.confidence}%)`)
        .join('\n');

      setGeneratedReportText(`# SAFE-GUARD AI SAFETY ANALYSIS REPORT
**AUTHORIZATION LEVEL:** ${user?.accessLevel || 'OPERATIVE'}
**AUDITED OPERATOR:** ${user?.name || 'Officer Reyes'}
**COMPLIANCE COMPILATION:** ${customReportPrompt}
**GENERATED ON:** ${new Date().toISOString()}

---

## 1. Safety Telemetry Metrics Overview
The neural engine processed safety metrics directly from the physical sensor array:
*   Reactor Core Temp: ${sensorStats.temperature.toFixed(1)}°C (Shutdown threshold configured at ${sensorStats.temperatureMaxTrigger}°C)
*   Active H2S Concentration Level: ${sensorStats.gasH2S.toFixed(2)} PPM (Risk ceiling: 0.15 PPM)
*   Oscillating Vibration: ${sensorStats.vibration.toFixed(1)} MM/S
*   Ambient Relative Humidity: ${sensorStats.humidity}% RH

## 2. Identified Active Hazards Logged
The safety command database reflects the following unresolved containment events:
${activeAnomalyLines || '* No unresolved hazards flagged nominal safety conditions verified.'}

## 3. Directed Corrective Action Mandate
Pursuant to ISO 45001 containment policies:
1.  **Safety Override Action**: Engage secondary coolant circuits.
2.  **Operator Action Required**: Calibrate humidity baselines and service the secondary bearings of Unit B-4.
3.  **Containment Valves**: Restrict flow rate to prevent chemical containment cell drift.

---
**SECURE SIGNAL AUDIT ENVELOPE SECURED**
*Hash: SG-AI-UPLINK-${Math.floor(Math.random() * 900000 + 100000)}*`);
    }, 2000);
  };

  const handleCopyReport = () => {
    if (!generatedReportText) return;
    navigator.clipboard.writeText(generatedReportText);
    alert('Report written to supervisor copy timeline.');
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleUpdateTemperatureTrigger = (temp: number) => {
    // Update local state and trigger maximum barrier limits
    useSafetyStore.setState(state => ({
      sensorStats: {
        ...state.sensorStats,
        temperatureMaxTrigger: temp
      }
    }));
  };

  // Wait for session loaders to resolve
  if (!authLoaded) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-[#FFD700] rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-mono text-[#94A3B8] tracking-widest uppercase">authenticating secure node gateway</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all duration-500 relative ${
      emergencyActive ? 'alert-critical-pulse pb-12' : 'bg-[#0F1115] pb-4'
    }`}>
      
      {/* Alarming Emergency Strobe Overlay */}
      {emergencyActive && (
        <div className="bg-red-950 text-white py-2.5 px-6 shrink-0 flex justify-between items-center z-50 border-b border-[#F87171] animate-pulse relative">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#F87171] text-xl font-bold animate-[spin_2s_linear_infinite]">emergency</span>
            <span className="font-mono text-xs font-bold uppercase tracking-widest">
              CRITICAL: PROTOCOL ALPHA-7 ACTUATED • SERVO MOTOR POWER DISENGAGED
            </span>
          </div>

          <button 
            type="button"
            onClick={() => {
              const confirmReset = window.confirm('Verify Command Supervisor Key Override to resume standard operations?');
              if (confirmReset) {
                setEmergencyActive(false);
                alert('Factory floor operations safely restored to baseline.');
              }
            }}
            className="px-4 py-1.5 bg-[#F87171] hover:bg-[#F87171]/80 text-[#0F1115] font-extrabold text-[10px] tracking-widest uppercase rounded-sm cursor-pointer transition-all"
          >
            DISARM SIRENS & OVERRIDE
          </button>
        </div>
      )}

      {/* MASTER TOP HEADER COMMAND NAV (Mock Screen 1 Layout Header) */}
      <header className="h-20 bg-[#161B22] border-b border-[#2D3139] px-8 flex items-center justify-between shrink-0 sticky top-0 z-40">
        
        {/* Left Side Brand */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-[#0F1115] border border-[#2D3139] flex items-center justify-center relative">
            <span className="material-symbols-outlined text-[#FFD700] text-2xl relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_with_heart
            </span>
            <div className="absolute inset-0 rounded-md border border-[#FFD700]/10 scale-125 animate-ping"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-[0.18em] text-[#FFD700] uppercase font-mono">SAFE-GUARD AI</h1>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${wsConnected ? 'bg-emerald-950 text-[#4ADE80] border border-emerald-800' : 'bg-red-955 text-[#F87171] border border-red-900'} uppercase font-mono`}>
                {wsConnected ? 'socket live' : 'disconnected'}
              </span>
            </div>
            <p className="text-[10px] text-[#94A3B8] font-mono tracking-widest leading-none mt-1">INDUSTRIAL INCIDENT COMMAND</p>
          </div>
        </div>

        {/* Middle View Selector Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#0F1115] border border-[#2D3139] rounded-sm p-1">
          {([
            { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
            { id: 'surveillance', label: 'Surveillance', icon: 'videocam' },
            { id: 'sensors', label: 'Telemetry Grid', icon: 'sensors' },
            { id: 'alerts', label: 'Alarms Ledger', icon: 'notifications_active' },
            { id: 'settings', label: 'Configuration', icon: 'tune' }
          ] as const).map((tab) => {
            const isActive = currentView === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentView(tab.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-sm font-bold tracking-wider text-[10.5px] uppercase transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'bg-[#FFD700] text-[#0F1115] shadow-[0_2px_8px_rgba(255,215,0,0.15)]' 
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#161B22]'
                }`}
              >
                <span className="material-symbols-outlined text-sm font-semibold">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right User control & Emergency action widget */}
        <div className="flex items-center gap-6">
          
          {/* Operative profile widget */}
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-xs font-bold text-[#E2E8F0] leading-none">{user.name}</p>
              <p className="text-[9.5px] text-zinc-400 mt-1 leading-none font-semibold">Role: {user.accessLevel}</p>
            </div>
            <button 
              onClick={logout}
              className="px-2.5 py-1.5 border border-red-900 bg-red-955/10 hover:bg-red-700 hover:text-white rounded-sm text-red-400 font-mono text-[9px] font-bold uppercase transition-all cursor-pointer whitespace-nowrap"
            >
              LOGOUT
            </button>
          </div>

          {/* EMERGENCY STOP TRIGGER holding gesture element */}
          <div className="relative">
            <button
              onMouseDown={startEstopHold}
              onMouseUp={cancelEstopHold}
              onMouseLeave={cancelEstopHold}
              onTouchStart={startEstopHold}
              onTouchEnd={cancelEstopHold}
              className={`h-11 px-5 border rounded-sm font-mono text-[10px] font-extrabold uppercase tracking-widest relative overflow-hidden transition-all select-none cursor-pointer duration-200 ${
                emergencyActive 
                  ? 'bg-transparent text-[#94A3B8] border-[#2D3139] pointer-events-none' 
                  : 'bg-red-950/20 text-[#F87171] border-[#F87171]/40 hover:bg-[#F87171]/10'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F87171] animate-pulse text-sm">emergency</span>
                HOLD 3S ESTOP
              </span>
              
              {/* hold-to-fill background bar */}
              <div 
                className="absolute left-0 bottom-0 top-0 bg-[#F87171] transition-all pointer-events-none" 
                style={{ width: `${estopHoldProgress}%` }}
              />
            </button>
          </div>

        </div>

      </header>

      {/* MOBILE LOWER NAV TAB BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161B22] border-t border-[#2D3139] px-4 py-2 flex items-center justify-around">
        {([
          { id: 'dashboard', label: 'Monitor', icon: 'dashboard' },
          { id: 'surveillance', label: 'Surveil', icon: 'videocam' },
          { id: 'sensors', label: 'Sensors', icon: 'sensors' },
          { id: 'alerts', label: 'Alarms', icon: 'notifications_active' },
          { id: 'settings', label: 'Configs', icon: 'tune' }
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCurrentView(tab.id)}
            className={`flex flex-col items-center p-2 text-[#94A3B8] cursor-pointer ${currentView === tab.id ? 'text-[#FFD700]' : ''}`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            <span className="text-[8px] font-bold tracking-brand-caps uppercase mt-1">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* PRIMARY VIEWER CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 outline-none mb-12">
        {currentView === 'dashboard' && (
          <DashboardView 
            stats={sensorStats} 
            alerts={alerts} 
            onNavigate={setCurrentView}
            onOpenReportGenerator={() => setShowReportGenerator(true)}
          />
        )}
        
        {currentView === 'surveillance' && (
          <SurveillanceView 
            feeds={cameraFeeds} 
            onFlagEvent={flagFeedEvent} 
            onOpenReportGenerator={() => setShowReportGenerator(true)}
          />
        )}

        {currentView === 'sensors' && (
          <SensorsView 
            stats={sensorStats} 
            onRunAnalysis={() => {
              alert('CALCULATING TELEMETRY CORRELATIONS (1.2M points parsed):\nBaseline parameters aligned of 99.8%.\nRecalibration required for Sector G X-axis servo.');
            }}
          />
        )}

        {currentView === 'alerts' && (
          <AlertsView 
            alerts={alerts} 
            onUpdateAlertStatus={handleUpdateAlertStatus}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView 
            temperatureMaxTrigger={sensorStats.temperatureMaxTrigger}
            onUpdateTemperatureTrigger={handleUpdateTemperatureTrigger}
            operatives={operatives}
            onAddOperative={(newOp) => setOperatives(prev => [...prev, newOp])}
            notificationRules={notificationRules}
          />
        )}
      </main>

      {/* ACTIVE TOAST POPUP BLOCKER */}
      {activeToast && (
        <div className="fixed bottom-24 right-8 z-50 glass-panel p-4 rounded-sm border-l-4 border-l-[#F87171] animate-[bounce_0.6s_ease] max-w-md w-full bg-[#161B22] flex gap-3.5 shadow-2xl">
          <div className="text-[#F87171] pt-0.5">
            <span className="material-symbols-outlined">warning_hazard</span>
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-white tracking-wider uppercase">{activeToast.title}</h5>
            <p className="text-[11px] text-[#94A3B8] leading-normal">{activeToast.message}</p>
          </div>
          <button onClick={() => setActiveToast(null)} className="ml-auto text-[#94A3B8] hover:text-white shrink-0 self-start">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* GEMINI SAFETY AUDIT REPORT GENERATOR MODAL */}
      {showReportGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setShowReportGenerator(false)} />
          
          <div className="relative glass-panel rounded-sm max-w-2xl w-full p-6 space-y-5 bg-[#161B22] border border-[#2D3139]">
            
            <div className="flex justify-between items-start pb-3 border-b border-[#2D3139]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#FFD700]">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  <h3 className="text-sm font-extrabold tracking-wider uppercase">SAFE-GUARD AI Audit Assistant</h3>
                </div>
                <p className="text-[10.5px] text-[#94A3B8]">Generate on-demand compliance reports using Google Gemini models fusing sensors metadata.</p>
              </div>

              <button 
                onClick={() => setShowReportGenerator(false)}
                className="text-[#94A3B8] hover:text-white"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold tracking-widest text-[#FFD700] uppercase block">
                  Select Compliance Protocol Directive Template
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setCustomReportPrompt('Standard Industrial EPA Evacuation Directive')}
                    className={`p-3 text-left rounded-sm text-xs font-semibold border transition-all ${
                      customReportPrompt === 'Standard Industrial EPA Evacuation Directive'
                        ? 'bg-[#FFD700]/10 border-[#FFD700] text-white font-bold'
                        : 'bg-transparent border-[#2D3139] text-[#94A3B8] hover:bg-[#0F1115]'
                    }`}
                  >
                    EPA Evacuation Policy 2026
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCustomReportPrompt('OSHA Thermal Tolerance Violation Review')}
                    className={`p-3 text-left rounded-sm text-xs font-semibold border transition-all ${
                      customReportPrompt === 'OSHA Thermal Tolerance Violation Review'
                        ? 'bg-[#FFD700]/10 border-[#FFD700] text-white font-bold'
                        : 'bg-transparent border-[#2D3139] text-[#94A3B8] hover:bg-[#0F1115]'
                    }`}
                  >
                    OSHA Overheat Review
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerateAIReport}
                  disabled={isGeneratingReport}
                  className="w-full py-3 bg-[#FFD700] text-[#0F1115] font-extrabold tracking-widest text-xs rounded-sm uppercase flex items-center justify-center gap-2 hover:bg-[#FFD700]/95 active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_15px_rgba(255,215,0,0.1)]"
                >
                  <span className="material-symbols-outlined text-base animate-pulse">science</span>
                  <span>{isGeneratingReport ? 'COMPILING INDUSTRIAL SIGNALS...' : 'INITIATE NEURAL INFERENCE'}</span>
                </button>
              </div>

              {/* Loader */}
              {isGeneratingReport && (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-md border-4 border-[#2D3139] animate-pulse"></div>
                    <div className="absolute inset-x-0 inset-y-0 rounded-md border-t-4 border-t-[#FFD700] animate-spin"></div>
                  </div>
                  <p className="text-xs font-mono text-[#94A3B8] uppercase tracking-widest">fusing sensor matrix baselines</p>
                </div>
              )}

              {/* Result markdown viewport container */}
              {generatedReportText && (
                <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                  <div className="bg-[#0F1115] p-4 rounded-sm border border-[#2D3139] max-h-[300px] overflow-y-auto text-xs leading-relaxed space-y-4 selection:bg-[#FFD700] selection:text-[#0F1115]">
                    <pre className="font-sans whitespace-pre-wrap text-[#E2E8F0] font-medium whitespace-pre-line select-text">
                      {generatedReportText}
                    </pre>
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button 
                      onClick={handlePrintReport}
                      className="flex items-center gap-1.5 px-4 py-2 hover:bg-[#0F1115] text-[#E2E8F0] rounded-sm text-xs uppercase font-bold border border-[#2D3139] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">print</span>
                      <span>Print Document</span>
                    </button>
                    <button 
                      onClick={handleCopyReport}
                      className="flex items-center gap-1.5 px-5 py-2 bg-[#FFD700] hover:bg-[#FFD700]/95 text-[#0F1115] rounded-sm text-xs uppercase font-extrabold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      <span>Copy Compliance text</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
