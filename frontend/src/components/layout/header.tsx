import { Button } from "@/components/ui/button";
import { da } from "@/i18n/da";

interface HeaderProps {
  email: string | null;
  onLogout: () => void;
  onMenuToggle?: () => void;
}

export function Header({ email, onLogout, onMenuToggle }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-neutral-light-gray flex items-center justify-between px-4 md:px-6" data-testid="header">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-2 text-brand-black hover:bg-neutral-light-gray rounded"
        data-testid="header-menu-toggle"
        aria-label="Menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <rect y="3" width="20" height="2" rx="1" />
          <rect y="9" width="20" height="2" rx="1" />
          <rect y="15" width="20" height="2" rx="1" />
        </svg>
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-4">
        {email && (
          <span className="text-xs text-neutral-mid-gray hidden sm:inline" data-testid="header-email">
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
