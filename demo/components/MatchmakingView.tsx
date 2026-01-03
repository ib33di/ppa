import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { SlotData } from '../types';

const TIMES = ['17:00', '18:30', '20:00', '21:30'];
const COURTS = ['Central Court', 'Court 2', 'Court 3', 'Court 4'];

// --- LIVE MATCH CONTROL TYPES ---

type MatchState = 'Draft' | 'Inviting' | 'Waiting' | 'Escalating' | 'Confirmed' | 'Locked' | 'Failed';

interface LiveMatch {
  id: string;
  court: string;
  time: string;
  state: MatchState;
  confirmedCount: number; // e.g. 3/4
  targetCount: number; // 4
  waitingOn?: string; // Player Name
  timeLeft?: string; // "04:12"
  agentAction?: string; // "Sending WhatsApp to Sarah..."
  players: { name: string; status: 'confirmed' | 'pending' | 'declined' | 'backup'; role?: string }[];
}

// --- MOCK ACTIVE MATCHES (8 ACTIVE AS REQUESTED) ---
const ACTIVE_MATCHES: LiveMatch[] = [
  {
    id: 'm1',
    court: 'Central Court',
    time: '17:00',
    state: 'Locked',
    confirmedCount: 4,
    targetCount: 4,
    agentAction: 'Match locked. Access codes sent.',
    players: [
        { name: 'J. Doe', status: 'confirmed', role: 'Player' },
        { name: 'M. Smith', status: 'confirmed', role: 'Player' },
        { name: 'A. Johnson', status: 'confirmed', role: 'Player' },
        { name: 'B. Williams', status: 'confirmed', role: 'Player' },
    ]
  },
  {
    id: 'm2',
    court: 'Court 2',
    time: '18:30',
    state: 'Waiting',
    confirmedCount: 3,
    targetCount: 4,
    waitingOn: 'Chris P.',
    timeLeft: '01:45',
    agentAction: 'Monitoring response window...',
    players: [
        { name: 'Elena F.', status: 'confirmed', role: 'Player' },
        { name: 'Marcus C.', status: 'confirmed', role: 'Player' },
        { name: 'Sofia R.', status: 'confirmed', role: 'Player' },
        { name: 'Chris P.', status: 'pending', role: 'Player' },
    ]
  },
  {
    id: 'm3',
    court: 'Court 3',
    time: '18:30',
    state: 'Inviting',
    confirmedCount: 1,
    targetCount: 4,
    waitingOn: 'Multiple',
    timeLeft: '08:00',
    agentAction: 'Broadcasting invites to "Level 4.5" pool...',
    players: [
        { name: 'Tom H.', status: 'confirmed', role: 'Host' },
        { name: 'Pending', status: 'pending', role: 'Player' },
        { name: 'Pending', status: 'pending', role: 'Player' },
        { name: 'Pending', status: 'pending', role: 'Player' },
    ]
  },
  {
    id: 'm4',
    court: 'Court 4',
    time: '20:00',
    state: 'Escalating',
    confirmedCount: 3,
    targetCount: 4,
    waitingOn: 'Sarah J. (Backup)',
    timeLeft: '04:59',
    agentAction: 'Lucas declined. Inviting Sarah J...',
    players: [
        { name: 'David K.', status: 'confirmed', role: 'Player' },
        { name: 'Maria L.', status: 'confirmed', role: 'Player' },
        { name: 'Alex M.', status: 'confirmed', role: 'Player' },
        { name: 'Lucas S.', status: 'declined', role: 'Original' },
        { name: 'Sarah J.', status: 'backup', role: 'Backup' }, 
    ]
  },
  {
    id: 'm5',
    court: 'Central Court',
    time: '20:00',
    state: 'Waiting',
    confirmedCount: 3,
    targetCount: 4,
    waitingOn: 'Javier M.',
    timeLeft: '02:15',
    agentAction: 'Waiting for confirmation...',
    players: [
        { name: 'Carlos R.', status: 'confirmed', role: 'Player' },
        { name: 'Luis G.', status: 'confirmed', role: 'Player' },
        { name: 'Ana P.', status: 'confirmed', role: 'Player' },
        { name: 'Javier M.', status: 'pending', role: 'Player' },
    ]
  },
  {
    id: 'm6',
    court: 'Court 2',
    time: '21:30',
    state: 'Confirmed',
    confirmedCount: 4,
    targetCount: 4,
    agentAction: 'Finalizing roster details...',
    players: [
        { name: 'Sam W.', status: 'confirmed', role: 'Player' },
        { name: 'Jenny K.', status: 'confirmed', role: 'Player' },
        { name: 'Mike R.', status: 'confirmed', role: 'Player' },
        { name: 'Lisa T.', status: 'confirmed', role: 'Player' },
    ]
  },
  {
    id: 'm7',
    court: 'Court 3',
    time: '21:30',
    state: 'Inviting',
    confirmedCount: 2,
    targetCount: 4,
    waitingOn: 'Group B',
    timeLeft: '12:30',
    agentAction: 'Sent reminders to regular group.',
    players: [
        { name: 'Paul B.', status: 'confirmed', role: 'Player' },
        { name: 'James F.', status: 'confirmed', role: 'Player' },
        { name: 'Pending', status: 'pending', role: 'Player' },
        { name: 'Pending', status: 'pending', role: 'Player' },
    ]
  },
  {
    id: 'm8',
    court: 'Court 4',
    time: '21:30',
    state: 'Failed',
    confirmedCount: 2,
    targetCount: 4,
    agentAction: 'Manual intervention required. 2 Slots open.',
    players: [
        { name: 'Rob S.', status: 'confirmed', role: 'Player' },
        { name: 'Tim D.', status: 'confirmed', role: 'Player' },
        { name: 'Nobody', status: 'declined', role: 'Player' },
        { name: 'Nobody', status: 'declined', role: 'Player' },
    ]
  },
];

