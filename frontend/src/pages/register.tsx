import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { da } from "@/i18n/da";

type Role = "fan" | "spiller";

interface RegisterResponse {
  success: boolean;
  message: string;
  status: "approved" | "pending";
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("fan");
  const [spondEmail, setSpondEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<"approved" | "pending" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await api.post<RegisterResponse>("/auth/register", {
        name,
        email,
        password,
        role,
        spondEmail: role === "spiller" ? spondEmail || undefined : undefined,
      });
      setSuccess(result.status);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Ukendt fejl");
      }
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in-up">
          <Card className="border-zinc-800 shadow-2xl shadow-black/50 relative overflow-visible">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-red-600/5 to-transparent pointer-events-none" />
            <CardHeader className="text-center relative">
              <img src="/logo.webp" alt="BK Skjold" className="mx-auto mb-3 h-16 w-16" />
              <CardTitle className="text-2xl font-bold text-zinc-50 tracking-tight">
                {da.register.success}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative text-center">
              <p className="text-zinc-400 mb-6" data-testid="register-success-message">
                {success === "approved" ? da.register.fanReady : da.register.pendingApproval}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full h-10 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors"
                data-testid="register-login-link"
              >
                {da.login.title}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative">
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Tilbage
      </Link>
      <div className="w-full max-w-sm animate-fade-in-up">
        <Card className="border-zinc-800 shadow-2xl shadow-black/50 relative overflow-visible">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-red-600/5 to-transparent pointer-events-none" />
          <CardHeader className="text-center relative">
            <img src="/logo.webp" alt="BK Skjold" className="mx-auto mb-3 h-16 w-16" />
            <CardTitle className="text-2xl font-bold text-zinc-50 tracking-tight">
              {da.layout.appName}
            </CardTitle>
            <p className="text-zinc-400 text-sm">{da.register.title}</p>
          </CardHeader>
          <CardContent className="relative">
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-zinc-300 mb-1.5 block">
                  {da.register.name}
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="register-name"
                  placeholder="Dit navn"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-zinc-300 mb-1.5 block">
                  {da.register.email}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="register-email"
                  placeholder="din@email.dk"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium text-zinc-300 mb-1.5 block">
                  {da.register.password}
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="register-password"
                  placeholder="Mindst 6 tegn"
                  required
                  minLength={6}
                />
              </div>

              {/* Role selector */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  {da.register.role}
                </label>
                <div className="grid grid-cols-2 gap-2" data-testid="register-role-selector">
                  <button
                    type="button"
                    onClick={() => setRole("fan")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      role === "fan"
                        ? "bg-red-600/20 border-red-600/50 text-red-400"
                        : "bg-zinc-900/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                    data-testid="register-role-fan"
                  >
                    {da.register.fan}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("spiller")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      role === "spiller"
                        ? "bg-red-600/20 border-red-600/50 text-red-400"
                        : "bg-zinc-900/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                    data-testid="register-role-spiller"
                  >
                    {da.register.player}
                  </button>
                </div>
              </div>

              {/* Spond email field - only for spiller */}
              {role === "spiller" && (
                <div data-testid="register-spond-section">
                  <label htmlFor="spondEmail" className="text-sm font-medium text-zinc-300 mb-1.5 block">
                    {da.register.spondEmail}
                  </label>
                  <Input
                    id="spondEmail"
                    type="email"
                    value={spondEmail}
                    onChange={(e) => setSpondEmail(e.target.value)}
                    data-testid="register-spond-email"
                    placeholder="din@spond-email.dk"
                  />
                  <p className="text-xs text-zinc-500 mt-1">{da.register.spondHint}</p>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                  <p className="text-sm text-red-400" data-testid="register-error">
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 text-sm font-medium shadow-lg shadow-red-600/20"
                disabled={loading}
                data-testid="register-submit"
              >
                {loading ? da.common.loading : da.register.submit}
              </Button>

              <p className="text-center text-sm text-zinc-500">
                <Link to="/login" className="text-red-400 hover:text-red-300 transition-colors" data-testid="register-to-login">
                  {da.register.loginLink}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
