import { da } from "@/i18n/da";

export default function MatchAnalysisPage() {
  return (
    <div data-testid="page-analysis">
      <h1 className="text-2xl font-bold text-brand-black">{da.nav.analysis}</h1>
      <p className="text-neutral-mid-gray mt-2">{da.common.comingSoon}</p>
    </div>
  );
}