// --- LIVE MATCH CONTROL COMPONENT ---

const LiveMatchRow: React.FC<{ match: LiveMatch; isExpanded: boolean; onToggle: () => void }> = ({ match, isExpanded, onToggle }) => {
    
    // State Color Logic
    const getStateStyles = (state: MatchState) => {
        switch (state) {
            case 'Waiting': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'Escalating': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'Confirmed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'Locked': return 'bg-zinc-800 text-zinc-400 border-zinc-700';
            case 'Failed': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'Inviting': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
        }
    };

    const getStatusIcon = (state: MatchState) => {
        switch (state) {
            case 'Waiting': return 'clock';
            case 'Escalating': return 'zap';
            case 'Confirmed': return 'check';
            case 'Locked': return 'lock';
            case 'Failed': return 'alert';
            case 'Inviting': return 'users';
            default: return 'activity';
        }
    };

    // Helper for player status colors in expanded view
    const getPlayerStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse';
            case 'declined': return 'text-rose-400 bg-rose-500/10 border-rose-500/20 line-through opacity-50';
            case 'backup': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
        }
    };

    return (
        <div 
            className={`
                rounded-xl transition-all duration-300 border overflow-hidden
                ${isExpanded 
                    ? 'bg-zinc-900 border-zinc-700 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' 
                    : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700 cursor-pointer'
                }
            `}
        >
            {/* --- HEADER (ALWAYS VISIBLE) --- */}
            <div onClick={onToggle} className="flex items-center justify-between p-3.5 h-[60px]">
                
                {/* Left: Identity */}
                <div className="flex items-center gap-4 w-[280px]">
                    <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center border transition-colors
                        ${getStateStyles(match.state).replace('bg-', 'bg-opacity-20 ')}
                    `}>
                        <Icon name={getStatusIcon(match.state)} className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-zinc-200">{match.court}</span>
                             <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono">{match.time}</span>
                        </div>
                        {match.state === 'Escalating' && (
                             <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5 animate-pulse">Escalating</div>
                        )}
                        {match.state === 'Waiting' && (
                             <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">Response Pending</div>
                        )}
                         {match.state === 'Failed' && (
                             <div className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mt-0.5">Intervention Needed</div>
                        )}
                    </div>
                </div>

                {/* Center: Context (Collapsed Only) */}
                {!isExpanded && (
                     <div className="flex-1 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="h-px w-8 bg-zinc-800"></div>
                        <div className="text-xs text-zinc-400 font-medium truncate max-w-[300px]">
                            {match.state === 'Waiting' ? `Waiting for ${match.waitingOn}` : match.agentAction}
                        </div>
                        {match.timeLeft && (
                            <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                                {match.timeLeft}
                            </span>
                        )}
                     </div>
                )}

                {/* Right: Metrics & Controls */}
                <div className="flex items-center gap-5 justify-end w-[200px]">
                     {/* WhatsApp Indicator */}
                     <div className="flex items-center gap-1.5" title="WhatsApp Agent Active">
                         <div className={`w-1.5 h-1.5 rounded-full ${match.state === 'Failed' ? 'bg-rose-500' : 'bg-emerald-500'} shadow-[0_0_6px_rgba(16,185,129,0.8)]`}></div>
                         <Icon name="message-circle" className="w-3.5 h-3.5 text-zinc-600" />
                     </div>
                     
                     {/* Count Pill */}
                     <div className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400">
                        <span className={match.confirmedCount >= 3 ? 'text-white font-bold' : ''}>{match.confirmedCount}</span>
                        <span className="text-zinc-600">/</span>
                        <span>{match.targetCount}</span>
                     </div>

                     {/* Chevron */}
                     <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <Icon name="chevron-down" className="w-4 h-4 text-zinc-600" />
                     </div>
                </div>
            </div>

            {/* --- BODY (EXPANDED ONLY) --- */}
            {isExpanded && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="h-px w-full bg-zinc-800 mb-4"></div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 1. Players Section */}
                        <div className="space-y-2">
                             <div className="flex justify-between items-center mb-1">
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Roster Status</h4>
                                <span className="text-[10px] text-zinc-600">Auto-lock on 4/4</span>
                             </div>
                             {match.players.map((p, i) => (
                                 <div key={i} className="flex items-center justify-between p-2 rounded bg-zinc-950/50 border border-zinc-800/50">
                                     <div className="flex items-center gap-3">
                                         <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-400">
                                             {p.name.charAt(0)}
                                         </div>
                                         <span className={`text-xs font-medium ${p.status === 'declined' ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                                             {p.name}
                                         </span>
                                     </div>
                                     <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPlayerStatusColor(p.status)}`}>
                                         {p.status}
                                     </div>
                                 </div>
                             ))}
                        </div>

                        {/* 2. Agent Feed / Radar */}
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Icon name="radio" className="w-3 h-3 text-emerald-500 animate-pulse" />
                                    Agent Feed
                                </h4>
                                {match.timeLeft && (
                                     <span className="text-[10px] font-mono text-zinc-500">Timeout in: <span className="text-zinc-300">{match.timeLeft}</span></span>
                                )}
                            </div>
                            <div className="flex-1 bg-black/40 rounded-lg border border-zinc-800 p-3 font-mono text-[10px] text-zinc-400 space-y-1.5 overflow-hidden min-h-[100px]">
                                <div className="flex gap-2">
                                    <span className="text-zinc-600">[18:29]</span>
                                    <span>Monitoring active negotiation...</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-zinc-600">[18:30]</span>
                                    <span className="text-emerald-500/80">WA: Sent invite to {match.waitingOn || "Candidates"}</span>
                                </div>
                                {match.state === 'Escalating' && (
                                    <div className="flex gap-2 animate-pulse">
                                        <span className="text-zinc-600">[18:31]</span>
                                        <span className="text-indigo-400">Escalation Triggered: Backup activated.</span>
                                    </div>
                                )}
                                {match.state === 'Locked' && (
                                    <div className="flex gap-2">
                                        <span className="text-zinc-600">[17:05]</span>
                                        <span className="text-zinc-300 font-bold">MATCH SECURED.</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Action Footer */}
                            <div className="mt-3 flex gap-2">
                                <button className="flex-1 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-bold transition-colors">
                                    Monitor
                                </button>
                                <button className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-colors">
                                    <Icon name="settings" className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const LiveMatchControl = () => {
    // Accordion State: Supports multiple expanded items
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleMatch = (id: string) => {
        const next = new Set(expandedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedIds(next);
    };

    const toggleAll = () => {
        if (expandedIds.size > 0) {
            setExpandedIds(new Set());
        } else {
            setExpandedIds(new Set(ACTIVE_MATCHES.map(m => m.id)));
        }
    };

    return (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
            {/* Header - Clickable to toggle all */}
            <div 
                onClick={toggleAll}
                className="flex items-center gap-2.5 mb-3 px-1 cursor-pointer group select-none"
            >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">
                    Live Match Control • {ACTIVE_MATCHES.length} Active
                </h3>
                <span className="text-[9px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                   {expandedIds.size > 0 ? '(Collapse All)' : '(Expand All)'}
                </span>
            </div>
            
            <div className="flex flex-col gap-2">
                {ACTIVE_MATCHES.map(match => (
                    <LiveMatchRow 
                        key={match.id} 
                        match={match} 
                        isExpanded={expandedIds.has(match.id)}
                        onToggle={() => toggleMatch(match.id)}
                    />
                ))}
            </div>
        </div>
    );
};


// --- SUB-COMPONENTS FOR GRID ---

interface CellProps {
  data: SlotData;
  onClick: () => void;
  isSelected: boolean;
}

const Cell: React.FC<CellProps> = ({ data, onClick, isSelected }) => {
  // BASE STYLE
  const baseClasses = "h-full w-full rounded transition-all duration-200 flex flex-col items-center justify-center cursor-pointer border relative overflow-hidden";
  
  // STATES
  if (data.status === 'booked') {
    return (
      <div className={`${baseClasses} bg-zinc-950 border-zinc-900 opacity-60 cursor-not-allowed`}>
        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{data.label}</span>
      </div>
    );
  }

  if (data.status === 'aura-opportunity') {
    return (
      <div 
        onClick={onClick}
        className={`
           ${baseClasses} 
           ${isSelected ? 'bg-zinc-900 border-white ring-1 ring-white' : 'bg-emerald-950/10 border-emerald-900/30 hover:border-emerald-500/50 hover:bg-emerald-950/20'}
        `}
      >
        <div className="flex items-center gap-1.5 z-10">
           <Icon name="brain" className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
           <span className={`text-xs font-bold font-mono ${isSelected ? 'text-white' : 'text-emerald-400'}`}>{data.confidence}%</span>
        </div>
      </div>
    );
  }

  if (data.status === 'partial') {
     return (
        <div 
          onClick={onClick} 
          className={`
            ${baseClasses} 
            ${isSelected ? 'bg-zinc-800 border-white ring-1 ring-white' : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-600'}
          `}
        >
            <div className="flex -space-x-1 mb-1.5">
               {[...Array(data.players)].map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-zinc-600 border border-zinc-900"></div>
               ))}
               {[...Array(4 - (data.players || 0))].map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full border border-zinc-700 bg-zinc-900"></div>
               ))}
            </div>
            <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wide">Filling</span>
        </div>
     );
  }

  // Open Status
  return (
    <div 
        onClick={onClick}
        className={`
           ${baseClasses} 
           ${isSelected ? 'bg-zinc-800 border-white ring-1 ring-white' : 'bg-transparent border-zinc-800/40 hover:bg-zinc-900 hover:border-zinc-700'}
        `}
    >
        <span className={`${isSelected ? 'text-white' : 'text-zinc-800 group-hover:text-zinc-600'}`}>
            <Icon name="plus" className="w-3 h-3" />
        </span>
    </div>
  );
};

// --- MAIN COMPONENT ---

interface MatchmakingViewProps {
  gridData: SlotData[];
  selectedSlot: SlotData | null;
  onSelectSlot: (slot: SlotData) => void;
  onOpenCalendar: () => void;
}

export const MatchmakingView: React.FC<MatchmakingViewProps> = ({ gridData, selectedSlot, onSelectSlot, onOpenCalendar }) => {
  
  // AURA QUICK FILL BAR LOGIC
  const highConfidenceSlots = gridData.filter(s => s.status === 'aura-opportunity' && (s.confidence || 0) > 90);

  return (
    <div className="h-full flex flex-col pt-2 select-none">
       
       {/* 1. HEADER: CONTROLS & AURA */}
       <div className="flex justify-between items-end mb-6 px-1">
          <div className="flex-1">
              <h2 className="text-xl font-medium text-white tracking-tight mb-2">Operations</h2>
              
              {highConfidenceSlots.length > 0 && (
                 <div className="flex items-center gap-3 animate-fade-in">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
                       <Icon name="brain" className="w-3 h-3 text-emerald-600" />
                       Aura suggests:
                    </span>
                    <div className="flex gap-2">
                       {highConfidenceSlots.map(slot => (
                          <button
                             key={slot.id}
                             onClick={() => onSelectSlot(slot)}
                             className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded hover:border-emerald-500/50 hover:bg-zinc-800 transition-all text-xs group"
                          >
                             <span className="text-zinc-300 font-medium group-hover:text-white">{slot.court}</span>
                             <span className="text-zinc-600 text-[10px]">•</span>
                             <span className="text-zinc-400 font-mono">{slot.time}</span>
                             <span className="text-zinc-600 text-[10px]">•</span>
                             <span className="text-emerald-400 font-bold">{slot.confidence}%</span>
                          </button>
                       ))}
                    </div>
                 </div>
              )}
          </div>
          
          {/* HEADER DATE & CALENDAR TOGGLE */}
          <div className="flex items-center gap-6 bg-zinc-900/50 rounded-lg p-1.5 border border-zinc-800/50 backdrop-blur-md">
                <div className="pl-3 flex flex-col justify-center text-right">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                        Today <span className="text-zinc-700 mx-1">·</span> Wed Dec 31
                    </span>
                    <span className="text-[10px] text-emerald-500 font-mono">
                        8 slots available
                    </span>
                </div>
                <button 
                    onClick={onOpenCalendar}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-bold uppercase tracking-wide rounded border border-zinc-700 transition-all flex items-center gap-2 group"
                >
                    <Icon name="calendar" className="w-3 h-3 group-hover:text-white transition-colors" />
                    Open Calendar
                </button>
           </div>
       </div>

       {/* 2. LIVE MATCH CONTROL (ACCORDION) */}
       <LiveMatchControl />

       {/* 3. THE GRID - The Decision Surface */}
       <div className="flex-1 flex flex-col overflow-hidden px-1 pb-4">
          
          {/* Header Row (Courts) */}
          <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr] gap-3 mb-2">
              <div className="text-right pr-3 pt-1">
                 {/* Empty corner */}
              </div>
              {COURTS.map(court => (
                 <div key={court} className="text-center pb-2 border-b border-zinc-900">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{court}</span>
                 </div>
              ))}
          </div>

          {/* Rows (Times) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
             {TIMES.map(time => (
                <div key={time} className="grid grid-cols-[50px_1fr_1fr_1fr_1fr] gap-3 h-28">
                   {/* Time Axis */}
                   <div className="text-right pr-3 pt-3 border-r border-zinc-900">
                      <span className="text-xs font-mono font-medium text-zinc-500">{time}</span>
                   </div>

                   {/* Cells */}
                   {COURTS.map(court => {
                      const slot = gridData.find(s => s.time === time && s.court === court) || { 
                          id: `${time}-${court}`, time, court, status: 'open' 
                      };
                      return (
                         <Cell 
                           key={slot.id} 
                           data={slot} 
                           onClick={() => onSelectSlot(slot)} 
                           isSelected={selectedSlot?.id === slot.id}
                         />
                      );
                   })}
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};