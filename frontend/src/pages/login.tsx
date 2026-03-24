import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { da } from "@/i18n/da";

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
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-brand-black">
            {da.layout.appName}
          </CardTitle>
          <p className="text-neutral-mid-gray text-sm">{da.login.title}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div>
              <label htmlFor="email" className="text-xs font-medium text-neutral-mid-gray">
                {da.login.email}
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="text-xs font-medium text-neutral-mid-gray">
                {da.login.password}
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-brand-red" data-testid="login-error">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="login-submit"
            >
              {loading ? da.common.loading : da.login.submit}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
