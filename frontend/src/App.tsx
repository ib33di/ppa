import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useMatches } from './hooks/useMatches';
import { usePlayers } from './hooks/usePlayers';
import { useCourts } from './hooks/useCourts';
import { Icon } from './components/Icons';
import { AddPlayerModal } from './components/AddPlayerModal';
import { AddCourtModal } from './components/AddCourtModal';
import { Match, SlotData } from './types';
import { api } from './lib/api';

type ViewState = 'overview' | 'players' | 'matchmaking' | 'analytics' | 'scheduled' | 'admin';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewState>('matchmaking');
  const { matches, loading: matchesLoading } = useMatches();
  const { players: playersList, loading: playersLoading, refetch: refetchPlayers } = usePlayers();
  const { courts: courtsList, loading: courtsLoading, refetch: refetchCourts, refetchAll: refetchAllCourts } = useCourts();
  const [, setSelectedSlot] = useState<SlotData | null>(null);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddCourt, setShowAddCourt] = useState(false);
  const { user, signOut, isAdmin, isManager } = useAuth();

  // Debug: Log admin status and show admin badge
  useEffect(() => {
    console.log('User role check:', { 
      email: user?.email, 
      role: user?.role, 
      isAdmin, 
      isManager 
    });
    
    // Force refresh user profile if role is missing
    if (user && !user.role) {
      console.warn('User role is missing, fetching profile...');
      fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
        .then(res => res.json())
        .then(userData => {
          console.log('Refreshed user profile:', userData);
        })
        .catch(err => console.error('Failed to refresh profile:', err));
    }
  }, [user, isAdmin, isManager]);

  // Fetch all courts when admin view is opened
  useEffect(() => {
    if (currentView === 'admin' && isAdmin) {
      refetchAllCourts();
    }
  }, [currentView, isAdmin]);

  // Convert matches to slot data for grid display
  const getSlotData = (): SlotData[] => {
    const slots: SlotData[] = [];
    const times = ['17:00', '18:30', '20:00', '21:30'];
    
    courtsList.forEach(court => {
      times.forEach(time => {
        const match = matches.find(m => {
          const matchTime = new Date(m.scheduled_time);
          const timeStr = matchTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          return m.court_id === court.id && timeStr === time;
        });

        if (match) {
          slots.push({
            id: match.id,
            time,
            court: court.name,
            status: match.status === 'Locked' ? 'booked' : 
                   match.confirmed_count > 0 ? 'partial' : 'open',
            players: match.confirmed_count,
            matchId: match.id,
          });
        } else {
          slots.push({
            id: `${court.id}-${time}`,
            time,
            court: court.name,
            status: 'open',
          });
        }
      });
    });

    return slots;
  };

  const handleCreateMatch = async (courtId: string, scheduledTime: string, playerIds: string[]) => {
    try {
      // Create match
      const match = await api.post<Match>('/matches', {
        court_id: courtId,
        scheduled_time: scheduledTime,
        status: 'Inviting',
        target_count: 4,
      });

      // Create invitations
      const invitations = await api.post<Array<{ id: string }>>('/invitations/batch', 
        playerIds.map(playerId => ({
          match_id: match.id,
          player_id: playerId,
          status: 'pending',
        }))
      );

      // Send WhatsApp invitations
      for (const invitation of invitations) {
        await api.post('/whatsapp/send-invitation', { invitationId: invitation.id });
      }

      setShowCreateMatch(false);
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Failed to create match');
    }
  };

  if (matchesLoading || playersLoading || courtsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  const slotData = getSlotData();

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex overflow-hidden">
      {/* Left Navigation */}
      <nav className="w-16 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-5">
        <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
          <span className="font-black text-indigo-500 text-[10px]">PPA</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="px-8 py-5 flex justify-between items-center bg-black border-b border-zinc-900">
          <h1 className="text-xl font-bold tracking-tight text-white">PPA Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">{user?.email}</span>
                  {user?.role && (
                <span className={`text-xs px-2 py-1 rounded ${
                  user.role === 'admin' ? 'bg-emerald-500/20 text-emerald-400' :
                  user.role === 'manager' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-zinc-500/20 text-zinc-400'
                }`}>
                  {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Manager' : 'User'}
                </span>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddPlayer(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                title="Add Player"
              >
                <Icon name="plus" className="w-4 h-4" />
                Add Player
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowAddCourt(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                title="Add Court"
              >
                <Icon name="plus" className="w-4 h-4" />
                Add Court
              </button>
            )}
            <button
              onClick={() => setShowCreateMatch(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              <Icon name="plus" className="w-4 h-4" />
              Create Match
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              <Icon name="logout" className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Navigation */}
        <div className="px-8 border-b border-zinc-800 bg-black/50">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setCurrentView('matchmaking')}
              className={`px-1 py-4 text-sm font-medium transition-all ${
                currentView === 'matchmaking' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Matchmaking
            </button>
            <button
              onClick={() => setCurrentView('players')}
              className={`px-1 py-4 text-sm font-medium transition-all ${
                currentView === 'players' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Players
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className={`px-1 py-4 text-sm font-medium transition-all ${
                currentView === 'admin' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Admin {isAdmin && <span className="ml-1 text-xs">(Admin)</span>}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentView === 'matchmaking' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Matchmaking</h2>
              <div className="grid grid-cols-4 gap-4">
                {courtsList.map(court => (
                  <div key={court.id} className="text-center text-xs font-bold text-zinc-500 uppercase mb-2">
                    {court.name}
                  </div>
                ))}
                {['17:00', '18:30', '20:00', '21:30'].map(time => (
                  <React.Fragment key={time}>
                    <div className="text-xs font-mono text-zinc-500">{time}</div>
                    {courtsList.map(court => {
                      const slot = slotData.find(s => s.time === time && s.court === court.name);
                      return (
                        <div
                          key={`${court.id}-${time}`}
                          onClick={() => slot && setSelectedSlot(slot)}
                          className={`h-24 rounded-lg border cursor-pointer flex items-center justify-center transition-all ${
                            slot?.status === 'booked' ? 'bg-zinc-950 border-zinc-900 opacity-60' :
                            slot?.status === 'partial' ? 'bg-zinc-900/40 border-zinc-800' :
                            'bg-transparent border-zinc-800 hover:bg-zinc-900'
                          }`}
                        >
                          {slot?.status === 'booked' && <Icon name="lock" className="w-5 h-5 text-zinc-600" />}
                          {slot?.status === 'partial' && <span className="text-xs text-zinc-400">{slot.players}/4</span>}
                          {slot?.status === 'open' && <Icon name="plus" className="w-4 h-4 text-zinc-600" />}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {currentView === 'players' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Players</h2>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddPlayer(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                  >
                    <Icon name="plus" className="w-4 h-4" />
                    Add Player
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playersList.map(player => (
                  <div key={player.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white">{player.name}</div>
                        <div className="text-xs text-zinc-500">{player.level} • {player.position}</div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400">Trust Score: {player.trust_score || 0}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'admin' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-zinc-400">
                    {user?.email}
                  </div>
                  <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                    user?.role === 'admin' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    user?.role === 'manager' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                  }`}>
                    {user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : user?.role || 'Undefined'}
                  </div>
                  {!isAdmin && (
                    <div className="text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                      Limited Permissions
                    </div>
                  )}
                </div>
              </div>
              
              {/* Players Management */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Players Management</h3>
                  {(isAdmin || isManager) && (
                    <button
                      onClick={() => setShowAddPlayer(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                    >
                      <Icon name="plus" className="w-4 h-4" />
                      Add New Player
                    </button>
                  )}
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="text-sm text-zinc-400">
                    Total Players: <span className="text-white font-bold">{playersList.length}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    You can add new players from here or from the Players page
                  </p>
                </div>
              </div>

              {/* Courts Management */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Courts Management</h3>
                  {(isAdmin || isManager) && (
                    <button
                      onClick={() => setShowAddCourt(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                    >
                      <Icon name="plus" className="w-4 h-4" />
                      Add New Court
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courtsList.map(court => (
                    <div key={court.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">{court.name}</div>
                          <div className="text-xs text-zinc-500 mt-1">
                            {court.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${court.is_active ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Times */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Available Times</h3>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['17:00', '18:30', '20:00', '21:30'].map(time => (
                      <div key={time} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-center">
                        <div className="text-lg font-bold text-white">{time}</div>
                        <div className="text-xs text-zinc-500 mt-1">Available</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-zinc-400 mt-4">
                    These are the default times for all courts. They can be modified later as needed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddPlayer && (
        <AddPlayerModal
          onClose={() => setShowAddPlayer(false)}
          onSuccess={() => {
            refetchPlayers();
            setShowAddPlayer(false);
          }}
        />
      )}

      {showAddCourt && (
        <AddCourtModal
          onClose={() => setShowAddCourt(false)}
          onSuccess={() => {
            refetchCourts();
            if (currentView === 'admin') {
              refetchAllCourts();
            }
            setShowAddCourt(false);
          }}
        />
      )}

      {/* Create Match Modal */}
      {showCreateMatch && (
        <CreateMatchModal
          courts={courtsList}
          players={playersList}
          onClose={() => setShowCreateMatch(false)}
          onCreate={handleCreateMatch}
        />
      )}
    </div>
  );
}

function CreateMatchModal({ courts, players, onClose, onCreate }: any) {
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!selectedCourt || !selectedTime || selectedPlayers.length === 0) {
      alert('Please fill all fields');
      return;
    }

    const date = new Date();
    date.setHours(parseInt(selectedTime.split(':')[0]));
    date.setMinutes(parseInt(selectedTime.split(':')[1]));

    onCreate(selectedCourt, date.toISOString(), selectedPlayers);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Create Match</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Court</label>
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white"
            >
              <option value="">Select court</option>
              {courts.map((court: any) => (
                <option key={court.id} value={court.id}>{court.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Time</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white"
            >
              <option value="">Select time</option>
              <option value="17:00">17:00</option>
              <option value="18:30">18:30</option>
              <option value="20:00">20:00</option>
              <option value="21:30">21:30</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Players</label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {players.map((player: any) => (
                <label key={player.id} className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPlayers.includes(player.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPlayers([...selectedPlayers, player.id]);
                      } else {
                        setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
                      }
                    }}
                  />
                  <span className="text-sm text-white">{player.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
          >
            Create & Send Invitations
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

