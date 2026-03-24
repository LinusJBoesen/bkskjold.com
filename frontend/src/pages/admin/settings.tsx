import { da } from "@/i18n/da";

export default function AdminSettingsPage() {
  return (
    <div data-testid="page-admin">
      <h1 className="text-2xl font-bold text-brand-black">{da.nav.admin}</h1>
      <p className="text-neutral-mid-gray mt-2">{da.common.comingSoon}</p>
    </div>
  );
}
