import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { da } from "@/i18n/da";
import { Shield } from "lucide-react";

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export default function LoginPage({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await onLogin(email, password);
    if (!result.success) {
      setError(result.error || da.login.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <Card className="border-zinc-800 shadow-2xl shadow-black/50 relative overflow-visible">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-red-600/5 to-transparent pointer-events-none" />
          <CardHeader className="text-center relative">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/10 border border-red-600/20">
              <Shield className="h-6 w-6 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-zinc-50 tracking-tight">
              {da.layout.appName}
            </CardTitle>
            <p className="text-zinc-400 text-sm">{da.login.title}</p>
          </CardHeader>
          <CardContent className="relative">
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-zinc-300 mb-1.5 block">
                  {da.login.email}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="login-email"
                  placeholder="admin@skjold.dk"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium text-zinc-300 mb-1.5 block">
                  {da.login.password}
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="login-password"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                  <p className="text-sm text-red-400" data-testid="login-error">
                    {error}
                  </p>
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-10 text-sm font-medium shadow-lg shadow-red-600/20"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? da.common.loading : da.login.submit}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
