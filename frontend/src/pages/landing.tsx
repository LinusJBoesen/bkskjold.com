import { Link } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-600/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-red-600/10 border border-red-600/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-red-500" />
          </div>
          <span className="text-lg font-bold text-zinc-50 tracking-tight">BK Skjold</span>
        </div>
        <Link
          to="/login"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-zinc-200 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          Log ind
          <ArrowRight className="h-4 w-4" />
        </Link>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 md:pt-36 pb-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-400 text-xs font-medium mb-8 animate-fade-in-up">
          <Shield className="h-3.5 w-3.5" />
          Serie 6 · Herrer
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-zinc-50 tracking-tight leading-[1.1] max-w-3xl animate-fade-in-up">
          Velkommen til
          <br />
          <span className="bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
            B.K. Skjolds
          </span>
          <br />
          bedste hold
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
          <a
            href="https://www.instagram.com/bkskjold13/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <InstagramIcon className="h-4 w-4" />
            Følg os på Instagram
          </a>
        </div>
      </main>

      {/* Instagram Embed */}
      <section className="relative z-10 px-6 md:px-12 pb-20">
        <div className="max-w-3xl mx-auto">
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
