import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Swords, TrendingUp, Users, Activity, Trophy, Zap, ChevronRight, Clock, Target, MessageSquare, Globe, DollarSign, BarChart3, Layers, GitBranch } from "lucide-react";
import { Link } from "react-router-dom";
import { TradingPanel } from "@/components/TradingPanel";

function getTimeRemaining(dateStr) {
  const diff = new Date(dateStr) - new Date();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

export default function Arena() {
  const [stats, setStats] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [adrenaStats, setAdrenaStats] = useState(null);
  const [adrenaLiquidity, setAdrenaLiquidity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await api.seed();
        const [statsRes, compsRes, lbRes] = await Promise.all([
          api.getStats(),
          api.getCompetitions(),
          api.getLeaderboard({ lb_type: "individual", metric: "composite", limit: 5 }),
        ]);
        setStats(statsRes.data);
        setCompetitions(compsRes.data);
        setTopPlayers(lbRes.data);
        // Fetch real Adrena data (non-blocking)
        try {
          const [poolRes, liqRes] = await Promise.all([
            api.getAdrenaPoolStats(),
            api.getAdrenaLiquidity(),
          ]);
          setAdrenaStats(poolRes.data?.data);
          setAdrenaLiquidity(liqRes.data?.data);
        } catch (e) { console.warn("Adrena API unavailable:", e); }
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-500">Loading Arena...</p>
        </div>
      </div>
    );
  }

  const activeComp = competitions.find((c) => c.status === "active");
  const upcomingComp = competitions.find((c) => c.status === "upcoming");

  return (
    <div className="p-6 lg:p-8 space-y-8" data-testid="arena-page">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-lg border border-zinc-800 bg-card" data-testid="hero-section">
        <div className="relative z-10 p-8 lg:p-12">
          <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs mb-4" data-testid="live-badge">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 animate-pulse" />
            Live Competition
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight" data-testid="hero-title">
            {activeComp?.name || "No Active Competition"}
          </h1>
          <p className="text-zinc-400 max-w-2xl text-sm mb-8">{activeComp?.description}</p>
          <div className="flex flex-wrap gap-8 items-end">
            <StatBlock label="Prize Pool" value={`$${activeComp?.prize_pool?.toLocaleString()}`} color="text-indigo-400" />
            <StatBlock label="Time Left" value={activeComp ? getTimeRemaining(activeComp.end_date) : "--"} color="text-zinc-200" />
            <StatBlock label="Participants" value={activeComp?.participant_ids?.length || 0} color="text-white" />
            <StatBlock label="Total Volume" value={`$${((activeComp?.total_volume || 0) / 1000).toFixed(0)}k`} color="text-zinc-300" />
            <Link to="/leaderboard">
              <Button className="bg-indigo-500 text-white font-semibold text-xs hover:bg-indigo-600 h-10 px-6 rounded-md" data-testid="view-rankings-btn">
                View Rankings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children" data-testid="stats-grid">
        <StatsCard icon={Users} label="Total Traders" value={stats?.total_players} iconColor="text-indigo-400" />
        <StatsCard icon={TrendingUp} label="Total Volume" value={`$${((stats?.total_volume || 0) / 1000000).toFixed(1)}M`} iconColor="text-indigo-400" />
        <StatsCard icon={Swords} label="Active Comps" value={stats?.active_competitions} iconColor="text-indigo-400" />
        <StatsCard icon={Activity} label="Total Trades" value={(stats?.total_trades || 0).toLocaleString()} iconColor="text-amber-400" />
      </div>

      {/* Live Adrena Protocol Data */}
      {adrenaStats && (
        <section data-testid="adrena-live-data">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={14} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Live Protocol Data</h2>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />Real-time
            </Badge>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-card border-zinc-800 hover:border-zinc-700 transition-colors duration-150">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={13} className="text-zinc-400" strokeWidth={1.5} />
                  <span className="text-[11px] text-zinc-500">Total Volume</span>
                </div>
                <p className="text-xl font-bold font-mono text-white">${(adrenaStats.total_volume_usd / 1e9).toFixed(2)}B</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-zinc-800 hover:border-zinc-700 transition-colors duration-150">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 size={13} className="text-zinc-400" strokeWidth={1.5} />
                  <span className="text-[11px] text-zinc-500">24h Volume</span>
                </div>
                <p className="text-xl font-bold font-mono text-white">${(adrenaStats.daily_volume_usd / 1000).toFixed(1)}k</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-zinc-800 hover:border-zinc-700 transition-colors duration-150">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={13} className="text-zinc-400" strokeWidth={1.5} />
                  <span className="text-[11px] text-zinc-500">Total Fees</span>
                </div>
                <p className="text-xl font-bold font-mono text-white">${(adrenaStats.total_fee_usd / 1e6).toFixed(2)}M</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-zinc-800 hover:border-zinc-700 transition-colors duration-150">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Layers size={13} className="text-zinc-400" strokeWidth={1.5} />
                  <span className="text-[11px] text-zinc-500">Pool AUM</span>
                </div>
                <p className="text-xl font-bold font-mono text-white">${adrenaLiquidity?.aumUsdFormatted ? `${(parseFloat(adrenaLiquidity.aumUsdFormatted) / 1000).toFixed(0)}k` : "--"}</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Top Players + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-card border-zinc-800" data-testid="top-traders-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Trophy size={16} className="text-indigo-400" /> Top Traders
              </CardTitle>
              <Link to="/leaderboard">
                <Button variant="ghost" className="text-zinc-500 hover:text-white text-xs" data-testid="view-all-traders-btn">
                  View All <ChevronRight size={12} />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {topPlayers.map((player, i) => (
              <div key={player.id} className="flex items-center gap-4 p-3 rounded-md hover:bg-zinc-800/40 transition-colors duration-150" data-testid={`top-player-${i}`}>
                <span className={`text-sm font-semibold font-mono w-8 text-center ${i === 0 ? "text-indigo-400" : i === 1 ? "text-indigo-400" : i === 2 ? "text-indigo-300" : "text-zinc-600"}`}>
                  #{i + 1}
                </span>
                <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center text-[11px] font-medium text-indigo-400 border border-zinc-700">
                  {player.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate font-medium">{player.username}</p>
                  <p className="text-[11px] text-zinc-500">Lv.{player.level}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold font-mono ${player.stats.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {player.stats.pnl >= 0 ? "+" : ""}${player.stats.pnl.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] text-zinc-500">{player.stats.win_rate}% WR</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {upcomingComp && (
            <Card className="bg-card border-zinc-800" data-testid="upcoming-comp-card">
              <CardHeader className="pb-2">
                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs w-fit">
                  Upcoming
                </Badge>
                <CardTitle className="text-sm text-white mt-2">{upcomingComp.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-[12px] text-zinc-500 leading-relaxed">{upcomingComp.description}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Prize Pool</span>
                  <span className="text-indigo-400 font-semibold font-mono">${upcomingComp.prize_pool.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Starts In</span>
                  <span className="text-zinc-200">{getTimeRemaining(upcomingComp.start_date)}</span>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="bg-card border-zinc-800" data-testid="quick-actions-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap size={14} className="text-indigo-400" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Link to="/tournament" className="block">
                <Button variant="outline" className="w-full justify-start border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 text-xs" data-testid="quick-bracket-btn">
                  <GitBranch size={13} className="mr-2" /> View Bracket
                </Button>
              </Link>
              <Link to="/teams" className="block">
                <Button variant="outline" className="w-full justify-start border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 text-xs" data-testid="quick-join-team-btn">
                  <Users size={13} className="mr-2" /> Join a Team
                </Button>
              </Link>
              <Link to="/quests" className="block">
                <Button variant="outline" className="w-full justify-start border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 text-xs" data-testid="quick-quests-btn">
                  <Target size={13} className="mr-2" /> View Quests
                </Button>
              </Link>
              <Link to="/social" className="block">
                <Button variant="outline" className="w-full justify-start border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 text-xs" data-testid="quick-social-btn">
                  <MessageSquare size={13} className="mr-2" /> Social Feed
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trading Panel */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <TradingPanel />
        </div>
        <Card className="lg:col-span-2 bg-card border-zinc-800" data-testid="competitions-list">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Swords size={16} className="text-indigo-400" /> All Competitions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {competitions.map((comp, i) => {
              const statusColors = { active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", upcoming: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", completed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30" };
              return (
                <div key={comp.id} className="flex items-center gap-4 p-3 rounded-md bg-zinc-800/20 border border-zinc-800/60 hover:border-zinc-700 transition-colors duration-150" data-testid={`comp-${i}`}>
                  <Badge className={`text-[11px] ${statusColors[comp.status] || ""}`}>{comp.status}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate font-medium">{comp.name}</p>
                    <p className="text-[11px] text-zinc-500">{comp.comp_type} · {comp.participant_ids?.length || 0} participants</p>
                  </div>
                  <p className="text-sm font-semibold font-mono text-indigo-400">${comp.prize_pool?.toLocaleString()}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatBlock({ label, value, color }) {
  return (
    <div>
      <span className="text-[11px] text-zinc-500 block mb-0.5">{label}</span>
      <p className={`text-xl lg:text-2xl font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, iconColor }) {
  return (
    <Card className="bg-card border-zinc-800 hover:border-zinc-700 transition-colors duration-150">
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon size={14} className={iconColor} strokeWidth={1.5} />
          <span className="text-[11px] text-zinc-500">{label}</span>
        </div>
        <p className="text-xl font-bold font-mono text-white">{value || 0}</p>
      </CardContent>
    </Card>
  );
}
