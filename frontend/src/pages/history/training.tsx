import { da } from "@/i18n/da";

export default function TrainingHistoryPage() {
  return (
    <div data-testid="page-history">
      <h1 className="text-2xl font-bold text-brand-black">{da.nav.history}</h1>
      <p className="text-neutral-mid-gray mt-2">{da.common.comingSoon}</p>
    </div>
  );
}
