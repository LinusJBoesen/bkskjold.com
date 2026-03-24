import { NavLink } from "react-router-dom";
import { da } from "@/i18n/da";

const navItems = [
  { to: "/", label: da.nav.dashboard, testId: "nav-dashboard" },
  { to: "/fines", label: da.nav.fines, testId: "nav-fines" },
  { to: "/teams", label: da.nav.teams, testId: "nav-teams" },
  { to: "/history", label: da.nav.history, testId: "nav-history" },
  { to: "/tournament", label: da.nav.tournament, testId: "nav-tournament" },
  { to: "/analysis", label: da.nav.analysis, testId: "nav-analysis" },
  { to: "/admin", label: da.nav.admin, testId: "nav-admin" },
];

export function Sidebar() {
  return (
    <aside
      className="w-60 bg-brand-black text-white min-h-screen flex flex-col"
      data-testid="sidebar"
    >
      <div className="p-4 border-b border-neutral-dark-gray">
        <h1 className="text-xl font-bold" data-testid="sidebar-title">
          {da.layout.appName}
        </h1>
      </div>
      <nav className="flex-1 py-2" data-testid="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            data-testid={item.testId}
            className={({ isActive }) =>
              `block px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "border-l-3 border-brand-red bg-brand-red/10 text-white font-medium"
                  : "border-l-3 border-transparent hover:bg-neutral-dark-gray text-neutral-light-gray"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
