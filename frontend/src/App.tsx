import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import FinesOverviewPage from "@/pages/fines/overview";
import FineDetailPage from "@/pages/fines/detail";
import TeamSelectorPage from "@/pages/teams/selector";
import TrainingHistoryPage from "@/pages/history/training";
import TournamentStandingsPage from "@/pages/tournament/standings";
import MatchAnalysisPage from "@/pages/analysis/match";
import AdminSettingsPage from "@/pages/admin/settings";

function ProtectedLayout() {
  const { isAuthenticated, loading, email, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <p className="text-neutral-mid-gray">Indlæser...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-brand-off-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header email={email} onLogout={logout} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function LoginRoute() {
  const { isAuthenticated, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <p className="text-neutral-mid-gray">Indlæser...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage onLogin={login} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route element={<ProtectedLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="fines" element={<FinesOverviewPage />} />
          <Route path="fines/:playerId" element={<FineDetailPage />} />
          <Route path="teams" element={<TeamSelectorPage />} />
          <Route path="history" element={<TrainingHistoryPage />} />
          <Route path="tournament" element={<TournamentStandingsPage />} />
          <Route path="analysis" element={<MatchAnalysisPage />} />
          <Route path="admin" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
