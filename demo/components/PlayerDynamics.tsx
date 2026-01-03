import React from 'react';
import { Icon } from './Icons';

export const PlayerDynamics: React.FC = () => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full">
      <div className="flex justify-between items-center mb-6">
         <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Icon name="users" className="w-5 h-5 text-zinc-400" />
                Player Impact Index
            </h3>
            <p className="text-sm text-zinc-400">Who helps the system?</p>
         </div>
      </div>

      <div className="space-y-6">
        {/* Closers */}
        <div>
           <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                 <span className="text-sm font-medium text-white">The Closers</span>
              </div>
              <span className="text-xs text-emerald-400">High Reliability</span>
           </div>
           <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800/50 flex justify-between items-center group cursor-pointer hover:border-emerald-500/30 transition-all">
               <div>
                  <div className="text-2xl font-bold text-white">428</div>
                  <p className="text-[10px] text-zinc-500 uppercase mt-1">Players</p>
               </div>
               <div className="text-right">
                  <div className="text-sm text-zinc-300">Match Completion</div>
                  <div className="text-lg font-mono text-emerald-400">98%</div>
               </div>
           </div>
        </div>

        {/* Risk */}
        <div>
           <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                 <span className="text-sm font-medium text-white">Risk Factors</span>
              </div>
              <span className="text-xs text-rose-400">Frequent Cancellations</span>
           </div>
           <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800/50 flex justify-between items-center group cursor-pointer hover:border-rose-500/30 transition-all">
               <div>
                  <div className="text-2xl font-bold text-white">42</div>
                  <p className="text-[10px] text-zinc-500 uppercase mt-1">Players</p>
               </div>
               <div className="text-right">
                  <div className="text-sm text-zinc-300">Cancellation Rate</div>
                  <div className="text-lg font-mono text-rose-400">35%</div>
               </div>
           </div>
        </div>
      </div>

      <div className="mt-5 text-center">
         <button className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto">
            View full player list in Matchmaking
            <Icon name="arrow-right" className="w-3 h-3" />
         </button>
      </div>
    </div>
  );
};