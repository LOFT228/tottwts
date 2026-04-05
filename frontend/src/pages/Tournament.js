import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Shield, Crown, Swords, ChevronRight, RefreshCw, Users } from "lucide-react";
import { XShareButton } from "@/components/XShareButton";
import { tweetChampion } from "@/lib/twitter";
import { motion } from "framer-motion";

export default function Tournament() {
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBracket = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await api.getBracket();
      setBracket(r.data);
    } catch (e) {
      console.error("Bracket error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBracket(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-500">Loading bracket...</p>
        </div>
      </div>
    );
  }

  const semiFinals = bracket?.rounds?.find((r) => r.name === "Semi-Finals");
  const finals = bracket?.rounds?.find((r) => r.name === "Finals");
  const champion = bracket?.champion;
  const hasData = bracket?.rounds?.length > 0;

  return (
    <div className="p-6 lg:p-8 space-y-8" data-testid="tournament-page">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tournament Bracket</h1>
          <p className="text-[11px] text-zinc-500 mt-1">Solana Season Showdown — Elimination Rounds</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchBracket(true)}
          disabled={refreshing}
          className="border-zinc-800 text-zinc-400 hover:border-indigo-500/30 hover:text-indigo-400 h-9 px-3 text-xs"
          data-testid="refresh-bracket-btn"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin mr-1.5" : "mr-1.5"} />
          {refreshing ? "Updating..." : "Refresh"}
        </Button>
      </div>

      {!hasData && (
        <Card className="bg-card border-zinc-800" data-testid="bracket-empty">
          <CardContent className="p-12 text-center">
            <Users size={32} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-sm text-zinc-500">Not enough teams to generate a bracket</p>
            <p className="text-[11px] text-zinc-600 mt-2">At least 2 teams are required for the tournament</p>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
          {/* Champion Banner */}
          {champion && (
            <motion.div initial={{ opacity: 0, scale: 0.92, filter: "blur(16px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <Card className="bg-card border-indigo-500/30 relative overflow-hidden" data-testid="champion-banner">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent" />
                <CardContent className="p-6 relative z-10 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                    <Crown size={28} className="text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-indigo-400">Champion</p>
                    <h2 className="text-xl font-bold text-white">{champion.name}</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Score: <span className="font-mono">{champion.composite_score?.toFixed(0)}</span> | P&L: <span className="font-mono">${champion.stats?.pnl?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                  <Badge className="bg-indigo-500/15 text-indigo-400 border-indigo-500/30 text-xs">{champion.tag}</Badge>
                  <XShareButton
                    onClick={() => tweetChampion(champion.name, champion.composite_score?.toFixed(0))}
                    label="Share"
                    data-testid="share-champion-btn"
                    className="text-zinc-600 hover:text-white"
                  />
                </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Bracket Visualization */}
          <div>
            <h2 className="text-base text-white mb-4 font-semibold flex items-center gap-2">
              <Swords size={16} className="text-indigo-400" /> Bracket
            </h2>
            <div className="flex items-stretch gap-0 overflow-x-auto pb-4" data-testid="bracket-view">
              {/* Semi-Finals */}
              {semiFinals && (
                <div className="flex flex-col justify-center gap-6 min-w-[280px]">
                  <div className="text-center mb-2">
                    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[10px]">
                      Semi-Finals
                    </Badge>
                  </div>
                  {semiFinals.matches.map((match, mi) => (
                    <motion.div key={match.id} initial={{ opacity: 0, x: -16, filter: "blur(10px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} transition={{ delay: mi * 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                      <MatchCard match={match} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Connector Lines */}
              {semiFinals && (
                <div className="flex flex-col justify-center min-w-[60px] relative">
                  <svg viewBox="0 0 60 200" className="w-[60px] h-[200px]" preserveAspectRatio="none">
                    <line x1="0" y1="50" x2="30" y2="50" stroke="#27272a" strokeWidth="2" />
                    <line x1="0" y1="150" x2="30" y2="150" stroke="#27272a" strokeWidth="2" />
                    <line x1="30" y1="50" x2="30" y2="150" stroke="#27272a" strokeWidth="2" />
                    <line x1="30" y1="100" x2="60" y2="100" stroke="#6366f1" strokeWidth="2" />
                  </svg>
                </div>
              )}

              {/* Finals */}
              {finals && (
                <div className="flex flex-col justify-center min-w-[280px]">
                  <div className="text-center mb-2">
                    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[10px]">
                      Finals
                    </Badge>
                  </div>
                  {finals.matches.map((match, mi) => (
                    <motion.div key={match.id} initial={{ opacity: 0, x: -16, filter: "blur(10px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} transition={{ delay: 0.3 + mi * 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                      <MatchCard match={match} isFinal />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Connector to Champion */}
              {finals && (
                <div className="flex flex-col justify-center min-w-[60px]">
                  <svg viewBox="0 0 60 200" className="w-[60px] h-[200px]" preserveAspectRatio="none">
                    <line x1="0" y1="100" x2="60" y2="100" stroke="#6366f1" strokeWidth="2" />
                  </svg>
                </div>
              )}

              {/* Champion Trophy */}
              {champion && (
                <div className="flex flex-col justify-center min-w-[200px]">
                  <motion.div initial={{ opacity: 0, scale: 0.85, filter: "blur(14px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                    <Card className="bg-card border-indigo-500/40" data-testid="bracket-champion">
                      <CardContent className="p-5 text-center">
                        <Crown size={32} className="text-indigo-400 mx-auto mb-2" />
                        <p className="text-[10px] text-indigo-400">Champion</p>
                        <p className="text-sm font-bold text-white mt-1">{champion.name}</p>
                        <p className="text-xs text-indigo-400 font-mono mt-1">{champion.composite_score?.toFixed(0)} pts</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              )}
            </div>
          </div>

          {/* Match Details */}
          <div>
            <h2 className="text-lg text-white mb-4 font-semibold">Match Details</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="match-details">
              {bracket?.rounds?.flatMap((round) =>
                round.matches.map((match) => (
                  <Card key={match.id} className="bg-card border-zinc-800" data-testid={`match-detail-${match.id}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-zinc-500 flex items-center gap-2">
                        <Swords size={12} /> {round.name} — Match {match.id.toUpperCase()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <TeamRow team={match.team1} isWinner={match.winner_id === match.team1.id} />
                      <div className="text-center text-[11px] text-zinc-600">VS</div>
                      <TeamRow team={match.team2} isWinner={match.winner_id === match.team2.id} />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Score Breakdown */}
          <Card className="bg-card border-zinc-800" data-testid="score-info">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-zinc-500 flex items-center gap-2">
                <Trophy size={12} className="text-indigo-400" /> Scoring Formula
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[11px] text-zinc-500">P&L Weight</p>
                  <p className="text-lg font-semibold text-indigo-400 font-mono">40%</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500">Volume Weight</p>
                  <p className="text-lg font-semibold text-indigo-400 font-mono">25%</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500">Win Rate Weight</p>
                  <p className="text-lg font-semibold text-indigo-400 font-mono">20%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MatchCard({ match, isFinal }) {
  const borderColor = isFinal ? "border-indigo-500/30" : "border-zinc-800";
  return (
    <Card className={`bg-card ${borderColor}`}>
      <CardContent className="p-0">
        <TeamSlot team={match.team1} isWinner={match.winner_id === match.team1.id} />
        <div className="h-px bg-white/5" />
        <TeamSlot team={match.team2} isWinner={match.winner_id === match.team2.id} />
      </CardContent>
    </Card>
  );
}

function TeamSlot({ team, isWinner }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${isWinner ? "bg-indigo-500/5" : ""}`} data-testid={`team-slot-${team.id}`}>
      <div className={`w-7 h-7 rounded-md flex items-center justify-center border ${isWinner ? "bg-indigo-500/10 border-indigo-500/30" : "bg-zinc-800 border-zinc-700"}`}>
        <Shield size={14} className={isWinner ? "text-indigo-400" : "text-zinc-500"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs ${isWinner ? "text-white font-semibold" : "text-zinc-400"}`}>{team.name}</p>
        <p className="text-[11px] text-zinc-500">{team.tag}</p>
      </div>
      <div className="text-right">
        <p className={`text-xs font-semibold font-mono ${isWinner ? "text-indigo-400" : "text-zinc-500"}`}>
          {team.composite_score?.toFixed(0)}
        </p>
      </div>
      {isWinner && <ChevronRight size={12} className="text-indigo-400" />}
    </div>
  );
}

function TeamRow({ team, isWinner }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-md ${isWinner ? "bg-indigo-500/5 border border-indigo-500/20" : "bg-zinc-800/20 border border-transparent"}`}>
      <Shield size={16} className={isWinner ? "text-indigo-400" : "text-zinc-500"} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={`text-xs ${isWinner ? "text-white font-semibold" : "text-zinc-400"}`}>{team.name}</p>
          <Badge className={`text-[10px] ${isWinner ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : "bg-zinc-800 text-zinc-600 border-zinc-700"}`}>
            {team.tag}
          </Badge>
        </div>
        <div className="flex gap-3 mt-1 text-[11px] text-zinc-500">
          <span>P&L: <span className={team.stats?.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>${team.stats?.pnl?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
          <span>WR: {team.stats?.avg_win_rate}%</span>
        </div>
      </div>
      <p className={`text-sm font-semibold font-mono ${isWinner ? "text-indigo-400" : "text-zinc-600"}`}>
        {team.composite_score?.toFixed(0)}
      </p>
      {isWinner && <Trophy size={14} className="text-indigo-400" />}
    </div>
  );
}
