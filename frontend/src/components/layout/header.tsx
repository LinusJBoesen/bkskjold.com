import { Button } from "@/components/ui/button";
import { da } from "@/i18n/da";

interface HeaderProps {
  email: string | null;
  onLogout: () => void;
}

export function Header({ email, onLogout }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-neutral-light-gray flex items-center justify-between px-6" data-testid="header">
      <div />
      <div className="flex items-center gap-4">
        {email && (
          <span className="text-xs text-neutral-mid-gray" data-testid="header-email">
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
