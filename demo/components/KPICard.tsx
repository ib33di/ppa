import React from 'react';
import { KPIMetric } from '../types';
import { Icon } from './Icons';

interface KPICardProps {
  metric: KPIMetric;
}

export const KPICard: React.FC<KPICardProps> = ({ metric }) => {
  const isPositive = metric.trend > 0;
  const isHealthy = metric.status === 'healthy';
  const isCritical = metric.status === 'critical';

  let statusColor = 'text-emerald-500';
  if (metric.status === 'attention') statusColor = 'text-amber-500';
  if (metric.status === 'critical') statusColor = 'text-rose-500';

  let bgClass = 'bg-zinc-900 border-zinc-800';
  if (isCritical) bgClass = 'bg-rose-950/10 border-rose-900/30';

  return (
    <div className={`p-5 rounded-xl border ${bgClass} transition-all hover:border-zinc-700 flex flex-col justify-between h-full`}>
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-zinc-400 text-sm font-medium">{metric.label}</span>
          <Icon name={metric.iconName} className={`w-4 h-4 ${statusColor}`} />
        </div>
        
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold text-white tracking-tight">{metric.value}</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            <Icon name={isPositive ? 'arrow-up' : 'arrow-down'} className="w-3 h-3 mr-1" />
            {Math.abs(metric.trend)}%
          </div>
          <span className="text-xs text-zinc-500">{metric.trendLabel}</span>
        </div>
      </div>

      {metric.context && (
        <div className="pt-3 border-t border-zinc-800/50">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400/80">
            {metric.context}
          </span>
        </div>
      )}
    </div>
  );
};