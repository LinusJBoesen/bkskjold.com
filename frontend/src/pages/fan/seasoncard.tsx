import { useAuth } from "@/hooks/use-auth";

// Deterministic "random" from a string seed so the card is always the same per user
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return (s: number) => {
    h = (Math.imul(31, h) + s) | 0;
    return Math.abs(h);
  };
}

function generateCard(name: string) {
  const rand = seededRandom(name);
  const cardNumber = 1000 + (rand(1) % 9000);
  const entrance = String.fromCharCode(65 + (rand(2) % 8)) + (1 + (rand(3) % 9));
  const row = 1 + (rand(4) % 20);
  const seat = 1 + (rand(5) % 30);
  return { cardNumber, entrance, row, seat };
}

const SEASON = "2025/26";

export default function SeasonCardPage() {
  const { name } = useAuth();
  const displayName = name || "Fan";
  const { cardNumber, entrance, row, seat } = generateCard(displayName);

  return (
    <div data-testid="page-seasoncard" className="animate-fade-in-up flex flex-col items-center justify-center min-h-[70vh] px-4">
      <h1 className="text-2xl font-bold text-zinc-50 tracking-tight mb-8">Dit Sæsonkort</h1>

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
        style={{
          background: "linear-gradient(135deg, #1a2744 0%, #243058 40%, #1e2d54 70%, #2a3a6e 100%)",
          aspectRatio: "1.586 / 1",
        }}
      >
        {/* Subtle fan silhouette overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)",
          }}
        />

        {/* Top-right logo area */}
        <div className="absolute top-5 right-5 flex flex-col items-center">
          <img src="/logo.webp" alt="BK Skjold" className="w-16 h-16 drop-shadow-lg" />
          <span className="text-white/40 text-[9px] tracking-widest uppercase mt-2 font-light">BK Skjold 10</span>
        </div>

        {/* Left content */}
        <div className="absolute top-5 left-6 bottom-5 flex flex-col justify-between">
          {/* Season + Title */}
          <div>
            <p className="text-white/60 text-sm font-light tracking-wider">{SEASON}</p>
            <p className="text-white text-4xl font-black tracking-tight leading-none mt-1 drop-shadow">
              SÆSONKORT
            </p>
            <p className="text-white/50 text-xs mt-2 tracking-wide">{displayName.toUpperCase()}</p>
          </div>

          {/* Card details */}
          <div className="space-y-0.5">
            <p className="text-white/70 text-sm font-medium">
              <span className="text-white/40 font-normal">Kortnummer: </span>{cardNumber}
            </p>
            <p className="text-white/70 text-sm font-medium">
              <span className="text-white/40 font-normal">Indgang: </span>{entrance}
            </p>
            <p className="text-white/70 text-sm font-medium">
              <span className="text-white/40 font-normal">Række: </span>{row}
            </p>
            <p className="text-white/70 text-sm font-medium">
              <span className="text-white/40 font-normal">Sæde: </span>{seat}
            </p>
          </div>
        </div>

        {/* Glossy sheen */}
        <div className="absolute inset-0 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%)",
          }}
        />
      </div>

      <p className="text-zinc-600 text-xs mt-6 text-center max-w-xs">
        Dit personlige sæsonkort for sæsonen {SEASON}. Vis det ved indgangen.
      </p>
    </div>
  );
}
