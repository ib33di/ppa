import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useMatches } from './hooks/useMatches';
import { usePlayers } from './hooks/usePlayers';
import { useCourts } from './hooks/useCourts';
import { Icon } from './components/Icons';
import { AddPlayerModal } from './components/AddPlayerModal';
import { AddCourtModal } from './components/AddCourtModal';
import { LiveMatchesPanel } from './components/LiveMatchesPanel';
import { OperatorFocusPanel } from './components/OperatorFocusPanel';
import { LiveCourtStatusGrid } from './components/LiveCourtStatusGrid';
import { CourtDetailsPanel } from './components/CourtDetailsPanel';
import { Court, SlotData } from './types';

type ViewState = 'live' | 'players' | 'matchmaking' | 'analytics' | 'scheduled' | 'admin';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewState>('live');
  const { matches, loading: matchesLoading } = useMatches();
  const { players: playersList, loading: playersLoading, refetch: refetchPlayers } = usePlayers();
  const { courts: courtsList, loading: courtsLoading, refetch: refetchCourts, refetchAll: refetchAllCourts } = useCourts();
  const [, setSelectedSlot] = useState<SlotData | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddCourt, setShowAddCourt] = useState(false);
  const [selectedCourtSlot, setSelectedCourtSlot] = useState<{ courtId: string; time: string } | null>(null);
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

  const getTimeSlotsForGrid = (courts: Court[]): string[] => {
    // Generate times from availability ranges; fallback to legacy default times.
    const legacy = ['17:00', '18:30', '20:00', '21:30'];

    const toMin = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map((v) => parseInt(v, 10));
      return h * 60 + m;
    };
    const toHHMM = (min: number) => {
      const h = String(Math.floor(min / 60)).padStart(2, '0');
      const m = String(min % 60).padStart(2, '0');
      return `${h}:${m}`;
    };

    const step = 90; // matches existing grid cadence (17:00 -> 18:30 -> ...)
    const all = new Set<string>();
    let hasAnyRules = false;

    courts.forEach((c) => {
      const ranges = c.availability || [];
      if (ranges.length === 0) return;
      hasAnyRules = true;
      ranges.forEach((r) => {
        const start = toMin(String(r.start_time).slice(0, 5));
        const end = toMin(String(r.end_time).slice(0, 5));
        for (let t = start; t < end; t += step) {
          all.add(toHHMM(t));
        }
      });
    });

    const times = [...all].sort((a, b) => toMin(a) - toMin(b));
    return (hasAnyRules && times.length > 0) ? times : legacy;
  };

  if (matchesLoading || playersLoading || courtsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  const slotData = getSlotData();
  const times = getTimeSlotsForGrid(courtsList);

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
              onClick={() => alert('Create matches from the center grid by selecting a court + time slot.')}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
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
              onClick={() => setCurrentView('live')}
              className={`px-1 py-4 text-sm font-medium transition-all ${
                currentView === 'live' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Live Operations
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`px-1 py-4 text-sm font-medium transition-all ${
                currentView === 'analytics' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Analytics
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
              onClick={() => setCurrentView('matchmaking')}
              className={`px-1 py-4 text-sm font-medium transition-all ${
                currentView === 'matchmaking' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Matchmaking
            </button>
            <button
              onClick={() => setCurrentView('scheduled')}
              className={`px-1 py-4 text-sm font-medium transition-all ${
                currentView === 'scheduled' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Scheduled
            </button>
            {isAdmin && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-1 py-4 text-sm font-medium transition-all ${
                  currentView === 'admin' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Admin
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {currentView === 'live' && (
            <>
              {/* Left Sidebar - Operator Focus */}
              <OperatorFocusPanel 
                matches={matches}
                onCourtSelect={(courtId, time) => {
                  setSelectedCourtSlot({ courtId, time });
                }}
              />
              
              {/* Center - Live Court Status Grid */}
              <LiveCourtStatusGrid
                matches={matches}
                courts={courtsList}
                times={times}
                selectedSlot={selectedCourtSlot}
                onSlotClick={(courtId, time, match) => {
                  setSelectedCourtSlot({ courtId, time });
                }}
              />
              
              {/* Right Sidebar - Court Details */}
              {selectedCourtSlot && (() => {
                const selectedMatch = matches.find(m => {
                  if (m.court_id !== selectedCourtSlot.courtId) return false;
                  const matchTime = new Date(m.scheduled_time);
                  const timeStr = matchTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  });
                  return timeStr === selectedCourtSlot.time;
                });
                const court = courtsList.find(c => c.id === selectedCourtSlot.courtId);
                
                return (
                  <CourtDetailsPanel
                    match={selectedMatch || null}
                    courtName={court?.name || 'Court'}
                    courtId={selectedCourtSlot.courtId}
                    time={selectedCourtSlot.time}
                    players={playersList}
                    onClose={() => setSelectedCourtSlot(null)}
                  />
                );
              })()}
            </>
          )}
          
          {currentView === 'matchmaking' && (
            <div className="flex-1 overflow-y-auto p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Matchmaking</h2>
              
              {/* Live Matches Panel */}
              <LiveMatchesPanel matches={matches} />
              
              {/* Grid */}
              <div className="mt-8">
                <h3 className="text-lg font-bold text-white mb-4">Schedule Grid</h3>
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
            </div>
          )}

          {currentView === 'players' && (
            <div className="flex-1 overflow-y-auto p-8">
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

          {currentView === 'analytics' && (
            <div className="flex-1 overflow-y-auto p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Analytics</h2>
              <div className="text-zinc-400">Analytics dashboard coming soon...</div>
            </div>
          )}

          {currentView === 'scheduled' && (
            <div className="flex-1 overflow-y-auto p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Scheduled Matches</h2>
              <LiveMatchesPanel matches={matches} />
            </div>
          )}

          {currentView === 'admin' && (
            <div className="flex-1 overflow-y-auto p-8">
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

