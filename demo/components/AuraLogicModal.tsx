import React, { useEffect, useState, useRef } from 'react';
import { Icon } from './Icons';

interface Log {
  id: number;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'process' | 'code';
  message: string;
  detail?: string;
}

const MOCK_LOGS: Omit<Log, 'id' | 'timestamp'>[] = [
  { type: 'info', message: 'Initializing Aura Core v2.4.1...' },
  { type: 'process', message: 'Connecting to Padel Manager API stream', detail: 'wss://api.ppa.io/stream/v1' },
  { type: 'success', message: 'Connection established. Latency: 14ms' },
  { type: 'info', message: 'Loading predictive models: [Retention, Utilization, MatchQuality]' },
  { type: 'process', message: 'Analyzing current grid state...', detail: 'Grid snapshot: 12 slots, 8 filled' },
  { type: 'code', message: 'const utilizationGap = calculateGap(grid.current, target.optimal);', detail: '// Result: 22% under-capacity for Tuesday' },
  { type: 'warning', message: 'Anomaly detected: Tuesday 18:30 Utilization drop' },
  { type: 'process', message: 'Running scenario simulations (n=50)...' },
  { type: 'code', message: 'if (player.reliability < 0.4) applyRiskFactor(1.5);', detail: '// Applied to: Chris Peterson' },
  { type: 'success', message: 'Identified 3 high-impact interventions' },
  { type: 'process', message: 'Optimizing match suggestions...' },
  { type: 'info', message: 'Candidate found: Alex Mercer (Trust: 98)' },
  { type: 'success', message: 'Aura Suggestion Generated: Confidence 94%' },
  { type: 'info', message: 'Waiting for operator action...' }
];

export const AuraLogicModal = ({ onClose }: { onClose: () => void }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentIndex = 0;
    
    // Clear logs on mount
    setLogs([]);

    const interval = setInterval(() => {
      if (currentIndex >= MOCK_LOGS.length) {
        clearInterval(interval);
        return;
      }

      const logData = MOCK_LOGS[currentIndex];
      const now = new Date();
      // Match the timestamp format [HH:MM:SS.ms] from screenshot
      const timeStr = now.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const ms = Math.floor(Math.random() * 999).toString().padStart(3, '0');
      
      const newLog: Log = {
        id: Date.now() + currentIndex,
        timestamp: `${timeStr}.${ms}`,
        ...logData
      };

      setLogs(prev => [...prev, newLog]);
      currentIndex++;
      
      // Auto scroll
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }

    }, 200); // Speed of logs

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-3xl bg-[#0d1117] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col h-[600px] animate-in zoom-in-95 duration-200 ring-1 ring-white/10" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header - macOS Style */}
        <div className="flex justify-between items-center px-4 py-3 bg-[#0d1117] border-b border-zinc-800/50">
           <div className="flex items-center gap-4">
              <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div> {/* Red */}
                 <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div> {/* Yellow */}
                 <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]"></div> {/* Green */}
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                  <Icon name="folder" className="w-3.5 h-3.5 opacity-50" />
                  <span className="text-xs font-mono font-bold opacity-80">aura_core_logs — -bash</span>
              </div>
           </div>
           <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <Icon name="x" className="w-4 h-4" />
           </button>
        </div>

        {/* Terminal Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 font-mono text-[13px] leading-relaxed custom-scrollbar bg-[#0d1117] text-zinc-300">
           {logs.map((log) => (
             <div key={log.id} className="mb-2 animate-in slide-in-from-left-1 duration-200">
                <div className="flex gap-3">
                    <span className="w-[110px] text-zinc-600 shrink-0 select-none font-medium">[{log.timestamp}]</span>
                    <div className="break-words">
                       {/* Type Indicator */}
                       {log.type === 'process' && (
                          <span className="text-blue-500 font-bold mr-2">→ PROCESS:</span>
                       )}
                       {log.type === 'success' && (
                          <span className="text-emerald-500 font-bold mr-2">✔ SUCCESS:</span>
                       )}
                       {log.type === 'warning' && (
                          <span className="text-amber-500 font-bold mr-2">⚠ WARNING:</span>
                       )}
                       {log.type === 'info' && (
                          <span className="text-zinc-100 font-bold mr-2">ℹ INFO:</span>
                       )}
                       {log.type === 'code' && (
                          <span className="text-pink-500 font-bold mr-2">λ EXEC:</span>
                       )}
                       
                       {/* Message */}
                       <span className="text-zinc-300 font-medium">
                         {log.message}
                       </span>
                    </div>
                </div>
                
                {/* Detail Line with Pipe */}
                {log.detail && (
                  <div className="flex gap-3 mt-0.5">
                     <span className="w-[110px] shrink-0"></span> {/* Spacer to align with text */}
                     <div className="flex gap-3 pl-0.5">
                        <div className="w-px bg-zinc-700 mx-1"></div> {/* The Pipe */}
                        <span className="text-zinc-500 italic font-medium">{log.detail}</span>
                     </div>
                  </div>
                )}
             </div>
           ))}
           {/* Blinking Cursor */}
           <div className="h-4 w-2.5 bg-zinc-500 animate-pulse mt-1 ml-[122px]"></div>
        </div>

        {/* Status Footer */}
        <div className="px-4 py-2 bg-[#0d1117] border-t border-zinc-800 flex justify-between items-center text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              System Online
           </div>
           <div>
              CPU: 12% • MEM: 402MB
           </div>
        </div>
      </div>
    </div>
  );
};