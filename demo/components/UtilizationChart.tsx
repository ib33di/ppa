import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { DailyUtilization } from '../types';

const data: DailyUtilization[] = [
  { day: 'Mon', current: 65, previous: 70, status: 'low' },
  { day: 'Tue', current: 58, previous: 75, status: 'low' },
  { day: 'Wed', current: 82, previous: 80, status: 'good' },
  { day: 'Thu', current: 85, previous: 82, status: 'good' },
  { day: 'Fri', current: 92, previous: 88, status: 'good' },
  { day: 'Sat', current: 98, previous: 95, status: 'good' },
  { day: 'Sun', current: 94, previous: 90, status: 'good' },
];

export const UtilizationChart: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Court Efficiency</h3>
          <p className="text-sm text-zinc-400">Where are we underperforming?</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
             <span className="text-zinc-400">This Week</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
             <span className="text-zinc-400">Last Week</span>
           </div>
        </div>
      </div>

      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 12 }} 
            />
            <Tooltip 
              cursor={{ fill: '#27272a' }}
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="previous" fill="#27272a" radius={[4, 4, 0, 0]} barSize={32} />
            <Bar dataKey="current" radius={[4, 4, 0, 0]} barSize={32} onClick={(data) => console.log('Drill down to', data)}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.current < 60 ? '#f59e0b' : '#6366f1'} 
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              ))}
            </Bar>
            <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Target', position: 'right', fill: '#10b981', fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg flex items-center justify-between">
        <div className="text-xs text-amber-200">
          <span className="font-bold">Insight:</span> Tuesday is lagging 17% behind last week.
        </div>
        <button className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1 rounded hover:bg-amber-500/20 font-medium transition-colors">
          Boost Tuesday
        </button>
      </div>
    </div>
  );
};