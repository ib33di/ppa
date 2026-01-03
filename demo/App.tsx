import React, { useState, useMemo, useEffect, useRef } from 'react';
import { KPICard } from './components/KPICard';
import { UtilizationChart } from './components/UtilizationChart';
import { RevenueChart } from './components/RevenueChart';
import { InsightsPanel } from './components/InsightsPanel';
import { PlayerDetailPanel } from './components/PlayerDetailPanel';
import { PlayerDynamics } from './components/PlayerDynamics';
import { MatchQuality } from './components/MatchQuality';
import { FunnelChart } from './components/FunnelChart';
import { PlayersView } from './components/PlayersView';
import { MatchmakingView } from './components/MatchmakingView';
import { LiveOperations } from './components/LiveOperations';
import { ScheduledView } from './components/ScheduledView';
import { AuraLogicModal } from './components/AuraLogicModal';
import { KPIMetric, Player, SlotData } from './types';
import { Icon } from './components/Icons';

// --- MOCK DATA ---

const METRICS: KPIMetric[] = [
  { label: 'Avg Utilization (7d)', value: '78%', trend: 4.5, trendLabel: 'vs last 7 days', status: 'healthy', iconName: 'activity', context: 'Driven by PPA' },
  { label: 'Rev per Court Hour', value: '€42.50', trend: -1.2, trendLabel: 'vs target', status: 'attention', iconName: 'wallet', context: 'PPA +22% vs Manual' },
  { label: 'Match Fill Rate', value: '3.8', trend: 0.2, trendLabel: 'players / slot', status: 'healthy', iconName: 'users', context: 'System Optimal' },
  { label: 'Cancellation Rate', value: '4.2%', trend: -2.1, trendLabel: 'increasing', status: 'attention', iconName: 'alert', context: 'Risk Segment' }
];

const MATCHMAKING_GRID: SlotData[] = [
  // 17:00
  { id: '1-1', time: '17:00', court: 'Central Court', status: 'booked', label: 'J. Doe +3' },
  { id: '1-2', time: '17:00', court: 'Court 2', status: 'aura-opportunity', confidence: 94 },
  { id: '1-3', time: '17:00', court: 'Court 3', status: 'open' },
  { id: '1-4', time: '17:00', court: 'Court 4', status: 'booked', label: 'Training' },
  // 18:30
  { id: '2-1', time: '18:30', court: 'Central Court', status: 'aura-opportunity', confidence: 88 },
  { id: '2-2', time: '18:30', court: 'Court 2', status: 'partial', players: 2 },
  { id: '2-3', time: '18:30', court: 'Court 3', status: 'open' },
  { id: '2-4', time: '18:30', court: 'Court 4', status: 'open' },
  // 20:00
  { id: '3-1', time: '20:00', court: 'Central Court', status: 'booked', label: 'Tournament' },
  { id: '3-2', time: '20:00', court: 'Court 2', status: 'booked', label: 'Tournament' },
  { id: '3-3', time: '20:00', court: 'Court 3', status: 'partial', players: 3 },
  { id: '3-4', time: '20:00', court: 'Court 4', status: 'aura-opportunity', confidence: 98 },
  // 21:30
  { id: '4-1', time: '21:30', court: 'Central Court', status: 'open' },
  { id: '4-2', time: '21:30', court: 'Court 2', status: 'open' },
  { id: '4-3', time: '21:30', court: 'Court 3', status: 'booked', label: 'Private' },
  { id: '4-4', time: '21:30', court: 'Court 4', status: 'open' },
];

// --- AGENT TYPES & DATA ---

type InviteStatus = 'idle' | 'sending' | 'invited' | 'confirmed' | 'declined' | 'timeout';

interface MatchCandidate {
    id: string;
    name: string;
    level: string;
    hand: string;
    img: string;
    trust: number;
    phone: string;
    inviteStatus: InviteStatus;
    isBackup?: boolean;
}

