import React from 'react';
import { Icon } from './Icons';
import { Match } from '../types';

interface OperatorFocusPanelProps {
  matches: Match[];
  onCourtSelect?: (courtId: string, time: string) => void;
}

export const OperatorFocusPanel: React.FC<OperatorFocusPanelProps> = ({ matches, onCourtSelect }) => {
  // Get needs attention items
  const needsAttention = matches
    .filter(m => {
      const time = new Date(m.scheduled_time);
      const now = new Date();
      const diffMinutes = (time.getTime() - now.getTime()) / (1000 * 60);
      
      // No-show risk: match soon and not enough confirmations
      if (diffMinutes < 30 && diffMinutes > 0 && m.confirmed_count < (m.target_count || 4)) {
        return true;
      }
      
      // Payment pending: confirmed but no payment
      const confirmedInvitations = (m.invitations || []).filter(inv => inv.status === 'confirmed');
      if (confirmedInvitations.length > 0 && m.status !== 'Locked') {
        return true;
      }
      
      return false;
    })
    .slice(0, 5);

  // Get active matchmaking
  const activeMatchmaking = matches
    .filter(m => m.status === 'Inviting' || m.status === 'Waiting' || m.status === 'Escalating')
    .slice(0, 5);

  // Format time for display
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Calculate time remaining
  const getTimeRemaining = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs < 0) return null;
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) return `${hours}:${mins.toString().padStart(2, '0')}`;
    return `00:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Operator Focus</h2>
      </div>

      {/* Needs Attention */}
      <div className="p-4 border-b border-zinc-800">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Needs Attention</h3>
        <div className="space-y-2">
          {needsAttention.length === 0 ? (
            <div className="text-xs text-zinc-600 py-2">All clear</div>
          ) : (
            needsAttention.map(match => {
              const courtName = match.court?.name || 'Court';
              const timeStr = formatTime(match.scheduled_time);
              const timeRemaining = getTimeRemaining(match.scheduled_time);
              const isNoShowRisk = timeRemaining && parseInt(timeRemaining.split(':')[1]) < 30 && match.confirmed_count < (match.target_count || 4);
              
              return (
                <div
                  key={match.id}
                  onClick={() => onCourtSelect?.(match.court_id, timeStr)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  {isNoShowRisk ? (
                    <>
                      <Icon name="alert-triangle" className="w-4 h-4 text-rose-500" />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-zinc-300">No-Show Risk</div>
                        <div className="text-[10px] text-zinc-500">{courtName} • {timeStr}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Icon name="clock" className="w-4 h-4 text-amber-500" />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-zinc-300">Payment Pending</div>
                        <div className="text-[10px] text-zinc-500">{courtName} • {timeStr}</div>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Matchmaking */}
      <div className="p-4 border-b border-zinc-800">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Active Matchmaking</h3>
        <div className="space-y-2">
          {activeMatchmaking.length === 0 ? (
            <div className="text-xs text-zinc-600 py-2">No active matchmaking</div>
          ) : (
            activeMatchmaking.map(match => {
              const courtName = match.court?.name || 'Court';
              const timeStr = formatTime(match.scheduled_time);
              const invitations = match.invitations || [];
              const confirmedCount = invitations.filter(inv => inv.status === 'confirmed').length;
              const pendingCount = invitations.filter(inv => inv.status === 'pending' || inv.status === 'invited').length;
              const timeRemaining = getTimeRemaining(match.scheduled_time);
              
              return (
                <div
                  key={match.id}
                  onClick={() => onCourtSelect?.(match.court_id, timeStr)}
                  className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-medium text-zinc-300">{courtName} • {timeStr}</div>
                    {timeRemaining && (
                      <div className="text-[10px] text-zinc-500 font-mono">{timeRemaining}</div>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {match.status === 'Inviting' && `Inviting ${pendingCount} player(s)`}
                    {match.status === 'Waiting' && `Waiting for reply (${confirmedCount}/${match.target_count || 4})`}
                    {match.status === 'Escalating' && `Inviting backup (${confirmedCount}/${match.target_count || 4})`}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Aura Suggestions */}
      <div className="p-4 border-b border-zinc-800">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Aura Suggestions</h3>
        <div className="space-y-2">
          <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-medium text-zinc-300">Central • 21:30</div>
              <div className="text-[10px] text-emerald-400 font-bold">98%</div>
            </div>
            <div className="text-[10px] text-zinc-500">Perfect Match</div>
          </div>
          <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-medium text-zinc-300">Court 3 • 21:30</div>
              <div className="text-[10px] text-emerald-400 font-bold">92%</div>
            </div>
            <div className="text-[10px] text-zinc-500">Fill Gap</div>
          </div>
        </div>
      </div>

      {/* System Learning */}
      <div className="p-4 flex-1">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">System Learning</h3>
        <div className="space-y-1.5 font-mono text-[10px] text-zinc-600">
          <div>2m ago Court 3 match completed</div>
          <div>5m ago Player reliability updated (Chris P)</div>
          <div>12m ago Feedback processed for Match #129</div>
        </div>
      </div>
    </div>
  );
};

