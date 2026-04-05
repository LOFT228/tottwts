import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useWalletContext } from "@/contexts/WalletContext";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Swords, RefreshCw, Wallet, Trophy, Clock, CheckCircle, XCircle, Zap, TrendingUp, BarChart3, Target, Timer, Shield, Flame } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { XShareButton } from "@/components/XShareButton";
import { shareOnX } from "@/lib/twitter";

const METRICS = [
  { id: "pnl", label: "P&L", icon: TrendingUp, color: "text-indigo-400" },
  { id: "volume", label: "Volume", icon: BarChart3, color: "text-indigo-400" },
  { id: "winrate", label: "Win Rate", icon: Target, color: "text-indigo-300" },
];

const DURATIONS = [
  { hours: 1, label: "1h", desc: "Lightning" },
  { hours: 6, label: "6h", desc: "Sprint" },
  { hours: 24, label: "24h", desc: "Standard" },
  { hours: 72, label: "3d", desc: "Marathon" },
  { hours: 168, label: "7d", desc: "War" },
];

const STATUS_CONFIG = {
  pending: { color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5", icon: Clock, label: "Pending" },
  active: { color: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/5", icon: Swords, label: "Active" },
  completed: { color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5", icon: Trophy, label: "Completed" },
  expired: { color: "text-zinc-500", border: "border-zinc-700", bg: "bg-zinc-800/30", icon: Clock, label: "Expired" },
  declined: { color: "text-red-400", border: "border-red-400/30", bg: "bg-red-400/5", icon: XCircle, label: "Declined" },
};

export default function Duels() {
  const { walletAddress, shortAddress, connected, player } = useWalletContext();
  const { setVisible } = useWalletModal();
  const [allDuels, setAllDuels] = useState([]);
  const [myDuels, setMyDuels] = useState([]);
  const [players, setPlayers] = useState([]);
  const [duelStats, setDuelStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("arena"); // arena | my | create
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [metric, setMetric] = useState("pnl");
  const [duration, setDuration] = useState(24);
  const [stake, setStake] = useState(100);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [duelsRes, playersRes, statsRes] = await Promise.all([
        api.getDuels(),
        api.getPlayers(),
        api.getDuelStats(),
      ]);
      setAllDuels(duelsRes.data);
      setPlayers(playersRes.data);
      setDuelStats(statsRes.data);
      if (walletAddress) {
        const myRes = await api.getMyDuels(walletAddress);
        setMyDuels(myRes.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [walletAddress]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = (opponent) => {
    if (!connected) { setVisible(true); return; }
    setSelectedOpponent(opponent);
    setMetric("pnl");
    setDuration(24);
    setStake(100);
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!connected || !walletAddress || !selectedOpponent) return;
    setCreating(true);
    try {
      await api.createDuel({
        challenger_wallet: walletAddress,
        challenger_name: shortAddress,
        opponent_id: selectedOpponent.id,
        stake,
        duration_hours: duration,
        metric,
      });
      toast.success(`Duel challenge sent!`, {
        description: `${selectedOpponent.username} · ${stake} chips · ${duration}h · ${metric.toUpperCase()}`,
      });
      setShowCreate(false);
      setSelectedOpponent(null);
      fetchData(true);
    } catch (e) {
      toast.error("Failed to create duel");
    } finally {
      setCreating(false);
    }
  };

  const handleAccept = async (duelId) => {
    try {
      await api.acceptDuel(duelId);
      toast.success("Duel accepted! The battle begins.");
      fetchData(true);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to accept duel");
    }
  };

  const handleDecline = async (duelId) => {
    try {
      await api.declineDuel(duelId);
      toast.info("Duel declined.");
      fetchData(true);
    } catch (e) {
      toast.error("Failed to decline duel");
    }
  };

  const handleResolve = async (duelId) => {
    try {
      const res = await api.resolveDuel(duelId);
      const d = res.data;
      if (d.winner_id === "draw") {
        toast.info("Duel ended in a draw!");
      } else {
        toast.success(`${d.winner_name} wins the duel!`, {
          description: `Challenger: ${d.challenger_delta >= 0 ? "+" : ""}${d.challenger_delta} vs Opponent: ${d.opponent_delta >= 0 ? "+" : ""}${d.opponent_delta}`,
        });
      }
      fetchData(true);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to resolve duel");
    }
  };

  const getTimeLeft = (endTime) => {
    if (!endTime) return "--";
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return "Ended";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const isMyDuel = (duel) => duel.challenger_wallet === walletAddress || duel.opponent_wallet === walletAddress;
  const amOpponent = (duel) => duel.opponent_wallet === walletAddress;

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="duels-page">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 animate-blur-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Swords size={24} className="text-red-400" /> Trading Duels
          </h1>
          <p className="text-[11px] text-zinc-500 mt-1">1v1 PvP trading battles. Challenge anyone. Winner takes all.</p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="border-zinc-800 text-zinc-400 hover:border-red-400/30 hover:text-red-400 h-9 px-3 text-xs"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin mr-1.5" : "mr-1.5"} /> Refresh
        </Button>
      </div>

      {/* Stats bar */}
      {duelStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Swords, color: "text-red-400", label: "Total Duels", value: duelStats.total_duels },
            { icon: Flame, color: "text-emerald-400", label: "Active Now", value: duelStats.active_duels },
            { icon: Trophy, color: "text-indigo-400", label: "Completed", value: duelStats.completed_duels },
            { icon: Zap, color: "text-indigo-300", label: "Total Staked", value: `${(duelStats.total_staked || 0).toLocaleString()} chips` },
          ].map(({ icon: Icon, color, label, value }, i) => (
            <Card key={i} className="bg-card border-zinc-800">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon size={18} className={color} />
                <div>
                  <p className="text-[11px] text-zinc-500">{label}</p>
                  <p className="text-lg font-semibold text-white font-mono">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Target, color: "text-red-400", label: "Pick Opponent", desc: "Challenge any trader on the leaderboard" },
          { icon: Timer, color: "text-indigo-400", label: "Set Terms", desc: "Stake, duration (1h-7d), and metric" },
          { icon: Swords, color: "text-indigo-400", label: "Battle", desc: "Both trade — best delta wins" },
          { icon: Trophy, color: "text-indigo-300", label: "Claim Victory", desc: "Winner takes the combined stake" },
        ].map(({ icon: Icon, color, label, desc }, i) => (
          <Card key={i} className="bg-card border-zinc-800">
            <CardContent className="p-4">
              <Icon size={18} className={`${color} mb-2`} />
              <p className="text-xs text-white font-semibold">{label}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connect wallet nudge */}
      {!connected && (
        <div className="border border-red-400/20 bg-red-400/5 rounded-md p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wallet size={16} className="text-red-400 shrink-0" />
            <p className="text-sm text-white">Connect wallet to challenge traders and accept duels</p>
          </div>
          <Button onClick={() => setVisible(true)} className="bg-red-500 text-white font-semibold text-xs h-9 px-4 hover:bg-red-600 shrink-0">
            Connect
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800/50">
        {[["arena", "Duel Arena"], ["my", "My Duels"], ["create", "Challenge"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-xs transition-all duration-200 border-b-2 -mb-px ${tab === id ? "text-red-400 border-red-400" : "text-zinc-500 border-transparent hover:text-zinc-300"}`}>
            {label} {id === "my" && myDuels.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-red-400/15 text-red-400 rounded text-[10px] font-mono">{myDuels.length}</span>}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-zinc-500">Loading Duels...</p>
          </div>
        </div>
      )}

      {/* DUEL ARENA — all active/pending duels */}
      {!loading && tab === "arena" && (
        <div className="space-y-3">
          {allDuels.length === 0 && (
            <Card className="bg-card border-zinc-800">
              <CardContent className="p-8 text-center">
                <Swords size={28} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No duels yet. Be the first to throw down a challenge!</p>
              </CardContent>
            </Card>
          )}
          <AnimatePresence>
            {allDuels.map((duel, i) => (
              <DuelCard key={duel.id} duel={duel} i={i} walletAddress={walletAddress}
                isMyDuel={isMyDuel(duel)} amOpponent={amOpponent(duel)}
                onAccept={handleAccept} onDecline={handleDecline} onResolve={handleResolve}
                getTimeLeft={getTimeLeft} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* MY DUELS */}
      {!loading && tab === "my" && (
        <div className="space-y-3">
          {!connected && (
            <Card className="bg-card border-zinc-800">
              <CardContent className="p-8 text-center">
                <Wallet size={28} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Connect wallet to see your duels</p>
              </CardContent>
            </Card>
          )}
          {connected && myDuels.length === 0 && (
            <Card className="bg-card border-zinc-800">
              <CardContent className="p-8 text-center">
                <Swords size={28} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No duels yet</p>
                <p className="text-[11px] text-zinc-600 mt-1">Go to "Challenge" tab and pick an opponent</p>
              </CardContent>
            </Card>
          )}
          <AnimatePresence>
            {myDuels.map((duel, i) => (
              <DuelCard key={duel.id} duel={duel} i={i} walletAddress={walletAddress}
                isMyDuel={true} amOpponent={amOpponent(duel)}
                onAccept={handleAccept} onDecline={handleDecline} onResolve={handleResolve}
                getTimeLeft={getTimeLeft} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* CHALLENGE — pick opponent */}
      {!loading && tab === "create" && (
        <Card className="bg-card border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Swords size={16} className="text-red-400" /> Choose Your Opponent
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50 text-[11px] text-zinc-500">
              <span className="w-10 text-center">Rank</span>
              <span className="flex-1">Trader</span>
              <span className="w-20 text-center hidden sm:block">P&L</span>
              <span className="w-16 text-center hidden sm:block">WR</span>
              <span className="w-16 text-center hidden md:block">Level</span>
              <span className="w-24 text-right">Action</span>
            </div>
            {players.sort((a, b) => (b.stats?.pnl || 0) - (a.stats?.pnl || 0)).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 border-b border-zinc-800/30 last:border-0 transition-colors">
                <span className={`text-xs font-semibold font-mono w-10 text-center ${i === 0 ? "text-indigo-400" : i === 1 ? "text-indigo-400" : i === 2 ? "text-indigo-300" : "text-zinc-600"}`}>
                  #{i + 1}
                </span>
                <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-indigo-400 font-medium shrink-0">
                  {p.username?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{p.username}</p>
                </div>
                <span className={`w-20 text-center hidden sm:block text-xs font-mono font-medium ${(p.stats?.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {(p.stats?.pnl || 0) >= 0 ? "+" : ""}${(p.stats?.pnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="w-16 text-center hidden sm:block text-xs text-zinc-400 font-mono">
                  {p.stats?.win_rate || 0}%
                </span>
                <span className="w-16 text-center hidden md:block text-xs text-zinc-500">
                  Lv.{p.level}
                </span>
                <div className="w-24 text-right">
                  <Button size="sm" onClick={() => openCreate(p)}
                    className="bg-red-400/15 border border-red-400/30 text-red-400 hover:bg-red-400/25 text-[11px] h-7 px-2">
                    Challenge
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create Duel Modal */}
      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md" aria-describedby="duel-modal-desc">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Swords size={16} className="text-red-400" /> Create Duel
            </DialogTitle>
            <p id="duel-modal-desc" className="text-[11px] text-zinc-500">Set the terms of battle.</p>
          </DialogHeader>

          {selectedOpponent && (
            <div className="space-y-5 pt-2">
              {/* Opponent */}
              <div className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-md border border-zinc-800">
                <div className="w-10 h-10 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-indigo-400">
                  {selectedOpponent.username?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-semibold">{selectedOpponent.username}</p>
                  <p className="text-[11px] text-zinc-500">P&L: ${(selectedOpponent.stats?.pnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} · WR: {selectedOpponent.stats?.win_rate}%</p>
                </div>
                <Badge className="bg-zinc-800 border-zinc-700 text-zinc-400 text-[11px]">Lv.{selectedOpponent.level}</Badge>
              </div>

              {/* Metric */}
              <div>
                <p className="text-[11px] text-zinc-500 mb-2">Battle metric</p>
                <div className="grid grid-cols-3 gap-2">
                  {METRICS.map((m) => (
                    <button key={m.id} onClick={() => setMetric(m.id)}
                      className={`p-3 rounded-md border text-center transition-all duration-200 ${metric === m.id ? `border-indigo-500/40 bg-indigo-500/10` : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-700"}`}>
                      <m.icon size={16} className={`mx-auto mb-1 ${metric === m.id ? "text-indigo-400" : "text-zinc-500"}`} />
                      <p className={`text-xs font-medium ${metric === m.id ? "text-indigo-400" : "text-zinc-400"}`}>{m.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <p className="text-[11px] text-zinc-500 mb-2">Duration</p>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <button key={d.hours} onClick={() => setDuration(d.hours)}
                      className={`flex-1 p-2 rounded-md border text-center transition-all ${duration === d.hours ? "border-indigo-500/40 bg-indigo-500/10" : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-700"}`}>
                      <p className={`text-sm font-semibold ${duration === d.hours ? "text-indigo-400" : "text-zinc-400"}`}>{d.label}</p>
                      <p className="text-[10px] text-zinc-600">{d.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake */}
              <div>
                <p className="text-[11px] text-zinc-500 mb-2">Stake (chips)</p>
                <div className="flex gap-2">
                  <Input type="number" value={stake} min={10} max={10000}
                    onChange={(e) => setStake(Math.max(10, parseInt(e.target.value) || 10))}
                    className="bg-zinc-900 border-zinc-800 text-white font-mono flex-1 focus:border-indigo-500/50" />
                  {[50, 100, 500, 1000].map((s) => (
                    <Button key={s} size="sm" variant="outline" onClick={() => setStake(s)}
                      className={`border-zinc-800 text-[11px] h-10 px-2 ${stake === s ? "border-indigo-500/40 text-indigo-400" : "text-zinc-500"}`}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 bg-red-400/5 border border-red-400/20 rounded-md">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-500">You vs</span>
                  <span className="text-white font-medium">{selectedOpponent.username}</span>
                </div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-500">Metric</span>
                  <span className="text-white font-medium">{metric.toUpperCase()} delta</span>
                </div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-500">Duration</span>
                  <span className="text-white font-medium">{DURATIONS.find(d => d.hours === duration)?.desc} ({duration}h)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500">Stake each</span>
                  <span className="text-red-400 font-medium font-mono">{stake} chips</span>
                </div>
                <div className="border-t border-red-400/20 mt-2 pt-2 flex justify-between text-xs">
                  <span className="text-zinc-400">Winner takes</span>
                  <span className="text-emerald-400 font-semibold font-mono">{stake * 2} chips</span>
                </div>
              </div>

              {/* Submit */}
              <Button onClick={handleCreate} disabled={creating}
                className="w-full bg-red-500 text-white font-semibold text-xs h-11 hover:bg-red-600 transition-all">
                {creating ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Sending Challenge...</>
                ) : (
                  <><Swords size={14} className="mr-2" /> Send Challenge</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DuelCard({ duel, i, walletAddress, isMyDuel, amOpponent, onAccept, onDecline, onResolve, getTimeLeft }) {
  const sc = STATUS_CONFIG[duel.status] || STATUS_CONFIG.pending;
  const Icon = sc.icon;
  const metricLabel = { pnl: "P&L", volume: "Volume", winrate: "Win Rate" }[duel.metric] || "P&L";

  const canAccept = amOpponent && duel.status === "pending";
  const canResolve = isMyDuel && duel.status === "active";
  const isCompleted = duel.status === "completed";

  return (
    <motion.div initial={{ opacity: 0, y: 10, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <Card className={`bg-card ${sc.border} border`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Status icon */}
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center border ${sc.border} ${sc.bg} shrink-0`}>
              <Icon size={20} className={sc.color} />
            </div>

            {/* Battle info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-white font-medium">{duel.challenger_name}</span>
                <Swords size={12} className="text-red-400" />
                <span className="text-xs text-white font-medium">{duel.opponent_name}</span>
                <Badge className={`text-[10px] ${sc.color} ${sc.border} ${sc.bg}`}>{sc.label}</Badge>
                <Badge className="bg-zinc-800 border-zinc-700 text-zinc-500 text-[10px]">{metricLabel}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                <span className="text-[11px] text-zinc-500">Stake: <span className="text-white font-medium font-mono">{duel.stake} chips each</span></span>
                <span className="text-[11px] text-zinc-500">Prize: <span className="text-emerald-400 font-medium font-mono">{duel.stake * 2} chips</span></span>
                <span className="text-[11px] text-zinc-500">Duration: <span className="text-zinc-300">{duel.duration_hours}h</span></span>
                {duel.status === "active" && duel.end_time && (
                  <span className="text-[11px] text-indigo-400">
                    <Clock size={10} className="inline mr-0.5" /> {getTimeLeft(duel.end_time)} left
                  </span>
                )}
              </div>
              {/* Results */}
              {isCompleted && (
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-[11px] font-medium font-mono ${duel.challenger_delta >= duel.opponent_delta ? "text-emerald-400" : "text-red-400"}`}>
                    {duel.challenger_name}: {duel.challenger_delta >= 0 ? "+" : ""}{duel.challenger_delta?.toLocaleString()}
                  </span>
                  <span className="text-zinc-700 text-[11px]">vs</span>
                  <span className={`text-[11px] font-medium font-mono ${duel.opponent_delta >= duel.challenger_delta ? "text-emerald-400" : "text-red-400"}`}>
                    {duel.opponent_name}: {duel.opponent_delta >= 0 ? "+" : ""}{duel.opponent_delta?.toLocaleString()}
                  </span>
                  {duel.winner_name && duel.winner_id !== "draw" && (
                    <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/30 text-[10px]">
                      <Trophy size={9} className="mr-1" /> {duel.winner_name}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {canAccept && (
                <>
                  <Button size="sm" onClick={() => onAccept(duel.id)}
                    className="bg-emerald-400/15 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/25 text-[11px] h-7 px-3">
                    <CheckCircle size={12} className="mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDecline(duel.id)}
                    className="border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-400/30 text-[11px] h-7 px-2">
                    Decline
                  </Button>
                </>
              )}
              {canResolve && (
                <Button size="sm" onClick={() => onResolve(duel.id)}
                  className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 text-[11px] h-7 px-3">
                  <Trophy size={12} className="mr-1" /> Resolve
                </Button>
              )}
              {isCompleted && duel.winner_name && duel.winner_id !== "draw" && (
                <XShareButton onClick={() => shareOnX(`⚔️ ${duel.winner_name} just won a trading duel on @AdrenaFoundation! ${duel.challenger_name} vs ${duel.opponent_name} | ${duel.stake * 2} chips prize 🏆\n#Adrena #Solana #TradingDuels`)} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
