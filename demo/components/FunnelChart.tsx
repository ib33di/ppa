import React from 'react';
import { Icon } from './Icons';
import { FunnelStage } from '../types';

const funnelData: FunnelStage[] = [
  { label: 'Slots Available', count: 120, percentage: 100, color: 'bg-zinc-700' },
  { label: 'Activated by PPA', count: 96, percentage: 80, dropOff: '-20%', color: 'bg-blue-600' },
  { label: 'Near-Ready (3/4)', count: 72, percentage: 60, dropOff: '-25%', color: 'bg-indigo-500' },
  { label: 'Matches Closed', count: 68, percentage: 56, dropOff: '-5%', color: 'bg-emerald-500' },
];

interface FunnelChartProps {
  onViewDropOffs?: () => void;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ onViewDropOffs }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Near-Ready Funnel</h3>
          <p className="text-sm text-zinc-400">Where does PPA lose momentum?</p>
        </div>
        <button 
          onClick={onViewDropOffs}
          className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded hover:bg-zinc-700 transition-colors hover:text-white border border-transparent hover:border-zinc-600"
        >
            View Drop-offs
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-4">
        {funnelData.map((stage, index) => (
          <div key={index} className="relative">
             {/* Connector Line */}
             {index < funnelData.length - 1 && (
                <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-zinc-800 -z-10 h-10"></div>
             )}
             
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${stage.color} flex items-center justify-center text-white font-bold shadow-lg`}>
                   {stage.percentage}%
                </div>
                
                <div className="flex-1">
                   <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-sm font-medium text-white">{stage.label}</h4>
                      <span className="text-xs text-zinc-500">{stage.count} slots</span>
                   </div>
                   <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${stage.color} opacity-80`} 
                        style={{ width: `${stage.percentage}%` }}
                      ></div>
                   </div>
                </div>

                {stage.dropOff && (
                    <div className="w-16 text-right">
                        <span className="text-xs font-medium text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                            {stage.dropOff}
                        </span>
                    </div>
                )}
             </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-400">
          <span className="text-amber-400 font-bold">Attention:</span> Biggest drop-off at "Near-Ready". 
          <button onClick={onViewDropOffs} className="ml-2 text-indigo-400 hover:text-indigo-300 underline">Auto-invite floaters &rarr;</button>
        </p>
      </div>
    </div>
  );
};