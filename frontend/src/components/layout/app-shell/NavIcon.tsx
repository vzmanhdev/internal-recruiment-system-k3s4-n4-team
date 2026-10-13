import {
  BadgeCheck, Bell, BookOpen, Briefcase, Building2, Calendar, CalendarClock, ChartColumn, CheckSquare, ClipboardList,
  Database, FileText, Gift, GitBranch, Grid3x3, History, House, Inbox, KeyRound, Kanban, Layers, Mail, Megaphone,
  Rocket, ScrollText, Settings, Share2, ShieldCheck, Star, Target, Upload, User, UserSearch, Users, Wallet,
  type LucideIcon,
} from "lucide-react";
import type { NavIcon as NavIconName } from "@/lib/auth/navigation";

const ICONS: Record<NavIconName, LucideIcon> = {
  home: House, shield: ShieldCheck, users: Users, upload: Upload, key: KeyRound, grid: Grid3x3, database: Database,
  building: Building2, badge: BadgeCheck, layers: Layers, scroll: ScrollText, file: FileText, check: CheckSquare,
  megaphone: Megaphone, "user-search": UserSearch, kanban: Kanban, star: Star, share: Share2, calendar: Calendar,
  clipboard: ClipboardList, clock: CalendarClock, book: BookOpen, gift: Gift, rocket: Rocket, mail: Mail, inbox: Inbox,
  bell: Bell, settings: Settings, chart: ChartColumn, briefcase: Briefcase, user: User, history: History,
  wallet: Wallet, flow: GitBranch, target: Target,
};

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const Icon = ICONS[name] || FileText;
  return <Icon className={className} aria-hidden="true" />;
}
