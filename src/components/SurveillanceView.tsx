import React, { useState, useEffect } from 'react';
import { CameraFeed } from '../types';

interface SurveillanceViewProps {
  feeds: CameraFeed[];
  onFlagEvent: (feedId: string) => void;
  onOpenReportGenerator: () => void;
}

export default function SurveillanceView({ feeds, onFlagEvent, onOpenReportGenerator }: SurveillanceViewProps) {
  const [selectedFeed, setSelectedFeed] = useState<string>('CAM_03_CHEM_W');
  const [zoomLevel, setZoomLevel] = useState<number>(45);
  const [uptimeStr, setUptimeStr] = useState('422:15:33');
  const [showPASystem, setShowPASystem] = useState(false);
  const [pAMessage, setPAMessage] = useState('Critical Alert: Evacuate Sector G Pipe Junction immediately.');

  // Simulated live uptime counter ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeStr(prev => {
        const parts = prev.split(':');
        let hrs = parseInt(parts[0]);
        let mins = parseInt(parts[1]);
        let secs = parseInt(parts[2]);

        secs += 1;
        if (secs >= 60) {
          secs = 0;
          mins += 1;
        }
        if (mins >= 60) {
          mins = 0;
          hrs += 1;
        }

        const h = hrs.toString();
        const m = mins < 10 ? `0${mins}` : mins;
        const s = secs < 10 ? `0${secs}` : secs;
        return `${h}:${m}:${s}`;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCaptureSnapshot = () => {
    alert(`CCTV SNAPSHOT CAPTURED: Frame saved to /archives/sector-g/${selectedFeed}_snap.jpg`);
  };

  const handlePAAnnounce = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`📢 GENERAL PA BROADCAST ACTIVATED:\n"${pAMessage}"`);
    setShowPASystem(false);
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 overflow-hidden">
      
      {/* LEFT: 4-Quadrant camera array (70%) */}
      <div className="flex-1 flex flex-col gap-6 h-full min-w-0">
        
        {/* Camera Feeds Grid */}
        <div className="grid grid-cols-2 gap-4 flex-grow overflow-y-auto pr-1">
          {feeds.map((feed) => {
            const isSelected = selectedFeed === feed.id;
            const isDanger = feed.overlayStyle.type === 'danger';
            const isWarning = feed.overlayStyle.type === 'warning';

            return (
              <div 
                key={feed.id}
                onClick={() => setSelectedFeed(feed.id)}
                className={`relative bg-[#0F1115] border rounded-sm overflow-hidden cursor-pointer group transition-all duration-300 ${
                  isSelected 
                    ? 'border-[#FFD700] ring-1 ring-[#FFD700]/30 shadow-2xl' 
                    : 'border-[#2D3139] hover:border-slate-500'
                }`}
              >
                {/* Channel Labels */}
                <div className="absolute top-3 left-3 z-20 flex gap-2">
                  <span className="bg-black/80 px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold border border-[#2D3139]/60 rounded-sm text-slate-100">
                    {feed.name}
                  </span>
                  
                  {feed.live && (
                    <span className={`px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold rounded-sm flex items-center gap-1 border ${
                      isDanger 
                        ? 'bg-red-950/40 text-[#F87171] border-[#F87171]/30' 
                        : isWarning 
                        ? 'bg-orange-950/40 text-[#FFD700] border-[#FFD700]/30' 
                        : 'bg-emerald-950/40 text-[#4ADE80] border-[#4ADE80]/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isDanger ? 'bg-[#F87171] animate-[pulse_0.5s_infinite]' : 'bg-[#4ADE80] animate-pulse'}`}></span>
                      {feed.statusText}
                    </span>
                  )}
                </div>

                {/* Simulated moving scanlines */}
                <div className="scanline"></div>

                {/* Active Video Background frame */}
                <div className="w-full h-full relative min-h-[160px] md:min-h-[200px]">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700" 
                    style={{ backgroundImage: `url('${feed.imageUrl}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                  {/* Red/Amber intelligent bounding overlay */}
                  <div 
                    className="absolute border-2 flex flex-col justify-between p-2 shadow-inner transition-all duration-500"
                    style={{
                      top: feed.overlayStyle.top,
                      left: feed.overlayStyle.left,
                      width: feed.overlayStyle.width,
                      height: feed.overlayStyle.height,
                      borderColor: isDanger ? '#F87171' : isWarning ? '#FFD700' : '#4ADE80',
                      backgroundColor: isDanger ? 'rgba(248, 113, 113, 0.15)' : isWarning ? 'rgba(255, 215, 0, 0.1)' : 'rgba(74, 222, 128, 0.12)',
                      boxShadow: isDanger ? '0 0 10px rgba(248, 113, 113, 0.3)' : isWarning ? '0 0 8px rgba(255, 215, 0, 0.2)' : '0 0 8px rgba(74, 222, 128, 0.2)'
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[8.5px] font-bold px-1 rounded-sm tracking-wider uppercase ${
                        isDanger ? 'bg-red-950 text-red-300' : isWarning ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                      }`}>
                        {feed.detectionLabel}
                      </span>
                    </div>
                    <span className="text-[8.5px] text-slate-300 font-mono tracking-widest leading-none drop-shadow-md">
                      {feed.detectionStatus}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* HUD control base operations toolbar */}
        <div className="h-24 glass-panel rounded-sm flex items-center px-6 gap-8 shrink-0">
          
          {/* Layout buttons */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">Layout Controls</p>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-sm bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
              <button onClick={() => alert('Feature initialized: Carousel mode locked.')} className="w-10 h-10 rounded-sm hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-lg">splitscreen</span>
              </button>
              <button onClick={() => alert('Feature initialized: Multi-carousel viewport unlocked.')} className="w-10 h-10 rounded-sm hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-lg">view_carousel</span>
              </button>
            </div>
          </div>

          {/* PTZ Joystick controller */}
          <div className="flex flex-col gap-1.5 border-l border-[#2D3139] pl-8">
            <p className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">PTZ Virtual Servo</p>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 items-center">
                <button onClick={() => alert('PTZ virtual motor panning LEFT')} className="p-1 hover:text-[#FFD700] text-slate-400 cursor-pointer">
                  <span className="material-symbols-outlined text-base">arrow_back_ios</span>
                </button>
                <div className="w-8 h-8 rounded-full border border-[#FFD700]/30 flex items-center justify-center relative bg-slate-900">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700] animate-ping absolute"></div>
                  <div className="w-2 h-2 rounded-full bg-[#FFD700] relative z-10"></div>
                </div>
                <button onClick={() => alert('PTZ virtual motor panning RIGHT')} className="p-1 hover:text-[#FFD700] text-slate-400 cursor-pointer">
                  <span className="material-symbols-outlined text-base">arrow_forward_ios</span>
                </button>
              </div>

              <div className="flex flex-col ml-4">
                <span className="text-[8.5px] font-bold tracking-widest text-[#FFD700] uppercase">OPTICAL ZOOM ({zoomLevel}%)</span>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={zoomLevel} 
                  onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                  className="w-24 accent-[#FFD700] h-1 bg-[#0F1115] rounded-none appearance-none cursor-pointer mt-1"
                />
              </div>
            </div>
          </div>

          {/* Global CCTV Actions */}
          <div className="hidden md:flex flex-col gap-1.5 border-l border-[#2D3139] pl-8">
            <p className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">Global Actions</p>
            <div className="flex gap-3">
              <button 
                onClick={() => onFlagEvent(selectedFeed)}
                className="flex items-center gap-2 bg-[#161B22] hover:bg-[#0F1115] text-slate-200 px-3.5 py-2.5 rounded-sm border border-[#2D3139] transition-all text-xs font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-[#FFD700]">flag</span>
                <span>Flag event</span>
              </button>
              
              <button 
                onClick={handleCaptureSnapshot}
                className="flex items-center gap-2 bg-[#161B22] hover:bg-[#0F1115] text-slate-200 px-3.5 py-2.5 rounded-sm border border-[#2D3139] transition-all text-xs font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-[#40e56c]">screenshot</span>
                <span>Snapshot</span>
              </button>

              <button 
                onClick={() => setShowPASystem(true)}
                className="flex items-center gap-2 bg-[#FFD700] text-[#0F1115] hover:brightness-110 px-4 py-2.5 rounded-sm transition-all text-xs font-build font-extrabold cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">record_voice_over</span>
                <span>PA BROADCAST</span>
              </button>
            </div>
          </div>

          {/* Uptime stats clock */}
          <div className="ml-auto text-right">
            <p className="text-[9px] text-[#FFD700] uppercase font-bold tracking-widest">SYSTEM UPTIME</p>
            <p className="text-lg font-mono font-extrabold text-[#4ADE80] tabular-nums mt-0.5">{uptimeStr}</p>
          </div>

        </div>

      </div>

      {/* RIGHT SIDEBAR: Live Anomalies Log Panel (30%) */}
      <aside className="w-80 flex flex-col gap-4 h-full shrink-0">
        
        <div className="flex items-center justify-between pb-2 border-b border-[#2D3139]">
          <h3 className="text-[11px] font-bold tracking-wider text-[#FFD700] uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F87171] text-sm">analytics</span>
            Live Anomalies Log
          </h3>
          <span className="bg-[#F87171]/10 text-[#F87171] text-[10px] px-2.5 py-0.5 rounded-sm font-bold border border-[#F87171]/20">
            Active Feed
          </span>
        </div>

        {/* Anomalies List Content */}
        <div className="flex-grow overflow-y-auto space-y-3 pr-1">
          
          {/* Item 1 */}
          <div className="p-3.5 bg-[#161B22] hover:bg-[#0F1115] border border-[#2D3139] rounded-sm border-l-4 border-l-[#F87171] transition-all cursor-pointer">
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-[#0F1115] shrink-0 overflow-hidden rounded-sm border border-[#2D3139]">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC35OhyAERlgzLympFIEGKEDRKnYjvVFrdvA0cUU_g6k3c2h6YI-lpB7jjcXxc_mK-Lfs8Mp992OPzI0uA5LaxHyays6Y9UlXv9xTzbIGTxOSCGCNmUcA25arw8ZCqRahXytAHYGI_AQ7dnO1txieKgbLPGPlwS7PyQHmjbuHKnT5b1MV9-XXExZq2VejmSmQYYLaklxcKl4SkwKgEu1ksvg6tHxyN0RU_JNthrIUtSwlsG68SrHtkRlnR4VazRRLdZB_8eEj9U3Ro" 
                  alt="Methane leak"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#F87171] font-bold text-[9px] uppercase tracking-wider">Fire Detected</span>
                  <span className="text-[9px] text-slate-500 font-mono">14:22:04</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#94A3B8]">
                  Sector G - Warehouse 4. High thermal signature detected near bay 12. Evacuate.
                </p>
              </div>
            </div>
          </div>

          {/* Item 2 */}
          <div className="p-3.5 bg-[#161B22] hover:bg-[#0F1115] border border-[#2D3139] rounded-sm border-l-4 border-l-[#FFD700] transition-all cursor-pointer">
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-[#0F1115] shrink-0 overflow-hidden rounded-sm border border-[#2D3139]">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4iBbxpK6l1Fk0aqy4dzMNrr4DJ9bprraXwkFinSUwJCQeAgDF9ecvAtQNDkov-bCAELB6ICylcG3ZP_OWonFp7fw0aELykO2U3LEV50d8UmxHJgW-X73WyMkF2B_rs9yqr6dITuDtdpZp0kU-R1DnZ8QpdCK_y4NyopcW8M91sDdiJBrRIbma16W8bR9_Xlp6rK0HpiFYHQC_pL80M_-TbsXqL5jBPq1CgzHCmXo_INdtglWfuo59vXuaZcdxwAWj1SjaqeysSfw" 
                  alt="PPE non compliance"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#FFD700] font-bold text-[9px] uppercase tracking-wider">PPE Violation</span>
                  <span className="text-[9px] text-slate-500 font-mono">14:20:15</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#94A3B8]">
                  Sector E - Assembly line. Operator ID: #042. Safety helmet missing.
                </p>
              </div>
            </div>
          </div>

          {/* Item 3 */}
          <div className="p-3.5 bg-[#161B22] hover:bg-[#0F1115] border border-[#2D3139] rounded-sm border-l-4 border-l-[#FFD700] transition-all cursor-pointer">
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-[#0F1115] shrink-0 overflow-hidden rounded-sm border border-[#2D3139]">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_1BhYIwS7Htg897AX96lSFsodIvzBamBteAmLR5jUnaXArJcJI9UCwiLaxLLXsEk0haCWhgfRkUPD0Grnl--jz0Lp4G_J6shJjUXreETyF3pmhVDftvXpUzFo2kV4PGDY8DzpojMXv4_9BLp08B9cLF8_q8KcFJPHh5PA6fVlSJjb-Yq2qmccLTrccrvZd3t0vw4HFT0jXMHB8uT5EtTq2-o2ZPUEUrrpd7vy4fl6eKtMyYMWGG5Qax4YLucPXGYO-aY3NU8rDmY" 
                  alt="Overheating"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#FFD700] font-bold text-[9px] uppercase tracking-wider">Overheating</span>
                  <span className="text-[9px] text-slate-500 font-mono">14:18:32</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#94A3B8]">
                  Unit 092 - Main Drive Servo. Temp: 114°C. Max Threshold: 90°C.
                </p>
              </div>
            </div>
          </div>

          {/* Item 4 */}
          <div className="p-3.5 bg-[#161B22] hover:bg-[#0F1115] border border-[#2D3139] rounded-sm border-l-4 border-l-[#FFD700]/30 transition-all cursor-pointer opacity-70 hover:opacity-100">
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-[#0F1115] shrink-0 overflow-hidden rounded-sm border border-[#2D3139]">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7vHj_XWWGBnlJP8rVsjm770ll-RerMnxNXUFV9DJQQlL5dH2fvYDx41t_Y0vIQ0Z4jPqSdJru2kZ2SX3cbKo7b-NZhv6WqJWkvx7TdSrtVGESexnL2gSU_MyL_NeJEka4lvdr6tVjSUrJD1rUlxlkK7MKh152ZiX8MdJoieIUTCOluUSliw6GIF_UrR_Gax3wmoZG1zHZARgwQsPLhYqqBQmSmGM3-SmBXT373jt7BikN1ljS1T2Esha5WLUhXA6ykMOVq9PLvsg" 
                  alt="Gate access"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#94A3B8] font-bold text-[9px] uppercase tracking-wider">Gate Clearance</span>
                  <span className="text-[9px] text-slate-500 font-mono">14:15:00</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#94A3B8] font-mono text-[10.5px]">
                  MAIN PORTAL - Vehicle V-722. ID driver verified: J. Carter. Access allowed.
                </p>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-4 border-t border-[#2D3139]">
          <button 
            type="button"
            onClick={onOpenReportGenerator}
            className="w-full py-2.5 bg-[#161B22] hover:bg-[#0F1115] text-[#FFD700] font-bold text-[10px] tracking-wider transition-all uppercase rounded-sm border border-[#2D3139] cursor-pointer"
          >
            Audit Live Feed logs
          </button>
        </div>

      </aside>

      {/* PA System Dialog Backdrop */}
      {showPASystem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs" onClick={() => setShowPASystem(false)} />
          <div className="relative glass-panel rounded-sm max-w-md w-full p-6 space-y-4 bg-[#161B22] border border-[#2D3139]">
            <h3 className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FFD700]">record_voice_over</span>
              Active PA PA-Broadcaster Terminal
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Input the broadcast announcement block which will emit localized siren chimes across Sector G and Warehouse assemblies.
            </p>
            <form onSubmit={handlePAAnnounce} className="space-y-4">
              <textarea
                required
                value={pAMessage}
                onChange={(e) => setPAMessage(e.target.value)}
                rows={3}
                placeholder="Message details..."
                className="w-full text-xs font-mono bg-[#0F1115] text-slate-100 border border-[#2D3139] rounded-sm p-3 focus:outline-none focus:border-[#FFD700]"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowPASystem(false)}
                  className="px-4 py-2 border border-[#2D3139] text-[#94A3B8] hover:text-white rounded-sm text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#FFD700] text-[#0F1115] font-extrabold rounded-sm text-xs uppercase cursor-pointer hover:bg-[#FFD700]/90"
                >
                  EMIT ANNOUNCEMENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
