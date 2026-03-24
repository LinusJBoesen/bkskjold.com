import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ToastProvider } from "@/components/toast";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Header email={email} onLogout={logout} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
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
      <ToastProvider>
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
      </ToastProvider>
    </BrowserRouter>
  );
}
