import { 
  Activity, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Calendar,
  Wallet,
  UserCheck,
  Trophy,
  ArrowRight,
  LayoutDashboard,
  ThumbsUp,
  Meh,
  Frown,
  Heart,
  Shield,
  Clock,
  Repeat,
  Smile,
  Flame,
  User,
  Search,
  Filter,
  Brain,
  Plus,
  X,
  SlidersHorizontal,
  ChevronDown,
  MoreHorizontal,
  RefreshCw,
  Share2,
  LayoutGrid,
  List,
  Bell,
  Swords,
  Command,
  Settings,
  LogOut,
  Sparkles,
  Folder,
  Briefcase,
  Flag,
  Check,
  MessageCircle,
  Radio,
  Lock
} from 'lucide-react';

export const Icon = ({ name, className }: { name: string; className?: string }) => {
  switch (name) {
    case 'activity': return <Activity className={className} />;
    case 'trending-up': return <TrendingUp className={className} />;
    case 'users': return <Users className={className} />;
    case 'alert': return <AlertTriangle className={className} />;
    case 'arrow-up': return <ArrowUpRight className={className} />;
    case 'arrow-down': return <ArrowDownRight className={className} />;
    case 'zap': return <Zap className={className} />;
    case 'calendar': return <Calendar className={className} />;
    case 'wallet': return <Wallet className={className} />;
    case 'user-check': return <UserCheck className={className} />;
    case 'trophy': return <Trophy className={className} />;
    case 'arrow-right': return <ArrowRight className={className} />;
    case 'dashboard': return <LayoutDashboard className={className} />;
    case 'thumbs-up': return <ThumbsUp className={className} />;
    case 'meh': return <Meh className={className} />;
    case 'frown': return <Frown className={className} />;
    case 'heart': return <Heart className={className} />;
    case 'shield': return <Shield className={className} />;
    case 'clock': return <Clock className={className} />;
    case 'repeat': return <Repeat className={className} />;
    case 'smile': return <Smile className={className} />;
    case 'flame': return <Flame className={className} />;
    case 'user': return <User className={className} />;
    case 'search': return <Search className={className} />;
    case 'filter': return <Filter className={className} />;
    case 'brain': return <Brain className={className} />;
    case 'plus': return <Plus className={className} />;
    case 'x': return <X className={className} />;
    case 'sliders': return <SlidersHorizontal className={className} />;
    case 'chevron-down': return <ChevronDown className={className} />;
    case 'more': return <MoreHorizontal className={className} />;
    case 'refresh': return <RefreshCw className={className} />;
    case 'share': return <Share2 className={className} />;
    case 'layout-grid': return <LayoutGrid className={className} />;
    case 'list': return <List className={className} />;
    case 'bell': return <Bell className={className} />;
    case 'swords': return <Swords className={className} />;
    case 'command': return <Command className={className} />;
    case 'settings': return <Settings className={className} />;
    case 'logout': return <LogOut className={className} />;
    case 'sparkles': return <Sparkles className={className} />;
    case 'folder': return <Folder className={className} />;
    case 'briefcase': return <Briefcase className={className} />;
    case 'flag': return <Flag className={className} />;
    case 'check': return <Check className={className} />;
    case 'message-circle': return <MessageCircle className={className} />;
    case 'radio': return <Radio className={className} />;
    case 'lock': return <Lock className={className} />;
    default: return <Activity className={className} />;
  }
};

