import React, { useState } from 'react';
import { useSafetyStore } from '../store';

export default function LoginView() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Viewer' | 'Safety Officer' | 'Manager' | 'Admin'>('Safety Officer');
  const [showPassword, setShowPassword] = useState(false);
  
  const [authStatus, setAuthStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [bypassMode, setBypassMode] = useState<null | 'biometric' | 'smartcard'>(null);
  const [bypassProgress, setBypassProgress] = useState(0);

  const loginUser = useSafetyStore(state => state.loginUser);
  const registerUser = useSafetyStore(state => state.registerUser);
  const bypassLogin = useSafetyStore(state => state.bypassLogin);
  const loginError = useSafetyStore(state => state.loginError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      alert('Please fill in complete authorization credentials');
      return;
    }

    setAuthStatus('scanning');
    setBypassMode(null);

    if (isRegisterMode) {
      // Register Mode
      const registerSuccess = await registerUser(username, password, role);
      if (registerSuccess) {
        setAuthStatus('success');
        setTimeout(() => {
          // Switch back to login page
          setIsRegisterMode(false);
          setAuthStatus('idle');
          setUsername('');
          setPassword('');
          alert('Registration successful! Please establish secure uplink using your credentials.');
        }, 800);
      } else {
        setAuthStatus('error');
      }
    } else {
      // Login Mode
      const loginSuccess = await loginUser(username, password);
      if (loginSuccess) {
        setAuthStatus('success');
      } else {
        setAuthStatus('error');
      }
    }
  };

  const handleBypass = (type: 'biometric' | 'smartcard') => {
    setBypassMode(type);
    setBypassProgress(0);
    setAuthStatus('scanning');

    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setBypassProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setAuthStatus('success');
        setTimeout(() => {
          // Authenticate using offline developer bypass with standard security overrides
          const bypassRole = type === 'biometric' ? 'Safety Officer' : 'Admin';
          const bypassName = type === 'biometric' ? 'Officer Reyes' : 'SysAdmin Arthur';
          bypassLogin(bypassRole, bypassName);
        }, 600);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#0F1115] relative overflow-hidden" 
         style={{
           backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(148, 163, 184, 0.05) 1px, transparent 0)',
           backgroundSize: '24px 24px'
         }}>
      
      {/* Side Decoration (Industrial Control Room feel) */}
      <div className="absolute top-8 left-8 flex flex-col gap-4 opacity-30 h-32 hidden lg:flex">
        <div className="h-24 w-[1px] bg-[#FFD700]"></div>
        <span className="text-[10px] tracking-widest text-[#FFD700]" style={{ writingMode: 'vertical-rl', transform: 'rotate(-180deg)' }}>
          PROTOCOL_ALPHA_7_SECURED
        </span>
      </div>

      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-2 opacity-35 hidden lg:flex text-right">
        <span className="font-mono text-[10px] text-[#94A3B8]">HOST_NODE: 192.168.1.104</span>
        <span className="font-mono text-[10px] text-[#4ADE80]">SECURE TUNNEL LATENCY: 14MS</span>
        <div className="h-16 w-[1px] bg-[#2D3139] mt-2"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        
        {/* Logo and Header info */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-[#161B22] border border-[#2D3139] mb-4 relative overflow-hidden">
            <span className="material-symbols-outlined text-[#FFD700] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_with_heart
            </span>
            <div className="scan-line absolute inset-0 w-full" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-[0.25em] text-[#FFD700] uppercase mb-1 font-mono">SAFE-GUARD AI</h1>
          <p className="text-[11px] font-bold tracking-[0.1em] text-[#94A3B8] uppercase">
            Command Center Access | Sector G Safety Monitor
          </p>
        </div>

        {/* Interactive Authentication Panel Card */}
        <div className="glass-panel rounded-sm p-8 shadow-2xl relative border border-[#2D3139] bg-[#161B22]">
          
          {/* Top Status Bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#0F1115] border border-[#2D3139] rounded-sm flex items-center gap-2 z-10 whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full ${authStatus === 'scanning' ? 'bg-orange-500 animate-pulse' : 'bg-[#4ADE80] animate-pulse'}`}></span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-200">
              {authStatus === 'scanning' ? 'GATEWAY INFERENCE PENDING...' : 'SYSTEM UPLINK READY'}
            </span>
          </div>

          {/* Login/Register Selector Tabs */}
          {authStatus === 'idle' && (
            <div className="grid grid-cols-2 mb-6 border-b border-[#2D3139] pb-3 gap-2">
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setAuthStatus('idle'); }}
                className={`text-[11px] uppercase tracking-wider font-extrabold pb-1 transition-all ${
                  !isRegisterMode ? 'text-[#FFD700] border-b-2 border-[#FFD700]' : 'text-slate-400 hover:text-white'
                }`}
              >
                ACCESS SECURE UPLINK
              </button>
              <button
                type="button"
                onClick={() => { setIsRegisterMode(true); setAuthStatus('idle'); }}
                className={`text-[11px] uppercase tracking-wider font-extrabold pb-1 transition-all ${
                  isRegisterMode ? 'text-[#FFD700] border-b-2 border-[#FFD700]' : 'text-slate-400 hover:text-white'
                }`}
              >
                REGISTER NEW OPERATIVE
              </button>
            </div>
          )}

          {authStatus === 'scanning' && bypassMode ? (
            /* Bypass scanning view */
            <div className="py-10 text-center space-y-6">
              <div className="relative inline-flex items-center justify-center p-6 bg-[#0F1115] rounded-sm border border-[#FFD700]/30">
                <span className={`material-symbols-outlined text-5xl text-[#FFD700] ${bypassMode === 'biometric' ? 'animate-pulse' : 'animate-bounce'}`}>
                  {bypassMode === 'biometric' ? 'fingerprint' : 'contactless'}
                </span>
                <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="44%"
                    fill="transparent"
                    stroke="#4ADE80"
                    strokeWidth="3"
                    strokeDasharray="276"
                    strokeDashoffset={276 - (bypassProgress / 100) * 276}
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="font-mono text-sm tracking-widest text-[#FFD700] uppercase font-bold">
                  AUTOPILOT SCANNING {bypassMode === 'biometric' ? 'BIOMETRICS' : 'SMART ENCRYPTED CARD'}
                </p>
                <p className="font-mono text-xs text-[#94A3B8]">{bypassProgress}% Authenticated</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthStatus('idle');
                  setBypassMode(null);
                }}
                className="text-xs text-[#F87171] hover:text-[#F87171]/80 underline font-semibold tracking-wider cursor-pointer"
              >
                Cancel Stream Override
              </button>
            </div>
          ) : authStatus === 'success' ? (
            /* Success confirmation */
            <div className="py-12 text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-[#4ADE80] animate-bounce">
                verified
              </span>
              <h3 className="text-xl font-bold tracking-widest text-white">ACCESS GRANTED</h3>
              <p className="text-xs font-mono text-[#94A3B8] uppercase">CONNECTING INT incident command DATABASE</p>
            </div>
          ) : (
            /* Primary Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {loginError && (
                <div className="p-3 bg-red-950/20 border border-red-900 text-[#F87171] text-xs font-mono rounded-sm leading-relaxed">
                  ⚠️ AUTH_ERROR: {loginError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-[#94A3B8] block ml-1" htmlFor="username">
                  OPERATOR USERNAME
                </label>
                <div className="relative flex items-center bg-[#0F1115] border border-[#2D3139] rounded-sm transition-all focus-within:border-[#FFD700]">
                  <span className="material-symbols-outlined absolute left-3 text-[#94A3B8] text-xl">
                    badge
                  </span>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. arthur_ops"
                    className="w-full h-11 bg-transparent border-none text-[#E2E8F0] placeholder-slate-600 pl-10 pr-4 text-sm font-semibold focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold tracking-brand-caps text-[#94A3B8] block" htmlFor="password">
                    SECURE SIGN IN KEY
                  </label>
                  {!isRegisterMode && (
                    <button 
                      type="button" 
                      onClick={() => alert("Credentials bypass: Use 'Biometric' or 'Smart Card' underneath for direct instant clearance on the preview.")} 
                      className="text-[10px] font-bold tracking-wider text-[#FFD700] hover:underline hover:text-white transition-all uppercase cursor-pointer"
                    >
                      Recovery Instructions
                    </button>
                  )}
                </div>
                <div className="relative flex items-center bg-[#0F1115] border border-[#2D3139] rounded-sm transition-all focus-within:border-[#FFD700]">
                  <span className="material-symbols-outlined absolute left-3 text-[#94A3B8] text-xl">
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 bg-transparent border-none text-[#E2E8F0] placeholder-slate-600 pl-10 pr-12 text-sm font-mono tracking-wider focus:ring-0 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#94A3B8] hover:text-[#FFD700] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Role Selection mapping when in Register Mode */}
              {isRegisterMode && (
                <div className="space-y-2 animate-[fadeIn_0.3s_ease]">
                  <label className="text-[10px] font-bold tracking-wider text-[#94A3B8] block ml-1" htmlFor="role-select">
                    ASSIGN CLEARANCE LEVEL ROLE
                  </label>
                  <div className="relative flex items-center bg-[#0F1115] border border-[#2D3139] rounded-sm focus-within:border-[#FFD700]">
                    <span className="material-symbols-outlined absolute left-3 text-[#FFD700] text-xl">
                      verified
                    </span>
                    <select
                      id="role-select"
                      value={role}
                      onChange={(e: any) => setRole(e.target.value)}
                      className="w-full h-11 bg-transparent border-none text-[#E2E8F0] pl-10 pr-4 text-sm font-semibold focus:ring-0 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="Viewer" className="bg-[#161B22] text-[#E2E8F0]">Viewer (Read Only Monitors)</option>
                      <option value="Safety Officer" className="bg-[#161B22] text-[#E2E8F0]">Safety Officer (Resolve Alarms)</option>
                      <option value="Manager" className="bg-[#161B22] text-[#E2E8F0]">Manager (AI Report Generatives)</option>
                      <option value="Admin" className="bg-[#161B22] text-[#E2E8F0]">Admin (Full Systems Override)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 text-slate-500 pointer-events-none">
                      arrow_drop_down
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={authStatus === 'scanning'}
                  className="w-full bg-[#FFD700] text-[#0F1115] font-bold tracking-widest text-xs py-3.5 rounded-sm flex items-center justify-center gap-2 hover:bg-[#FFD700]/95 active:scale-[0.98] transition-all cursor-pointer shadow-[0_2px_8px_rgba(255,215,0,0.15)] disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">verified_user</span>
                  {isRegisterMode ? 'ENROLL AND ACTIVATE OPERATIVE' : 'ESTABLISH SECURE INTERFACE'}
                </button>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-[1px] flex-grow bg-[#2D3139]"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">
                    Instant Auto-Clearance Bypass
                  </span>
                  <div className="h-[1px] flex-grow bg-[#2D3139]"></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleBypass('biometric')}
                    disabled={authStatus === 'scanning'}
                    className="flex items-center justify-center gap-2 bg-[#161B22] text-slate-100 font-bold py-3 rounded-sm border border-[#2D3139] hover:bg-[#0F1115] transition-colors text-[10px] tracking-wider uppercase cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[#4ADE80] text-sm">fingerprint</span>
                    BIOMETRIC
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBypass('smartcard')}
                    disabled={authStatus === 'scanning'}
                    className="flex items-center justify-center gap-2 bg-[#161B22] text-slate-100 font-bold py-3 rounded-sm border border-[#2D3139] hover:bg-[#0F1115] transition-colors text-[10px] tracking-wider uppercase cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[#FFD700] text-sm">contactless</span>
                    CARD OVERRIDE
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Security Compliance Notes Footer */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 text-[#94A3B8]">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">encrypted</span>
              <span className="text-[8px] font-bold tracking-wider uppercase">AES-256</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">security</span>
              <span className="text-[8px] font-bold tracking-wider uppercase">ISO 27001 SECURE</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 max-w-[280px] text-center leading-relaxed font-mono">
            Access restricted to certified plant operators. Security system monitors, logs, and hashes all interface entries.
          </p>
        </div>

      </div>
    </div>
  );
}
