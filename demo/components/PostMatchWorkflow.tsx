import React, { useState } from 'react';
import { Icon } from './Icons';

export const PostMatchWorkflow = () => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  return (
    <div className="h-full w-full p-8 max-w-[1200px] mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
       
       <div className="mb-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Live Operations</h2>
          <p className="text-zinc-400 text-sm mt-1">Real-time match management and intelligence gathering.</p>
       </div>

       {/* Section 1: Action Items */}
       <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 overflow-hidden shadow-lg shadow-black/20">
          {/* Verification Alert */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                <span className="text-zinc-200 font-medium">1 need verification</span>
             </div>
             <button className="px-5 py-1.5 bg-white text-black text-xs font-bold rounded hover:bg-zinc-200 transition-colors">
                Verify
             </button>
          </div>
          
          {/* Risk Alert */}
          <div className="flex items-center justify-between p-4 hover:bg-zinc-800/20 transition-colors">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                <span className="text-zinc-200 font-medium">1 risky players</span>
             </div>
             <button className="px-5 py-1.5 bg-zinc-800 text-zinc-300 text-xs font-bold rounded hover:bg-zinc-700 hover:text-white transition-colors">
                Review
             </button>
          </div>
       </div>

       {/* Section 2: Post-Match Learning */}
       <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg shadow-black/20 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="flex items-center justify-between mb-8 relative z-10">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                   <Icon name="sparkles" className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Post-Match Learning</h3>
             </div>
             <button 
                onClick={() => setShowFeedbackModal(true)}
                className="px-4 py-2 border border-zinc-700 text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
             >
                Simulate Player Feedback
             </button>
          </div>

          <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-5 flex items-center justify-between relative z-10 hover:border-zinc-700 transition-colors cursor-pointer group">
             <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 group-hover:text-zinc-300 transition-colors">
                   <Icon name="swords" className="w-6 h-6" />
                </div>
                <div>
                   <div className="text-white font-bold text-base mb-1">Court 3 • 2v2 Match</div>
                   <div className="text-zinc-500 text-xs font-medium">Finished 10 mins ago</div>
                </div>
             </div>
             <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-500/20">
                Complete
             </span>
          </div>
       </div>

       {/* FEEDBACK MODAL */}
       {showFeedbackModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-[420px] p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
               <button 
                  onClick={() => setShowFeedbackModal(false)}
                  className="absolute top-6 right-6 text-zinc-600 hover:text-white transition-colors"
               >
                  <Icon name="x" className="w-6 h-6" />
               </button>

               <div className="flex items-center gap-2 mb-8">
                  <Icon name="sparkles" className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500 text-[10px] font-bold tracking-[0.2em] uppercase">Post-Match Feedback</span>
               </div>

               <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-white mb-3">Teammate Rating</h2>
                  <p className="text-zinc-400 text-base leading-relaxed">
                     Would you play with <span className="text-white font-bold">Maria Rodriguez</span> again?
                  </p>
               </div>

               <div className="grid grid-cols-3 gap-4 mb-8">
                  <button 
                     onClick={() => setShowFeedbackModal(false)}
                     className="flex flex-col items-center gap-3 p-4 bg-zinc-800/30 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-zinc-600 transition-all group active:scale-95"
                  >
                     <Icon name="frown" className="w-8 h-8 text-zinc-600 group-hover:text-rose-500 transition-colors" />
                     <span className="text-xs font-bold text-zinc-500 group-hover:text-rose-400">No</span>
                  </button>
                  <button 
                     onClick={() => setShowFeedbackModal(false)}
                     className="flex flex-col items-center gap-3 p-4 bg-zinc-800/30 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-zinc-600 transition-all group active:scale-95"
                  >
                     <Icon name="meh" className="w-8 h-8 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                     <span className="text-xs font-bold text-zinc-500 group-hover:text-amber-400">Maybe</span>
                  </button>
                  <button 
                     onClick={() => setShowFeedbackModal(false)}
                     className="flex flex-col items-center gap-3 p-4 bg-zinc-800/30 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-zinc-600 transition-all group active:scale-95"
                  >
                     <Icon name="smile" className="w-8 h-8 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                     <span className="text-xs font-bold text-zinc-500 group-hover:text-emerald-400">Yes!</span>
                  </button>
               </div>

               <div className="text-center">
                  <button 
                     onClick={() => setShowFeedbackModal(false)}
                     className="text-zinc-600 text-xs font-bold hover:text-zinc-300 transition-colors uppercase tracking-wide"
                  >
                     Skip for now
                  </button>
               </div>
            </div>
         </div>
       )}

    </div>
  );
};