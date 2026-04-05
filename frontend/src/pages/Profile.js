import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useWalletContext } from "@/contexts/WalletContext";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User, TrendingUp, Activity, Flame, Star, Trophy, BarChart3, Sparkles, RefreshCw, Wallet, Lock } from "lucide-react";
import { XShareButton } from "@/components/XShareButton";
import { tweetMyStats } from "@/lib/twitter";
import { toast } from "sonner";

export default function Profile() {
  const { player, positions, positionsLoading, playerLoading, walletAddress, shortAddress, connected, refreshPositions } = useWalletContext();
  const { setVisible } = useWalletModal();
  const [achievements, setAchievements] = useState([]);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [fallbackPlayer, setFallbackPlayer] = useState(null);
  const [achLoading, setAchLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const aRes = await api.getAchievements();
        setAchievements(aRes.data);
        // Fallback: if no wallet connected, show first seeded player
        if (!connected) {
          const pRes = await api.getPlayers();
          if (pRes.data.length > 0) setFallbackPlayer(pRes.data[0]);
        }
      } catch (e) { console.error(e); }
      finally { setAchLoading(false); }
    };
    load();
  }, [connected]);

  const activePlayer = player || fallbackPlayer;

  const getInsight = async () => {
    if (!activePlayer) return;
    setInsightLoading(true);
    try {
      const res = await api.getAIInsights({ player_id: activePlayer.id, context: "competition strategy" });
      setInsight(res.data.insight);
    } catch (e) { toast.error("Failed to get AI insight"); }
    finally { setInsightLoading(false); }
  };

  if (achLoading || playerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-500">
            {playerLoading ? "Loading wallet profile..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!activePlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8" data-testid="profile-page">
        <div className="text-center space-y-4">
          <Lock size={40} className="text-zinc-700 mx-auto" />
          <p className="text-zinc-400 text-sm">No profile data available</p>
        </div>
      </div>
    );
  }

  const s = activePlayer.stats;
  const xpPct = (activePlayer.xp / activePlayer.xp_to_next) * 100;
  const playerBadges = achievements.filter((a) => (activePlayer.badges || []).includes(a.id));
  const rarityBorder = { common: "border-zinc-600", rare: "border-indigo-400", epic: "border-indigo-500", legendary: "border-indigo-400" };
  const rarityText = { common: "text-zinc-400", rare: "text-indigo-400", epic: "text-indigo-500", legendary: "text-indigo-400" };

  const isWalletPlayer = !!activePlayer.wallet_address;

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="profile-page">
      {/* Connect Wallet Banner */}
      {!connected && (
        <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-md p-4 flex items-center justify-between gap-4" data-testid="connect-wallet-banner">
          <div className="flex items-center gap-3">
            <Wallet size={18} className="text-indigo-400 shrink-0" />
            <div>
              <p className="text-sm text-white">Connect Wallet for Your Real Profile</p>
              <p className="text-[11px] text-zinc-500">Auto-sync your Adrena positions & track competition P&L</p>
            </div>
          </div>
          <Button
            onClick={() => setVisible(true)}
            className="bg-indigo-500 text-white font-semibold text-xs h-9 px-4 shrink-0 hover:bg-indigo-600"
            data-testid="profile-connect-wallet-btn"
          >
            <Wallet size={12} className="mr-1.5" /> Connect
          </Button>
        </div>
      )}

      {/* Player Hero */}
      <Card className="bg-card border-zinc-800 relative overflow-hidden" data-testid="player-hero">
        <CardContent className="p-6 lg:p-8 relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-20 h-20 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-xl text-indigo-400 font-semibold shrink-0">
              {activePlayer.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="player-username">{activePlayer.username}</h1>
                <Badge className="bg-indigo-500/15 text-indigo-400 border-indigo-500/30 text-[10px]">Rank #{activePlayer.rank || "N/A"}</Badge>
                {isWalletPlayer && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                    Live
                  </Badge>
                )}
              </div>
              {walletAddress && (
                <p className="text-[11px] text-zinc-500 mb-2" data-testid="wallet-address-display">
                  Wallet: {shortAddress}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <div>
                  <p className="text-[11px] text-zinc-500">Level</p>
                  <p className="text-lg font-semibold text-white">{activePlayer.level}</p>
                </div>
                <div className="flex-1 max-w-xs">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-500">XP</span>
                    <span className="text-indigo-400 font-mono">{activePlayer.xp}/{activePlayer.xp_to_next}</span>
                  </div>
                  <Progress value={xpPct} className="h-2 bg-zinc-800 [&>div]:bg-indigo-500" data-testid="xp-bar" />
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500">Total XP</p>
                  <p className="text-lg font-semibold text-indigo-400 font-mono">{(activePlayer.total_xp || 0).toLocaleString()}</p>
                </div>
                <div className="ml-auto">
                  <XShareButton
                    onClick={() => tweetMyStats(activePlayer.username, s.pnl || 0, s.win_rate || 0, activePlayer.level)}
                    label="Share Stats"
                    data-testid="share-stats-btn"
                    className="text-zinc-700 hover:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="profile-stats">
        <StatCard icon={TrendingUp} label="Total P&L" value={`$${(s.pnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} positive={(s.pnl || 0) >= 0} live={isWalletPlayer} />
        <StatCard icon={BarChart3} label="Volume" value={`$${((s.volume || 0) / 1000).toFixed(0)}k`} live={isWalletPlayer} />
        <StatCard icon={Activity} label="Win Rate" value={`${s.win_rate || 0}%`} />
        <StatCard icon={Flame} label="Current Streak" value={`${s.current_streak || 0} wins`} streak />
        <StatCard icon={Trophy} label="Best Streak" value={`${s.best_streak || 0} wins`} />
        <StatCard icon={Activity} label="Total Trades" value={s.trades_count || 0} live={isWalletPlayer} />
        <StatCard icon={TrendingUp} label="Best Trade" value={`$${(s.best_trade || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} positive />
        <StatCard icon={TrendingUp} label="Worst Trade" value={`$${(s.worst_trade || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} positive={false} />
      </div>

      {/* Badges */}
      <Card className="bg-card border-zinc-800" data-testid="player-badges">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Star size={16} className="text-indigo-400" /> Badges ({playerBadges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {playerBadges.length === 0 ? (
            <p className="text-xs text-zinc-500">No badges earned yet. Trade to unlock achievements!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {playerBadges.map((badge) => (
                <div key={badge.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-md border bg-zinc-800/30 ${rarityBorder[badge.rarity] || "border-zinc-800"}`} data-testid={`profile-badge-${badge.id}`}>
                  <Star size={12} className={rarityText[badge.rarity] || "text-zinc-400"} />
                  <span className="text-[11px] text-white">{badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Positions (Wallet-Connected) */}
      {connected && (
        <Card className="bg-card border-indigo-500/20" data-testid="live-positions-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" /> Live Adrena Positions
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />Real-time
                </Badge>
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={refreshPositions}
                disabled={positionsLoading}
                className="border-zinc-800 text-zinc-400 hover:border-indigo-500/30 hover:text-indigo-400 h-8 px-3"
                data-testid="refresh-positions-btn"
              >
                <RefreshCw size={12} className={positionsLoading ? "animate-spin" : ""} />
              </Button>
            </div>
            <p className="text-[11px] text-zinc-500">Your real trading positions on Adrena protocol</p>
          </CardHeader>
          <CardContent>
            {positionsLoading ? (
              <div className="flex items-center gap-2 py-4">
                <div className="w-4 h-4 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-zinc-500">Fetching positions...</p>
              </div>
            ) : positions.length === 0 ? (
              <div className="text-center py-6" data-testid="no-positions-msg">
                <p className="text-xs text-zinc-500">No positions found for this wallet.</p>
                <p className="text-[11px] text-zinc-600 mt-1">Trade on Adrena to see your positions here.</p>
              </div>
            ) : (
              <div className="space-y-2" data-testid="positions-list">
                <p className="text-[11px] text-zinc-500 mb-3">
                  {positions.length} Position{positions.length !== 1 ? "s" : ""} Found
                </p>
                {positions.slice(0, 10).map((pos, i) => (
                  <div key={pos.position_id || i} className="flex items-center gap-3 p-3 rounded-md bg-zinc-800/30 border border-zinc-800/50 hover:border-zinc-700 transition-colors" data-testid={`position-${i}`}>
                    <Badge className={`text-[10px] shrink-0 ${pos.side === "long" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-400/10 text-red-400 border-red-400/30"}`}>
                      {pos.side}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white">{pos.symbol || "Unknown"}</p>
                      <p className="text-[11px] text-zinc-500">{pos.entry_leverage ? `${pos.entry_leverage}x leverage` : ""} {pos.status ? `· ${pos.status}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-semibold font-mono ${(pos.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`} data-testid={`position-pnl-${i}`}>
                        {pos.pnl != null ? `${pos.pnl >= 0 ? "+" : ""}$${pos.pnl.toFixed(2)}` : "Open"}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono">Vol: ${(pos.volume || 0).toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card className="bg-card border-indigo-500/20" data-testid="ai-insights-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" /> AI Trading Insights
            </CardTitle>
            <Button size="sm" onClick={getInsight} disabled={insightLoading} className="bg-indigo-500 text-white font-semibold text-xs hover:bg-indigo-600 h-8 px-4" data-testid="get-insight-btn">
              {insightLoading ? "Analyzing..." : "Get Insight"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {insight ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-md p-4" data-testid="insight-content">
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{insight}</p>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Click "Get Insight" for AI-powered analysis of your trading performance.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, positive, streak, live }) {
  const color = positive === true ? "text-emerald-400" : positive === false ? "text-red-400" : "text-white";
  return (
    <Card className="bg-card border-zinc-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={13} className={streak ? "text-red-400" : "text-zinc-500"} strokeWidth={1.5} />
          <span className="text-[11px] text-zinc-500">{label}</span>
          {live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto animate-pulse" title="Live data" />}
        </div>
        <p className={`text-lg font-semibold font-mono ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
