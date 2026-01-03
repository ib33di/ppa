import React from 'react';
import { Icon } from './Icons';
import { SlotData } from '../types';

// --- MOCK DATA FOR FOCUS PANEL ---

const RISKS = [
  { id: 1, title: 'No-Show Risk', subtitle: 'Court 1 • 17:00', type: 'critical' },
  { id: 2, title: 'Payment Pending', subtitle: 'Court 3 • 18:30', type: 'warning' }
];

const ACTIVE_AGENTS = [
  { id: 'a1', court: 'Court 2', time: '18:30', players: '3/4', state: 'Waiting for reply', timer: '01:45', status: 'active' },
  { id: 'a2', court: 'Court 4', time: '20:00', players: '2/4', state: 'Inviting backup', timer: '04:59', status: 'warning' },
];

const SUGGESTIONS = [
  { id: 's1', court: 'Central', time: '21:30', confidence: 98, label: 'Perfect Match' },
  { id: 's2', court: 'Court 3', time: '21:30', confidence: 92, label: 'Fill Gap' },
];

const SYSTEM_FEED = [
  { id: 1, text: 'Court 3 match completed', time: '2m ago' },
  { id: 2, text: 'Player reliability updated (Chris P)', time: '5m ago' },
  { id: 3, text: 'Feedback processed for Match #129', time: '12m ago' },
];

// --- MOCK DATA FOR GRID ---
// Simplified grid data for visual clarity
const LIVE_GRID_ROWS = ['17:00', '18:30', '20:00', '21:30'];
const LIVE_GRID_COLS = ['Central Court', 'Court 2', 'Court 3', 'Court 4'];

interface LiveOperationsProps {
  gridData: SlotData[];
  selectedSlot: SlotData | null;
  onSelectSlot: (slot: SlotData) => void;
}

