import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RevenueData } from '../types';
import { Icon } from './Icons';

const data: RevenueData[] = [
  { time: '17:00', manual: 80, ppa: 40, recoverable: 40 },
  { time: '18:00', manual: 60, ppa: 80, recoverable: 20 },
  { time: '19:00', manual: 40, ppa: 120, recoverable: 0 },
  { time: '20:00', manual: 30, ppa: 130, recoverable: 0 },
  { time: '21:00', manual: 40, ppa: 60, recoverable: 60 },
  { time: '22:00', manual: 20, ppa: 40, recoverable: 80 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 p-3 rounded shadow-xl">
        <p className="text-zinc-200 font-bold text-sm mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-xs text-indigo-400">PPA: €{payload[1].value}</p>
          <p className="text-xs text-zinc-400">Manual: €{payload[0].value}</p>
          <p className="text-xs text-rose-400">Recoverable: €{payload[2].value}</p>
        </div>
      </div>
    );
  }
  return null;
};

export const RevenueChart: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Revenue Quality</h3>
          <p className="text-sm text-zinc-400">Are we filling courts intelligently?</p>
        </div>
        <div className="flex gap-4">
            <div className="text-right">
                <p className="text-lg font-bold text-indigo-400">€470</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">PPA Revenue</p>
            </div>
            <div className="text-right">
                <p className="text-lg font-bold text-rose-400">€200</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Recoverable</p>
            </div>
        </div>
      </div>

      <div className="flex-1 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={32}>
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 12 }} 
              dy={10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#27272a', opacity: 0.4}} />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} 
            />
            <Bar dataKey="manual" name="Manual" stackId="a" fill="#3f3f46" radius={[0, 0, 4, 4]} />
            <Bar dataKey="ppa" name="PPA Driven" stackId="a" fill="#6366f1" />
            <Bar dataKey="recoverable" name="Recoverable" stackId="a" fill="#ef4444" fillOpacity={0.2} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

       <div className="mt-4 flex items-center gap-3 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
          <div className="p-1.5 bg-indigo-500/10 rounded">
             <Icon name="zap" className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
             <p className="text-xs text-indigo-200">
                <span className="font-bold">Insight:</span> PPA generates 30% more revenue per slot than manual booking.
             </p>
          </div>
       </div>
    </div>
  );
};