import { da } from "@/i18n/da";

export default function TeamSelectorPage() {
  return (
    <div data-testid="page-teams">
      <h1 className="text-2xl font-bold text-brand-black">{da.nav.teams}</h1>
      <p className="text-neutral-mid-gray mt-2">{da.common.comingSoon}</p>
    </div>
  );
}
