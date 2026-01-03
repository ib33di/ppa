import React from 'react';
import { Player } from '../types';
import { Icon } from './Icons';

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onClick: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, isSelected, onClick }) => {
  // Visual mappings based on screenshot
  const isTrusted = player.trustScore >= 90;
  
  // Energy Tag Colors
  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case 'Intense': return 'border-rose-500/30 text-rose-400 bg-rose-500/10';
      case 'Calm': return 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10';
      default: return 'border-zinc-700 text-zinc-400 bg-zinc-800/50';
    }
  };

  // Feedback Text Color
  const getFeedbackColor = (signal: string) => {
    if (signal === 'Mostly Yes') return 'text-emerald-400';
    if (signal === 'Mixed') return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative group p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[180px]
        ${isSelected 
          ? 'bg-zinc-900 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50' 
          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
        }
      `}
    >
      {/* Top Row: Avatar, Info, Status Icon */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors
            ${isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'}
          `}>
            {player.avatarInitials}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">
              {player.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
               <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-400 border border-zinc-700">{player.level}</span>
               <span className="text-[10px] font-bold text-zinc-500 uppercase">{player.position}</span>
            </div>
          </div>
        </div>
        
        {/* Status Icon (Shield or User) */}
        <div className={`
            w-7 h-7 rounded-lg flex items-center justify-center border
            ${isTrusted 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                : 'bg-zinc-800 border-zinc-700 text-zinc-500'
            }
        `}>
           {isTrusted ? <Icon name="shield" className="w-3.5 h-3.5" /> : <Icon name="user" className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Middle Row: Tags */}
      <div className="flex items-center gap-2 mb-6">
         <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getEnergyColor(player.energy)}`}>
            {player.energy}
         </span>
         
         {player.availability.includes('Active') && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-emerald-900/30 bg-emerald-900/10">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"></div>
               <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Active</span>
            </div>
         )}
         
         {player.reliabilityStatus === 'Risk' && (
            <div className="flex items-center justify-center w-6 h-6 rounded border border-rose-900/30 bg-rose-900/10">
               <Icon name="alert" className="w-3 h-3 text-rose-500" />
            </div>
         )}
      </div>

      {/* Bottom Row: Metrics */}
      <div className="mt-auto">
         <div className="flex justify-between items-end mb-1.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Repeat Rate</span>
            <div className="text-right">
               <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">Feedback</span>
               <span className={`text-[10px] font-bold ${getFeedbackColor(player.feedbackSignal)}`}>
                  {player.feedbackSignal}
               </span>
            </div>
         </div>
         
         {/* Progress Bar */}
         <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
               className="h-full bg-indigo-500 rounded-full" 
               style={{ width: `${player.repeatRate}%` }}
            ></div>
         </div>
      </div>
    </div>
  );
};