const CANDIDATE_POOL: MatchCandidate[] = [
    { id: 'c1', name: 'Chris Lee', level: '4.5', hand: 'Backhand', img: 'CL', trust: 92, phone: '+1...453', inviteStatus: 'idle' },
    { id: 'c2', name: 'Elena G.', level: '4.5', hand: 'Drive', img: 'EG', trust: 96, phone: '+1...882', inviteStatus: 'idle' },
    { id: 'c3', name: 'Lucas S.', level: '4.4', hand: 'Backhand', img: 'LS', trust: 85, phone: '+1...129', inviteStatus: 'idle' }, // Will decline
    { id: 'c4', name: 'Maria R.', level: '4.2', hand: 'Drive', img: 'MR', trust: 90, phone: '+1...991', inviteStatus: 'idle' },
];

const BACKUP_POOL: MatchCandidate[] = [
    { id: 'b1', name: 'David Kim', level: '4.5', hand: 'Left', img: 'DK', trust: 89, phone: '+1...773', inviteStatus: 'idle', isBackup: true },
    { id: 'b2', name: 'Sarah J.', level: '4.4', hand: 'Right', img: 'SJ', trust: 91, phone: '+1...442', inviteStatus: 'idle', isBackup: true }
];

interface LogEntry {
    id: number;
    time: string;
    text: string;
    type: 'system' | 'whatsapp' | 'error' | 'success';
}

// --- SYSTEM MONITOR COMPONENT (The "Apple/Jobs" Aesthetic) ---

const SYSTEM_LOGS = [
  "Initializing neural core...",
  "Scanning court utilization...",
  "Latency check: 14ms... OK",
  "Syncing player dynamics...",
  "Optimizing revenue potential...",
  "Pattern matching active...",
  "Secure handshake established...",
  "Monitoring real-time signals..."
];

const SystemMonitor = () => {
    const [logIndex, setLogIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setLogIndex(prev => (prev + 1) % SYSTEM_LOGS.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const currentLog = SYSTEM_LOGS[logIndex];
    const prevLog = SYSTEM_LOGS[(logIndex - 1 + SYSTEM_LOGS.length) % SYSTEM_LOGS.length];

    return (
        <div className="h-full bg-black flex flex-col relative overflow-hidden font-sans select-none border-l border-zinc-800">
             {/* Background Ambience */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>

             {/* Main Visual */}
             <div className="flex-1 flex flex-col items-center justify-center z-10">
                 <div className="relative mb-8 group cursor-default">
                     <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse transition-all duration-1000 group-hover:bg-emerald-500/30"></div>
                     <div className="w-20 h-20 bg-zinc-950 rounded-full border border-zinc-800/80 flex items-center justify-center relative shadow-2xl ring-1 ring-white/5 group-hover:scale-105 transition-transform duration-500">
                         <Icon name="activity" className="w-8 h-8 text-emerald-500 opacity-90" />
                     </div>
                     {/* Orbital Ring - subtle spin */}
                     <div className="absolute inset-0 rounded-full border border-emerald-500/10 scale-125 animate-[spin_10s_linear_infinite]"></div>
                 </div>

                 <h3 className="text-zinc-200 font-medium tracking-tight mb-2">System Monitoring</h3>
                 
                 <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Live Feed Active</span>
                 </div>
             </div>

             {/* Terminal / Logs Area */}
             <div className="h-48 w-full bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent px-8 pb-8 flex flex-col justify-end">
                  <div className="space-y-3">
                      {/* Previous Log (Fading out) */}
                      <div className="flex items-center gap-3 opacity-30 transition-opacity duration-500">
                          <div className="w-1 h-1 rounded-full bg-zinc-600"></div>
                          <span className="text-[10px] font-mono text-zinc-500 truncate">{prevLog}</span>
                      </div>
                      
                      {/* Current Log (Active) */}
                      <div className="flex items-center gap-3">
                          <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                          <span className="text-xs font-mono text-emerald-400/90 truncate">{currentLog}</span>
                      </div>
                  </div>
                  
                  {/* Decor Line */}
                  <div className="w-full h-px bg-zinc-900 mt-6 flex items-center gap-1">
                      <div className="h-px w-8 bg-zinc-800"></div>
                      <div className="h-px w-2 bg-zinc-700"></div>
                  </div>
             </div>
        </div>
    );
};

// --- VIEWS ---

const AnalyticsDashboard = ({ onNavigateToMatchmaking }: { onNavigateToMatchmaking: () => void }) => (
  <div className="p-8 pb-12 space-y-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
    <section>
      <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 pl-1">Executive Truth</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m, i) => (
          <KPICard key={i} metric={m} />
        ))}
      </div>
    </section>

    <section>
      <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 pl-1">System Performance</h5>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[420px]">
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <UtilizationChart />
        </div>
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <RevenueChart />
        </div>
      </div>
    </section>

    <section>
      <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 pl-1">Leverage Points</h5>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[420px]">
        <FunnelChart onViewDropOffs={onNavigateToMatchmaking} />
        <PlayerDynamics />
        <MatchQuality />
      </div>
    </section>
  </div>
);

