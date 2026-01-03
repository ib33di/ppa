import React, { useState } from 'react';
import { Icon } from './Icons';

interface ScheduledViewProps {
  onBack: () => void;
}

const HOURS = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
const COURTS = ['Central Court', 'Court 2', 'Court 3', 'Court 4'];

// Mock Data for the Calendar to show "Life" without "Logic"
const CALENDAR_EVENTS = [
    { court: 'Central Court', start: '17:00', end: '18:30', type: 'match', label: 'League Match' },
    { court: 'Central Court', start: '20:00', end: '21:30', type: 'tournament', label: 'Club Championship QF' },
    { court: 'Court 2', start: '17:00', end: '18:00', type: 'training', label: 'Junior Academy' },
    { court: 'Court 2', start: '18:30', end: '20:00', type: 'match', label: 'Private Booking' },
    { court: 'Court 3', start: '21:30', end: '23:00', type: 'match', label: 'Social Mixin' },
    { court: 'Court 4', start: '17:00', end: '18:30', type: 'training', label: 'Adult Beginners' },
    { court: 'Court 4', start: '20:00', end: '21:30', type: 'match', label: 'Private Booking' },
];

export const ScheduledView: React.FC<ScheduledViewProps> = ({ onBack }) => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  const getEventStyle = (type: string) => {
      switch (type) {
          case 'match': return 'bg-zinc-800 border-zinc-700 text-zinc-300';
          case 'tournament': return 'bg-indigo-900/40 border-indigo-500/30 text-indigo-300';
          case 'training': return 'bg-blue-900/30 border-blue-500/20 text-blue-300';
          default: return 'bg-zinc-800 border-zinc-700 text-zinc-400';
      }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950/50 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* 1. CALENDAR HEADER */}
      <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          
          <div className="flex items-center gap-6">
              <button 
                onClick={onBack}
                className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wide"
              >
                  <Icon name="arrow-right" className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Back to Operations
              </button>
              
              <div className="h-6 w-px bg-zinc-800"></div>

              <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      Scheduled <span className="text-zinc-600 font-light">·</span> Wed Dec 31
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Focused on: <span className="text-zinc-300 font-medium">Court 2 · 18:30</span>
                  </div>
              </div>
          </div>

          <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              {['day', 'week', 'month'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={`
                        px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all
                        ${viewMode === mode 
                            ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' 
                            : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                        }
                    `}
                  >
                      {mode}
                  </button>
              ))}
          </div>
      </div>

      {/* 2. CALENDAR BODY (DAY VIEW) */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-[#09090b]">
          
          {/* Header Row */}
          <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr] border-b border-zinc-900">
              <div className="p-4 border-r border-zinc-900 bg-zinc-950/50"></div>
              {COURTS.map(court => (
                  <div key={court} className="py-3 px-2 text-center border-r border-zinc-900 last:border-0">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{court}</span>
                  </div>
              ))}
          </div>

          {/* Time Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {/* Grid Lines Background */}
              <div className="absolute inset-0 pointer-events-none z-0">
                 {HOURS.map((_, i) => (
                    <div key={i} className="h-24 border-b border-zinc-900/50 w-full" style={{ top: `${i * 96}px` }}></div>
                 ))}
              </div>

              {HOURS.map((time, index) => (
                  <div key={time} className="grid grid-cols-[60px_1fr_1fr_1fr_1fr] min-h-[96px] relative z-10">
                      {/* Time Column */}
                      <div className="border-r border-zinc-900 py-2 pr-3 text-right bg-zinc-950/30">
                          <span className="text-xs font-mono text-zinc-600 sticky top-2">{time}</span>
                      </div>
                      
                      {/* Court Columns */}
                      {COURTS.map((court) => {
                          const event = CALENDAR_EVENTS.find(e => e.court === court && e.start === time);
                          return (
                              <div key={`${time}-${court}`} className="border-r border-zinc-900/40 p-1 relative group hover:bg-zinc-900/20 transition-colors">
                                  {event && (
                                      <div className={`
                                          absolute inset-x-1 top-1 bottom-1 rounded-lg border p-3 flex flex-col justify-center
                                          ${getEventStyle(event.type)}
                                      `}>
                                          <div className="flex items-center gap-1.5 mb-1">
                                              <div className={`w-1.5 h-1.5 rounded-full ${
                                                  event.type === 'tournament' ? 'bg-indigo-400' : 
                                                  event.type === 'training' ? 'bg-blue-400' : 'bg-zinc-500'
                                              }`}></div>
                                              <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{event.type}</span>
                                          </div>
                                          <div className="text-xs font-medium truncate">{event.label}</div>
                                          <div className="text-[10px] font-mono opacity-60 mt-1">{event.start} - {event.end}</div>
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              ))}
              
              {/* Current Time Indicator Line */}
              <div className="absolute left-[60px] right-0 top-[260px] h-px bg-emerald-500 z-20 pointer-events-none flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 -ml-0.5"></div>
                  <div className="ml-2 text-[9px] font-bold text-emerald-500 bg-zinc-950 px-1 rounded">18:42</div>
              </div>

          </div>
      </div>
    </div>
  );
};