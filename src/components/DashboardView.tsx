import React, { useState } from 'react';
import { SensorStates, AlertEvent } from '../types';
import { useSafetyStore } from '../store';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardViewProps {
  stats: SensorStates;
  alerts: AlertEvent[];
  onNavigate: (view: 'dashboard' | 'surveillance' | 'sensors' | 'alerts' | 'settings') => void;
  onOpenReportGenerator: () => void;
}

export default function DashboardView({ stats, alerts, onNavigate, onOpenReportGenerator }: DashboardViewProps) {
  const [queuedTasks, setQueuedTasks] = useState<string[]>([]);
  const [approvedUpdates, setApprovedUpdates] = useState<string[]>([]);
  const [reviewedConfigs, setReviewedConfigs] = useState<string[]>([]);

  // Pull active security role from Zustand store
  const user = useSafetyStore(state => state.user);
  const liveRiskScore = useSafetyStore(state => state.liveRiskScore);
  const liveRiskStatus = useSafetyStore(state => state.liveRiskStatus);
  const liveRiskCategory = useSafetyStore(state => state.liveRiskCategory);
  const liveActiveTriggers = useSafetyStore(state => state.liveActiveTriggers);
  const liveReasoning = useSafetyStore(state => state.liveReasoning);
  const liveThemeAccent = useSafetyStore(state => state.liveThemeAccent);
  const historicalTrends = useSafetyStore(state => state.historicalTrends);
  const mlAnomaly = useSafetyStore(state => state.mlAnomaly);

  const getRolePrecedence = (roleName?: string) => {
    switch (roleName) {
      case 'Admin': return 4;
      case 'Manager': return 3;
      case 'Safety Officer': return 2;
      case 'Viewer': return 1;
      default: return 1;
    }
  };

  const currentRoleLevel = getRolePrecedence(user?.accessLevel);

  const toggleTask = (taskId: string) => {
    if (currentRoleLevel < 2) {
      alert("⚠️ ACCESS PRIVILEGE VIOLATION: Viewers cannot queue corrective maintenance procedures.");
      return;
    }
    if (queuedTasks.includes(taskId)) {
      setQueuedTasks(queuedTasks.filter(id => id !== taskId));
    } else {
      setQueuedTasks([...queuedTasks, taskId]);
    }
  };

  const toggleUpdate = (updateId: string) => {
    if (currentRoleLevel < 2) {
      alert("⚠️ ACCESS PRIVILEGE VIOLATION: Viewers cannot calibrate plant sensor clusters.");
      return;
    }
    if (approvedUpdates.includes(updateId)) {
      setApprovedUpdates(approvedUpdates.filter(id => id !== updateId));
    } else {
      setApprovedUpdates([...approvedUpdates, updateId]);
    }
  };

  const toggleConfig = (configId: string) => {
    if (currentRoleLevel < 3) {
      alert("⚠️ ACCESS PRIVILEGE VIOLATION: Only Managers and Admins can approve modifications to safety threshold criteria.");
      return;
    }
    if (reviewedConfigs.includes(configId)) {
      setReviewedConfigs(reviewedConfigs.filter(id => id !== configId));
    } else {
      setReviewedConfigs([...reviewedConfigs, configId]);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score < 25) return { text: 'LOW THREAT', color: 'text-[#4ADE80]', glow: 'risk-glow-safe', progressColor: '#4ADE80' };
    if (score < 60) return { text: 'ELEVATED RISK', color: 'text-[#FFD700]', glow: 'risk-glow-warning', progressColor: '#FFD700' };
    return { text: 'CRITICAL THREAT', color: 'text-[#F87171] animate-pulse', glow: 'risk-glow-danger', progressColor: '#F87171' };
  };

  const riskMeta = getRiskLevel(liveRiskScore);

  // Group historical alerts by severity levels to visualize "Alert History" using Recharts
  const alertStats = [
    {
      name: 'Critical',
      count: alerts.filter(a => a.severity === 'critical').length,
      color: '#F87171'
    },
    {
      name: 'Warning',
      count: alerts.filter(a => a.severity === 'warning').length,
      color: '#FFD700'
    },
    {
      name: 'Info',
      count: alerts.filter(a => a.severity === 'info').length,
      color: '#38BDF8'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* 4-KPI Overview Panel Row (Screen 4 Header) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Risk Card */}
        <div className="glass-panel p-4 rounded-sm flex flex-col justify-between hover:border-[#FFD700]/40 transition-[border-color] duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase font-mono">AGGREGATED RISK INDEX</span>
            <span className={`material-symbols-outlined text-sm ${riskMeta.color}`}>security</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">{liveRiskScore}%</h2>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${riskMeta.color}`}>
              {liveRiskCategory}
            </span>
          </div>
          <div className="w-full h-1 bg-[#0F1115] rounded-none overflow-hidden mt-3">
            <div 
              className="h-full transition-all duration-500" 
              style={{ width: `${liveRiskScore}%`, backgroundColor: riskMeta.progressColor }}
            ></div>
          </div>
        </div>

        {/* Active Sensors Card */}
        <div className="glass-panel p-4 rounded-sm flex flex-col justify-between hover:border-[#FFD700]/40 transition-[border-color] duration-300 pointer-events-auto cursor-pointer" onClick={() => onNavigate('sensors')}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">ACTIVE INTEGRATIONS</span>
            <span className="material-symbols-outlined text-[#FFD700] text-sm">sensors</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">1,240</h2>
            <span className="text-[#94A3B8] font-mono text-[10px]">COOP STREAMS</span>
          </div>
          <span className="text-[#4ADE80] text-[10px] font-semibold mt-3 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full animate-pulse"></span> 100% SECURE SIGNAL
          </span>
        </div>

        {/* Personnel Count Card */}
        <div className="glass-panel p-4 rounded-sm flex flex-col justify-between hover:border-[#FFD700]/40 transition-[border-color] duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">PERSONNEL ENROLLED</span>
            <span className="material-symbols-outlined text-[#FFD700] text-sm">groups</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">42</h2>
            <span className="text-[#94A3B8] font-mono text-[10px]">SECTOR G EXPEDITION</span>
          </div>
          <span className="text-[#94A3B8] text-[10px] font-semibold mt-3 uppercase tracking-wider font-mono">
            STAFF ACCOUNT NOMINAL
          </span>
        </div>

        {/* Incident Count */}
        <div className="glass-panel p-4 rounded-sm flex flex-col justify-between hover:border-[#FFD700]/40 transition-[border-color] duration-300 cursor-pointer" onClick={() => onNavigate('alerts')}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">UNRESOLVED ALARMS</span>
            <span className="material-symbols-outlined text-[#F87171] text-sm">notifications_active</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              {alerts.filter(a => a.status === 'ACTIVE').length}
            </h2>
            <span className="text-[#94A3B8] font-mono text-[10px]">ACTIVE TRACES</span>
          </div>
          <span className="text-[#4ADE80] text-[10px] font-semibold mt-3 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full"></span> HISTORICAL CATALOG SYNCED
          </span>
        </div>

      </div>

      {/* Grid Structure (Screen 1 Main Visualization Body) */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: AI Risk Breakdown (3/12) */}
        <div className="col-span-12 lg:col-span-3 glass-panel p-5 rounded-sm flex flex-col justify-between border border-[#2D3139]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FFD700]" style={{ fontVariationSettings: "'FILL' 1" }}>
                psychology
              </span>
              <h2 className="text-[11px] font-bold tracking-wider text-[#FFD700] uppercase font-mono">EXPLAINABLE AI REASONING</h2>
            </div>
            
            <div className="space-y-4">
              
              <div className="p-4 bg-[#0F1115] rounded-sm border-l-2 border-[#FFD700]">
                <p className="text-[10px] font-bold tracking-wider uppercase text-[#FFD700] mb-1 font-mono">
                  ANOMALY ENGINE SUMMARY
                </p>
                <p className="text-xs text-[#94A3B8] leading-relaxed select-text">
                  {liveReasoning}
                </p>
              </div>

              {mlAnomaly && (
                <div className={`p-4 bg-[#0F1115] rounded-sm border-l-2 ${mlAnomaly.ml_anomaly_detected ? 'border-[#F87171]' : 'border-[#4ADE80]'}`}>
                  <p className="text-[10px] font-bold tracking-wider uppercase text-[#94A3B8] mb-1 font-mono">
                    ML ENGINE STATUS
                  </p>
                  <p className="text-xs text-white leading-normal font-semibold">
                    {mlAnomaly.operational_status} (Score: {mlAnomaly.anomaly_score.toFixed(3)})
                  </p>
                  <p className="text-[10.5px] text-slate-500 font-mono mt-1">
                    Isolation Forest Confidence: {Math.round(mlAnomaly.anomaly_confidence * 100)}%
                  </p>
                </div>
              )}

              {liveActiveTriggers && liveActiveTriggers.length > 0 && (
                <div className="p-4 bg-[#0F1115] rounded-sm border-l-2 border-[#F87171] space-y-1">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-[#F87171] mb-1 font-mono">
                    ACTIVE TRIGGERED VIOLATIONS
                  </p>
                  {liveActiveTriggers.map((trig, i) => (
                    <div key={i} className="text-xs text-slate-200">
                      • <span className="font-mono text-[10.5px] text-slate-400">[{trig.code}]</span>: {trig.message}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          <div className="pt-4 border-t border-[#2D3139] mt-6">
            <p className="text-[9px] text-[#94A3B8] uppercase tracking-widest mb-1 font-mono">Model Engine Version</p>
            <p className="text-xs font-mono text-[#94A3B8]">SG-NEURAL-V4.2.0 (Stable)</p>
          </div>
        </div>

        {/* MIDDLE COLUMN: Central Visualization (6/12) */}
        <div className="col-span-12 lg:col-span-6 glass-panel rounded-sm flex flex-col p-6 min-h-[420px] relative overflow-hidden bg-[#161B22]/60">
          
          <div className="w-full flex justify-between items-center pb-4 border-b border-[#2D3139] mb-4">
            <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono">REALTIME RISK DEVIATION</h4>
            <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-700/50 rounded-sm font-mono text-[9px] text-[#FFD700] uppercase tracking-wider">
              {liveRiskStatus} ZONE
            </span>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Left circular dial */}
            <div className="flex flex-col items-center justify-center relative">
              <div className="relative w-52 h-52 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle 
                    cx="104" 
                    cy="104" 
                    fill="transparent" 
                    r="88" 
                    stroke="#0F1115" 
                    strokeWidth="12" 
                  />
                  <circle 
                    className={riskMeta.glow}
                    cx="104" 
                    cy="104" 
                    fill="transparent" 
                    r="88" 
                    stroke={riskMeta.progressColor} 
                    strokeWidth="12" 
                    strokeDasharray="553" 
                    strokeDashoffset={553 - (liveRiskScore / 100) * 553}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                </svg>

                {/* Glowing aggregated risk center readouts */}
                <div className="text-center z-20 space-y-1">
                  <p className="text-[9px] font-bold tracking-[0.16em] text-[#94A3B8] uppercase font-mono">
                    RISK SCORE
                  </p>
                  <h1 className="text-5xl font-extrabold text-white tracking-tighter">
                    {liveRiskScore}
                  </h1>
                  <p className={`text-[10px] font-bold tracking-wider uppercase ${riskMeta.color} font-mono`}>
                    {riskMeta.text}
                  </p>
                </div>
              </div>
            </div>

            {/* Right chart detailing overall risk trend timeline (Using Recharts) */}
            <div className="w-full h-52">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-3 font-mono tracking-wider">AGGREGATED RISK MATRIX</p>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={historicalTrends} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="timestamp" stroke="#52525b" fontSize={8} fontFamily="monospace" />
                  <YAxis stroke="#52525b" fontSize={8} fontFamily="monospace" />
                  <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: '#2D3139', fontSize: 10, fontFamily: 'monospace' }} />
                  <Area type="monotone" dataKey="risk_score" stroke={riskMeta.progressColor} fill={riskMeta.progressColor} fillOpacity={0.15} name="Risk %" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Core Metrics row */}
          <div className="grid grid-cols-3 gap-6 w-full max-w-lg mx-auto mt-4 pt-4 border-t border-[#2D3139] text-center">
            <div>
              <p className="text-[9px] font-bold tracking-wider text-[#94A3B8] uppercase mb-1 font-mono">RELIABILITY INDEX</p>
              <p className="text-base font-extrabold text-white">482h MTTF</p>
            </div>
            <div className="border-x border-[#2D3139]">
              <p className="text-[9px] font-bold tracking-wider text-[#94A3B8] uppercase mb-1 font-mono">NET ENGINE LATENCY</p>
              <p className="text-base font-bold text-[#4ADE80]">99.98% / 12MS</p>
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-wider text-[#94A3B8] uppercase mb-1 font-mono">COMPUTE BURDEN</p>
              <p className="text-base font-extrabold text-white">62% GPU</p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Confidence & Alert Distribution (3/12) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          
          {/* Confidence factor score */}
          <div className="glass-panel p-5 rounded-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold tracking-wider text-[#FFD700] uppercase font-mono">AI INFERENCE QUALITY</h2>
              <span className="material-symbols-outlined text-[#FFD700] text-sm">verified</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">98.4</span>
              <span className="text-sm text-[#94A3B8] font-mono">%</span>
            </div>
            <div className="w-full bg-[#0F1115] h-1.5 rounded-none overflow-hidden">
              <div className="bg-[#FFD700] h-full" style={{ width: '98.4%' }}></div>
            </div>
            <p className="text-[10.5px] text-[#94A3B8] leading-normal">
              Continuously aggregated across 1.2M historical samples on SQLite/PostgreSQL layer.
            </p>
          </div>

          {/* Alarm History / Severity Distribution (Using Recharts BarChart) */}
          <div className="glass-panel p-5 rounded-sm flex-1 flex flex-col justify-between bg-[#161B22]/50">
            <div>
              <h2 className="text-[10px] font-bold tracking-wider text-[#FFD700] uppercase mb-3 font-mono">INCIDENT ANALYSIS DISTRIBUTION</h2>
              <div className="w-full h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alertStats} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3139" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={9} strokeWidth={0} />
                    <YAxis stroke="#a1a1aa" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', color: '#fff', fontSize: 10 }} />
                    <Bar dataKey="count" fill="#FFD700" radius={[2, 2, 0, 0]} name="Alarms Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => onNavigate('alerts')}
                className="w-full bg-[#161B22] hover:bg-[#0F1115] text-[#FFD700] border border-[#2D3139] text-[10px] font-bold py-2.5 rounded-sm transition-all uppercase tracking-wider cursor-pointer font-mono"
              >
                OPEN ALERTS ARCHIVE
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ACTIONABLE SAFETY RECOMMENDATIONS (Bottom Section) */}
      <div className="glass-panel p-5 rounded-sm border border-[#2D3139]">
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-[#2D3139]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FFD700]">assignment_turned_in</span>
            <h2 className="text-xs font-bold tracking-wider text-[#FFD700] uppercase font-mono">
              ROLE SECURITY CLEARANCE: <span className="text-white">[{user?.accessLevel?.toUpperCase()}]</span>
            </h2>
          </div>
          
          <button 
            type="button"
            onClick={onOpenReportGenerator}
            className="px-4 py-2 bg-[#FFD700]/10 hover:bg-[#FFD700] text-[#FFD700] hover:text-[#0F1115] border border-[#FFD700]/30 rounded-sm text-[10.5px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Generate Realtime AI Safety Audit Report
          </button>
        </div>

        {/* 3-Recommendation Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Recommendation 1 */}
          <div className={`p-4 bg-[#0F1115] rounded-sm border transition-all flex flex-col justify-between ${queuedTasks.includes('bearing-lubrication') ? 'border-[#4ADE80]/45 bg-emerald-950/5' : 'border-[#2D3139] hover:border-[#2D3139]'}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-sm bg-[#FFD700]/10 flex items-center justify-center text-[#FFD700]">
                  <span className="material-symbols-outlined text-base">build</span>
                </div>
                <h4 className="text-xs font-bold text-slate-100">Service Turbine Unit B-4</h4>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Lubricate secondary bearing configurations immediately. Vibration metrics show friction heating that mimics structural fatigue.
              </p>
            </div>
            <button 
              onClick={() => toggleTask('bearing-lubrication')}
              className={`w-full mt-4 text-[10px] font-bold uppercase tracking-widest py-2 rounded-sm flex items-center justify-center gap-1 transition-all border ${
                queuedTasks.includes('bearing-lubrication') 
                  ? 'bg-[#4ADE80] text-[#0F1115] font-extrabold border-transparent' 
                  : 'bg-transparent text-[#FFD700] border-[#FFD700]/25 hover:bg-[#FFD700]/10 cursor-pointer'
              }`}
            >
              {queuedTasks.includes('bearing-lubrication') ? (
                <>TASK QUEUED <span className="material-symbols-outlined text-sm">done</span></>
              ) : (
                <>QUEUE LUBRICATION <span className="material-symbols-outlined text-sm">chevron_right</span></>
              )}
            </button>
          </div>

          {/* Recommendation 2 */}
          <div className={`p-4 bg-[#0F1115] rounded-sm border transition-all flex flex-col justify-between ${approvedUpdates.includes('sensor-offset') ? 'border-[#4ADE80]/45 bg-emerald-950/5' : 'border-[#2D3139] hover:border-[#2D3139]'}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-sm bg-[#4ADE80]/10 flex items-center justify-center text-[#4ADE80]">
                  <span className="material-symbols-outlined text-base">sync_alt</span>
                </div>
                <h4 className="text-xs font-bold text-slate-100">Sensor Array Calibration</h4>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Sensor matrix in Sector G requires offset calibration sync to adjust local humidity baselines (offset tracking difference: +4.2%).
              </p>
            </div>
            <button 
              onClick={() => toggleUpdate('sensor-offset')}
              className={`w-full mt-4 text-[10px] font-bold uppercase tracking-widest py-2 rounded-sm flex items-center justify-center gap-1 transition-all border ${
                approvedUpdates.includes('sensor-offset') 
                  ? 'bg-[#4ADE80] text-[#0F1115] font-extrabold border-transparent' 
                  : 'bg-transparent text-[#FFD700] border-[#FFD700]/25 hover:bg-[#FFD700]/10 cursor-pointer'
              }`}
            >
              {approvedUpdates.includes('sensor-offset') ? (
                <>CALIBRATION INSTALLED <span className="material-symbols-outlined text-sm">done</span></>
              ) : (
                <>APPROVE CALIBRATION <span className="material-symbols-outlined text-sm">chevron_right</span></>
              )}
            </button>
          </div>

          {/* Recommendation 3 */}
          <div className={`p-4 bg-[#0F1115] rounded-sm border transition-all flex flex-col justify-between ${reviewedConfigs.includes('proximity-sensor') ? 'border-[#4ADE80]/45 bg-emerald-950/5' : 'border-[#F87171]/45 border-[#F87171]/25 bg-red-955/5'}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-sm bg-[#F87171]/10 flex items-center justify-center text-[#F87171]">
                  <span className="material-symbols-outlined text-base">warning</span>
                </div>
                <h4 className="text-xs font-bold text-[#F87171]">Exclusion Zone G-9 Guard</h4>
              </div>
              <p className="text-xs text-[#F87171]/85 leading-relaxed">
                Check and calibrate proximity sensor trigger levels. Recent changes are initiating frequent false-alarms from dust plumes.
              </p>
            </div>
            <button 
              onClick={() => toggleConfig('proximity-sensor')}
              className={`w-full mt-4 text-[10px] font-bold uppercase tracking-widest py-2 rounded-sm flex items-center justify-center gap-1 transition-all border ${
                reviewedConfigs.includes('proximity-sensor') 
                  ? 'bg-[#4ADE80] text-[#0F1115] font-extrabold border-transparent' 
                  : 'bg-transparent text-rose-300 border-rose-500/20 hover:bg-[#F87171]/10 cursor-pointer'
              }`}
            >
              {reviewedConfigs.includes('proximity-sensor') ? (
                <>THRESHOLD CONFIGS UPDATED <span className="material-symbols-outlined text-sm">done</span></>
              ) : (
                <>REVIEW THRESHOLDS <span className="material-symbols-outlined text-sm">chevron_right</span></>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
