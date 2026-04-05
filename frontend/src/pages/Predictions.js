import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useWalletContext } from "@/contexts/WalletContext";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, TrendingUp, TrendingDown, Target, RefreshCw, Wallet, Zap, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const PREDICTION_TYPES = [
  { id: "wins",       label: "Wins",     desc: "Finishes #1",             color: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/5" },
  { id: "top3",       label: "Top 3",    desc: "Finishes in top 3",       color: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/5" },
  { id: "top10",      label: "Top 10",   desc: "Finishes in top 10",      color: "text-indigo-300", border: "border-indigo-400/30", bg: "bg-indigo-400/5" },
  { id: "busts",      label: "Busts",    desc: "Ends with negative P&L",  color: "text-red-400", border: "border-red-400/30", bg: "bg-red-400/5" },
];

const TYPE_MAP = Object.fromEntries(PREDICTION_TYPES.map(t => [t.id, t]));

export default function Predictions() {
  const { walletAddress, shortAddress, connected } = useWalletContext();
  const { setVisible } = useWalletModal();
  const [players, setPlayers] = useState([]);
  const [myPredictions, setMyPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [predType, setPredType] = useState("wins");
  const [stake, setStake] = useState(100);
  const [placing, setPlacing] = useState(false);
  const [tab, setTab] = useState("board"); // board | mine

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [lbRes] = await Promise.all([api.getPredictionsLeaderboard()]);
      setPlayers(lbRes.data);
      if (walletAddress) {
        const myRes = await api.getMyPredictions(walletAddress);
        setMyPredictions(myRes.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [walletAddress]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openPredict = (player) => {
    if (!connected) { setVisible(true); return; }
    setSelectedPlayer(player);
    setPredType("wins");
    setStake(100);
  };

  const selectedOdds = selectedPlayer ? (selectedPlayer.odds?.[predType] || 2) : 2;
  const potentialPayout = Math.round(stake * selectedOdds);

  const handlePlace = async () => {
    if (!connected || !walletAddress) { setVisible(true); return; }
    if (!selectedPlayer) return;
    setPlacing(true);
    try {
      const res = await api.placePrediction({
        predictor_wallet: walletAddress,
        predictor_name: shortAddress,
        target_player_id: selectedPlayer.id,
        prediction_type: predType,
        stake,
        competition_id: null,
      });
      toast.success(`Prediction placed! ${stake} chips в†’ potential ${res.data.potential_payout} chips`, {
        description: `${selectedPlayer.username} ${TYPE_MAP[predType]?.label} @ ${res.data.odds}x`,
      });
      setSelectedPlayer(null);
      fetchData(true);
    } catch (e) {
      toast.error("Failed to place prediction");
    } finally {
      setPlacing(false);
    }
  };

  const rankColor = (r) => r === 1 ? "text-indigo-400" : r === 2 ? "text-indigo-400" : r === 3 ? "text-indigo-300" : "text-zinc-600";

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="predictions-page">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 animate-blur-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Predictions</h1>
          <p className="text-[11px] text-zinc-500 mt-1">Bet on who wins. Collect if right.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="border-zinc-800 text-zinc-400 hover:border-indigo-500/30 hover:text-indigo-400 h-9 px-3 text-xs"
          data-testid="refresh-predictions-btn"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin mr-1.5" : "mr-1.5"} /> Refresh
        </Button>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="how-it-works">
        {[
          { icon: Target,     color: "text-indigo-400", label: "Pick a Trader",  desc: "Choose anyone from the live leaderboard" },
          { icon: Zap,        color: "text-indigo-400", label: "Choose Outcome", desc: "Will they Win, Top 3, Top 10, or Bust?" },
          { icon: TrendingUp, color: "text-indigo-400", label: "Set Your Stake", desc: "More stake = bigger payout if correct" },
          { icon: Trophy,     color: "text-indigo-400", label: "Collect Chips",  desc: "Win chips multiplied by the odds" },
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
        <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-md p-4 flex items-center justify-between gap-4" data-testid="connect-wallet-predictions">
          <div className="flex items-center gap-3">
            <Wallet size={16} className="text-indigo-400 shrink-0" />
            <p className="text-sm text-white">Connect wallet to place predictions and track your bets</p>
          </div>
          <Button onClick={() => setVisible(true)} className="bg-indigo-500 text-white font-semibold text-xs h-9 px-4 hover:bg-indigo-600 shrink-0" data-testid="connect-for-predictions-btn">
            Connect
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800/50" data-testid="predictions-tabs">
        {[["board", "Prediction Board"], ["mine", "My Bets"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-xs font-medium transition-all duration-150 border-b-2 -mb-px ${tab === id ? "text-indigo-400 border-indigo-500" : "text-zinc-600 border-transparent hover:text-zinc-400"}`}
            data-testid={`tab-${id}`}>
            {label} {id === "mine" && myPredictions.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 rounded text-[10px]">{myPredictions.length}</span>}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-zinc-500">Loading odds...</p>
          </div>
        </div>
      )}

      {/* PREDICTION BOARD */}
      {!loading && tab === "board" && (
        <Card className="bg-card border-zinc-800" data-testid="prediction-board">
          <CardContent className="p-0">
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50 text-[11px] text-zinc-500 font-medium">
              <span className="w-10 text-center">Rank</span>
              <span className="flex-1">Trader</span>
              <span className="w-16 text-center hidden sm:block">Wins</span>
              <span className="w-16 text-center hidden sm:block">Top 3</span>
              <span className="w-16 text-center hidden sm:block">Top 10</span>
              <span className="w-16 text-center hidden sm:block">Busts</span>
              <span className="w-20 text-center hidden md:block">Bets</span>
              <span className="w-24 text-right">Action</span>
            </div>

            <AnimatePresence>
              {players.map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 border-b border-zinc-800/40 last:border-0 transition-colors group"
                  data-testid={`pred-row-${i}`}
                >
                  <span className={`text-sm font-bold w-10 text-center font-mono ${rankColor(player.position)}`}>
                    #{player.position}
                  </span>
                  <div className="w-8 h-8 rounded-md bg-zinc-800/80 border border-zinc-800 flex items-center justify-center text-[11px] text-indigo-400 shrink-0">
                    {player.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{player.username}</p>
                    <p className={`text-[11px] font-mono font-semibold ${(player.stats?.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(player.stats?.pnl || 0) >= 0 ? "+" : ""}${(player.stats?.pnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  {/* Odds columns */}
                  {["wins", "top3", "top10", "busts"].map((pt) => {
                    const t = TYPE_MAP[pt];
                    const odds = player.odds?.[pt];
                    const bets = player.sentiment?.[pt] || 0;
                    return (
                      <div key={pt} className="w-16 text-center hidden sm:block" data-testid={`odds-${pt}-${i}`}>
                        <p className={`text-sm font-semibold font-mono ${t.color}`}>{odds?.toFixed(1)}x</p>
                        {bets > 0 && <p className="text-[10px] text-zinc-600">{bets} bet{bets !== 1 ? "s" : ""}</p>}
                      </div>
                    );
                  })}
                  {/* Total bets */}
                  <div className="w-20 text-center hidden md:block">
                    {player.community_bets > 0
                      ? <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[10px]">{player.community_bets} bets</Badge>
                      : <span className="text-[11px] text-zinc-700">no bets</span>
                    }
                  </div>
                  {/* Predict button */}
                  <div className="w-24 text-right">
                    <Button
                      size="sm"
                      onClick={() => openPredict(player)}
                      className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 text-[11px] h-7 px-2 transition-all duration-150"
                      data-testid={`predict-btn-${i}`}
                    >
                      Predict
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* MY BETS */}
      {!loading && tab === "mine" && (
        <div className="space-y-3" data-testid="my-predictions">
          {!connected && (
            <Card className="bg-card border-zinc-800">
              <CardContent className="p-8 text-center">
                <Wallet size={28} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Connect wallet to see your bets</p>
              </CardContent>
            </Card>
          )}
          {connected && myPredictions.length === 0 && (
            <Card className="bg-card border-zinc-800">
              <CardContent className="p-8 text-center">
                <Target size={28} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No bets placed yet</p>
                <p className="text-[11px] text-zinc-600 mt-1">Switch to "Prediction Board" and place your first bet</p>
              </CardContent>
            </Card>
          )}
          <AnimatePresence>
            {myPredictions.map((pred, i) => {
              const t = TYPE_MAP[pred.prediction_type] || TYPE_MAP.wins;
              const statusIcon = pred.status === "won" ? <CheckCircle size={13} className="text-emerald-400" /> : pred.status === "lost" ? <XCircle size={13} className="text-red-400" /> : <Clock size={13} className="text-zinc-500" />;
              return (
                <motion.div key={pred.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className={`bg-card ${t.border} border`} data-testid={`my-pred-${i}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center border ${t.border} ${t.bg} shrink-0`}>
                        <Target size={18} className={t.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-white font-semibold">{pred.target_player_name}</p>
                          <Badge className={`text-[10px] ${t.color} ${t.border} ${t.bg}`}>{t.label}</Badge>
                          <span className="text-[11px] text-zinc-500">@ {pred.odds}x В· ranked #{pred.target_rank_at_bet} at bet</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-zinc-500">Staked: <span className="text-white font-semibold font-mono">{pred.stake} chips</span></span>
                          <span className="text-[11px] text-zinc-500">To win: <span className={t.color + " font-semibold font-mono"}>{pred.potential_payout} chips</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {statusIcon}
                        <span className={`text-xs font-medium ${pred.status === "won" ? "text-emerald-400" : pred.status === "lost" ? "text-red-400" : "text-zinc-500"}`}>
                          {pred.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Prediction Modal */}
      <Dialog open={!!selectedPlayer} onOpenChange={(o) => !o && setSelectedPlayer(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md" aria-describedby="pred-modal-desc" data-testid="prediction-modal">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Target size={16} className="text-indigo-400" /> Place Prediction
            </DialogTitle>
            <p id="pred-modal-desc" className="text-[11px] text-zinc-500">Bet prediction chips on the outcome for this trader.</p>
          </DialogHeader>

          {selectedPlayer && (
            <div className="space-y-5 pt-2">
              {/* Target player info */}
              <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-md border border-zinc-800">
                <div className="w-10 h-10 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-indigo-400">
                  {selectedPlayer.username?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-semibold">{selectedPlayer.username}</p>
                  <p className="text-[11px] text-zinc-500">Current rank #{selectedPlayer.position} В· P&L: ${(selectedPlayer.stats?.pnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <Badge className="bg-zinc-800 border-zinc-700 text-zinc-400 text-[10px]">Lv.{selectedPlayer.level}</Badge>
              </div>

              {/* Prediction type */}
              <div>
                <p className="text-[11px] text-zinc-500 mb-2">What do you predict?</p>
                <div className="grid grid-cols-2 gap-2">
                  {PREDICTION_TYPES.map((pt) => (
                    <button
                      key={pt.id}
                      onClick={() => setPredType(pt.id)}
                      className={`p-3 rounded-md border text-left transition-all duration-150 ${predType === pt.id ? `${pt.border} ${pt.bg}` : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-700"}`}
                      data-testid={`pred-type-${pt.id}`}
                    >
                      <p className={`text-xs font-semibold ${predType === pt.id ? pt.color : "text-zinc-400"}`}>{pt.label}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{pt.desc}</p>
                      <p className={`text-base font-bold font-mono mt-1 ${predType === pt.id ? pt.color : "text-zinc-600"}`}>
                        {selectedPlayer.odds?.[pt.id]?.toFixed(1)}x
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake */}
              <div>
                <p className="text-[11px] text-zinc-500 mb-2">Stake (chips)</p>
                <div className="flex gap-2">
                  <Input
                    type="number" value={stake} min={10} max={10000}
                    onChange={(e) => setStake(Math.max(10, parseInt(e.target.value) || 10))}
                    className="bg-zinc-900 border-zinc-800 text-white flex-1 focus:border-indigo-500/50 transition-colors"
                    data-testid="stake-input"
                  />
                  {[100, 500, 1000].map((s) => (
                    <Button key={s} size="sm" variant="outline" onClick={() => setStake(s)}
                      className={`border-zinc-800 text-xs h-10 px-3 ${stake === s ? "border-indigo-500/50 text-indigo-400" : "text-zinc-500"}`}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Payout preview */}
              <div className={`p-4 rounded-md border ${TYPE_MAP[predType]?.border} ${TYPE_MAP[predType]?.bg}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[11px] text-zinc-500">Odds</p>
                    <p className={`text-2xl font-bold font-mono ${TYPE_MAP[predType]?.color}`}>{selectedOdds.toFixed(1)}x</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-zinc-500">Potential Payout</p>
                    <p className={`text-2xl font-bold font-mono ${TYPE_MAP[predType]?.color}`}>{potentialPayout.toLocaleString()} chips</p>
                  </div>
                </div>
              </div>

              {/* Confirm */}
              <Button
                onClick={handlePlace}
                disabled={placing}
                className="w-full bg-indigo-500 text-white font-semibold text-xs h-11 hover:bg-indigo-600 transition-colors"
                data-testid="confirm-prediction-btn"
              >
                {placing ? "Placing..." : `Bet ${stake} chips в†’ Win ${potentialPayout}`}
              </Button>

              <p className="text-[11px] text-zinc-600 text-center">
                Predictions use virtual chips. Odds shift with community bets.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
