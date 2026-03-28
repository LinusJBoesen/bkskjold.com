import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Users,
  History,
  Trophy,
  BarChart3,
  Settings,
  CreditCard,
} from "lucide-react";
import { da } from "@/i18n/da";

const navItems = [
  { to: "/dashboard", label: da.nav.dashboard, testId: "nav-dashboard", icon: LayoutDashboard, roles: ["admin", "spiller", "fan"] },
  { to: "/fines", label: da.nav.fines, testId: "nav-fines", icon: Receipt, roles: ["admin", "spiller"] },
  { to: "/teams", label: da.nav.teams, testId: "nav-teams", icon: Users, roles: ["admin", "spiller"] },
  { to: "/history", label: da.nav.history, testId: "nav-history", icon: History, roles: ["admin", "spiller"] },
  { to: "/tournament", label: da.nav.tournament, testId: "nav-tournament", icon: Trophy, roles: ["admin", "spiller", "fan"] },
  { to: "/analysis", label: da.nav.analysis, testId: "nav-analysis", icon: BarChart3, roles: ["admin", "spiller", "fan"] },
  { to: "/seasoncard", label: da.nav.seasoncard, testId: "nav-seasoncard", icon: CreditCard, roles: ["fan"] },
  { to: "/admin", label: da.nav.admin, testId: "nav-admin", icon: Settings, roles: ["admin"] },
];

interface SidebarProps {
  onNavigate?: () => void;
  role?: string | null;
}

export function Sidebar({ onNavigate, role }: SidebarProps) {
  const filteredItems = role
    ? navItems.filter((item) => item.roles.includes(role))
    : navItems;

  return (
    <aside
      className="w-60 bg-[#0A0A0A] text-white min-h-screen flex flex-col border-r border-white/5"
      data-testid="sidebar"
    >
      <div className="p-4 border-b border-white/5 flex items-center gap-3">
        <img src="/logo.webp" alt="BK Skjold" className="h-9 w-9" />
        <h1 className="text-xl font-bold text-white" data-testid="sidebar-title">
          {da.layout.appName}
        </h1>
      </div>
      <nav className="flex-1 py-2" data-testid="sidebar-nav">
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            data-testid={item.testId}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-200 ${
                isActive
                  ? "border-l-2 border-red-500 bg-white/5 text-white font-medium"
                  : "border-l-2 border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
