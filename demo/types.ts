export interface KPIMetric {
  label: string;
  value: string;
  trend: number; // percentage change
  trendLabel: string;
  status: 'healthy' | 'attention' | 'critical';
  iconName: string;
  context?: string; // e.g. "82% PPA Driven"
}

export interface InsightAction {
  id: string;
  title: string;
  description: string;
  impact: string;
  actionLabel: string;
  priority: 'high' | 'medium' | 'low';
  category: 'revenue' | 'utilization' | 'quality';
}

export interface DailyUtilization {
  day: string;
  current: number;
  previous: number;
  status: 'good' | 'low';
}

export interface RevenueData {
  time: string;
  manual: number;
  ppa: number;
  recoverable: number;
}

export interface FunnelStage {
  label: string;
  count: number;
  percentage: number;
  dropOff?: string;
  color: string;
  
}

// --- MATCHMAKING TYPES ---

export type SlotStatus = 'open' | 'booked' | 'partial' | 'aura-opportunity';

export interface SlotData {
  id: string;
  time: string;
  court: string;
  status: SlotStatus;
  players?: number; // x/4
  confidence?: number; // Aura score
  label?: string; // "League Match" or "Booked"
}

// --- PLAYER INTELLIGENCE TYPES ---

export type EnergyLevel = 'Calm' | 'Neutral' | 'Intense';
export type FeedbackSignal = 'Positive' | 'Neutral' | 'Mixed'; // Mapped to Mostly Yes, Mixed, Avoided
export type AttendanceStatus = 'attended' | 'cancelled' | 'late';
export type AvailabilityStatus = 'Active Today' | 'Active this Week' | 'Dormant';
export type ReliabilityStatus = 'Trusted' | 'Stable' | 'Inconsistent' | 'Risk';

export interface Player {
  id: string;
  name: string;
  avatarInitials: string;
  level: string; // "4.5"
  position: 'Left' | 'Right' | 'Both';
  
  // Reliability (The Primary Signal)
  reliabilityStatus: ReliabilityStatus; 
  trustScore: number; // 0-100, the "Aura Trust Score"
  attendanceHistory: AttendanceStatus[]; // Last 10 matches
  confirmationSpeed: 'Instant' | 'Normal' | 'Slow'; // Behavioral signal
  
  // Human Signals
  feedbackSignal: FeedbackSignal;
  energy: EnergyLevel;
  repeatRate: number; // 0-100, used for visual bar
  lastMatch: string; // Added field

  // System Intelligence
  availability: AvailabilityStatus;
  impactTags: string[]; // e.g., 'Closer', 'High Repeat', 'Avoided', 'Risk'
  
  // Coach Intelligence (Contextual Judgment)
  coachSummary: string; // Natural language judgment
  patternInsight: string; // "Cancels more often on Thursdays"
  
  // Match Stats for Context (Hidden on card, used in panel)
  typicalPartners: string[];
  matchCount: number;
}