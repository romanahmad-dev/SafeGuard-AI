import React, { useState } from 'react';
import { AlertEvent, Severity } from '../types';

interface AlertsViewProps {
  alerts: AlertEvent[];
  onUpdateAlertStatus: (alertId: string, status: AlertEvent['status'], actionText?: string) => void;
}

export default function AlertsView({ alerts, onUpdateAlertStatus }: AlertsViewProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<AlertEvent['status'] | 'ALL'>('ACTIVE');
  const [inspectingAlertId, setInspectingAlertId] = useState<string | null>(null);
  
  // Investigation Form states
  const [overrideAction, setOverrideAction] = useState('');
  const [overrideStatus, setOverrideStatus] = useState<AlertEvent['status']>('INVESTIGATED');

  // Filtered lists
  const filteredAlerts = alerts.filter(alert => {
    const sevMatch = selectedSeverity === 'ALL' || alert.severity === selectedSeverity;
    const statMatch = selectedStatus === 'ALL' || alert.status === selectedStatus;
    return sevMatch && statMatch;
  });

  const inspectedAlert = alerts.find(a => a.id === inspectingAlertId);

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingAlertId) return;

    if (!overrideAction.trim()) {
      alert('Please specify action taken to log under compliance standards.');
      return;
    }

    onUpdateAlertStatus(inspectingAlertId, overrideStatus, overrideAction);
    alert(`INCIDENT COMPLIANCE SEALED:\nStatus: ${overrideStatus}\nLogged Action: "${overrideAction}"`);
    setOverrideAction('');
    setInspectingAlertId(null);
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 overflow-hidden">
      
      {/* LEFT: Incident Registry (Timeline and listings) */}
      <div className="flex-1 flex flex-col gap-6 h-full min-w-0">
        
        {/* Timeline Header Filter tabs */}
        <div className="glass-panel p-4 rounded-sm flex flex-wrap justify-between items-center gap-4 shrink-0">
          
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold tracking-widest text-[#FFD700] uppercase">Severity Filter</span>
            <div className="flex bg-[#161B22] border border-[#2D3139] rounded-sm p-0.5">
              {(['ALL', 'critical', 'warning', 'info'] as const).map((sev) => (
                <button 
                  key={sev}
                  type="button"
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-3 py-1 font-mono text-[9px] tracking-wider uppercase font-bold rounded-sm transition-all cursor-pointer ${
                    selectedSeverity === sev 
                      ? 'bg-[#FFD700] text-[#0F1115]' 
                      : 'bg-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {sev === 'critical' ? 'CRITICAL' : sev === 'warning' ? 'WARNING' : sev === 'info' ? 'DIAGNOSTICS' : 'SHOW ALL'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold tracking-widest text-[#FFD700] uppercase">Resolution Status</span>
            <div className="flex bg-[#161B22] border border-[#2D3139] rounded-sm p-0.5">
              {(['ALL', 'ACTIVE', 'INVESTIGATED', 'RESOLVED', 'FALSE_ALARM'] as const).map((status) => (
                <button 
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 font-mono text-[9px] tracking-wider uppercase font-bold rounded-sm transition-all cursor-pointer ${
                    selectedStatus === status 
                      ? 'bg-[#FFD700] text-[#0F1115]' 
                      : 'bg-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Dynamic results grid */}
        <div className="flex-grow overflow-y-auto space-y-4 pr-1">
          {filteredAlerts.length === 0 ? (
            <div className="glass-panel p-16 text-center rounded-sm border-dashed">
              <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">assignment_late</span>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">No Incident Reports found</p>
              <p className="text-xs text-slate-500 mt-1">Try relaxing filters or adjusting search parameters.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isInspected = alert.id === inspectingAlertId;
              const isCritical = alert.severity === 'critical';
              const isWarning = alert.severity === 'warning';

              return (
                <div 
                  key={alert.id}
                  onClick={() => {
                    setInspectingAlertId(alert.id);
                    setOverrideStatus(alert.status);
                  }}
                  className={`p-5 rounded-sm border cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                    isInspected 
                      ? 'bg-[#161B22] border-[#FFD700] ring-1 ring-[#FFD700]/40 shadow-2xl' 
                      : isCritical 
                      ? 'glass-panel-glow-danger hover:border-red-500/60' 
                      : isWarning 
                      ? 'glass-panel-glow-warning hover:border-orange-500/60' 
                      : 'glass-panel hover:border-slate-500'
                  }`}
                >
                  
                  {/* Status Strip overlay */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    isCritical ? 'bg-[#F87171]' : isWarning ? 'bg-[#FFD700]' : 'bg-blue-400'
                  }`} />

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 pl-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest border ${
                          isCritical 
                            ? 'bg-red-950/45 text-[#F87171] border-[#F87171]/20' 
                            : isWarning 
                            ? 'bg-amber-950/45 text-[#FFD700] border-[#FFD700]/20' 
                            : 'bg-blue-950/45 text-blue-400 border-blue-500/20'
                        }`}>
                          {alert.severity}
                        </span>
                        
                        <span className="text-[10px] text-[#94A3B8] font-mono">{alert.timestamp}</span>
                        <span className="text-[10px] text-[#FFD700] font-bold uppercase">{alert.location}</span>
                      </div>
                      
                      <h4 className="text-sm font-extrabold text-white tracking-wide group-hover:text-[#FFD700] transition-colors">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{alert.message}</p>
                    </div>

                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span className={`text-[10px] font-mono font-bold uppercase py-1 px-3 rounded-sm border ${
                        alert.status === 'ACTIVE' 
                          ? 'border-[#F87171]/40 text-[#F87171] bg-[#F87171]/10 animate-pulse' 
                          : alert.status === 'RESOLVED' 
                          ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' 
                          : 'border-[#2D3139] text-[#94A3B8] bg-slate-800/10'
                      }`}>
                        {alert.status}
                      </span>
                      {alert.operatorActionTaken && (
                        <span className="text-[9.5px] text-emerald-400 italic font-medium mt-2 max-w-[200px] text-right truncate">
                          Action Taken: {alert.operatorActionTaken}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* RIGHT SIDEBAR: Action & Investigation Center Detail Card */}
      <aside className="w-96 glass-panel rounded-sm flex flex-col justify-between overflow-hidden shrink-0">
        
        {inspectedAlert ? (
          /* Inspection mode view */
          <div className="flex-1 flex flex-col justify-between overflow-y-auto">
            
            <div className="p-5 border-b border-[#2D3139] bg-[#161B22]/40 flex justify-between items-center">
              <h3 className="text-[11px] font-bold tracking-brand-caps text-slate-300 uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">security_scan</span>
                INCIDENT ID: {inspectedAlert.id.toUpperCase()}
              </h3>
              <button 
                onClick={() => setInspectingAlertId(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-5 flex-grow">
              
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-[#FFD700] tracking-widest uppercase">ALERT CLASSIFICATION</span>
                <h4 className="text-base font-extrabold text-white leading-snug">{inspectedAlert.title}</h4>
                <div className="flex justify-between items-center py-2 border-b border-[#2D3139] text-[10.5px] font-mono text-slate-400">
                  <span>Confidence:</span>
                  <span className="text-emerald-400 font-bold">{inspectedAlert.confidence}%</span>
                </div>
              </div>

              {/* CCTV Reference Capture */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase block">CCTV Reference Snap</span>
                <div className="relative aspect-video rounded-sm overflow-hidden border border-[#2D3139] bg-black">
                  <img 
                    src={inspectedAlert.imageUrl} 
                    alt="Inspection surveillance alert layout frame" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-transparent pointer-events-none crosshair-overlay" />
                  {inspectedAlert.imageThumb && (
                    <div className="absolute top-2 right-2 w-12 h-12 rounded-sm border border-[#FFD700] overflow-hidden bg-black/60">
                      <img src={inspectedAlert.imageThumb} className="w-full h-full object-cover opacity-80" alt="In-helmet violation zoom" />
                    </div>
                  )}
                </div>
              </div>

              {/* Action recommendations checklist list */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-[#FFD700] tracking-widest uppercase block">AI PROTOCOL SUGGESTIONS</span>
                <ul className="space-y-2">
                  {inspectedAlert.recommendation.map((rec, i) => (
                    <li key={i} className="flex gap-2 items-start text-xs text-slate-300 leading-relaxed">
                      <span className="text-emerald-400 font-bold font-mono">[{i+1}]</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mitigation action form */}
              <form onSubmit={handleResolveSubmit} className="space-y-4 pt-4 border-t border-[#2D3139]">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 tracking-widest uppercase block">
                    Assigned Action Log
                  </label>
                  <textarea 
                    required
                    value={overrideAction}
                    onChange={(e) => setOverrideAction(e.target.value)}
                    placeholder="Describe direct corrective action taken (e.g. Cleared lane obstructions and rebooted telemetry line)..."
                    className="w-full h-18 text-xs font-mono bg-[#0F1115] border border-[#2D3139] rounded-sm p-2.5 focus:outline-none focus:border-[#FFD700] text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8.5px] font-bold text-slate-400 tracking-widest uppercase block mb-1">
                      Target Resolution State
                    </label>
                    <select
                      value={overrideStatus}
                      onChange={(e) => setOverrideStatus(e.target.value as AlertEvent['status'])}
                      className="w-full text-[10.5px] font-bold uppercase font-mono tracking-wider bg-[#0F1115] border border-[#2D3139] rounded-sm px-2.5 py-2 text-slate-100 focus:outline-none focus:border-[#FFD700]"
                    >
                      <option value="INVESTIGATED">INVESTIGATED</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="FALSE_ALARM">FALSE ALARM</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button 
                      type="submit"
                      className="w-full py-2 bg-[#FFD700] text-[#0F1115] hover:bg-[#FFD700]/90 rounded-sm text-[10px] font-extrabold tracking-widest uppercase h-9.5 transition-all cursor-pointer"
                    >
                      SEAL JOURNAL
                    </button>
                  </div>
                </div>

              </form>

            </div>

          </div>
        ) : (
          /* Blank state details */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4 bg-[#161B22]/30">
            <div className="w-16 h-16 rounded-sm bg-slate-800/30 flex items-center justify-center text-[#FFD700]/75 border border-[#2D3139]">
              <span className="material-symbols-outlined text-3xl">policy</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Incident Inspection Area</h4>
              <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
                Click any alarm listed on the timeline to inspect active live screenshots, confidence indices, and register containment processes.
              </p>
            </div>
          </div>
        )}

      </aside>

    </div>
  );
}
