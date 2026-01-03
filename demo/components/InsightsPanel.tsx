import React from 'react';
import { InsightAction } from '../types';
import { Icon } from './Icons';

const insights: InsightAction[] = [
  {
    id: '1',
    title: 'Fill Rate Alert',
    description: 'Tuesday 18:30 is 22% under capacity.',
    impact: '+€320 Revenue',
    actionLabel: 'Create Social Match',
    priority: 'high',
    category: 'utilization'
  },
  {
    id: '2',
    title: 'High Cancel Risk',
    description: '3 players in tomorrow\'s league often no-show.',
    impact: 'Avoid Dead Court',
    actionLabel: 'Overbook Slot',
    priority: 'medium',
    category: 'revenue'
  },
  {
    id: '3',
    title: 'Match Imbalance',
    description: 'Court 3 (20:00) has a skill gap > 1.5 levels.',
    impact: 'Player Retention',
    actionLabel: 'Suggest Swap',
    priority: 'high',
    category: 'quality'
  }
];

export const InsightsPanel: React.FC = () => {
  return (
    <div className="h-full bg-zinc-900 border-l border-zinc-800 flex flex-col w-full lg:w-96 sticky top-0 h-screen overflow-hidden">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-blue-500/10 p-1.5 rounded-lg">
             <Icon name="zap" className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Action Center</h2>
        </div>
        <p className="text-sm text-zinc-400">3 critical interventions required today.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className="group relative bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                insight.priority === 'high' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {insight.priority}
              </span>
              <span className="text-xs font-medium text-emerald-400">{insight.impact}</span>
            </div>
            
            <h4 className="text-sm font-semibold text-white mb-1">{insight.title}</h4>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{insight.description}</p>
            
            <button className="w-full flex items-center justify-center gap-2 bg-white text-black py-2 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors">
              {insight.actionLabel}
              <Icon name="arrow-right" className="w-3 h-3" />
            </button>
          </div>
        ))}

        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-800 text-center">
            <Icon name="trophy" className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">All other systems nominal.</p>
        </div>
      </div>
    </div>
  );
};