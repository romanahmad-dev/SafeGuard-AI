import React, { useState } from 'react';
import { SensorStates } from '../types';
import { useSafetyStore } from '../store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SensorsViewProps {
  stats: SensorStates;
  onRunAnalysis: () => void;
}

export default function SensorsView({ stats, onRunAnalysis }: SensorsViewProps) {
  const [activeTempFilter, setActiveTempFilter] = useState(true);
  const [activeGasFilter, setActiveGasFilter] = useState(true);
  const [activeVibFilter, setActiveVibFilter] = useState(true);
  const [activePeriod, setActivePeriod] = useState<'1H' | '6H' | '24H' | '7D'>('1H');
  const [queryStart, setQueryStart] = useState('2026-06-19');
  const [queryEnd, setQueryEnd] = useState('2026-06-20');

  // Pull dynamic trends history from Zustand
  const historicalTrends = useSafetyStore(state => state.historicalTrends);
  const liveRiskScore = useSafetyStore(state => state.liveRiskScore);
  const alerts = useSafetyStore(state => state.alerts);

  const handleExport = () => {
    alert(`DATABASE EXPORT DETECTED:\nDataset range: [${queryStart}] to [${queryEnd}]\nFormat: telemetry-sector-g.json\nCompressed files prepared successfully.`);
  };

  // Radial calculation (Dash offset: circle perimeter = 2 * PI * r = 2 * 3.14 * 28 = 176)
  const calcDashoffset = (percentage: number) => {
    return 176 - (percentage / 100) * 176;
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-8 pr-1">
      
      {/* 4-Grid sensor panel (Bento flow) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* temperature gauge panel */}
        <div className="glass-panel p-5 rounded-sm flex flex-col justify-between hover:border-[#FFD700]/40 transition-[border-color] duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">Temperature</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-white mt-1">
                {stats.temperature.toFixed(1)}<span className="text-xs text-[#94A3B8] font-normal ml-0.5">°C</span>
              </h3>
            </div>

            {/* Radial Concentric tracker circle */}
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full rotate-[-90deg]">
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="#2D3139" strokeWidth="4" />
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="#4ADE80" strokeWidth="4" 
                  strokeDasharray="176" 
                  strokeDashoffset={calcDashoffset(Math.min(100, Math.round(stats.temperature)))} 
                  strokeLinecap="round"
                  className="risk-glow-safe"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-[#4ADE80]">
                {Math.min(100, Math.round(stats.temperature))}%
              </div>
            </div>
          </div>

          <div className="h-12 w-full flex items-end mt-4">
            <svg className="w-full h-8" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path d="M0 25 Q 10 20, 20 25 T 40 22 T 60 27 T 80 23 T 100 25" fill="none" stroke="#4ADE80" strokeWidth="2" className="risk-glow-safe"></path>
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] mt-3 font-semibold text-slate-400 uppercase tracking-wider">
            <span>Range: 15-110°C</span>
            <span className="text-[#4ADE80]">+1.2% Trend</span>
          </div>
        </div>

        {/* Gas H2S Warning gauge panel */}
        <div className={`glass-panel p-5 rounded-sm flex flex-col justify-between hover:border-[#FFD700]/40 transition-[border-color] duration-300 ${stats.gasH2S > 0.12 ? 'border-amber-550/30' : ''}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-[#FFD700] uppercase">Gas Levels (H2S)</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-white mt-1">
                {stats.gasH2S.toFixed(2)}<span className="text-xs text-slate-400 font-normal ml-0.5">PPM</span>
              </h3>
            </div>

            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full rotate-[-90deg]">
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="#2D3139" strokeWidth="4" />
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="#FFD700" strokeWidth="4" 
                  strokeDasharray="176" 
                  strokeDashoffset={calcDashoffset(Math.min(100, Math.round(stats.gasH2S * 500)))} 
                  strokeLinecap="round"
                  className="risk-glow-warning"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-[#FFD700]">
                {Math.min(100, Math.round(stats.gasH2S * 500))}%
              </div>
            </div>
          </div>

          <div className="h-12 w-full flex items-end mt-4">
            <svg className="w-full h-8" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path d="M0 28 L 20 20 L 40 25 L 60 15 L 80 22 L 100 18" fill="none" stroke="#FFD700" strokeWidth="2" className="risk-glow-warning"></path>
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] mt-3 font-semibold text-slate-400 uppercase tracking-wider">
            <span>Limit: 0.15 PPM</span>
            <span className="text-[#FFD700]">ACTIVE SPECTRUM</span>
          </div>
        </div>

        {/* Vibration critical panel */}
        <div className={`p-5 rounded-sm flex flex-col justify-between transition-all duration-300 ${stats.vibration > 7.0 ? 'glass-panel-glow-danger border border-[#F87171]' : 'glass-panel hover:border-rose-500/40'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-[#F87171] uppercase">Vibration (X-Axis)</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-white mt-1">
                {stats.vibration.toFixed(1)}<span className="text-xs text-[#94A3B8] font-normal ml-0.5">MM/S</span>
              </h3>
            </div>

            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full rotate-[-90deg]">
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="#2D3139" strokeWidth="4" />
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="#F87171" strokeWidth="4" 
                  strokeDasharray="176" 
                  strokeDashoffset={calcDashoffset(Math.min(100, Math.round(stats.vibration * 10)))} 
                  strokeLinecap="round"
                  className="risk-glow-danger"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-[#F87171]">
                {Math.min(100, Math.round(stats.vibration * 10))}%
              </div>
            </div>
          </div>

          <div className="h-12 w-full flex items-end mt-4 overflow-hidden">
            <svg className="w-full h-8" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path 
                d="M0 15 L 5 25 L 10 5 L 15 25 L 20 10 L 25 20 L 30 5 L 35 25 L 40 10 L 45 22 L 50 8 L 55 25 L 60 12 L 65 20 L 70 5 L 75 25 L 80 10 L 85 20 L 90 5 L 95 25 L 100 15" 
                fill="none" 
                stroke="#F87171" 
                strokeWidth="2" 
                className={stats.vibration > 7.0 ? 'risk-glow-danger animate-pulse' : ''}
              />
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] mt-3 font-semibold text-slate-400 uppercase tracking-wider">
            <span>Limit: 5.0 MM/S</span>
            <span className={stats.vibration > 7.0 ? 'text-[#F87171] font-extrabold animate-pulse' : 'text-[#F87171]'}>
              {stats.vibration > 7.0 ? 'DANGER: EXCEEDED' : 'ABNORMAL SPIKE'}
            </span>
          </div>
        </div>

        {/* Ambient Humidity panel */}
        <div className="glass-panel p-5 rounded-sm flex flex-col justify-between hover:border-[#FFD700]/40 transition-[border-color] duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-[#FFD700] uppercase">Humidity</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-white mt-1">
                {stats.humidity}<span className="text-xs text-[#94A3B8] font-normal ml-0.5">% RH</span>
              </h3>
            </div>

            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full rotate-[-90deg]">
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="#2D3139" strokeWidth="4" />
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="#FFD700" strokeWidth="4" 
                  strokeDasharray="176" 
                  strokeDashoffset={calcDashoffset(stats.humidity)} 
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-[#FFD700]">{stats.humidity}%</div>
            </div>
          </div>

          <div className="h-12 w-full flex items-end mt-4">
            <svg className="w-full h-8" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path d="M0 15 Q 25 12, 50 15 T 100 15" fill="none" stroke="#FFD700" strokeWidth="2"></path>
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] mt-3 font-semibold text-[#94A3B8] uppercase tracking-wider">
            <span>Range: 35-55% RH</span>
            <span className="text-[#FFD700] italic font-mono">Stable Ambient</span>
          </div>
        </div>

      </div>

      {/* Main Graph Analyzer Section (Screen 2 Bottom) */}
      <div className="grid grid-cols-12 gap-6 min-h-[460px]">
        
        {/* Central Large trend waves graph tracker */}
        <div className="col-span-12 lg:col-span-9 glass-panel rounded-sm flex flex-col overflow-hidden bg-[#161B22]/60">
          
          <div className="p-4 border-b border-[#2D3139] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#161B22]/40">
            <div className="flex flex-wrap items-center gap-6">
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">LIVE MATRIX ANALYTICS</h4>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={activeTempFilter} 
                    onChange={() => setActiveTempFilter(!activeTempFilter)} 
                    className="rounded-sm bg-slate-950 border-[#2D3139] text-[#4ADE80] focus:ring-0"
                  />
                  <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
                  <span>Temperature</span>
                </label>
                
                <label className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={activeGasFilter} 
                    onChange={() => setActiveGasFilter(!activeGasFilter)} 
                    className="rounded-sm bg-slate-950 border-[#2D3139] text-[#FFD700] focus:ring-0"
                  />
                  <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
                  <span>CO2 PPM</span>
                </label>

                <label className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={activeVibFilter} 
                    onChange={() => setActiveVibFilter(!activeVibFilter)} 
                    className="rounded-sm bg-slate-950 border-[#2D3139] text-[#F87171] focus:ring-0"
                  />
                  <span className="w-2 h-2 rounded-full bg-[#F87171]" />
                  <span>Vibration</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex rounded-sm overflow-hidden border border-[#2D3139]">
                {(['1H', '6H', '24H', '7D'] as const).map((period) => (
                  <button 
                    key={period}
                    onClick={() => {
                      setActivePeriod(period);
                    }}
                    className={`px-3 py-1 font-mono text-[9px] tracking-wider uppercase cursor-pointer font-bold transition-all ${
                      activePeriod === period ? 'bg-[#FFD700] text-[#0F1115]' : 'bg-transparent text-[#94A3B8] hover:bg-slate-800'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RECHARTS CHANNELS VIEWPORT */}
          <div className="flex-1 p-4 bg-slate-900/10 min-h-[300px]">
            {historicalTrends && historicalTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={historicalTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4ADE80" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFD700" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorVib" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F87171" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#F87171" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3139" opacity={0.4} />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#94A3B8" 
                    fontSize={9} 
                    fontFamily="monospace"
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={9} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                  />
                  
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161B22',
                      borderColor: '#2D3139',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                    labelClassName="text-[#FFD700] font-bold"
                  />
                  
                  {activeTempFilter && (
                    <Area 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#4ADE80" 
                      fillOpacity={1} 
                      fill="url(#colorTemp)" 
                      name="Temperature (°C)"
                      strokeWidth={2}
                    />
                  )}
                  {activeGasFilter && (
                    <Area 
                      type="monotone" 
                      dataKey="co2_ppm" 
                      stroke="#FFD700" 
                      fillOpacity={1} 
                      fill="url(#colorCo2)" 
                      name="CO2 Gas (PPM)"
                      strokeWidth={2}
                    />
                  )}
                  {activeVibFilter && (
                    <Area 
                      type="monotone" 
                      dataKey="vibration" 
                      stroke="#F87171" 
                      fillOpacity={1} 
                      fill="url(#colorVib)" 
                      name="Vibration (MM/S)"
                      strokeWidth={1.5}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-t-2 border-t-[#FFD700] border-slate-700 animate-spin mb-3"></div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Syncing database stream feeds...</p>
              </div>
            )}
          </div>
        </div>

        {/* ALARMS & INCIDENTS SIDEBAR PANEL (Right 3/12) */}
        <div className="col-span-12 lg:col-span-3 glass-panel rounded-sm flex flex-col justify-between overflow-hidden">
          
          <div className="p-4 border-b border-[#2D3139] bg-[#161B22]/40">
            <h4 className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase font-mono">TELEMETRY ANOMALIES</h4>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {alerts && alerts.filter(a => a.status === 'ACTIVE').length > 0 ? (
              alerts.filter(a => a.status === 'ACTIVE').slice(0, 5).map((alertItem) => (
                <div key={alertItem.id} className={`border-l-2 pl-3 ${alertItem.severity === 'critical' ? 'border-[#F87171]' : 'border-[#FFD700]'}`}>
                  <span className={`text-[9px] font-bold tracking-wider uppercase font-mono ${alertItem.severity === 'critical' ? 'text-[#F87171]' : 'text-[#FFD700]'}`}>
                    {alertItem.severity.toUpperCase()} ALERT
                  </span>
                  <p className="text-xs font-bold text-slate-200 mt-0.5 leading-snug">{alertItem.title}</p>
                  <p className="text-[9.5px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{alertItem.message}</p>
                  <p className="text-[9px] text-slate-500 font-mono mt-1">{alertItem.timestamp} • Sector G</p>
                </div>
              ))
            ) : (
              <div className="space-y-4">
                <div className="border-l-2 border-[#4ADE80] pl-3">
                  <span className="text-[9px] font-bold tracking-wider text-[#4ADE80] uppercase font-mono">NOMINAL STATE</span>
                  <p className="text-xs font-bold text-slate-200 mt-0.5">Reactor core temperature normalized</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Ready • Baseline secure</p>
                </div>
                <div className="border-l-2 border-[#4ADE80] pl-3">
                  <span className="text-[9px] font-bold tracking-wider text-[#4ADE80] uppercase font-mono">FUSION MONITOR</span>
                  <p className="text-xs font-bold text-slate-200 mt-0.5">Automated safety policies synced</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Ready • All 1,240 sensors nominal</p>
                </div>
              </div>
            )}

          </div>

          <div className="p-4 border-t border-[#2D3139]">
            <p className="text-[9.5px] text-slate-500 mb-2 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full animate-pulse"></span>
              Live Pipeline Risk Score: {liveRiskScore}%
            </p>
          </div>

        </div>

      </div>

      {/* BOTTOM HISTORICAL Date range contextual query selection container */}
      <div className="glass-panel rounded-sm px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border border-[#2D3139]">
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold tracking-widest text-[#FFD700] uppercase flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">filter_alt</span> 
            QUERY ANALYSIS FRAME:
          </span>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={queryStart}
              onChange={(e) => setQueryStart(e.target.value)}
              className="bg-[#0F1115] border border-[#2D3139] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm text-white focus:outline-none focus:border-[#FFD700]"
            />
            <span className="text-xs text-slate-500 font-semibold">to</span>
            <input 
              type="date" 
              value={queryEnd}
              onChange={(e) => setQueryEnd(e.target.value)}
              className="bg-[#0F1115] border border-[#2D3139] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm text-white focus:outline-none focus:border-[#FFD700]"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleExport}
            className="px-5 py-2.5 bg-[#161B22] hover:bg-[#0F1115] border border-[#2D3139] rounded-sm text-[10px] font-bold tracking-wider uppercase text-slate-300 cursor-pointer text-center"
          >
            Export Logs Dataset
          </button>
          <button 
            type="button"
            onClick={onRunAnalysis}
            className="px-5 py-2.5 bg-[#FFD700] hover:bg-[#FFD700]/95 text-[#0F1115] rounded-sm text-[10px] font-extrabold tracking-wider uppercase cursor-pointer text-center"
          >
            Execute Matrix Analysis
          </button>
        </div>

      </div>

    </div>
  );
}
