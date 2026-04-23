import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { da } from "@/i18n/da";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ArrowLeft, MapPin, Clock, Calendar, Shield, ExternalLink, Swords, BarChart3, Users, Info, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/toast";

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
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    avgGoalsFor: number;
    avgGoalsAgainst: number;
    recentForm: ("W" | "D" | "L")[];
  } | null;
  commonOpponents: {
    opponent: string;
    ourResult: string;
    ourScore: string;
    theirResult: string;
    theirScore: string;
  }[];
  matchInfo: {
    referee: string | null;
    venueName: string | null;
    venueAddress: string | null;
    pitch: string | null;
    homeLineup: string[];
    awayLineup: string[];
    homeOfficials: string[];
    awayOfficials: string[];
    goalScorers: { name: string; team: string; goals: number }[];
    goalEvents: {
      scorer: string;
      assist: string | null;
      team: "home" | "away";
      minute: string | null;
    }[];
  } | null;
}

const isCompleted = (m: MatchInfo) => m.homeScore !== null && m.awayScore !== null;

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<MatchDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHomeLineup, setShowHomeLineup] = useState(false);
  const [showAwayLineup, setShowAwayLineup] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { role } = useAuth();
  const { toast } = useToast();

  const refreshFromDbu = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      await api.post(`/dbu/matches/${id}/info/refresh`, {});
      const fresh = await api.get<MatchDetailsResponse>(`/matches/${id}/details`);
      setData(fresh);
      toast(da.matchDetail.refreshed, "success");
    } catch {
      toast(da.matchDetail.refreshError, "error");
    } finally {
      setRefreshing(false);
    }
  };

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
      <div data-testid="match-detail-page" className="animate-fade-in-up max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-6 transition-colors"
          data-testid="match-detail-back"
        >
          <ArrowLeft className="w-4 h-4" />
          {da.matchDetail.back}
        </button>
        <div className="space-y-4">
          <div className="h-48 bg-zinc-900/50 rounded-xl border border-zinc-800 animate-pulse" data-testid="match-detail-skeleton-hero" />
          <div className="h-32 bg-zinc-900/50 rounded-xl border border-zinc-800 animate-pulse" data-testid="match-detail-skeleton-h2h" />
          <div className="h-24 bg-zinc-900/50 rounded-xl border border-zinc-800 animate-pulse" data-testid="match-detail-skeleton-season" />
          <div className="h-32 bg-zinc-900/50 rounded-xl border border-zinc-800 animate-pulse" data-testid="match-detail-skeleton-common" />
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

      {/* Head-to-Head & Opponent Season — side by side on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Head-to-Head */}
        <Card className="bg-zinc-900/50 border-zinc-800" data-testid="match-detail-h2h">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Swords className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-zinc-200">
                {da.matchDetail.headToHead}
              </h3>
            </div>
            {data.headToHead.length === 0 ? (
              <p className="text-sm text-zinc-500">{da.matchDetail.noHeadToHead}</p>
            ) : (
              <div className="space-y-1.5">
                {data.headToHead.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md bg-zinc-800/30"
                    data-testid="match-detail-h2h-row"
                  >
                    <span className="text-zinc-500 text-xs w-20 shrink-0">{h.date}</span>
                    <span className="text-zinc-300 flex-1 text-center truncate text-xs">
                      {h.homeTeam} vs {h.awayTeam}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-zinc-200 tabular-nums text-xs">
                        {h.homeScore !== null ? `${h.homeScore}-${h.awayScore}` : "-"}
                      </span>
                      {h.result && (
                        <ResultBadge result={h.result} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opponent Season Snapshot */}
        <Card className="bg-zinc-900/50 border-zinc-800" data-testid="match-detail-opponent-season">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-zinc-200">
                {da.matchDetail.opponentSeason}
              </h3>
            </div>
            {data.opponentSeason ? (
              <div>
                {/* W/D/L pills */}
                <div className="flex gap-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                      {data.opponentSeason.wins}
                    </span>
                    <span className="text-xs text-zinc-500">{da.matchDetail.wins}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                      {data.opponentSeason.draws}
                    </span>
                    <span className="text-xs text-zinc-500">{da.matchDetail.draws}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-md bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold">
                      {data.opponentSeason.losses}
                    </span>
                    <span className="text-xs text-zinc-500">{da.matchDetail.losses}</span>
                  </div>
                </div>

                {/* Goals */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-zinc-400">
                  <span>
                    {da.matchDetail.played}: <span className="text-zinc-200 font-medium">{data.opponentSeason.played}</span>
                  </span>
                  <span>
                    {da.matchDetail.goalsFor}: <span className="text-zinc-200 font-medium">{data.opponentSeason.goalsFor}</span>
                  </span>
                  <span>
                    {da.matchDetail.goalsAgainst}: <span className="text-zinc-200 font-medium">{data.opponentSeason.goalsAgainst}</span>
                  </span>
                  <span>
                    {da.matchDetail.avgGoalsFor}: <span className="text-zinc-200 font-medium">{data.opponentSeason.avgGoalsFor.toFixed(2)}</span>
                  </span>
                  <span>
                    {da.matchDetail.avgGoalsAgainst}: <span className="text-zinc-200 font-medium">{data.opponentSeason.avgGoalsAgainst.toFixed(2)}</span>
                  </span>
                </div>

                {/* Recent form */}
                {data.opponentSeason.recentForm.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">{da.matchDetail.recentForm}</p>
                    <div className="flex gap-1">
                      {data.opponentSeason.recentForm.map((r, i) => (
                        <ResultBadge key={i} result={r} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">{da.matchDetail.noData}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Common Opponents */}
      <Card className="bg-zinc-900/50 border-zinc-800 mb-6" data-testid="match-detail-common-opponents">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-zinc-200">
              {da.matchDetail.commonOpponents}
            </h3>
          </div>
          {data.commonOpponents.length === 0 ? (
            <p className="text-sm text-zinc-500">{da.matchDetail.noCommonOpponents}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{da.matchDetail.opponent}</TableHead>
                  <TableHead className="text-center">{da.matchDetail.us}</TableHead>
                  <TableHead className="text-center">{da.matchDetail.them}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.commonOpponents.map((co, i) => (
                  <TableRow key={i} data-testid="match-detail-common-row">
                    <TableCell className="text-zinc-300 text-sm">{co.opponent}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <ResultBadge result={co.ourResult as "W" | "D" | "L"} />
                        <span className="text-xs text-zinc-400 tabular-nums">{co.ourScore}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <ResultBadge result={co.theirResult as "W" | "D" | "L"} />
                        <span className="text-xs text-zinc-400 tabular-nums">{co.theirScore}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Kampfakta */}
      <Card className="bg-zinc-900/50 border-zinc-800 mb-6" data-testid="match-detail-kampfakta">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-zinc-200">
                {da.matchDetail.kampfakta}
              </h3>
            </div>
            {role === "admin" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={refreshFromDbu}
                disabled={refreshing}
                data-testid="match-detail-refresh-dbu"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refreshing ? "animate-spin" : ""}`} />
                {da.matchDetail.refreshFromDbu}
              </Button>
            )}
          </div>
          {!data.matchInfo ? (
            <p className="text-sm text-zinc-500">{da.matchDetail.noKampfakta}</p>
          ) : (
            <div className="space-y-4">
              {/* Referee & Pitch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {data.matchInfo.referee && (
                  <div data-testid="match-detail-referee">
                    <span className="text-zinc-500 text-xs">{da.matchDetail.dommer}</span>
                    <p className="text-zinc-200">{data.matchInfo.referee}</p>
                  </div>
                )}
                {data.matchInfo.pitch && (
                  <div data-testid="match-detail-pitch">
                    <span className="text-zinc-500 text-xs">{da.matchDetail.bane}</span>
                    <p className="text-zinc-200">{data.matchInfo.pitch}</p>
                  </div>
                )}
              </div>

              {/* Goal events (scorer + assist, per-event) — falls back to the flat
                  scorer tally for rows where we only have aggregated data. */}
              {data.matchInfo.goalEvents && data.matchInfo.goalEvents.length > 0 ? (
                <div data-testid="match-detail-goal-events">
                  <span className="text-zinc-500 text-xs">{da.matchDetail.goalEvents}</span>
                  <ul className="mt-1 space-y-1">
                    {data.matchInfo.goalEvents.map((ev, i) => {
                      const teamName = ev.team === "home" ? match.homeTeam : match.awayTeam;
                      return (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-xs text-zinc-300"
                          data-testid="match-detail-goal-event"
                        >
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">⚽</span>
                          <span className="text-zinc-500 w-24 truncate shrink-0">{teamName}</span>
                          <span className="font-medium text-zinc-200">{ev.scorer}</span>
                          {ev.assist && (
                            <span className="text-zinc-500">
                              ({da.matchDetail.assist}: <span className="text-zinc-300">{ev.assist}</span>)
                            </span>
                          )}
                          {ev.minute && <span className="ml-auto text-zinc-500 tabular-nums">{ev.minute}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : data.matchInfo.goalScorers.length > 0 && (
                <div data-testid="match-detail-scorers">
                  <span className="text-zinc-500 text-xs">{da.matchDetail.maalscorere}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {data.matchInfo.goalScorers.map((gs, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 text-xs border border-zinc-700"
                      >
                        {gs.name}
                        {gs.goals > 1 && (
                          <span className="text-red-400 font-bold">×{gs.goals}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Officials */}
              {(data.matchInfo.homeOfficials.length > 0 || data.matchInfo.awayOfficials.length > 0) && (
                <div>
                  <span className="text-zinc-500 text-xs">{da.matchDetail.holdleder}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {data.matchInfo.homeOfficials.length > 0 && (
                      <div className="text-xs text-zinc-300">
                        <span className="text-zinc-500">{match.homeTeam}:</span>{" "}
                        {data.matchInfo.homeOfficials.join(", ")}
                      </div>
                    )}
                    {data.matchInfo.awayOfficials.length > 0 && (
                      <div className="text-xs text-zinc-300">
                        <span className="text-zinc-500">{match.awayTeam}:</span>{" "}
                        {data.matchInfo.awayOfficials.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Home Lineup (collapsible) */}
              {data.matchInfo.homeLineup.length > 0 && (
                <div data-testid="match-detail-lineup-home">
                  <button
                    onClick={() => setShowHomeLineup(!showHomeLineup)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    data-testid="match-detail-lineup-home-toggle"
                  >
                    {showHomeLineup ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {da.matchDetail.opstillingHjemme} ({match.homeTeam})
                  </button>
                  {showHomeLineup && (
                    <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {data.matchInfo.homeLineup.map((p, i) => (
                        <span key={i} className="text-xs text-zinc-300 py-0.5">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Away Lineup (collapsible) */}
              {data.matchInfo.awayLineup.length > 0 && (
                <div data-testid="match-detail-lineup-away">
                  <button
                    onClick={() => setShowAwayLineup(!showAwayLineup)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    data-testid="match-detail-lineup-away-toggle"
                  >
                    {showAwayLineup ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {da.matchDetail.opstillingUde} ({match.awayTeam})
                  </button>
                  {showAwayLineup && (
                    <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {data.matchInfo.awayLineup.map((p, i) => (
                        <span key={i} className="text-xs text-zinc-300 py-0.5">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* If no data at all in matchInfo fields */}
              {!data.matchInfo.referee && !data.matchInfo.pitch && data.matchInfo.goalScorers.length === 0 && (!data.matchInfo.goalEvents || data.matchInfo.goalEvents.length === 0) && data.matchInfo.homeLineup.length === 0 && data.matchInfo.awayLineup.length === 0 && (
                <p className="text-sm text-zinc-500">{da.matchDetail.noData}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResultBadge({ result }: { result: "W" | "D" | "L" }) {
  const styles = {
    W: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    D: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    L: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border ${styles[result]}`}>
      {result === "W" ? "S" : result === "D" ? "U" : "T"}
    </span>
  );
}
