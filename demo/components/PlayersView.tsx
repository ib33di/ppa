import React, { useState } from 'react';
import { Player } from '../types';
import { PlayerCard } from './PlayerCard';
import { Icon } from './Icons';

// --- MOCK DATA MATCHING SCREENSHOT ---
const PLAYERS: Player[] = [
  {
    id: '1',
    name: 'Alex Mercer',
    avatarInitials: 'AM',
    level: '5.0',
    position: 'Left',
    trustScore: 98,
    reliabilityStatus: 'Trusted',
    attendanceHistory: ['attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended'],
    confirmationSpeed: 'Instant',
    feedbackSignal: 'Mixed',
    energy: 'Intense',
    repeatRate: 72,
    lastMatch: 'Yesterday',
    availability: 'Active Today',
    impactTags: ['Closer'],
    coachSummary: 'Thrives in high-stakes matches but can overwhelm casual players. Best paired with resilient partners.',
    patternInsight: 'Often requests late night slots.',
    typicalPartners: ['Elena F.', 'Marcus C.'],
    matchCount: 142
  },
  {
    id: '2',
    name: 'Sofia Rodriguez',
    avatarInitials: 'SR',
    level: '4.5',
    position: 'Right',
    trustScore: 92,
    reliabilityStatus: 'Trusted',
    attendanceHistory: ['attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended'],
    confirmationSpeed: 'Instant',
    feedbackSignal: 'Positive', // Mapped to 'Mostly Yes'
    energy: 'Calm',
    repeatRate: 88,
    lastMatch: 'Today',
    availability: 'Active this Week',
    impactTags: [],
    coachSummary: 'Consistent and calming presence on court.',
    patternInsight: '',
    typicalPartners: [],
    matchCount: 89
  },
  {
    id: '3',
    name: 'Chris Peterson',
    avatarInitials: 'CP',
    level: '3.0',
    position: 'Both',
    trustScore: 65,
    reliabilityStatus: 'Risk',
    attendanceHistory: ['cancelled', 'attended', 'cancelled', 'attended', 'late', 'attended', 'attended', 'cancelled', 'attended', 'attended'],
    confirmationSpeed: 'Slow',
    feedbackSignal: 'Mixed', // Mapped to 'Often Avoided' in UI logic if low
    energy: 'Neutral',
    repeatRate: 35,
    lastMatch: '5 days ago',
    availability: 'Dormant',
    impactTags: [],
    coachSummary: 'Unpredictable availability.',
    patternInsight: '',
    typicalPartners: [],
    matchCount: 12
  },
  {
    id: '4',
    name: 'Elena Fisher',
    avatarInitials: 'EF',
    level: '5.5',
    position: 'Left',
    trustScore: 96,
    reliabilityStatus: 'Trusted',
    attendanceHistory: ['attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended'],
    confirmationSpeed: 'Instant',
    feedbackSignal: 'Positive',
    energy: 'Intense',
    repeatRate: 94,
    lastMatch: 'Yesterday',
    availability: 'Active Today',
    impactTags: [],
    coachSummary: 'Top tier competitive player.',
    patternInsight: '',
    typicalPartners: [],
    matchCount: 204
  },
  {
    id: '5',
    name: 'Marcus Chen',
    avatarInitials: 'MC',
    level: '4.0',
    position: 'Right',
    trustScore: 85,
    reliabilityStatus: 'Stable',
    attendanceHistory: ['attended', 'attended', 'late', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended'],
    confirmationSpeed: 'Normal',
    feedbackSignal: 'Positive',
    energy: 'Calm',
    repeatRate: 82,
    lastMatch: '3 days ago',
    availability: 'Dormant',
    impactTags: [],
    coachSummary: 'Good partner for mixed skill games.',
    patternInsight: '',
    typicalPartners: [],
    matchCount: 56
  },
  {
    id: '6',
    name: 'Sarah Jenkins',
    avatarInitials: 'SJ',
    level: '3.5',
    position: 'Both',
    trustScore: 45,
    reliabilityStatus: 'Risk',
    attendanceHistory: ['attended', 'cancelled', 'attended', 'attended', 'cancelled', 'attended', 'attended', 'attended', 'cancelled', 'attended'],
    confirmationSpeed: 'Slow',
    feedbackSignal: 'Mixed',
    energy: 'Neutral',
    repeatRate: 45,
    lastMatch: '1 week ago',
    availability: 'Active Today',
    impactTags: [],
    coachSummary: 'Cancellation risk on weekends.',
    patternInsight: '',
    typicalPartners: [],
    matchCount: 28
  },
  {
    id: '7',
    name: 'David Kim',
    avatarInitials: 'DK',
    level: '4.5',
    position: 'Left',
    trustScore: 89,
    reliabilityStatus: 'Trusted',
    attendanceHistory: ['attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended'],
    confirmationSpeed: 'Instant',
    feedbackSignal: 'Positive',
    energy: 'Intense',
    repeatRate: 85,
    lastMatch: 'Today',
    availability: 'Active Today',
    impactTags: [],
    coachSummary: 'High intensity, good for competitive slots.',
    patternInsight: '',
    typicalPartners: [],
    matchCount: 110
  },
  {
    id: '8',
    name: 'Emma Watson',
    avatarInitials: 'EW',
    level: '2.5',
    position: 'Right',
    trustScore: 90,
    reliabilityStatus: 'Trusted',
    attendanceHistory: ['attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended', 'attended'],
    confirmationSpeed: 'Normal',
    feedbackSignal: 'Positive',
    energy: 'Calm',
    repeatRate: 78,
    lastMatch: '2 days ago',
    availability: 'Active this Week',
    impactTags: [],
    coachSummary: 'New player, very eager and reliable.',
    patternInsight: '',
    typicalPartners: [],
    matchCount: 8
  }
];

// --- HELPER COMPONENTS ---

const FilterPill: React.FC<{ label: string, active?: boolean }> = ({ label, active = false }) => (
  <button className={`
    min-w-[40px] px-3 py-1.5 rounded-md text-[11px] font-bold border transition-all duration-200
    ${active 
      ? 'bg-zinc-800 text-white border-zinc-600' 
      : 'bg-zinc-900/40 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
    }
  `}>
    {label}
  </button>
);

const FilterGroup = ({ label, options }: { label: string, options: string[] }) => (
  <div className="flex items-center gap-3">
    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{label}</span>
    <div className="flex items-center gap-1.5">
      {options.map((opt) => (
        <FilterPill key={opt} label={opt} />
      ))}
    </div>
  </div>
);

const PlayerListRow: React.FC<{ player: Player; isSelected: boolean; onClick: () => void }> = ({ player, isSelected, onClick }) => {
   const isTrusted = player.trustScore >= 90;
   
   const getEnergyColor = (energy: string) => {
    switch (energy) {
      case 'Intense': return 'border-rose-500/30 text-rose-400 bg-rose-500/10';
      case 'Calm': return 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10';
      default: return 'border-zinc-700 text-zinc-400 bg-zinc-800/50';
    }
  };

  const getFeedbackColor = (signal: string) => {
    if (signal === 'Positive') return 'text-emerald-400';
    if (signal === 'Mixed') return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
      <div 
        onClick={onClick}
        className={`
            flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer group
            ${isSelected 
            ? 'bg-zinc-900 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50' 
            : 'bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900'
            }
        `}
      >
        {/* Player Info */}
        <div className="flex items-center gap-4 min-w-[240px]">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                {player.avatarInitials}
            </div>
            <div>
                <div className="font-bold text-white text-sm">{player.name}</div>
                 <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-700">{player.level}</span>
                    <span className="text-[10px] text-zinc-500 uppercase">{player.position}</span>
                 </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="flex items-center gap-8 flex-1 justify-end">
            {/* Reliability */}
            <div className="w-32 flex justify-center">
                {isTrusted ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/5 rounded border border-emerald-500/10">
                        <Icon name="shield" className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase">Trusted</span>
                    </div>
                ) : (
                    <span className={`text-xs font-medium px-2 ${player.reliabilityStatus === 'Risk' ? 'text-rose-500 bg-rose-500/10 rounded py-1' : 'text-zinc-500'}`}>
                        {player.reliabilityStatus}
                    </span>
                )}
            </div>

            {/* Energy */}
            <div className="w-24 text-center">
                 <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getEnergyColor(player.energy)}`}>
                    {player.energy}
                 </span>
            </div>
            
            {/* Feedback */}
             <div className="w-24 text-right hidden lg:block">
                <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">Feedback</span>
                <span className={`text-xs font-bold ${getFeedbackColor(player.feedbackSignal)}`}>
                    {player.feedbackSignal === 'Positive' ? 'Mostly Yes' : player.feedbackSignal}
                </span>
             </div>

             {/* Last Match - ADDED COLUMN */}
             <div className="w-24 text-right hidden xl:block">
                <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">Last Match</span>
                <span className="text-xs font-medium text-zinc-300">{player.lastMatch}</span>
             </div>
             
             {/* Matches */}
             <div className="w-20 text-right hidden md:block">
                <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">Matches</span>
                <span className="text-xs font-medium text-zinc-300">{player.matchCount}</span>
             </div>
             
             {/* Action */}
             <div className="w-8 flex justify-end text-zinc-600 group-hover:text-white transition-colors">
                 <Icon name="arrow-right" className="w-4 h-4" />
             </div>
        </div>
      </div>
  )
};

interface PlayersViewProps {
  onSelectPlayer: (player: Player) => void;
  selectedPlayerId: string | null;
}

export const PlayersView: React.FC<PlayersViewProps> = ({ onSelectPlayer, selectedPlayerId }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="h-full flex flex-col p-8 max-w-[1600px] mx-auto">
       
       {/* 1. HEADER SECTION */}
       <div className="flex justify-between items-start mb-6">
          <div>
             <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Players Intelligence</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-400">
                  {PLAYERS.length} Players
                </span>
             </div>
             <p className="text-sm text-zinc-500">Human signals & system behavior.</p>
          </div>
          
          <div className="relative group w-64">
             <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-hover:text-zinc-500" />
             <input 
               type="text" 
               placeholder="Find by name..." 
               className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 transition-colors"
             />
          </div>
       </div>

       {/* 2. FILTER & TOOLBAR */}
       <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center gap-6 mb-8 pb-6 border-b border-zinc-800/50">
          
          {/* Left: Filters */}
          <div className="flex items-center gap-6 overflow-x-auto w-full xl:w-auto no-scrollbar mask-gradient-right pb-2 xl:pb-0">
              <FilterGroup label="Level" options={['2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5']} />
              
              <div className="h-6 w-px bg-zinc-800 shrink-0"></div>
              
              <FilterGroup label="Reliability" options={['Trusted', 'Stable', 'Inconsistent', 'Risk']} />
              
              <div className="h-6 w-px bg-zinc-800 shrink-0"></div>
              
              <FilterGroup label="Energy" options={['Calm', 'Neutral', 'Intense']} />
          </div>

          {/* Right: View Toggle */}
          <div className="flex items-center bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 shrink-0">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Grid View"
              >
                <Icon name="layout-grid" className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="List View"
              >
                <Icon name="list" className="w-4 h-4" />
              </button>
          </div>
       </div>

       {/* 3. CONTENT AREA */}
       {viewMode === 'grid' ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 overflow-y-auto pb-20 custom-scrollbar animate-in fade-in duration-300">
              {PLAYERS.map((player) => (
                 <PlayerCard 
                    key={player.id} 
                    player={player} 
                    isSelected={selectedPlayerId === player.id}
                    onClick={() => onSelectPlayer(player)}
                 />
              ))}
           </div>
       ) : (
           <div className="flex flex-col gap-3 overflow-y-auto pb-20 custom-scrollbar animate-in fade-in duration-300">
              {PLAYERS.map((player) => (
                 <PlayerListRow 
                    key={player.id} 
                    player={player} 
                    isSelected={selectedPlayerId === player.id}
                    onClick={() => onSelectPlayer(player)}
                 />
              ))}
           </div>
       )}
    </div>
  );
};