import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Users,
  History,
  Trophy,
  BarChart3,
  Settings,
} from "lucide-react";
import { da } from "@/i18n/da";

const navItems = [
  { to: "/dashboard", label: da.nav.dashboard, testId: "nav-dashboard", icon: LayoutDashboard },
  { to: "/fines", label: da.nav.fines, testId: "nav-fines", icon: Receipt },
  { to: "/teams", label: da.nav.teams, testId: "nav-teams", icon: Users },
  { to: "/history", label: da.nav.history, testId: "nav-history", icon: History },
  { to: "/tournament", label: da.nav.tournament, testId: "nav-tournament", icon: Trophy },
  { to: "/analysis", label: da.nav.analysis, testId: "nav-analysis", icon: BarChart3 },
  { to: "/admin", label: da.nav.admin, testId: "nav-admin", icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside
      className="w-60 bg-[#0A0A0A] text-white min-h-screen flex flex-col border-r border-white/5"
      data-testid="sidebar"
    >
      <div className="p-4 border-b border-white/5">
        <h1 className="text-xl font-bold text-white" data-testid="sidebar-title">
          {da.layout.appName}
        </h1>
      </div>
      <nav className="flex-1 py-2" data-testid="sidebar-nav">
        {navItems.map((item) => (
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
