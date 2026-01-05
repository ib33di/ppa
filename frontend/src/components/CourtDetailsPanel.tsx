import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Match, Player } from '../types';
import { Icon } from './Icons';
import { api } from '../lib/api';

interface CourtDetailsPanelProps {
  match: Match | null;
  courtName: string;
  courtId: string;
  time: string;
  players: Player[];
  onClose: () => void;
}

export const CourtDetailsPanel: React.FC<CourtDetailsPanelProps> = ({ 
  match, 
  courtName, 
  courtId,
  time,
  players,
  onClose 
}) => {
  const feedRef = useRef<HTMLDivElement>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string>('');
  const [sendSummary, setSendSummary] = useState<string>('');

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [match?.invitations]);

  const selectedTimeIso = useMemo(() => {
    const [hh, mm] = time.split(':').map((v) => parseInt(v, 10));
    const d = new Date();
    d.setSeconds(0, 0);
    d.setHours(hh, mm);
    return d.toISOString();
  }, [time]);

  const existingInvitedPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    (match?.invitations || []).forEach((inv) => {
      if (inv.player_id) ids.add(inv.player_id);
    });
    return ids;
  }, [match]);

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers((prev) => (prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]));
  };

  const handleSendInvitations = async () => {
    setSendError('');
    setSendSummary('');
    if (selectedPlayers.length === 0) {
      setSendError('Select at least 1 player');
      return;
    }

    setSending(true);
    try {
      let matchId = match?.id;

      // Create match from selected slot if needed
      if (!matchId) {
        const created = await api.post<{ id: string }>('/matches/create', {
          court_id: courtId,
          scheduled_time: selectedTimeIso,
          slot_time: time,
          status: 'Inviting',
          target_count: 4,
        });
        matchId = created.id;
      }

      const result = await api.post<{ results: Array<{ invitationId: string; success: boolean; error?: string }> }>(
        '/invitations/send',
        { match_id: matchId, player_ids: selectedPlayers }
      );

      const failed = result.results.filter((r) => !r.success);
      if (failed.length > 0) {
        setSendError(`Failed to send ${failed.length} invitation(s).`);
      } else {
        setSendSummary(`Sent ${result.results.length} invitation(s).`);
      }

      setSelectedPlayers([]);
    } catch (e: any) {
      setSendError(e?.message || 'Failed to send invitations');
    } finally {
      setSending(false);
    }
  };

  const PlayerPicker = (
    <div className="p-4 border-b border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Invite Players</h3>
        <div className="text-[10px] text-zinc-600 font-mono">{time}</div>
      </div>

      {sendError && (
        <div className="mb-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {sendError}
        </div>
      )}
      {sendSummary && (
        <div className="mb-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          {sendSummary}
        </div>
      )}

      <div className="max-h-48 overflow-y-auto space-y-1">
        {players.map((p) => {
          const alreadyInvited = existingInvitedPlayerIds.has(p.id);
          return (
            <label
              key={p.id}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${
                alreadyInvited
                  ? 'bg-zinc-900/30 border-zinc-800 opacity-60'
                  : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900'
              }`}
              title={alreadyInvited ? 'Already invited' : ''}
            >
              <input
                type="checkbox"
                disabled={alreadyInvited || sending}
                checked={selectedPlayers.includes(p.id)}
                onChange={() => togglePlayer(p.id)}
              />
              <div className="flex-1">
                <div className="text-xs text-zinc-200 font-medium">{p.name}</div>
                <div className="text-[10px] text-zinc-500">{p.level || 'N/A'} {p.position || ''}</div>
              </div>
              {alreadyInvited && <span className="text-[10px] text-zinc-500 font-mono">INVITED</span>}
            </label>
          );
        })}
      </div>

      <button
        onClick={handleSendInvitations}
        disabled={sending}
        className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg transition-colors text-xs font-bold"
      >
        {sending ? 'Sending…' : 'Send Invitations'}
      </button>
    </div>
  );

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
        <div className="flex-1 overflow-y-auto">
          {PlayerPicker}
          <div className="p-8 text-center text-zinc-500">
            <Icon name="info" className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No match scheduled</p>
            <p className="text-xs mt-1">Use the panel above to create this match and send invites.</p>
          </div>
        </div>
      </div>
    );
  }

  const invitations = match.invitations || [];
  const confirmedInvitations = invitations.filter(inv => inv.status === 'confirmed');

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
        {(match.status !== 'Locked' && match.status !== 'Confirmed') && PlayerPicker}

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

