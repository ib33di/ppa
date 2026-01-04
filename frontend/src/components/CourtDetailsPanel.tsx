import React, { useEffect, useRef } from 'react';
import { Match, Invitation } from '../types';
import { Icon } from './Icons';

interface CourtDetailsPanelProps {
  match: Match | null;
  courtName: string;
  time: string;
  onClose: () => void;
}

export const CourtDetailsPanel: React.FC<CourtDetailsPanelProps> = ({ 
  match, 
  courtName, 
  time,
  onClose 
}) => {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [match?.invitations]);

  if (!match) {
    return (
      <div className="w-96 bg-zinc-950 border-l border-zinc-800 flex flex-col h-full">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">{courtName}</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-zinc-500">
            <Icon name="info" className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No match scheduled</p>
            <p className="text-xs mt-1">Select a slot to view details</p>
          </div>
        </div>
      </div>
    );
  }

  const invitations = match.invitations || [];
  const confirmedInvitations = invitations.filter(inv => inv.status === 'confirmed');
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending' || inv.status === 'invited');
  const declinedInvitations = invitations.filter(inv => inv.status === 'declined');

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getAgentFeedMessages = (): Array<{ time: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }> => {
    const messages: Array<{ time: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }> = [];
    
    // Sort invitations by creation time
    const sortedInvitations = [...invitations].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });

    sortedInvitations.forEach(invitation => {
      const player = invitation.player;
      if (!player) return;

      const sentTime = formatTime(invitation.sent_at);
      const respondedTime = formatTime(invitation.responded_at);

      // Sent invitation
      if (invitation.sent_at) {
        messages.push({
          time: sentTime,
          message: `WA: Sent invite to ${player.name}: "Hey ${player.name.split(' ')[0]}, spot opened up at ${time}."`,
          type: 'info'
        });
      }

      // Confirmed
      if (invitation.status === 'confirmed' && invitation.responded_at) {
        messages.push({
          time: respondedTime,
          message: `${player.name} confirmed via WhatsApp.`,
          type: 'success'
        });
      }

      // Declined
      if (invitation.status === 'declined' && invitation.responded_at) {
        messages.push({
          time: respondedTime,
          message: `${player.name} declined invite.`,
          type: 'warning'
        });
      }
    });

    // Backup promotion
    const backupInvitations = invitations.filter(inv => inv.is_backup && inv.status === 'invited');
    backupInvitations.forEach(invitation => {
      const player = invitation.player;
      if (player) {
        messages.push({
          time: formatTime(invitation.sent_at),
          message: `Promoted backup candidate: ${player.name}`,
          type: 'info'
        });
      }
    });

    // Match confirmed
    if (match.status === 'Locked' || match.status === 'Confirmed') {
      messages.push({
        time: formatTime(match.locked_at || match.updated_at),
        message: 'MATCH CONFIRMED. Roster locked.',
        type: 'success'
      });
      
      messages.push({
        time: formatTime(match.locked_at || match.updated_at),
        message: `Final notification sent to ${confirmedInvitations.length} players.`,
        type: 'info'
      });
    }

    return messages.sort((a, b) => {
      // Simple time comparison (assuming HH:MM format)
      return a.time.localeCompare(b.time);
    });
  };

  const agentFeedMessages = getAgentFeedMessages();

  return (
    <div className="w-96 bg-zinc-950 border-l border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">{courtName}</h2>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          <Icon name="x" className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Agent State */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {time} Agent State
            </span>
          </div>
          <div className="text-sm font-medium text-emerald-400">
            {match.status === 'Locked' || match.status === 'Confirmed' ? 'Match Closed' : 'Match Active'}
          </div>
        </div>

        {/* Player List */}
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
            {courtName} • {time}
          </h3>
          <div className="space-y-2">
            {invitations.length === 0 ? (
              <div className="text-xs text-zinc-600 py-2">No players invited</div>
            ) : (
              invitations.map((invitation, index) => {
                const player = invitation.player;
                if (!player) return null;

                const initials = player.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                const isConfirmed = invitation.status === 'confirmed';
                const isBackup = invitation.is_backup;

                return (
                  <div
                    key={invitation.id || index}
                    className={`flex items-center gap-3 p-2 rounded-lg border ${
                      isConfirmed
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : invitation.status === 'declined'
                        ? 'bg-zinc-900/50 border-zinc-800 opacity-50'
                        : 'bg-zinc-900/50 border-zinc-800'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isConfirmed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {initials}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-zinc-300">
                        {player.name}
                        {isBackup && (
                          <span className="ml-2 text-[10px] text-indigo-400">BACKUP</span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {player.level || 'N/A'} {player.position || ''}
                      </div>
                    </div>
                    {isConfirmed && (
                      <Icon name="check" className="w-4 h-4 text-emerald-400" />
                    )}
                    {invitation.status === 'declined' && (
                      <Icon name="x" className="w-4 h-4 text-zinc-600" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Agent Feed */}
        <div className="p-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Icon name="radio" className="w-3 h-3 text-emerald-500 animate-pulse" />
            Live Agent Feed
          </h3>
          <div
            ref={feedRef}
            className="bg-black/40 rounded-lg border border-zinc-800 p-3 font-mono text-[10px] text-zinc-400 space-y-1.5 overflow-y-auto max-h-64"
          >
            {agentFeedMessages.length === 0 ? (
              <div className="flex gap-2">
                <span className="text-zinc-600">[--:--]</span>
                <span>No activity yet</span>
              </div>
            ) : (
              agentFeedMessages.map((msg, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-zinc-600">[{msg.time}]</span>
                  <span className={
                    msg.type === 'success' ? 'text-emerald-500/80' :
                    msg.type === 'warning' ? 'text-amber-500/80' :
                    msg.type === 'error' ? 'text-rose-500/80' :
                    'text-zinc-300'
                  }>
                    {msg.message}
                  </span>
                </div>
              ))
            )}
          </div>
          
          {match.status === 'Locked' || match.status === 'Confirmed' ? (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-xs text-emerald-400 font-medium">
                Match secured. Monitoring for last-minute changes.
              </p>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="mt-4 w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-400 transition-colors"
            >
              Close Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

