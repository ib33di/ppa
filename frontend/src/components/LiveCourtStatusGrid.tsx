import React from 'react';
import { Match, Court } from '../types';
import { Icon } from './Icons';

interface LiveCourtStatusGridProps {
  matches: Match[];
  courts: Court[];
  selectedSlot?: { courtId: string; time: string } | null;
  onSlotClick?: (courtId: string, time: string, match?: Match) => void;
}

export const LiveCourtStatusGrid: React.FC<LiveCourtStatusGridProps> = ({ 
  matches, 
  courts, 
  selectedSlot,
  onSlotClick 
}) => {
  const times = ['17:00', '18:30', '20:00', '21:30'];

  const getMatchForSlot = (courtId: string, time: string): Match | undefined => {
    return matches.find(m => {
      if (m.court_id !== courtId) return false;
      const matchTime = new Date(m.scheduled_time);
      const timeStr = matchTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      return timeStr === time;
    });
  };

  const getSlotStatus = (match: Match | undefined): {
    status: 'open' | 'booked' | 'filling' | 'training' | 'private' | 'confidence';
    label?: string;
    confidence?: number;
    players?: number;
  } => {
    if (!match) {
      return { status: 'open' };
    }

    if (match.status === 'Locked' || match.status === 'Confirmed') {
      return { status: 'booked' };
    }

    if (match.status === 'Inviting' || match.status === 'Waiting') {
      const confirmedCount = match.confirmed_count || 0;
      const targetCount = match.target_count || 4;
      
      if (confirmedCount === targetCount) {
        return { status: 'booked' };
      }
      
      return { 
        status: 'filling', 
        players: confirmedCount,
        label: `${confirmedCount}/${targetCount}`
      };
    }

    // Calculate confidence based on confirmed players
    const confirmedCount = match.confirmed_count || 0;
    const targetCount = match.target_count || 4;
    const confidence = Math.round((confirmedCount / targetCount) * 100);
    
    if (confidence >= 90) {
      return { status: 'confidence', confidence, label: `${confidence}% CONFIDENCE` };
    }

    return { status: 'filling', players: confirmedCount, label: `${confirmedCount}/${targetCount}` };
  };

  const getSlotStyles = (status: string, isSelected: boolean) => {
    const baseStyles = 'h-24 rounded-lg border cursor-pointer flex flex-col items-center justify-center transition-all relative';
    
    switch (status) {
      case 'booked':
        return `${baseStyles} bg-zinc-950 border-zinc-900 opacity-60 ${isSelected ? 'ring-2 ring-emerald-500' : ''}`;
      case 'filling':
        return `${baseStyles} bg-indigo-500/10 border-indigo-500/30 ${isSelected ? 'ring-2 ring-indigo-500' : ''}`;
      case 'confidence':
        return `${baseStyles} bg-emerald-500/10 border-emerald-500/30 ${isSelected ? 'ring-2 ring-emerald-500' : ''}`;
      case 'training':
        return `${baseStyles} bg-purple-500/10 border-purple-500/30 ${isSelected ? 'ring-2 ring-purple-500' : ''}`;
      case 'private':
        return `${baseStyles} bg-zinc-800 border-zinc-700 ${isSelected ? 'ring-2 ring-zinc-500' : ''}`;
      default:
        return `${baseStyles} bg-transparent border-zinc-800 hover:bg-zinc-900/50 ${isSelected ? 'ring-2 ring-zinc-500' : ''}`;
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 bg-black/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
            <h2 className="text-sm font-bold text-white">Live Court Status</h2>
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            {getCurrentTime()} • SYSTEM ONLINE
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-4 gap-4">
          {/* Court Headers */}
          {courts.map(court => (
            <div key={court.id} className="text-center">
              <div className="text-xs font-bold text-zinc-500 uppercase mb-2">
                {court.name}
              </div>
            </div>
          ))}

          {/* Time Slots */}
          {times.map(time => (
            <React.Fragment key={time}>
              <div className="text-xs font-mono text-zinc-500 flex items-center justify-center">
                {time}
              </div>
              {courts.map(court => {
                const match = getMatchForSlot(court.id, time);
                const slotStatus = getSlotStatus(match);
                const isSelected = selectedSlot?.courtId === court.id && selectedSlot?.time === time;
                
                return (
                  <div
                    key={`${court.id}-${time}`}
                    onClick={() => onSlotClick?.(court.id, time, match)}
                    className={getSlotStyles(slotStatus.status, isSelected)}
                  >
                    {slotStatus.status === 'open' && (
                      <Icon name="plus" className="w-4 h-4 text-zinc-600" />
                    )}
                    
                    {slotStatus.status === 'booked' && (
                      <>
                        <Icon name="lock" className="w-5 h-5 text-zinc-600 mb-1" />
                        {match && match.invitations && match.invitations.length > 0 && (
                          <div className="text-[10px] text-zinc-500 mt-1">
                            {match.invitations[0]?.player?.name?.split(' ').map((n: string) => n[0]).join('') || ''}
                            {match.invitations.length > 1 && ` +${match.invitations.length - 1}`}
                          </div>
                        )}
                      </>
                    )}
                    
                    {slotStatus.status === 'filling' && (
                      <>
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                          <span className="text-xs font-bold text-indigo-400">FILLING</span>
                        </div>
                        {slotStatus.label && (
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {slotStatus.label}
                          </div>
                        )}
                      </>
                    )}
                    
                    {slotStatus.status === 'confidence' && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mb-1"></div>
                        <div className="text-[10px] font-bold text-emerald-400">
                          {slotStatus.label}
                        </div>
                      </>
                    )}
                    
                    {slotStatus.status === 'training' && (
                      <div className="text-[10px] text-purple-400 font-bold">TRAINING</div>
                    )}
                    
                    {slotStatus.status === 'private' && (
                      <div className="text-[10px] text-zinc-400 font-bold">PRIVATE</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

