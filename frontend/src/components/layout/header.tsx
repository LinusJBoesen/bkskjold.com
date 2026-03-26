import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { da } from "@/i18n/da";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  spiller: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  fan: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

interface HeaderProps {
  email: string | null;
  role?: string | null;
  onLogout: () => void;
  onMenuToggle?: () => void;
}

export function Header({ email, role, onLogout, onMenuToggle }: HeaderProps) {
  const roleLabel = role ? (da.roles as Record<string, string>)[role] || role : null;

  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6" data-testid="header">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        data-testid="header-menu-toggle"
        aria-label="Menu"
      >
        <Menu className="size-5" />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        {roleLabel && (
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${ROLE_COLORS[role!] || ROLE_COLORS.fan}`}
            data-testid="header-role-badge"
          >
            {roleLabel}
          </span>
        )}
        {email && (
          <span className="text-xs text-zinc-500 hidden sm:inline" data-testid="header-email">
            {email}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          data-testid="header-logout"
        >
          {da.layout.logout}
        </Button>
      </div>
    </header>
  );
}
