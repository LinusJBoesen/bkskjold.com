import { da } from "@/i18n/da";

export default function TournamentStandingsPage() {
  return (
    <div data-testid="page-tournament">
      <h1 className="text-2xl font-bold text-brand-black">{da.nav.tournament}</h1>
      <p className="text-neutral-mid-gray mt-2">{da.common.comingSoon}</p>
    </div>
  );
}
