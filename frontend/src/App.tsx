import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ToastProvider } from "@/components/toast";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import FinesOverviewPage from "@/pages/fines/overview";
import FineDetailPage from "@/pages/fines/detail";
import TeamSelectorPage from "@/pages/teams/selector";
import TrainingHistoryPage from "@/pages/history/training";
import TournamentStandingsPage from "@/pages/tournament/standings";
import MatchAnalysisPage from "@/pages/analysis/match";
import AdminSettingsPage from "@/pages/admin/settings";
import SeasonCardPage from "@/pages/fan/seasoncard";
import MatchDetailPage from "@/pages/matches/detail";

function RoleGuard({ allowed, children }: { allowed: string[]; children: React.ReactNode }) {
  const { role } = useAuth();
  if (role && !allowed.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function ProtectedLayout() {
  const { isAuthenticated, loading, email, role, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Indlæser...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} role={role} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Header email={email} role={role} onLogout={logout} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function LandingRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Indlæser...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
}

function LoginRoute() {
  const { isAuthenticated, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Indlæser...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage onLogin={login} />;
}

function RegisterRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Indlæser...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <RegisterPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route index element={<LandingRoute />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />
          <Route element={<ProtectedLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="fines" element={<RoleGuard allowed={["admin", "spiller"]}><FinesOverviewPage /></RoleGuard>} />
            <Route path="fines/:playerId" element={<RoleGuard allowed={["admin", "spiller"]}><FineDetailPage /></RoleGuard>} />
            <Route path="teams" element={<RoleGuard allowed={["admin", "spiller"]}><TeamSelectorPage /></RoleGuard>} />
            <Route path="history" element={<RoleGuard allowed={["admin", "spiller"]}><TrainingHistoryPage /></RoleGuard>} />
            <Route path="matches/:id" element={<MatchDetailPage />} />
            <Route path="tournament" element={<TournamentStandingsPage />} />
            <Route path="analysis" element={<MatchAnalysisPage />} />
            <Route path="admin" element={<RoleGuard allowed={["admin"]}><AdminSettingsPage /></RoleGuard>} />
            <Route path="seasoncard" element={<RoleGuard allowed={["fan"]}><SeasonCardPage /></RoleGuard>} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