// --- NAVIGATION ---

type ViewState = 'overview' | 'players' | 'matchmaking' | 'analytics' | 'scheduled';
type Role = 'Manager' | 'Club Owner' | 'Receptionist' | 'Coach';

interface TopNavItemProps {
  view: ViewState;
  current: ViewState;
  icon: string;
  label: string;
  onClick: (view: ViewState) => void;
}

const TopNavItem: React.FC<TopNavItemProps> = ({ view, current, icon, label, onClick }) => {
  const isActive = current === view;
  return (
    <button 
      onClick={() => onClick(view)}
      className={`relative flex items-center gap-2.5 px-1 py-4 text-sm font-medium transition-all ${
        isActive 
          ? 'text-emerald-400' 
          : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
       <Icon name={icon} className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
       {label}
       {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_-1px_6px_rgba(16,185,129,0.4)]"></div>
       )}
    </button>
  );
};

// --- ROLE SELECTOR ---

interface RoleOption {
  role: Role;
  label: string;
  subtitle: string;
  icon: string;
  view: ViewState;
}

const ROLE_OPTIONS: RoleOption[] = [
  { role: 'Manager', label: 'Manager', subtitle: 'System Operator', icon: 'shield', view: 'overview' },
  { role: 'Club Owner', label: 'Club Owner', subtitle: 'Outcome View', icon: 'briefcase', view: 'analytics' },
  { role: 'Receptionist', label: 'Receptionist', subtitle: 'Execution View', icon: 'user', view: 'scheduled' },
  { role: 'Coach', label: 'Coach', subtitle: 'Activation View', icon: 'flag', view: 'players' },
];

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('overview');
  const [currentRole, setCurrentRole] = useState<Role>('Manager');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showAuraLogic, setShowAuraLogic] = useState(false);
  const [selectedMatchSlot, setSelectedMatchSlot] = useState<SlotData | null>(null);

  // --- AGENT STATE ---
  const [agentStatus, setAgentStatus] = useState<'idle' | 'active' | 'confirmed' | 'failed'>('idle');
  const [roster, setRoster] = useState<MatchCandidate[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setIsRoleMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [roleMenuRef]);

  // Reset agent when slot changes
  useEffect(() => {
    if (selectedMatchSlot) {
        setAgentStatus('idle');
        setRoster([]);
        setLogs([]);
    }
  }, [selectedMatchSlot]);

  // Auto-scroll logs
  useEffect(() => {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (text: string, type: LogEntry['type'] = 'system') => {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      setLogs(prev => [...prev, { id: Date.now(), time, text, type }]);
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
  };

  const handleNavigateToMatchmaking = () => {
    setCurrentView('matchmaking');
  };
  
  const handleOpenCalendar = () => {
    setCurrentView('scheduled');
  };
  
  const handleBackToOperations = () => {
    setCurrentView('matchmaking');
  };

  const handleRoleChange = (roleOption: RoleOption) => {
    setCurrentRole(roleOption.role);
    setCurrentView(roleOption.view); // Switch view based on role
    setIsRoleMenuOpen(false);
  };

  const auraOpportunities = useMemo(() => {
    return MATCHMAKING_GRID.filter(slot => slot.status === 'aura-opportunity').sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }, []);

  // --- THE AGENT BRAIN ---
  const startAutonomousFlow = () => {
      setAgentStatus('active');
      setRoster(CANDIDATE_POOL); // Initial Selection
      addLog("Analyzing reliability scores...", 'system');
      addLog("Selected 4 primary candidates.", 'system');

      // 1. Simulate sending invites
      setTimeout(() => {
          setRoster(prev => prev.map(p => ({ ...p, inviteStatus: 'sending' })));
          addLog("Initiating WhatsApp API...", 'system');
      }, 800);

      setTimeout(() => {
          setRoster(prev => prev.map(p => ({ ...p, inviteStatus: 'invited' })));
          addLog(`Sent invite to Chris Lee: "Hey Chris 👋 match today at ${selectedMatchSlot?.time}?"`, 'whatsapp');
          addLog(`Sent invite to Elena G: "Hey Elena 👋 match today at ${selectedMatchSlot?.time}?"`, 'whatsapp');
          addLog(`Sent invite to Lucas S: "Hey Lucas 👋 match today at ${selectedMatchSlot?.time}?"`, 'whatsapp');
          addLog(`Sent invite to Maria R: "Hey Maria 👋 match today at ${selectedMatchSlot?.time}?"`, 'whatsapp');
      }, 2000);

      // 2. Simulate Responses
      // Chris Confirms
      setTimeout(() => {
          setRoster(prev => prev.map(p => p.id === 'c1' ? { ...p, inviteStatus: 'confirmed' } : p));
          addLog("Chris Lee confirmed via WhatsApp.", 'success');
      }, 3500);

      // Elena Confirms
      setTimeout(() => {
          setRoster(prev => prev.map(p => p.id === 'c2' ? { ...p, inviteStatus: 'confirmed' } : p));
          addLog("Elena G. confirmed via WhatsApp.", 'success');
      }, 4500);

      // 3. FALLBACK SCENARIO: Lucas Declines
      setTimeout(() => {
          setRoster(prev => prev.map(p => p.id === 'c3' ? { ...p, inviteStatus: 'declined' } : p));
          addLog("Lucas S. declined invite.", 'error');
          addLog("Triggering Fallback Protocol...", 'system');
      }, 6000);

      // 4. Activate Backup
      setTimeout(() => {
          // Remove Lucas, Add David
          setRoster(prev => {
              const filtered = prev.filter(p => p.id !== 'c3');
              return [...filtered, BACKUP_POOL[0]]; // Add David
          });
          addLog("Promoted backup candidate: David Kim", 'system');
      }, 7000);

      // 5. Invite Backup
      setTimeout(() => {
          setRoster(prev => prev.map(p => p.id === 'b1' ? { ...p, inviteStatus: 'invited' } : p));
          addLog(`Sent invite to David Kim: "Hey David, spot opened up at ${selectedMatchSlot?.time}."`, 'whatsapp');
      }, 7800);

      // 6. Final Confirmations
      setTimeout(() => {
          setRoster(prev => prev.map(p => p.id === 'c4' ? { ...p, inviteStatus: 'confirmed' } : p));
          addLog("Maria R. confirmed via WhatsApp.", 'success');
      }, 9000);

      setTimeout(() => {
          setRoster(prev => prev.map(p => p.id === 'b1' ? { ...p, inviteStatus: 'confirmed' } : p));
          addLog("David Kim confirmed via WhatsApp.", 'success');
      }, 10500);

      // 7. COMPLETE
      setTimeout(() => {
          setAgentStatus('confirmed');
          addLog("MATCH CONFIRMED. Roster locked.", 'success');
          addLog(`Final notification sent to 4 players.`, 'system');
      }, 12000);
  };

  const getStatusColor = (status: InviteStatus) => {
      switch(status) {
          case 'confirmed': return 'text-emerald-400';
          case 'declined': return 'text-rose-400';
          case 'invited': return 'text-amber-400';
          case 'sending': return 'text-zinc-400';
          default: return 'text-zinc-500';
      }
  };

  const getStatusIcon = (status: InviteStatus) => {
      switch(status) {
          case 'confirmed': return 'check';
          case 'declined': return 'x';
          case 'invited': return 'clock';
          case 'sending': return 'arrow-right';
          default: return 'user';
      }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex overflow-hidden">
      
      {/* Aura Logic Modal */}
      {showAuraLogic && <AuraLogicModal onClose={() => setShowAuraLogic(false)} />}

      {/* 0. LEFT NAVIGATION RAIL */}
      <nav className="w-16 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-5 z-30 relative">
          <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-6 cursor-pointer hover:bg-indigo-500/20 transition-colors group">
             <span className="font-black text-indigo-500 text-[10px] tracking-tighter group-hover:scale-105 transition-transform">PPA</span>
          </div>
          
          {/* ROLE SWITCHER TRIGGER */}
          <div className="mt-auto pb-4 relative" ref={roleMenuRef}>
            <button 
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${isRoleMenuOpen ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'}`}
            >
               <Icon name="user" className="w-4 h-4" />
            </button>
            
            {/* ROLE MENU POPOVER */}
            {isRoleMenuOpen && (
                <div className="absolute left-14 bottom-2 w-64 bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-left-2 duration-200">
                    <div className="px-4 py-3 border-b border-zinc-800/50">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Switch Perspective</span>
                    </div>
                    <div className="p-1">
                        {ROLE_OPTIONS.map((opt) => {
                            const isSelected = currentRole === opt.role;
                            return (
                                <button 
                                    key={opt.role}
                                    onClick={() => handleRoleChange(opt)}
                                    className={`
                                        w-full flex items-center justify-between p-3 rounded-lg text-left group transition-all
                                        ${isSelected ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-zinc-800 border border-transparent'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon 
                                            name={opt.icon} 
                                            className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} 
                                        />
                                        <div>
                                            <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                                                {opt.label}
                                            </div>
                                            <div className={`text-[10px] ${isSelected ? 'text-blue-300/70' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                                                {opt.subtitle}
                                            </div>
                                        </div>
                                    </div>
                                    {isSelected && <Icon name="check" className="w-3.5 h-3.5 text-blue-400" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
          </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-zinc-950/50">
        
        {/* 1. HEADER ROW */}
        <header className="px-8 py-5 flex justify-between items-center bg-black border-b border-zinc-900 z-20">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                PPA Dashboard
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-500 uppercase tracking-wider">
                    {currentRole} View
                </span>
            </h1>
            <div className="flex items-center gap-6">
               
               {/* CLICKABLE AURA STATUS */}
               <button 
                  onClick={() => setShowAuraLogic(true)}
                  className="
                    group relative flex items-center gap-2.5 px-4 py-2 rounded-full 
                    bg-zinc-900/60 backdrop-blur-md border border-zinc-800/60 
                    transition-all duration-300 ease-out 
                    hover:bg-zinc-800 hover:border-zinc-600 hover:scale-[1.03] hover:shadow-[0_0_25px_-5px_rgba(236,72,153,0.3)] 
                    active:scale-95 active:opacity-90
                  "
               >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                  <Icon name="brain" className="w-4 h-4 text-pink-500 transition-transform duration-300 group-hover:scale-110 group-hover:text-pink-400 group-hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                  <span className="text-xs font-semibold text-zinc-300 transition-colors duration-300 group-hover:text-white">Aura Active</span>
                  
                  {/* Tooltip: Stop Aura Coach */}
                  <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 transform translate-y-1 group-hover:translate-y-0">
                     <span className="text-[10px] font-bold text-rose-400 tracking-wide">Stop Aura Coach</span>
                  </div>
               </button>

               <div className="h-6 w-px bg-zinc-800"></div>
               <button className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  <Icon name="plus" className="w-4 h-4" />
                  Create Assessment
               </button>
            </div>
        </header>

        {/* 2. HORIZONTAL NAVIGATION BAR */}
        <div className="px-8 border-b border-zinc-800 bg-black/50 backdrop-blur-sm z-10">
           <div className="flex items-center gap-8">
              <TopNavItem view="overview" current={currentView} icon="zap" label="Live Operations" onClick={setCurrentView} />
              <TopNavItem view="analytics" current={currentView} icon="trending-up" label="Analytics" onClick={setCurrentView} />
              <TopNavItem view="players" current={currentView} icon="users" label="Players" onClick={setCurrentView} />
              <TopNavItem view="matchmaking" current={currentView} icon="trophy" label="Matchmaking" onClick={setCurrentView} />
              <TopNavItem view="scheduled" current={currentView} icon="calendar" label="Scheduled" onClick={setCurrentView} />
           </div>
        </div>

        {/* 3. CONTENT VIEW AREA */}
        <div className="flex-1 overflow-hidden relative flex">
            {/* Main View Container */}
            <div className="flex-1 overflow-y-auto scroll-smooth flex">
                {currentView === 'overview' && (
                  <LiveOperations 
                      gridData={MATCHMAKING_GRID}
                      selectedSlot={selectedMatchSlot}
                      onSelectSlot={setSelectedMatchSlot}
                  />
                )}
                {currentView === 'analytics' && (
                  <AnalyticsDashboard onNavigateToMatchmaking={handleNavigateToMatchmaking} />
                )}
                {currentView === 'players' && (
                  <div className="h-full w-full">
                    <PlayersView 
                        onSelectPlayer={handlePlayerSelect} 
                        selectedPlayerId={selectedPlayer?.id || null} 
                    />
                  </div>
                )}
                {currentView === 'matchmaking' && (
                  <div className="h-full w-full p-8 max-w-[1600px] mx-auto">
                    <MatchmakingView 
                      gridData={MATCHMAKING_GRID}
                      selectedSlot={selectedMatchSlot}
                      onSelectSlot={setSelectedMatchSlot}
                      onOpenCalendar={handleOpenCalendar}
                    />
                  </div>
                )}
                {currentView === 'scheduled' && (
                  <div className="h-full w-full p-8 max-w-[1600px] mx-auto">
                    <ScheduledView onBack={handleBackToOperations} />
                  </div>
                )}
            </div>

            {/* Right Sidebar (Contextual) */}
            <aside className="w-full lg:w-96 border-l border-zinc-800 bg-black z-20 shadow-2xl hidden xl:block">
              {currentView === 'analytics' ? (
                  <InsightsPanel />
              ) : currentView === 'players' ? (
                  <PlayerDetailPanel player={selectedPlayer} />
              ) : currentView === 'matchmaking' || currentView === 'overview' ? (
                  // --- DYNAMIC MATCHMAKING PANEL (DECISION COCKPIT) ---
                  <div className="h-full bg-zinc-950 flex flex-col relative z-30 shadow-2xl border-l border-zinc-800">
                    {!selectedMatchSlot ? (
                        currentView === 'overview' ? (
                             <SystemMonitor />
                        ) : (
                        // STATE 1: AURA SUGGESTIONS (The Redesign Target)
                        <div className="flex-1 p-8 flex flex-col">
                            {/* HEADER */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2.5 mb-2 text-emerald-400">
                                    <Icon name="sparkles" className="w-4 h-4" />
                                    <h3 className="text-xs font-bold uppercase tracking-widest">Aura Intelligence</h3>
                                </div>
                                <p className="text-lg text-white font-medium leading-snug">
                                    High-confidence matches, ready to be created.
                                </p>
                            </div>

                            {/* CARDS CONTAINER */}
                            <div className="space-y-4">
                                {auraOpportunities.map((slot, index) => {
                                    const isTopPriority = index === 0;
                                    // Micro-reasons
                                    const reason = index === 0 
                                        ? "Perfect skill match · High trust" 
                                        : "Peak hour · Reliable players active";

                                    return (
                                        <div 
                                            key={slot.id}
                                            onClick={() => setSelectedMatchSlot(slot)}
                                            className={`
                                                relative p-5 rounded-2xl cursor-pointer transition-all duration-300 group
                                                ${isTopPriority 
                                                    ? 'bg-zinc-900 border border-emerald-500/30 shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] hover:border-emerald-500/50' 
                                                    : 'bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                                                }
                                            `}
                                        >
                                            {/* Priority Label for Top Card */}
                                            {isTopPriority && (
                                                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded text-emerald-400 text-[10px] font-bold uppercase tracking-wide border border-emerald-500/20">
                                                    <Icon name="sparkles" className="w-3 h-3 fill-current" />
                                                    Recommended
                                                </div>
                                            )}

                                            <div className="flex items-start gap-5">
                                                {/* Percentage */}
                                                <div className="flex flex-col items-center justify-center pt-1">
                                                    <span className={`text-3xl font-bold tracking-tight ${isTopPriority ? 'text-emerald-400' : 'text-emerald-500/80'}`}>
                                                        {slot.confidence}%
                                                    </span>
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1">
                                                    <h3 className={`text-base font-bold mb-1 ${isTopPriority ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                                                        {slot.court}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono mb-2">
                                                        {slot.time}
                                                    </div>
                                                    
                                                    {/* Reason - The "Why" */}
                                                    <p className={`text-xs ${isTopPriority ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                                        {reason}
                                                    </p>
                                                </div>

                                                {/* Action Arrow (Subtle) */}
                                                <div className={`mt-2 ${isTopPriority ? 'text-emerald-500' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                                                    <Icon name="arrow-right" className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Footer / Filler */}
                            <div className="mt-auto pt-8 flex items-center justify-center opacity-30">
                                 <Icon name="brain" className="w-12 h-12 text-zinc-800" />
                            </div>
                        </div>
                        )
                    ) : (
                      // STATE 2: AGENT INTERFACE
                      <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                        
                        {/* 1. PRIMARY CONTEXT */}
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
                           <div className="flex justify-between items-start mb-4">
                              <h2 className="text-2xl font-semibold text-white tracking-tight leading-none">{selectedMatchSlot.court}</h2>
                              <button 
                                onClick={() => setSelectedMatchSlot(null)}
                                className="text-zinc-500 hover:text-white transition-colors p-1"
                              >
                                <Icon name="x" className="w-5 h-5" />
                              </button>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="text-3xl font-light text-zinc-200">{selectedMatchSlot.time}</div>
                              <div className="h-8 w-px bg-zinc-800"></div>
                              <div className="flex flex-col justify-center">
                                 <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-0.5">Agent State</span>
                                 <span className={`text-sm font-medium flex items-center gap-2 ${agentStatus === 'confirmed' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${agentStatus === 'idle' ? 'bg-zinc-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                                    {agentStatus === 'idle' ? 'Ready to Engage' : agentStatus === 'confirmed' ? 'Match Closed' : 'Closing Match...'}
                                 </span>
                              </div>
                           </div>
                        </div>

                        {/* 2. AGENT WORKSPACE */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                           
                           {/* ROSTER SECTION */}
                           <div className="p-6 pb-0">
                               {agentStatus === 'idle' ? (
                                   <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 flex flex-col items-center justify-center text-center">
                                       <Icon name="users" className="w-8 h-8 text-zinc-600 mb-3" />
                                       <p className="text-sm text-zinc-400">Roster is empty.</p>
                                       <p className="text-xs text-zinc-600 mt-1">Activate agent to select candidates.</p>
                                   </div>
                               ) : (
                                   <div className="space-y-2">
                                       {roster.map((player) => (
                                           <div key={player.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/50">
                                               <div className="flex items-center gap-3">
                                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${player.isBackup ? 'bg-amber-600' : 'bg-indigo-600'}`}>
                                                       {player.img}
                                                   </div>
                                                   <div>
                                                       <div className="text-sm text-white font-medium">{player.name}</div>
                                                       <div className="flex items-center gap-1.5">
                                                           <span className="text-[10px] text-zinc-500">{player.level} • {player.hand}</span>
                                                           {player.isBackup && <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1 rounded uppercase">Backup</span>}
                                                       </div>
                                                   </div>
                                               </div>
                                               <div className={`flex items-center gap-1.5 text-xs font-bold ${getStatusColor(player.inviteStatus)}`}>
                                                   {player.inviteStatus === 'sending' || player.inviteStatus === 'invited' ? (
                                                       <span className="animate-pulse">{player.inviteStatus === 'sending' ? 'Sending...' : 'Invited'}</span>
                                                   ) : (
                                                       <span className="capitalize">{player.inviteStatus}</span>
                                                   )}
                                                   <Icon name={getStatusIcon(player.inviteStatus)} className="w-3.5 h-3.5" />
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </div>

                           {/* LIVE LOG SECTION */}
                           <div className="flex-1 p-6 flex flex-col justify-end min-h-[200px]">
                               <div className="border-t border-zinc-800 pt-4">
                                   <div className="flex items-center gap-2 mb-3">
                                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                       <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Live Agent Feed</span>
                                   </div>
                                   <div className="space-y-2 font-mono text-[10px] text-zinc-400 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                                       {logs.length === 0 && (
                                           <span className="text-zinc-700 italic">System ready. Waiting for initialization...</span>
                                       )}
                                       {logs.map((log) => (
                                           <div key={log.id} className="flex gap-2 animate-in slide-in-from-left-1">
                                               <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                                               <span className={`${
                                                   log.type === 'whatsapp' ? 'text-emerald-400/80' : 
                                                   log.type === 'error' ? 'text-rose-400' :
                                                   log.type === 'success' ? 'text-white font-bold' :
                                                   'text-zinc-300'
                                               }`}>
                                                   {log.type === 'whatsapp' && <span className="text-emerald-500 mr-1">WA:</span>}
                                                   {log.text}
                                               </span>
                                           </div>
                                       ))}
                                       <div ref={logsEndRef}></div>
                                   </div>
                               </div>
                           </div>
                           
                        </div>
                        
                        {/* 3. CONTROL ACTION */}
                        <div className="p-6 border-t border-zinc-800 bg-zinc-950">
                           {agentStatus === 'idle' ? (
                               <button 
                                    onClick={startAutonomousFlow}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                               >
                                  <Icon name="sparkles" className="w-4 h-4" />
                                  Start Matchmaking Agent
                               </button>
                           ) : agentStatus === 'confirmed' ? (
                               <button 
                                    onClick={() => setSelectedMatchSlot(null)}
                                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                               >
                                  <Icon name="check" className="w-4 h-4" />
                                  Close Panel
                               </button>
                           ) : (
                               <button 
                                    disabled
                                    className="w-full py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                               >
                                  <Icon name="refresh" className="w-4 h-4 animate-spin" />
                                  Agent Working...
                               </button>
                           )}
                           
                           <p className="text-center text-[10px] text-zinc-500 mt-3">
                              {agentStatus === 'idle' ? "Agent will select candidates and handle fallback logic automatically." : 
                               agentStatus === 'confirmed' ? "Match secured. Monitoring for last-minute changes." :
                               "Do not close window while agent is negotiating."}
                           </p>
                        </div>
                      </div>
                    )}
                  </div>
              ) : (
                  <div className="h-full bg-zinc-950 border-l border-zinc-800 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                    <Icon name="activity" className="w-8 h-8 mb-4 opacity-50" />
                    <p className="text-sm">Context panel ready.</p>
                  </div>
              )}
            </aside>
        </div>

      </div>
    </div>
  );
}