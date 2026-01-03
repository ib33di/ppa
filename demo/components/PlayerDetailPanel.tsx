import React from 'react';
import { Player } from '../types';
import { Icon } from './Icons';

interface PlayerDetailPanelProps {
  player: Player | null;
}

export const PlayerDetailPanel: React.FC<PlayerDetailPanelProps> = ({ player }) => {
  if (!player) {
    return (
      <div className="h-full bg-zinc-950 border-l border-zinc-900 flex flex-col items-center justify-center p-12 text-center text-zinc-600">
         <div className="w-16 h-16 bg-zinc-900/50 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/5 shadow-2xl">
            <Icon name="search" className="w-6 h-6 opacity-40" />
         </div>
         <p className="text-sm font-medium text-zinc-500">Select a player to access briefing.</p>
      </div>
    );
  }

  // Formatting for screenshot accuracy
  const showUpRate = Math.round((player.attendanceHistory.filter(x => x === 'attended').length / 10) * 100);
  
  return (
    <div className="h-full bg-[#09090b] border-l border-zinc-800 flex flex-col w-full lg:w-[400px] sticky top-0 h-screen overflow-hidden font-sans">
      
      {/* 1. HEADER SECTION (PHOTO + IDENTITY) */}
      <div className="px-8 pt-8 pb-6 bg-[#09090b]">
         {/* Breadcrumb */}
         <div className="flex items-center gap-2 mb-6 animate-in slide-in-from-left-2 duration-300">
             <Icon name="zap" className="w-3.5 h-3.5 text-indigo-500 fill-current" />
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Aura Coach</span>
         </div>
         
         {/* Photo + Name Area */}
         <div className="flex flex-col gap-6">
             {/* THE REQUESTED PHOTO - Large, beautiful avatar */}
             <div className="relative w-24 h-24 group">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl group-hover:bg-indigo-500/30 transition-all duration-500"></div>
                <div className="relative w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-300 border border-zinc-700 shadow-2xl overflow-hidden">
                    {/* Fallback to initials since mock data has no images, but styled like a pro placeholder */}
                    <span className="z-10">{player.avatarInitials}</span>
                    <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800 to-zinc-700 opacity-50"></div>
                </div>
                {/* Trust Indicator on Avatar */}
                {player.trustScore >= 90 && (
                   <div className="absolute -bottom-1 -right-1 bg-black p-1 rounded-full">
                      <div className="bg-emerald-500 rounded-full p-1 border border-black">
                         <Icon name="check" className="w-3 h-3 text-black stroke-[3px]" />
                      </div>
                   </div>
                )}
             </div>

             {/* Name & Badge Row */}
             <div className="flex justify-between items-start animate-in slide-in-from-bottom-2 duration-300 delay-75">
                 <div>
                     <h2 className="text-3xl font-bold text-white tracking-tight leading-tight mb-2">{player.name}</h2>
                     <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                        <span className="px-2 py-0.5 bg-zinc-800/80 rounded text-zinc-300 text-xs font-bold border border-zinc-700/50">{player.level}</span>
                        <span>{player.matchCount} Matches tracked</span>
                     </div>
                 </div>
                 
                 {player.trustScore >= 90 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                       <Icon name="shield" className="w-3.5 h-3.5 text-emerald-500" />
                       <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Trusted</span>
                    </div>
                 )}
             </div>
         </div>
      </div>

      {/* 2. SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 space-y-8">
         
         {/* QUOTE BOX */}
         <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 relative group transition-colors hover:bg-zinc-900/60">
             <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 rounded-l-2xl"></div>
             <div className="text-sm text-zinc-200 italic leading-relaxed font-medium">
                 "{player.coachSummary}"
             </div>
         </div>

         {/* COMMITMENT VIZ */}
         <div>
            <div className="flex justify-between items-end mb-3">
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Commitment</span>
               <span className="text-[10px] text-zinc-500">Last 10 matches</span>
            </div>
            <div className="flex gap-1.5 h-1.5">
               {player.attendanceHistory.map((status, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-full transition-all duration-300 ${
                        status === 'attended' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 
                        status === 'late' ? 'bg-amber-500' : 'bg-zinc-800'
                    }`}
                  ></div>
               ))}
            </div>
         </div>

         {/* STATS GRID */}
         <div className="grid grid-cols-2 gap-4">
             <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all">
                 <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Show-up Rate</div>
                 <div className={`text-3xl font-light tracking-tight ${showUpRate > 85 ? 'text-emerald-400' : 'text-zinc-200'}`}>
                    {showUpRate}%
                 </div>
             </div>
             <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all">
                 <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Reliability</div>
                 <div className="text-xl font-medium text-white">
                    {player.reliabilityStatus}
                 </div>
             </div>
         </div>

         {/* HUMAN IMPACT */}
         <div>
             <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Human Impact</div>
             
             {/* Repeat Rate Bar */}
             <div className="bg-zinc-900/30 rounded-xl p-5 border border-zinc-800">
                 <div className="flex justify-between text-xs mb-3">
                    <span className="text-zinc-400 font-medium">Repeat Rate</span>
                    <span className="text-white font-bold">{player.repeatRate}%</span>
                 </div>
                 <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                        className="h-full bg-zinc-400 rounded-full" 
                        style={{ width: `${player.repeatRate}%` }}
                    ></div>
                 </div>
                 <p className="text-[10px] text-zinc-600 mt-3 leading-snug">
                    Percentage of partners who play with {player.name.split(' ')[0]} more than once.
                 </p>
             </div>
         </div>

         {/* ACTIONS */}
         <div className="pt-2 space-y-3">
             <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Coaching Actions</div>
             <button className="w-full flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all group active:scale-[0.98]">
                 <span className="text-xs font-bold text-zinc-300 group-hover:text-white">Prioritize in Peak Hours</span>
                 <Icon name="arrow-right" className="w-4 h-4 text-zinc-600 group-hover:text-white transition-transform group-hover:translate-x-1" />
             </button>
             <button className="w-full flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all group active:scale-[0.98]">
                 <span className="text-xs font-bold text-zinc-300 group-hover:text-white">Suggest for Competitive League</span>
                 <Icon name="arrow-right" className="w-4 h-4 text-zinc-600 group-hover:text-white transition-transform group-hover:translate-x-1" />
             </button>
         </div>

      </div>
    </div>
  );
};