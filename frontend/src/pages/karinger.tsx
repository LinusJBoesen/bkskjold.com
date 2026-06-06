import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { da } from "@/i18n/da";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/toast";
import { Award as AwardIcon, Check, Eye, Trash2, Plus, ChevronRight, Trophy, Crown, Vote, Lock } from "lucide-react";

interface Candidate {
  id: string;
  type: "player" | "fan" | "user";
  name: string;
  profilePicture?: string | null;
  voteCount: number | null;
}

interface Award {
  id: string;
  title: string;
  description: string | null;
  status: "suggested" | "open" | "revealed";
  candidates: Candidate[];
  myVoteCandidateId: string | null;
  createdAt: string;
  revealedAt: string | null;
}

interface Player { id: string; display_name: string; profile_picture: string | null }
// Unified picker entry for the Fans column: either a fan_signups record
// (kind="signup", id refers to fan_signups.id) or a fan-role user account
// (kind="user", id refers to users.id).
interface Fan { id: string; name: string; kind: "signup" | "user" }

type Tab = "vote" | "results" | "suggest" | "admin";

function Avatar({ name, src, size = "md" }: { name: string; src?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  if (src) return <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover border border-zinc-700 shrink-0`} />;
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={`${sizeClass} rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-medium text-zinc-400 shrink-0`}>
      {initials}
    </div>
  );
}

export default function KaringrPage() {
  const { role } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === "admin";
  const canSuggest = role === "spiller";

  const [tab, setTab] = useState<Tab>("vote");
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [fans, setFans] = useState<Fan[]>([]);

  // Suggest form
  const [sugTitle, setSugTitle] = useState("");
  const [sugDesc, setSugDesc] = useState("");
  const [sugSubmitting, setSugSubmitting] = useState(false);

  // Pending vote selections per award (not yet confirmed)
  const [pendingByAward, setPendingByAward] = useState<Record<string, string>>({});

  // Admin: candidate picker
  const [editingAward, setEditingAward] = useState<Award | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set()); // keys: "p:<id>" or "f:<id>"

  // Admin: "add candidates to open award" picker (separate from the create/approve picker)
  const [addingTo, setAddingTo] = useState<string | null>(null); // award id
  const [addPicks, setAddPicks] = useState<Set<string>>(new Set());

  // Admin: access list
  interface AccessUser { id: string; name: string; email: string; role: string; karingerAccess: boolean }
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>([]);
  const [accessAllowed, setAccessAllowed] = useState<Set<string>>(new Set());
  const [savingAccess, setSavingAccess] = useState(false);

  // Admin: create-from-scratch
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");

  const load = () => {
    setLoading(true);
    const tasks: Promise<unknown>[] = [api.get<Award[]>("/awards").then(setAwards).catch(() => {})];
    if (isAdmin) {
      tasks.push(api.get<Player[]>("/players").then(setPlayers));
      // Combine fan_signups + fan-role users into the Fans picker column.
      // The /awards/access endpoint already returns spiller+fan users; we
      // filter that down to fans for the picker (independent of access flag —
      // anyone can be a candidate even if they can't see the tab).
      tasks.push(Promise.all([
        api.get<{ id: string; name: string }[]>("/fan-signup").catch(() => [] as { id: string; name: string }[]),
        api.get<AccessUser[]>("/awards/access").catch(() => [] as AccessUser[]),
      ]).then(([signups, users]) => {
        const fanUsers = users.filter(u => u.role === "fan").map(u => ({ id: u.id, name: u.name, kind: "user" as const }));
        const fanSignups = signups.map(s => ({ id: s.id, name: s.name, kind: "signup" as const }));
        // Sort alphabetically across the combined set.
        setFans([...fanUsers, ...fanSignups].sort((a, b) => a.name.localeCompare(b.name)));
        setAccessUsers(users);
        setAccessAllowed(new Set(users.filter(r => r.karingerAccess).map(r => r.id)));
      }));
    }
    Promise.all(tasks).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [role]);

  const openAwards = useMemo(() => awards.filter(a => a.status === "open"), [awards]);
  const revealed = useMemo(() => awards.filter(a => a.status === "revealed"), [awards]);
  const suggested = useMemo(() => awards.filter(a => a.status === "suggested"), [awards]);

  const selectPending = (awardId: string, candidateId: string) => {
    setPendingByAward(prev => ({ ...prev, [awardId]: candidateId }));
  };

  const clearPending = (awardId: string) => {
    setPendingByAward(prev => {
      const next = { ...prev };
      delete next[awardId];
      return next;
    });
  };

  const confirmVote = async (awardId: string) => {
    const candidateId = pendingByAward[awardId];
    if (!candidateId) return;
    try {
      await api.post(`/awards/${awardId}/vote`, { candidateId });
      setAwards(prev => prev.map(a => a.id === awardId ? { ...a, myVoteCandidateId: candidateId } : a));
      clearPending(awardId);
      toast("Din stemme er bekræftet og låst", "success");
    } catch (e: any) {
      if (e?.status === 409) {
        toast("Du har allerede stemt på denne nominering", "error");
        load();
      } else {
        toast("Kunne ikke gemme stemme", "error");
      }
    }
  };

  const submitSuggestion = async () => {
    if (!sugTitle.trim()) return;
    setSugSubmitting(true);
    try {
      await api.post("/awards/suggest", { title: sugTitle.trim(), description: sugDesc.trim() || undefined });
      toast("Tak for forslaget — admin gennemgår det", "success");
      setSugTitle("");
      setSugDesc("");
      load();
    } catch {
      toast("Kunne ikke sende forslag", "error");
    }
    setSugSubmitting(false);
  };

  const openEditor = (award: Award) => {
    setEditingAward(award);
    const seed = new Set<string>();
    for (const cand of award.candidates) {
      seed.add(cand.type === "player" ? `p:${cand.id}` : `f:${cand.id}`);
    }
    setPicked(seed);
  };

  const togglePick = (key: string) => {
    setPicked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const submitOpen = async () => {
    if (!editingAward) return;
    if (picked.size < 2) {
      toast("Vælg mindst 2 kandidater", "error");
      return;
    }
    // Map picked back to player/fan IDs (need original lists)
    const candidates: { playerId?: string; fanId?: string }[] = [];
    for (const key of picked) {
      const [kind, id] = key.split(":");
      if (kind === "p") candidates.push({ playerId: id });
      else if (kind === "u") candidates.push({ userId: id });
      else candidates.push({ fanId: id });
    }
    try {
      await api.post(`/awards/${editingAward.id}/open`, { candidates });
      toast("Afstemning åbnet", "success");
      setEditingAward(null);
      setPicked(new Set());
      load();
    } catch {
      toast("Kunne ikke åbne afstemning", "error");
    }
  };

  const submitCreate = async () => {
    if (!createTitle.trim()) return;
    if (picked.size < 2) {
      toast("Vælg mindst 2 kandidater", "error");
      return;
    }
    const candidates: { playerId?: string; fanId?: string }[] = [];
    for (const key of picked) {
      const [kind, id] = key.split(":");
      if (kind === "p") candidates.push({ playerId: id });
      else if (kind === "u") candidates.push({ userId: id });
      else candidates.push({ fanId: id });
    }
    try {
      await api.post("/awards/create", { title: createTitle.trim(), description: createDesc.trim() || undefined, candidates });
      toast("Nominering oprettet og åbnet for afstemning", "success");
      setCreateTitle("");
      setCreateDesc("");
      setPicked(new Set());
      load();
    } catch {
      toast("Kunne ikke oprette nominering", "error");
    }
  };

  const reveal = async (id: string) => {
    if (!confirm("Afslør resultater og luk afstemningen?")) return;
    try {
      await api.post(`/awards/${id}/reveal`);
      toast("Resultater afsløret", "success");
      load();
    } catch {
      toast("Kunne ikke afsløre resultater", "error");
    }
  };

  const toggleAccess = (userId: string) => {
    setAccessAllowed(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  };

  const saveAccess = async () => {
    setSavingAccess(true);
    try {
      await api.put("/awards/access", { allowedUserIds: Array.from(accessAllowed) });
      toast("Adgang opdateret", "success");
      load();
    } catch {
      toast("Kunne ikke gemme adgang", "error");
    }
    setSavingAccess(false);
  };

  const startAddCandidates = (awardId: string) => {
    setAddingTo(awardId);
    setAddPicks(new Set());
  };

  const toggleAddPick = (key: string) => {
    setAddPicks(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const submitAddCandidates = async () => {
    if (!addingTo || addPicks.size === 0) return;
    const candidates: { playerId?: string; fanId?: string }[] = [];
    for (const key of addPicks) {
      const [kind, id] = key.split(":");
      if (kind === "p") candidates.push({ playerId: id });
      else if (kind === "u") candidates.push({ userId: id });
      else candidates.push({ fanId: id });
    }
    try {
      const res = await api.post<{ added: number }>(`/awards/${addingTo}/candidates`, { candidates });
      toast(`${res.added} kandidat${res.added === 1 ? "" : "er"} tilføjet`, "success");
      setAddingTo(null);
      setAddPicks(new Set());
      load();
    } catch {
      toast("Kunne ikke tilføje kandidater", "error");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Er du sikker på, at du vil slette denne nominering?")) return;
    try {
      await api.delete(`/awards/${id}`);
      toast("Nominering slettet", "success");
      load();
    } catch {
      toast("Kunne ikke slette nominering", "error");
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: "vote", label: "Stem", icon: <Vote className="w-4 h-4" />, show: true },
    { id: "results", label: "Resultater", icon: <Trophy className="w-4 h-4" />, show: true },
    { id: "suggest", label: "Foreslå", icon: <Plus className="w-4 h-4" />, show: canSuggest },
    { id: "admin", label: "Administrér", icon: <AwardIcon className="w-4 h-4" />, show: isAdmin },
  ];

  return (
    <div data-testid="page-karinger" className="animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <AwardIcon className="w-7 h-7 text-amber-400" />
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-50 tracking-tight">{da.nav.karinger}</h1>
      </div>

      <div className="flex gap-1 mb-6 border-b border-zinc-800 overflow-x-auto" data-testid="karinger-tabs">
        {tabs.filter(t => t.show).map(t => (
          <button
            key={t.id}
            data-testid={`karinger-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors shrink-0 ${
              tab === t.id ? "border-red-500 text-red-400" : "border-transparent text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-zinc-500 text-sm">Indlæser...</p>}

      {!loading && tab === "vote" && (
        <div className="space-y-4" data-testid="karinger-vote-list">
          {openAwards.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-zinc-500 text-sm">Ingen åbne nomineringer lige nu</CardContent></Card>
          ) : openAwards.map(a => (
            <Card key={a.id} data-testid={`award-${a.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{a.title}</CardTitle>
                    {a.description && <p className="text-sm text-zinc-400 mt-1">{a.description}</p>}
                  </div>
                  <Badge variant="warning">Åben</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {a.myVoteCandidateId ? (
                  <p className="text-xs text-emerald-400 mb-3 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Din stemme er bekræftet og låst indtil afsløring.
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 mb-3">Vælg din favorit og bekræft. Når du har bekræftet, kan du ikke ændre din stemme.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {a.candidates.map(cand => {
                    const isVotedFor = a.myVoteCandidateId === cand.id;
                    const isPending = !a.myVoteCandidateId && pendingByAward[a.id] === cand.id;
                    const isLocked = !!a.myVoteCandidateId;
                    return (
                      <button
                        key={cand.id}
                        data-testid={`candidate-${cand.id}`}
                        onClick={() => !isLocked && selectPending(a.id, cand.id)}
                        disabled={isLocked && !isVotedFor}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                          isVotedFor
                            ? "border-emerald-500 bg-emerald-500/10"
                            : isPending
                            ? "border-amber-500 bg-amber-500/10"
                            : isLocked
                            ? "border-zinc-900 bg-zinc-900/30 opacity-50 cursor-not-allowed"
                            : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50"
                        }`}
                      >
                        <Avatar name={cand.name} src={cand.profilePicture} />
                        <span className="text-sm text-zinc-200 flex-1 min-w-0 truncate">{cand.name}</span>
                        {(cand.type === "fan" || cand.type === "user") && <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Fan</span>}
                        {isAdmin && cand.voteCount !== null && (
                          <span className="text-[11px] font-semibold tabular-nums bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded shrink-0">{cand.voteCount}</span>
                        )}
                        {isVotedFor && <Lock className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {isPending && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {!a.myVoteCandidateId && pendingByAward[a.id] && (() => {
                  const pendCand = a.candidates.find(c => c.id === pendingByAward[a.id]);
                  return (
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-zinc-800">
                      <Button
                        onClick={() => confirmVote(a.id)}
                        data-testid={`confirm-vote-${a.id}`}
                        className="flex-1"
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        Bekræft stemme på {pendCand?.name ?? ""}
                      </Button>
                      <Button variant="secondary" onClick={() => clearPending(a.id)}>
                        Annullér valg
                      </Button>
                    </div>
                  );
                })()}
                {isAdmin && (() => {
                  const totalVotes = a.candidates.reduce((s, c) => s + (c.voteCount ?? 0), 0);
                  return (
                    <div className="mt-4 pt-3 border-t border-zinc-800 space-y-3">
                      <p className="text-xs text-zinc-500">Admin: {totalVotes} stemme{totalVotes === 1 ? "" : "r"} indtil videre.</p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => startAddCandidates(a.id)}>
                          <Plus className="w-4 h-4 mr-1.5" /> Tilføj kandidater
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => reveal(a.id)}>
                          <Eye className="w-4 h-4 mr-1.5" /> Afslør resultater
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => remove(a.id)} className="text-red-400">
                          <Trash2 className="w-4 h-4 mr-1.5" /> Slet
                        </Button>
                      </div>
                      {addingTo === a.id && (
                        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                          <p className="text-xs text-amber-200 mb-2">Vælg nye kandidater. Eksisterende ignoreres automatisk — afgivne stemmer røres ikke.</p>
                          <CandidatePicker players={players} fans={fans} picked={addPicks} onToggle={toggleAddPick} />
                          <div className="flex gap-2 mt-3 pt-2 border-t border-amber-500/20">
                            <Button size="sm" onClick={submitAddCandidates} disabled={addPicks.size === 0}>
                              <Plus className="w-4 h-4 mr-1.5" /> Tilføj {addPicks.size}
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => { setAddingTo(null); setAddPicks(new Set()); }}>
                              Annullér
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && tab === "results" && (
        <div className="space-y-4" data-testid="karinger-results-list">
          {revealed.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-zinc-500 text-sm">Ingen afslørede nomineringer endnu</CardContent></Card>
          ) : revealed.map(a => {
            const total = a.candidates.reduce((s, c) => s + (c.voteCount ?? 0), 0);
            const maxVotes = Math.max(0, ...a.candidates.map(c => c.voteCount ?? 0));
            return (
              <Card key={a.id} data-testid={`result-${a.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                      {a.description && <p className="text-sm text-zinc-400 mt-1">{a.description}</p>}
                    </div>
                    <Badge variant="success">Afsløret</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {isAdmin ? (
                    <>
                      <div className="space-y-2">
                        {[...a.candidates].sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0)).map(cand => {
                          const votes = cand.voteCount ?? 0;
                          const pct = total > 0 ? (votes / total) * 100 : 0;
                          const isWinner = votes > 0 && votes === maxVotes;
                          return (
                            <div key={cand.id} className="relative rounded-lg border border-zinc-800 px-3 py-2.5 overflow-hidden">
                              <div className={`absolute inset-y-0 left-0 ${isWinner ? "bg-amber-500/15" : "bg-zinc-800/40"}`} style={{ width: `${pct}%` }} />
                              <div className="relative flex items-center gap-3">
                                <Avatar name={cand.name} src={cand.profilePicture} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-zinc-100 truncate">{cand.name}</span>
                                    {isWinner && <Crown className="w-4 h-4 text-amber-400 shrink-0" />}
                                  </div>
                                </div>
                                <span className="text-sm font-bold tabular-nums text-zinc-200">{votes}</span>
                                <span className="text-xs text-zinc-500 tabular-nums w-12 text-right">{Math.round(pct)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-zinc-500 mt-3">{total} stemme{total === 1 ? "" : "r"} i alt</p>
                    </>
                  ) : a.candidates.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-4">Ingen stemmer afgivet</p>
                  ) : (
                    // Non-admin: just the winner(s), no counts.
                    <div className={`grid gap-3 ${a.candidates.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                      {a.candidates.map(cand => (
                        <div key={cand.id} className="flex flex-col items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-6">
                          <Crown className="w-6 h-6 text-amber-400" />
                          <Avatar name={cand.name} src={cand.profilePicture} size="lg" />
                          <div className="text-center">
                            <p className="text-base font-bold text-zinc-100">{cand.name}</p>
                            <p className="text-[10px] uppercase tracking-wider text-amber-300 mt-1">
                              {a.candidates.length > 1 ? "Delt vinder" : "Vinder"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isAdmin && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                      <Button size="sm" variant="secondary" onClick={() => remove(a.id)} className="text-red-400">
                        <Trash2 className="w-4 h-4 mr-1.5" /> Slet
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && tab === "suggest" && canSuggest && (
        <Card data-testid="karinger-suggest-form">
          <CardHeader>
            <CardTitle>Foreslå en ny nominering</CardTitle>
            <p className="text-sm text-zinc-400 mt-1">Admin vælger kandidaterne og åbner afstemningen.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Titel (fx 'Mest engageret', 'Bedste kølerlampe')"
              value={sugTitle}
              onChange={(e) => setSugTitle(e.target.value)}
              data-testid="suggest-title"
            />
            <textarea
              placeholder="Beskrivelse (valgfrit)"
              value={sugDesc}
              onChange={(e) => setSugDesc(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50"
              data-testid="suggest-description"
            />
            <Button onClick={submitSuggestion} disabled={!sugTitle.trim() || sugSubmitting} data-testid="suggest-submit">
              <Plus className="w-4 h-4 mr-1.5" />
              {sugSubmitting ? "Sender..." : "Send forslag"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && tab === "admin" && isAdmin && (
        <div className="space-y-6">
          {/* Pending suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-zinc-500" />
                Spiller-forslag ({suggested.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suggested.length === 0 ? (
                <p className="text-sm text-zinc-500">Ingen ventende forslag</p>
              ) : (
                <div className="space-y-2">
                  {suggested.map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-3 border border-zinc-800 rounded-lg px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-100 truncate">{a.title}</p>
                        {a.description && <p className="text-xs text-zinc-500 truncate">{a.description}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="secondary" onClick={() => openEditor(a)}>
                          Vælg kandidater
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => remove(a.id)} className="text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Candidate picker (modal-like inline section) */}
          {editingAward && (
            <Card className="border-amber-500/40">
              <CardHeader>
                <CardTitle>Vælg kandidater til "{editingAward.title}"</CardTitle>
                <p className="text-sm text-zinc-400">Vælg mindst 2. Spillere og fans kan blandes.</p>
              </CardHeader>
              <CardContent>
                <CandidatePicker players={players} fans={fans} picked={picked} onToggle={togglePick} />
                <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-800">
                  <Button onClick={submitOpen} disabled={picked.size < 2}>
                    <Check className="w-4 h-4 mr-1.5" /> Åbn afstemning ({picked.size} valgt)
                  </Button>
                  <Button variant="secondary" onClick={() => { setEditingAward(null); setPicked(new Set()); }}>
                    Annullér
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create from scratch */}
          {!editingAward && (
            <Card>
              <CardHeader>
                <CardTitle>Opret nominering fra bunden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Titel" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} />
                <textarea
                  placeholder="Beskrivelse (valgfrit)"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50"
                />
                <CandidatePicker players={players} fans={fans} picked={picked} onToggle={togglePick} />
                <Button onClick={submitCreate} disabled={!createTitle.trim() || picked.size < 2}>
                  <Plus className="w-4 h-4 mr-1.5" /> Opret og åbn ({picked.size} valgt)
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Adgang til Kåringer — invite list */}
          <Card>
            <CardHeader>
              <CardTitle>Adgang til Nomineringer</CardTitle>
              <p className="text-sm text-zinc-400 mt-1">Vælg de spillere og fans, der må se og stemme i nomineringerne. Nye brugere har som standard ingen adgang.</p>
            </CardHeader>
            <CardContent>
              {accessUsers.length === 0 ? (
                <p className="text-sm text-zinc-500">Ingen brugere registreret endnu.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {accessUsers.map(u => {
                      const sel = accessAllowed.has(u.id);
                      return (
                        <label key={u.id} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${sel ? "bg-emerald-500/10" : "hover:bg-zinc-800/50"}`}>
                          <input type="checkbox" checked={sel} onChange={() => toggleAccess(u.id)} className="accent-emerald-500" />
                          <span className="text-sm text-zinc-200 flex-1 min-w-0 truncate">{u.name}</span>
                          <span className="text-[10px] uppercase tracking-wider text-zinc-500 shrink-0">{u.role}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-zinc-800">
                    <Button onClick={saveAccess} disabled={savingAccess} data-testid="save-access">
                      <Check className="w-4 h-4 mr-1.5" /> {savingAccess ? "Gemmer..." : `Gem adgang (${accessAllowed.size} valgt)`}
                    </Button>
                    <span className="text-xs text-zinc-500">{accessUsers.length} brugere i alt</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function CandidatePicker({ players, fans, picked, onToggle }: {
  players: Player[];
  fans: Fan[];
  picked: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Spillere ({players.length})</p>
        <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
          {players.map(p => {
            const key = `p:${p.id}`;
            const sel = picked.has(key);
            return (
              <label key={p.id} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${sel ? "bg-emerald-500/10" : "hover:bg-zinc-800/50"}`}>
                <input type="checkbox" checked={sel} onChange={() => onToggle(key)} className="accent-emerald-500" />
                <Avatar name={p.display_name} src={p.profile_picture} size="sm" />
                <span className="text-sm text-zinc-200 truncate">{p.display_name}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Fans ({fans.length})</p>
        <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
          {fans.length === 0 ? (
            <p className="text-xs text-zinc-500 px-2 py-1.5">Ingen fans registreret</p>
          ) : fans.map(f => {
            const key = `${f.kind === "user" ? "u" : "f"}:${f.id}`;
            const sel = picked.has(key);
            return (
              <label key={key} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${sel ? "bg-emerald-500/10" : "hover:bg-zinc-800/50"}`}>
                <input type="checkbox" checked={sel} onChange={() => onToggle(key)} className="accent-emerald-500" />
                <Avatar name={f.name} size="sm" />
                <span className="text-sm text-zinc-200 truncate">{f.name}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
