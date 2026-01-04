import React, { useState } from 'react';
import { Icon } from './Icons';
import { Match } from '../types';

interface LiveMatchesPanelProps {
  matches: Match[];
}

type MatchState = 'Draft' | 'Inviting' | 'Waiting' | 'Escalating' | 'Confirmed' | 'Locked' | 'Failed';

const LiveMatchRow: React.FC<{ match: Match; isExpanded: boolean; onToggle: () => void }> = ({ match, isExpanded, onToggle }) => {
  const getStateStyles = (state: string): string => {
    switch (state) {
      case 'Waiting': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Escalating': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Confirmed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Locked': return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      case 'Failed': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Inviting': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const getStatusIcon = (state: string): string => {
    switch (state) {
      case 'Waiting': return 'clock';
      case 'Escalating': return 'zap';
      case 'Confirmed': return 'check';
      case 'Locked': return 'lock';
      case 'Failed': return 'alert';
      case 'Inviting': return 'users';
      default: return 'activity';
    }
  };

  const getPlayerStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'invited': return 'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse';
      case 'pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse';
      case 'declined': return 'text-rose-400 bg-rose-500/10 border-rose-500/20 line-through opacity-50';
      case 'backup': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  const matchState = match.status as MatchState;
  const courtName = match.court?.name || 'Court';
  const scheduledTime = new Date(match.scheduled_time);
  const timeStr = scheduledTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  const invitations = match.invitations || [];
  const confirmedCount = invitations.filter(inv => inv.status === 'confirmed').length;
  const pendingCount = invitations.filter(inv => inv.status === 'pending' || inv.status === 'invited').length;
  const declinedCount = invitations.filter(inv => inv.status === 'declined').length;

  return (
    <div 
      className={`
        rounded-xl transition-all duration-300 border overflow-hidden
        ${isExpanded 
          ? 'bg-zinc-900 border-zinc-700 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' 
          : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700 cursor-pointer'
        }
      `}
    >
      {/* Header */}
      <div onClick={onToggle} className="flex items-center justify-between p-3.5 h-[60px]">
        {/* Left: Identity */}
        <div className="flex items-center gap-4 w-[280px]">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center border transition-colors
            ${getStateStyles(matchState)}
          `}>
            <Icon name={getStatusIcon(matchState)} className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-200">{courtName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono">{timeStr}</span>
            </div>
            {matchState === 'Escalating' && (
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5 animate-pulse">Escalating</div>
            )}
            {matchState === 'Waiting' && (
              <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">Response Pending</div>
            )}
            {matchState === 'Failed' && (
              <div className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mt-0.5">Intervention Needed</div>
            )}
          </div>
        </div>

        {/* Center: Context */}
        {!isExpanded && (
          <div className="flex-1 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-px w-8 bg-zinc-800"></div>
            <div className="text-xs text-zinc-400 font-medium truncate max-w-[300px]">
              {pendingCount > 0 ? `Waiting for ${pendingCount} response(s)` : matchState}
            </div>
          </div>
        )}

        {/* Right: Metrics */}
        <div className="flex items-center gap-5 justify-end w-[200px]">
          {/* WhatsApp Indicator */}
          <div className="flex items-center gap-1.5" title="WhatsApp Agent Active">
            <div className={`w-1.5 h-1.5 rounded-full ${matchState === 'Failed' ? 'bg-rose-500' : 'bg-emerald-500'} shadow-[0_0_6px_rgba(16,185,129,0.8)]`}></div>
            <Icon name="message-circle" className="w-3.5 h-3.5 text-zinc-600" />
          </div>
          
          {/* Count Pill */}
          <div className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400">
            <span className={confirmedCount >= 3 ? 'text-white font-bold' : ''}>{confirmedCount}</span>
            <span className="text-zinc-600">/</span>
            <span>{match.target_count || 4}</span>
          </div>

          {/* Chevron */}
          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <Icon name="chevron-down" className="w-4 h-4 text-zinc-600" />
          </div>
        </div>
      </div>

      {/* Body (Expanded) */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
          <div className="h-px w-full bg-zinc-800 mb-4"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Players Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Roster Status</h4>
                <span className="text-[10px] text-zinc-600">Auto-lock on {match.target_count || 4}/{match.target_count || 4}</span>
              </div>
              {invitations.length > 0 ? (
                invitations.map((invitation, i) => {
                  const player = invitation.player;
                  if (!player) return null;
                  
                  return (
                    <div key={invitation.id || i} className="flex items-center justify-between p-2 rounded bg-zinc-950/50 border border-zinc-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-400">
                          {player.name.charAt(0)}
                        </div>
                        <span className={`text-xs font-medium ${invitation.status === 'declined' ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                          {player.name}
                        </span>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPlayerStatusColor(invitation.status)}`}>
                        {invitation.status}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-zinc-500 p-2">No invitations yet</div>
              )}
            </div>

            {/* Agent Feed */}
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Icon name="radio" className="w-3 h-3 text-emerald-500 animate-pulse" />
                  Agent Feed
                </h4>
              </div>
              <div className="flex-1 bg-black/40 rounded-lg border border-zinc-800 p-3 font-mono text-[10px] text-zinc-400 space-y-1.5 overflow-hidden min-h-[100px]">
                {invitations.map((invitation) => {
                  const player = invitation.player;
                  if (!player) return null;
                  
                  if (invitation.status === 'confirmed') {
                    return (
                      <div key={invitation.id} className="flex gap-2">
                        <span className="text-zinc-600">[{timeStr}]</span>
                        <span className="text-emerald-500/80">WA: {player.name} confirmed via WhatsApp</span>
                      </div>
                    );
                  }
                  if (invitation.status === 'declined') {
                    return (
                      <div key={invitation.id} className="flex gap-2">
                        <span className="text-zinc-600">[{timeStr}]</span>
                        <span className="text-rose-500/80">WA: {player.name} declined invite</span>
                      </div>
                    );
                  }
                  if (invitation.status === 'invited') {
                    return (
                      <div key={invitation.id} className="flex gap-2">
                        <span className="text-zinc-600">[{timeStr}]</span>
                        <span className="text-emerald-500/80">WA: Sent invite to {player.name}</span>
                      </div>
                    );
                  }
                  return null;
                })}
                {invitations.length === 0 && (
                  <div className="flex gap-2">
                    <span className="text-zinc-600">[--:--]</span>
                    <span>No activity yet</span>
                  </div>
                )}
                {matchState === 'Locked' && (
                  <div className="flex gap-2">
                    <span className="text-zinc-600">[{timeStr}]</span>
                    <span className="text-zinc-300 font-bold">MATCH SECURED.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const LiveMatchesPanel: React.FC<LiveMatchesPanelProps> = ({ matches }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleMatch = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const toggleAll = () => {
    if (expandedIds.size > 0) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(matches.map(m => m.id)));
    }
  };

  const activeMatches = matches.filter(m => 
    m.status !== 'Completed' && m.status !== 'Draft'
  );

  if (activeMatches.length === 0) {
    return (
      <div className="mb-8">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">
          Live Match Control • 0 Active
        </h3>
        <div className="text-sm text-zinc-500 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
          No active matches
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
      {/* Header */}
      <div 
        onClick={toggleAll}
        className="flex items-center gap-2.5 mb-3 px-1 cursor-pointer group select-none"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">
          Live Match Control • {activeMatches.length} Active
        </h3>
        <span className="text-[9px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          {expandedIds.size > 0 ? '(Collapse All)' : '(Expand All)'}
        </span>
      </div>
      
      <div className="flex flex-col gap-2">
        {activeMatches.map(match => (
          <LiveMatchRow 
            key={match.id} 
            match={match} 
            isExpanded={expandedIds.has(match.id)}
            onToggle={() => toggleMatch(match.id)}
          />
        ))}
      </div>
    </div>
  );
};

