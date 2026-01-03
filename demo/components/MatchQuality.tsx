import React from 'react';
import { Icon } from './Icons';

export const MatchQuality: React.FC = () => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>

      <div className="flex justify-between items-center mb-6 relative z-10">
         <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Icon name="trophy" className="w-5 h-5 text-indigo-400" />
            Match Quality
         </h3>
         <span className="px-2 py-1 bg-indigo-500/10 text-indigo-300 text-xs rounded border border-indigo-500/20">
            Aura Enabled
         </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
           <div className="text-2xl font-bold text-white mb-1">4.8</div>
           <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Balance Score</div>
        </div>
        <div className="text-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
           <div className="text-2xl font-bold text-white mb-1">92%</div>
           <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Repeat Play</div>
        </div>
        <div className="text-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
           <div className="text-2xl font-bold text-white mb-1">12m</div>
           <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Avg. Close Time</div>
        </div>
      </div>

      <div className="space-y-4">
         <div className="flex items-center gap-3">
             <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden flex">
                <div className="bg-indigo-500 h-full w-[65%]"></div>
                <div className="bg-zinc-600 h-full w-[35%]"></div>
             </div>
         </div>
         <div className="flex justify-between text-xs">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-zinc-300">PPA Matchmaking (65%)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                <span className="text-zinc-300">Manual Booking (35%)</span>
            </div>
         </div>
         
         <p className="text-xs text-zinc-500 mt-4 border-t border-zinc-800 pt-3">
            Matches created via PPA are rated <span className="text-white font-bold">18% higher</span> than manual bookings.
         </p>
      </div>
    </div>
  );
};