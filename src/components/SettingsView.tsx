import React, { useState } from 'react';
import { Operative, NotificationRule } from '../types';

interface SettingsViewProps {
  temperatureMaxTrigger: number;
  onUpdateTemperatureTrigger: (temp: number) => void;
  operatives: Operative[];
  onAddOperative: (op: Operative) => void;
  notificationRules: NotificationRule[];
}

export default function SettingsView({
  temperatureMaxTrigger,
  onUpdateTemperatureTrigger,
  operatives,
  onAddOperative,
  notificationRules
}: SettingsViewProps) {
  
  // Supervisor wizard state
  const [newOpName, setNewOpName] = useState('');
  const [newOpEmail, setNewOpEmail] = useState('');
  const [newOpStation, setNewOpStation] = useState('MAIN_ASSEMBLY_D7');
  const [newOpAccess, setNewOpAccess] = useState('LEVEL 2 CLEARANCE');

  // API Token state
  const [apiLocked, setApiLocked] = useState(true);
  const [geminiKey, setGeminiKey] = useState('SG_AI_********************');
  const [rfidFrequency, setRfidFrequency] = useState(13.56);

  const handleCreateOperative = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName.trim() || !newOpEmail.trim()) {
      alert('Please fill out all operative characteristics.');
      return;
    }

    const newOp: Operative = {
      id: `OP-${Math.floor(10 + Math.random() * 90)}`,
      name: newOpName,
      email: newOpEmail,
      accessLevel: newOpAccess,
      station: newOpStation,
      lastSignIn: 'JUST RECRUITED',
      status: 'ACTIVE'
    };

    onAddOperative(newOp);
    alert(`OPERATIVE COMPLIANCE SUCCESSFUL:\n${newOpName} registered successfully at ${newOpStation}.`);
    setNewOpName('');
    setNewOpEmail('');
  };

  return (
    <div className="space-y-6 pb-8 h-full overflow-y-auto pr-1">
      
      {/* 2-Column layout grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN PANEL: Threshold slider and Supervisor roster list */}
        <div className="space-y-6">
          
          {/* Slider Trigger limits configuration */}
          <div className="glass-panel p-5 rounded-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#2D3139]">
              <h4 className="text-[11px] font-bold tracking-wider text-[#FFD700] uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#FFD700]">thermostat</span>
                Thermal Tolerances & Sensitivities
              </h4>
              <span className="text-[9.5px] font-mono text-[#4ADE80] font-bold bg-[#4ADE80]/10 px-2 py-0.5 rounded-sm border border-[#4ADE80]/20">
                ACTIVE STATE
              </span>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Define the maximum safe temperature ceiling for the turbine and generator systems inside Sector G assemblies. Reaching this limit initiates structural containment sirens.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-xs text-slate-400">MAX TEMPERATURE ALARM LIMIT</span>
                <span className="text-lg font-extrabold text-[#4ADE80]">{temperatureMaxTrigger}°C</span>
              </div>
              
              <input 
                type="range"
                min="30"
                max="180"
                value={temperatureMaxTrigger}
                onChange={(e) => onUpdateTemperatureTrigger(parseInt(e.target.value))}
                className="w-full accent-[#FFD700] h-2 bg-[#161B22] rounded-sm appearance-none cursor-pointer"
              />

              <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Min: 30°C</span>
                <span>Normal: 90°C</span>
                <span>Shutdown Max: 180°C</span>
              </div>
            </div>

          </div>

          {/* Supervisor Operatives catalog */}
          <div className="glass-panel p-5 rounded-sm space-y-4">
            <h4 className="text-[11px] font-bold tracking-wider text-[#FFD700] uppercase flex items-center gap-2 pb-2 border-b border-[#2D3139]">
              <span className="material-symbols-outlined text-sm text-[#FFD700]">group</span>
              Active Safety Operatives Register
            </h4>

            <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
              {operatives.map((op) => (
                <div key={op.id} className="p-3 bg-[#161B22]/30 border border-[#2D3139] rounded-sm flex justify-between items-center">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{op.name}</span>
                      <span className="text-[9px] font-mono bg-slate-800 px-1.5 py-0.5 rounded-sm text-slate-300 font-semibold">{op.id}</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400">{op.email} • {op.station}</p>
                    <p className="text-[9px] font-bold tracking-widest text-[#FFD700] uppercase">{op.accessLevel}</p>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-sm text-[9px] font-bold border ${
                    op.status === 'ACTIVE' 
                      ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' 
                      : 'border-[#2D3139] text-slate-400'
                  }`}>
                    {op.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Recruiter / register wizard form */}
            <form onSubmit={handleCreateOperative} className="space-y-3 pt-3 border-t border-[#2D3139]">
              <span className="text-[9.5px] font-bold tracking-widest text-[#FFD700] uppercase block">
                Recruit Safety Officer
              </span>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text"
                  required
                  value={newOpName}
                  onChange={(e) => setNewOpName(e.target.value)}
                  placeholder="Officer Name"
                  className="bg-[#0F1115] border border-[#2D3139] rounded-sm px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#FFD700]"
                />
                
                <input 
                  type="email"
                  required
                  value={newOpEmail}
                  onChange={(e) => setNewOpEmail(e.target.value)}
                  placeholder="Email ID"
                  className="bg-[#0F1115] border border-[#2D3139] rounded-sm px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newOpAccess}
                  onChange={(e) => setNewOpAccess(e.target.value)}
                  className="bg-[#0F1115] border border-[#2D3139] rounded-sm px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="LEVEL 2 CLEARANCE">LEVEL 2 CLEARANCE</option>
                  <option value="LEVEL 4 CLEARANCE">LEVEL 4 CLEARANCE</option>
                  <option value="Shift Supervisor">Shift Supervisor</option>
                </select>

                <button 
                  type="submit"
                  className="w-full bg-[#161B22] hover:bg-[#FFD700] hover:text-[#0F1115] border border-[#2D3139] hover:border-transparent rounded-sm text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all py-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  <span>ENROLL OFFICER</span>
                </button>
              </div>
            </form>

          </div>

        </div>

        {/* RIGHT COLUMN PANEL: Notification Routers and API Integration Keys */}
        <div className="space-y-6">
          
          {/* Notification Routers */}
          <div className="glass-panel p-5 rounded-sm space-y-4">
            <h4 className="text-[11px] font-bold tracking-wider text-[#FFD700] uppercase flex items-center gap-2 pb-2 border-b border-[#2D3139]">
              <span className="material-symbols-outlined text-sm text-[#FFD700]">tune</span>
              Smart Alarm Dispatch Routers
            </h4>

            <div className="space-y-4">
              {notificationRules.map((rule) => (
                <div key={rule.id} className="flex gap-4 items-start pb-4 border-b border-[#2D3139] last:border-b-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-sm shrink-0 flex items-center justify-center uppercase border ${
                    rule.severity === 'critical' 
                      ? 'bg-rose-950/20 text-[#F87171] border-[#F87171]/25' 
                      : rule.severity === 'warning' 
                      ? 'bg-amber-950/20 text-[#FFD700] border-[#FFD700]/25' 
                      : 'bg-blue-950/20 text-blue-400 border-blue-500/25'
                  }`}>
                    <span className="material-symbols-outlined text-base">
                      {rule.severity === 'critical' ? 'emergency_home' : rule.severity === 'warning' ? 'notifications' : 'logs'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-100">{rule.title}</h5>
                    <p className="text-[11px] text-[#94A3B8]">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Master API Credentials Panel */}
          <div className="glass-panel p-5 rounded-sm space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-[#2D3139]">
              <h4 className="text-[11px] font-bold tracking-wider text-[#FFD700] uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#FFD700]">lock</span>
                Industrial SDK Integration Credentials
              </h4>
              <button 
                type="button" 
                onClick={() => setApiLocked(!apiLocked)}
                className={`flex items-center gap-1 rounded-sm py-1 px-2.5 font-mono text-[9px] font-bold uppercase cursor-pointer border ${
                  apiLocked 
                    ? 'border-red-500/30 text-[#F87171] bg-red-950/10' 
                    : 'border-emerald-500/30 text-emerald-400 bg-emerald-950/10'
                }`}
              >
                <span className="material-symbols-outlined text-xs">
                  {apiLocked ? 'lock' : 'lock_open'}
                </span>
                <span>{apiLocked ? 'KEYS LOCKED' : 'KEYS WRITABLE'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Manage connection hashes used for Google Gemini AI automated incident mitigation generation and perimeter RFID secure antennas.
            </p>

            <div className="space-y-4 pt-2">
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                  GEMINI_API_KEY SECRET CONFIG
                </label>
                <input 
                  type="password"
                  disabled={apiLocked}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full h-10 font-mono text-xs bg-[#0F1115] border border-[#2D3139] rounded-sm px-3 text-slate-300 disabled:opacity-50 focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                  RFID RADAR SECURE ANTENNA FREQUENCY (MHZ)
                </label>
                <input 
                  type="number"
                  disabled={apiLocked}
                  value={rfidFrequency}
                  onChange={(e) => setRfidFrequency(parseFloat(e.target.value))}
                  className="w-full h-10 font-mono text-xs bg-[#0F1115] border border-[#2D3139] rounded-sm px-3 text-slate-300 disabled:opacity-50 focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              {!apiLocked && (
                <div className="pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      alert('SDK connection configuration credentials saved successfully.');
                      setApiLocked(true);
                    }}
                    className="w-full py-2.5 bg-[#FFD700] text-[#0F1115] text-[10px] font-extrabold tracking-widest uppercase rounded-sm cursor-pointer hover:bg-[#FFD700]/90"
                  >
                    DEPLOY CONFIGURATION CHANGES
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