export const LiveOperations: React.FC<LiveOperationsProps> = ({ gridData, selectedSlot, onSelectSlot }) => {
  
  const getSlot = (time: string, court: string) => {
    return gridData.find(s => s.time === time && s.court === court) || { id: `${time}-${court}`, time, court, status: 'open' };
  };

  return (
    <div className="flex h-full w-full bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      
      {/* --- 1. LEFT COLUMN: OPERATOR FOCUS PANEL --- */}
      <div className="w-[340px] flex flex-col border-r border-zinc-800 bg-[#0c0c0e] h-full overflow-hidden">
         
         <div className="p-5 pb-2">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Operator Focus</h2>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar px-5 space-y-8 pb-10">
            
            {/* PRIORITY 1: NEEDS ATTENTION */}
            <section>
               <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                  <h3 className="text-sm font-bold text-white">Needs Attention</h3>
               </div>
               <div className="space-y-2">
                  {RISKS.map(item => (
                     <div key={item.id} className="group flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              <Icon name={item.type === 'critical' ? 'alert' : 'clock'} className="w-4 h-4" />
                           </div>
                           <div>
                              <div className="text-sm font-bold text-zinc-200 group-hover:text-white">{item.title}</div>
                              <div className="text-xs text-zinc-500 font-mono">{item.subtitle}</div>
                           </div>
                        </div>
                        <Icon name="arrow-right" className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
                     </div>
                  ))}
               </div>
            </section>

            {/* PRIORITY 2: ACTIVE AGENTS */}
            <section>
               <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  <h3 className="text-sm font-bold text-white">Active Matchmaking</h3>
               </div>
               <div className="space-y-2">
                  {ACTIVE_AGENTS.map(agent => (
                     <div key={agent.id} className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50 hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden group">
                        {/* Progress Bar Background */}
                        <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500/50 w-3/4"></div>
                        
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <div className="text-xs font-bold text-white mb-0.5">{agent.court}</div>
                              <div className="text-[10px] text-zinc-500 font-mono uppercase">{agent.time}</div>
                           </div>
                           <div className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300">
                              {agent.players}
                           </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                           <span className={`font-medium ${agent.status === 'warning' ? 'text-amber-500' : 'text-indigo-400'}`}>
                              {agent.state}
                           </span>
                           <span className="font-mono text-zinc-500 group-hover:text-zinc-300">{agent.timer}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            {/* PRIORITY 3: AURA SUGGESTIONS */}
            <section>
               <div className="flex items-center gap-2 mb-3">
                  <Icon name="sparkles" className="w-3 h-3 text-emerald-500" />
                  <h3 className="text-sm font-bold text-zinc-300">Aura Suggestions</h3>
               </div>
               <div className="space-y-2">
                  {SUGGESTIONS.map(sugg => (
                     <div key={sugg.id} className="flex items-center justify-between p-3 rounded-lg border border-dashed border-zinc-800 hover:bg-zinc-900/50 hover:border-emerald-500/30 transition-all cursor-pointer group">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-zinc-300">{sugg.court}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">• {sugg.time}</span>
                           </div>
                           <div className="text-[10px] font-bold text-emerald-500">{sugg.label}</div>
                        </div>
                        <div className="text-right">
                           <div className="text-lg font-bold text-white group-hover:text-emerald-400">{sugg.confidence}%</div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

         </div>

         {/* SYSTEM LEARNING FOOTER */}
         <div className="p-5 border-t border-zinc-800 bg-[#09090b]">
            <h4 className="text-[10px] font-bold text-zinc-600 uppercase mb-3">System Learning</h4>
            <div className="space-y-3 opacity-60">
               {SYSTEM_FEED.map(feed => (
                  <div key={feed.id} className="flex gap-3 text-[10px]">
                     <span className="text-zinc-500 font-mono shrink-0">{feed.time}</span>
                     <span className="text-zinc-400 truncate">{feed.text}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* --- 2. CENTER: LIVE GRID --- */}
      <div className="flex-1 flex flex-col bg-[#09090b] relative">
         {/* Grid Header */}
         <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-900">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
               <h1 className="text-base font-bold text-white tracking-tight">Live Court Status</h1>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
               <span className="text-zinc-300">18:42</span>
               <span>•</span>
               <span>SYSTEM ONLINE</span>
            </div>
         </div>

         {/* The Grid */}
         <div className="flex-1 p-8 overflow-hidden flex flex-col">
            
            {/* Column Headers */}
            <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr] gap-4 mb-4 pr-2">
               <div></div> {/* Time col spacer */}
               {LIVE_GRID_COLS.map(court => (
                  <div key={court} className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">
                     {court}
                  </div>
               ))}
            </div>

            {/* Rows */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
               {LIVE_GRID_ROWS.map(time => (
                  <div key={time} className="grid grid-cols-[60px_1fr_1fr_1fr_1fr] gap-4 h-32">
                     {/* Time Label */}
                     <div className="text-right pt-4">
                        <span className="text-xs font-mono font-medium text-zinc-600">{time}</span>
                     </div>

                     {/* Slots */}
                     {LIVE_GRID_COLS.map(court => {
                        const slot = getSlot(time, court);
                        const isSelected = selectedSlot?.id === slot.id;
                        
                        return (
                           <div 
                              key={`${time}-${court}`}
                              onClick={() => onSelectSlot(slot as SlotData)}
                              className={`
                                 relative rounded-xl border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center group overflow-hidden
                                 ${isSelected 
                                    ? 'bg-zinc-900 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg' 
                                    : 'bg-zinc-900/30 border-zinc-800/60 hover:bg-zinc-900 hover:border-zinc-700'
                                 }
                              `}
                           >
                              {/* STATUS: BOOKED */}
                              {slot.status === 'booked' && (
                                 <>
                                    <div className="w-full h-full bg-zinc-950/80 absolute inset-0 z-0"></div>
                                    <div className="z-10 text-center opacity-50 group-hover:opacity-80 transition-opacity">
                                       <Icon name="lock" className="w-5 h-5 text-zinc-600 mx-auto mb-2" />
                                       <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{slot.label || 'Occupied'}</span>
                                    </div>
                                 </>
                              )}

                              {/* STATUS: OPEN */}
                              {slot.status === 'open' && (
                                 <div className="opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100 duration-300">
                                    <Icon name="plus" className="w-6 h-6 text-zinc-600" />
                                 </div>
                              )}

                              {/* STATUS: PARTIAL / AGENT WORKING */}
                              {slot.status === 'partial' && (
                                 <div className="w-full h-full p-4 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                       <div className="flex items-center gap-1.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Filling</span>
                                       </div>
                                       <span className="text-[10px] font-mono text-zinc-500">{slot.players}/4</span>
                                    </div>
                                    <div className="flex -space-x-1.5 justify-center">
                                       {[...Array(slot.players)].map((_,i) => (
                                          <div key={i} className="w-6 h-6 rounded-full bg-zinc-700 border-2 border-[#09090b]"></div>
                                       ))}
                                       {[...Array(4-(slot.players||0))].map((_,i) => (
                                          <div key={i} className="w-6 h-6 rounded-full border-2 border-dashed border-zinc-700 bg-transparent"></div>
                                       ))}
                                    </div>
                                 </div>
                              )}

                              {/* STATUS: AURA OPPORTUNITY */}
                              {slot.status === 'aura-opportunity' && (
                                 <div className="w-full h-full relative overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-900/5 group-hover:bg-emerald-900/10 transition-colors"></div>
                                    <div className="absolute top-3 right-3">
                                       <span className="flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                       </span>
                                    </div>
                                    <div className="h-full flex flex-col items-center justify-center">
                                       <div className="text-2xl font-bold text-emerald-500 mb-1">{slot.confidence}%</div>
                                       <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">Confidence</span>
                                    </div>
                                 </div>
                              )}

                           </div>
                        );
                     })}
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
