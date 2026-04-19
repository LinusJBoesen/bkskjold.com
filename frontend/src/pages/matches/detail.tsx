import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { da } from "@/i18n/da";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Calendar, Shield, ExternalLink } from "lucide-react";

interface MatchInfo {
  dbuMatchId: string;
  date: string;
  time: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  locationName: string | null;
  locationAddress: string | null;
  isHome: boolean;
  opponent: string;
}

interface MatchDetailsResponse {
  match: MatchInfo;
  headToHead: {
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    result: "W" | "D" | "L" | null;
  }[];
  opponentSeason: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    recentForm: ("W" | "D" | "L")[];
  } | null;
  commonOpponents: {
    opponent: string;
    ourResult: string;
    ourScore: string;
    theirResult: string;
    theirScore: string;
  }[];
}

const isCompleted = (m: MatchInfo) => m.homeScore !== null && m.awayScore !== null;

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<MatchDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<MatchDetailsResponse>(`/matches/${id}/details`)
      .then(setData)
      .catch(() => setError(da.matchDetail.errorLoading))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div data-testid="match-detail-page" className="animate-fade-in-up">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-6 transition-colors"
          data-testid="match-detail-back"
        >
          <ArrowLeft className="w-4 h-4" />
          {da.matchDetail.back}
        </button>
        <div className="space-y-4">
          <div className="h-48 bg-zinc-900/50 rounded-xl border border-zinc-800 animate-pulse" />
          <div className="h-32 bg-zinc-900/50 rounded-xl border border-zinc-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div data-testid="match-detail-page" className="animate-fade-in-up">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-6 transition-colors"
          data-testid="match-detail-back"
        >
          <ArrowLeft className="w-4 h-4" />
          {da.matchDetail.back}
        </button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-400" data-testid="match-detail-error">
              {error || da.matchDetail.notFound}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { match } = data;
  const completed = isCompleted(match);
  const address = match.locationAddress || match.venue;
  const venueName = match.locationName || match.venue;
  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  return (
    <div data-testid="match-detail-page" className="animate-fade-in-up max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-6 transition-colors"
        data-testid="match-detail-back"
      >
        <ArrowLeft className="w-4 h-4" />
        {da.matchDetail.back}
      </button>

      {/* Hero section */}
      <div
        className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 mb-6"
        data-testid="match-detail-hero"
      >
        {/* Status badge */}
        <div className="flex justify-between items-start mb-4">
          <Badge variant={completed ? "success" : "default"}>
            {completed ? da.matchDetail.completed : da.matchDetail.upcoming}
          </Badge>
          <Badge variant="secondary">
            {match.isHome ? da.matchDetail.home : da.matchDetail.away}
          </Badge>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-zinc-500" />
            </div>
            <p
              className={`text-lg sm:text-xl font-bold ${
                match.isHome ? "text-red-400" : "text-zinc-200"
              }`}
              data-testid="match-detail-home-team"
            >
              {match.homeTeam}
            </p>
          </div>

          <div className="text-center" data-testid="match-detail-score">
            {completed ? (
              <p className="text-3xl sm:text-4xl font-bold tabular-nums text-zinc-50">
                {match.homeScore} - {match.awayScore}
              </p>
            ) : (
              <p className="text-2xl font-medium text-zinc-600">vs</p>
            )}
          </div>

          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-zinc-500" />
            </div>
            <p
              className={`text-lg sm:text-xl font-bold ${
                !match.isHome ? "text-red-400" : "text-zinc-200"
              }`}
              data-testid="match-detail-away-team"
            >
              {match.awayTeam}
            </p>
          </div>
        </div>

        {/* Meta: date, kickoff, venue */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-zinc-400">
            <Calendar className="w-4 h-4 shrink-0" />
            <span data-testid="match-detail-date">{match.date}</span>
          </div>

          {match.time && (
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock className="w-4 h-4 shrink-0" />
              <span data-testid="match-detail-time">{match.time}</span>
            </div>
          )}

          {venueName && (
            <div className="flex items-center gap-2 text-zinc-400">
              <MapPin className="w-4 h-4 shrink-0" />
              <span data-testid="match-detail-venue" className="truncate">
                {venueName}
              </span>
            </div>
          )}
        </div>

        {/* Address + Google Maps link */}
        {address && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-zinc-500">{address}</span>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                data-testid="match-detail-maps-link"
              >
                <ExternalLink className="w-3 h-3" />
                {da.matchDetail.openInMaps}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
