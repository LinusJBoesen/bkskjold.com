import { da } from "@/i18n/da";

export default function DashboardPage() {
  return (
    <div data-testid="page-dashboard">
      <h1 className="text-2xl font-bold text-brand-black">{da.nav.dashboard}</h1>
      <p className="text-neutral-mid-gray mt-2">{da.common.comingSoon}</p>
    </div>
  );
}
