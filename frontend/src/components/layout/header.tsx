import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { da } from "@/i18n/da";

interface HeaderProps {
  email: string | null;
  onLogout: () => void;
  onMenuToggle?: () => void;
}

export function Header({ email, onLogout, onMenuToggle }: HeaderProps) {
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
      <div className="flex items-center gap-4">
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
