import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Send, Heart, Shield } from "lucide-react";


function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FanSignupSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [comment, setComment] = useState("");
  const [loveLevel, setLoveLevel] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/fan-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, position, comment, love_level: loveLevel }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError("Kunne ikke sende tilmelding");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="relative z-10 px-6 md:px-12 pb-20">
        <div className="max-w-lg mx-auto text-center p-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <Heart className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-lg font-semibold text-zinc-50" data-testid="fan-signup-success">Tak for din tilmelding!</p>
          <p className="text-sm text-zinc-400 mt-2">Vi vender tilbage hurtigst muligt.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 px-6 md:px-12 pb-20">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-5 w-5 text-red-400" />
          <h2 className="text-lg font-semibold text-zinc-200">Vil du være en del af klubben?</h2>
        </div>
        <p className="text-sm text-zinc-400 mb-6">Udfyld formularen herunder, for at komme i betragtning.</p>
        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl border border-white/10 bg-white/[0.02]" data-testid="fan-signup-form">
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1">Navn *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
              data-testid="fan-signup-name"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1">E-mail (valgfrit)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
              data-testid="fan-signup-email"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1">Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
              data-testid="fan-signup-position"
            >
              <option value="">Vælg position</option>
              <option value="keeper">Målmand</option>
              <option value="defender">Forsvar</option>
              <option value="wing">Kant</option>
              <option value="midfield">Central</option>
              <option value="attacker">Angriber</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1">Kommentar</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all resize-none"
              data-testid="fan-signup-comment"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1">
              Kærlighed til BK Skjold: {loveLevel}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={loveLevel}
              onChange={(e) => setLoveLevel(parseInt(e.target.value))}
              className="w-full accent-red-500"
              data-testid="fan-signup-love"
            />
            <div className="flex justify-between text-xs text-zinc-600">
              <span>1</span>
              <span>10</span>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-600/20 transition-all"
            data-testid="fan-signup-submit"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Sender..." : "Send tilmelding"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-x-hidden">
      {/* Background gradient effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-600/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Nav - fixed */}
      <nav className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-12 py-6" style={{ background: "linear-gradient(to bottom, rgba(9,9,11,0.9), rgba(9,9,11,0))" }}>
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="BK Skjold" className="h-9 w-9" />
          <span className="text-lg font-bold text-zinc-50 tracking-tight">BK Skjold</span>
        </div>
        <a
          href="https://www.instagram.com/bkskjold13/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          <InstagramIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Følg os på Instagram</span>
        </a>
      </nav>

      {/* Floating Jerseys - fixed position */}
      {/* Left jersey - black/blue with subtle blue glow */}
      <div className="hidden lg:block absolute left-[-40px] xl:left-0 top-[80px] z-[5] w-[220px] xl:w-[280px] 2xl:w-[340px] pointer-events-none">
        <div className="absolute inset-0 bg-blue-500/8 rounded-full blur-[80px] scale-125" />
        <img
          src="/jersey-away.png"
          alt="BK Skjold udebanetrøje"
          className="relative w-full object-contain drop-shadow-[0_0_25px_rgba(59,130,246,0.15)]"
          style={{ animation: "floatLeft 6s ease-in-out infinite", transform: "rotate(-5deg)" }}
        />
      </div>

      {/* Right jersey - red/white with subtle red glow */}
      <div className="hidden lg:block absolute right-[-40px] xl:right-0 top-[80px] z-[5] w-[220px] xl:w-[280px] 2xl:w-[340px] pointer-events-none">
        <div className="absolute inset-0 bg-red-500/8 rounded-full blur-[80px] scale-125" />
        <img
          src="/jersey-home.png"
          alt="BK Skjold hjemmebanetrøje"
          className="relative w-full object-contain drop-shadow-[0_0_25px_rgba(239,68,68,0.15)]"
          style={{ animation: "floatRight 6s ease-in-out infinite", transform: "rotate(5deg)" }}
        />
      </div>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-12 md:pt-24 pb-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-400 text-xs font-medium mb-8 animate-fade-in-up">
          <img src="/logo.webp" alt="" className="h-3.5 w-3.5" />
          Alexanders Træningshold
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-zinc-50 tracking-tight leading-[1.1] max-w-3xl animate-fade-in-up">
          Velkommen til
          <br />
          <span className="bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
            B.K. Skjolds
          </span>
          <br />
          hold 10
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-xl animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          Holdoversigt, bødesystem, turneringsstilling og mere — alt samlet ét sted.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <Link
            to="/login"
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/30 transition-all duration-200"
          >
            Log ind
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all duration-200"
            data-testid="landing-register-link"
          >
            Tilmeld dig
          </Link>
        </div>
      </main>


      {/* Instagram Embed */}
      <section className="relative z-10 px-6 md:px-12 pb-20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <InstagramIcon className="h-5 w-5 text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-200">@bkskjold13</h2>
          </div>
          <div className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
            <iframe
              src="https://www.instagram.com/bkskjold13/embed"
              className="w-full border-0"
              height="600"
              loading="lazy"
              title="BK Skjold Instagram"
              allowTransparency
            />
          </div>
        </div>
      </section>

      {/* Fan Signup */}
      <FanSignupSection />

      {/* Footer line */}
      <footer className="relative z-10 border-t border-white/5 px-6 md:px-12 py-6 flex items-center justify-between">
        <p className="text-xs text-zinc-600">
          BK Skjold · København
        </p>
        <a
          href="https://www.instagram.com/bkskjold13/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <InstagramIcon className="h-4 w-4" />
        </a>
      </footer>
    </div>
  );
}
