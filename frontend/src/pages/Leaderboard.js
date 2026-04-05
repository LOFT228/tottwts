import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, RefreshCw, Wallet, Globe, Wifi, WifiOff, Medal, Trophy } from "lucide-react";
import { XShareButton } from "@/components/XShareButton";
import { tweetMyRank } from "@/lib/twitter";
import { motion, AnimatePresence } from "framer-motion";

const WS_BASE = process.env.REACT_APP_BACKEND_URL
  ? process.env.REACT_APP_BACKEND_URL.replace(/^https/, "wss").replace(/^http/, "ws")
  : "ws://localhost:8001";

export default function Leaderboard() {
  const [lbType, setLbType] = useState("individual");
  const [metric, setMetric] = useState("composite");
  const [mode, setMode] = useState("mock");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [wsStatus, setWsStatus] = useState("off"); // off | connecting | live | error
  const wsRef = useRef(null);

  const fetchMock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getLeaderboard({ lb_type: lbType, metric, limit: 20 });
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [lbType, metric]);

  const fetchLiveREST = useCallback(async () => {
    setLiveLoading(true);
    try {
      const res = await api.getLiveLeaderboard();
      setData(res.data);
    } catch { setData([]); }
    finally { setLiveLoading(false); }
  }, []);

  // WebSocket for live leaderboard
  const connectLiveWS = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setWsStatus("connecting");
    const ws = new WebSocket(`${WS_BASE}/api/ws/leaderboard`);
    ws.onopen = () => setWsStatus("live");
    ws.onerror = () => {
      setWsStatus("error");
      fetchLiveREST(); // fallback
    };
    ws.onclose = () => {
      setWsStatus("off");
      wsRef.current = null;
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "leaderboard" && Array.isArray(msg.data)) {
          setData(msg.data);
          setLiveLoading(false);
        }
      } catch {}
    };
    wsRef.current = ws;
  }, [fetchLiveREST]);

  useEffect(() => {
    if (mode === "live") {
      connectLiveWS();
      fetchLiveREST(); // immediate data while WS connects
    } else {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; setWsStatus("off"); }
      fetchMock();
    }
    return () => {
      if (mode === "live" && wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    };
  }, [mode]); // eslint-disable-line

  useEffect(() => {
    if (mode === "mock") fetchMock();
  }, [lbType, metric, mode, fetchMock]);

  // Cleanup on unmount
  useEffect(() => () => { wsRef.current?.close(); }, []);

  const getMetricValue = (item) => {
    const s = item.stats;
    if (mode === "live" || metric === "pnl") return { value: `$${(s?.pnl || 0).toLocaleString()}`, positive: (s?.pnl || 0) >= 0 };
    if (metric === "volume") return { value: `$${((s?.volume || 0) / 1000).toFixed(0)}k`, positive: true };
    if (metric === "winrate") return { value: `${lbType === "team" ? s?.avg_win_rate : s?.win_rate}%`, positive: true };
    if (metric === "streak") return { value: `${s?.current_streak || 0} wins`, positive: true };
    return { value: `${(item.composite_score || 0).toFixed(0)} pts`, positive: true };
  };

  const isLoading = loading || liveLoading;

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="leaderboard-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Rankings</h1>
          <p className="text-xs text-zinc-500 mt-1">Competition Standings</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Live / Mock Toggle */}
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="bg-zinc-900 border border-zinc-800 h-9" data-testid="mode-tabs">
              <TabsTrigger
                value="mock"
                className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400 text-xs font-medium h-7 px-3"
                data-testid="tab-mock"
              >
                Competition
              </TabsTrigger>
              <TabsTrigger
                value="live"
                className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-xs font-medium h-7 px-3"
                data-testid="tab-live"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                Live
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === "mock" && (
            <>
              <Tabs value={lbType} onValueChange={setLbType}>
                <TabsList className="bg-zinc-900 border border-zinc-800 h-9" data-testid="lb-type-tabs">
                  <TabsTrigger value="individual" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400 text-xs font-medium h-7 px-3" data-testid="tab-individual">
                    Individual
                  </TabsTrigger>
                  <TabsTrigger value="team" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400 text-xs font-medium h-7 px-3" data-testid="tab-team">
                    Team
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger className="w-36 bg-zinc-900 border-zinc-800 text-white text-xs h-9" data-testid="metric-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="composite" data-testid="metric-composite">Composite</SelectItem>
                  <SelectItem value="pnl" data-testid="metric-pnl">P&L</SelectItem>
                  <SelectItem value="volume" data-testid="metric-volume">Volume</SelectItem>
                  <SelectItem value="winrate" data-testid="metric-winrate">Win Rate</SelectItem>
                  <SelectItem value="streak" data-testid="metric-streak">Streak</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {mode === "live" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { connectLiveWS(); fetchLiveREST(); }}
              disabled={liveLoading || wsStatus === "live"}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-9 px-3 text-xs"
              data-testid="refresh-live-btn"
            >
              {wsStatus === "live"
                ? <><span className="live-dot mr-1.5" /> Live</>
                : wsStatus === "connecting"
                ? <><RefreshCw size={12} className="animate-spin mr-1.5" /> Connecting...</>
                : <><RefreshCw size={12} className={liveLoading ? "animate-spin mr-1.5" : "mr-1.5"} /> Refresh</>
              }
            </Button>
          )}
        </div>
      </div>

      {/* Live Mode Banner */}
      {mode === "live" && (
        <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-md p-4 flex items-center gap-3 animate-blur-in" data-testid="live-mode-banner">
          {wsStatus === "live"
            ? <Wifi size={16} className="text-emerald-400 shrink-0 animate-pulse" />
            : wsStatus === "error"
            ? <WifiOff size={16} className="text-zinc-500 shrink-0" />
            : <Globe size={16} className="text-indigo-400 shrink-0" />
          }
          <div className="flex-1">
            <p className="text-sm text-white flex items-center gap-2">
              Live Leaderboard — Real Adrena Position Data
              {wsStatus === "live" && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">WS Live</Badge>}
              {wsStatus === "error" && <Badge className="bg-zinc-800 text-zinc-500 border-zinc-700 text-[11px]">Polling</Badge>}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Rankings based on real P&amp;L from wallet-registered traders · auto-updates every 20s</p>
          </div>
          {data.length === 0 && !liveLoading && (
            <div className="ml-auto flex items-center gap-2">
              <Wallet size={14} className="text-zinc-500" />
              <p className="text-[11px] text-zinc-500">Connect your wallet to appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16" data-testid="leaderboard-loading">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-zinc-500">
              {liveLoading ? "Fetching live data..." : "Loading rankings..."}
            </p>
          </div>
        </div>
      )}

      {/* Empty Live */}
      {!isLoading && mode === "live" && data.length === 0 && (
        <Card className="bg-card border-zinc-800" data-testid="live-empty">
          <CardContent className="p-12 text-center">
            <Wallet size={32} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-sm text-zinc-400">No wallet-registered traders yet</p>
            <p className="text-xs text-zinc-600 mt-2">Connect your Phantom or Backpack wallet to join the live leaderboard</p>
          </CardContent>
        </Card>
      )}

      {/* Podium */}
      {!isLoading && data.length >= 3 && (
        <div className="relative max-w-2xl mx-auto pt-4 pb-0" data-testid="podium">
          <div className="flex items-end justify-center gap-3">
            {[data[1], data[0], data[2]].map((item, i) => {
              const pos = [2, 1, 3][i];
              const isFirst = pos === 1;
              const medalColor = ["text-zinc-300", "text-amber-400", "text-amber-600"][i];
              const avatarBorder = ["border-zinc-500/40", "border-amber-400/50", "border-amber-700/40"][i];
              const medalBg = ["bg-zinc-500/15", "bg-amber-400/15", "bg-amber-700/15"][i];
              const medalBorderSmall = ["border-zinc-500/30", "border-amber-400/40", "border-amber-700/30"][i];
              const barH = ["h-20", "h-28", "h-14"][i];
              const barBg = ["bg-zinc-500/[0.06]", "bg-amber-400/[0.07]", "bg-amber-700/[0.05]"][i];
              const barBorderColor = ["border-zinc-500/10", "border-amber-400/15", "border-amber-700/10"][i];
              const rankLabel = ["2nd", "1st", "3rd"][i];
              const mv = getMetricValue(item);
              const name = mode === "live" || lbType === "individual" ? item?.username : item?.name;
              return (
                <motion.div
                  key={item?.id}
                  initial={{ opacity: 0, y: 16, filter: "blur(12px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex flex-col items-center flex-1 ${isFirst ? "max-w-[210px]" : "max-w-[180px]"}`}
                  data-testid={`podium-${pos}`}
                >
                  {/* Avatar */}
                  <div className="relative mb-2.5">
                    <div className={`${isFirst ? "w-14 h-14" : "w-11 h-11"} rounded-full bg-zinc-800 border-2 ${avatarBorder} flex items-center justify-center ${isFirst ? "text-sm" : "text-xs"} font-semibold text-white`}>
                      {name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${medalBg} border ${medalBorderSmall} flex items-center justify-center`}>
                      {isFirst ? <Crown size={10} className={medalColor} /> : <Medal size={9} className={medalColor} />}
                    </div>
                  </div>

                  {/* Name + score */}
                  <p className={`font-medium text-white truncate max-w-full ${isFirst ? "text-sm" : "text-xs"}`}>{name}</p>
                  <p className={`text-[11px] font-mono mt-0.5 font-medium ${mv.positive ? "text-emerald-400" : "text-red-400"}`}>{mv.value}</p>
                  <div className="mt-1 mb-2.5">
                    <XShareButton
                      onClick={() => tweetMyRank(pos, name, item?.stats?.pnl || 0)}
                      label="Share"
                      data-testid={`share-rank-${pos}`}
                    />
                  </div>

                  {/* Podium bar */}
                  <div className={`w-full ${barH} rounded-t-lg ${barBg} border-t border-x ${barBorderColor} flex items-start justify-center pt-2.5`}>
                    <span className={`text-xs font-semibold ${medalColor}`}>{rankLabel}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {/* Base line */}
          <div className="h-px bg-zinc-800 w-full" />
        </div>
      )}

      {/* Ranking List */}
      {!isLoading && data.length > 0 && (
        <Card className="bg-card border-zinc-800" data-testid="rankings-list">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800/60 text-[11px] text-zinc-500">
              <span className="w-10 text-center">Rank</span>
              <span className="flex-1">Trader</span>
              <span className="w-24 text-right hidden md:block">P&L</span>
              <span className="w-24 text-right hidden md:block">Volume</span>
              <span className="w-20 text-right hidden md:block">Win Rate</span>
              <span className="w-20 text-right">Score</span>
            </div>
            <AnimatePresence>
              {data.map((item, i) => {
                const mv = getMetricValue(item);
                const name = mode === "live" || lbType === "individual" ? item.username : item.name;
                const sub = mode === "live" ? item.wallet_address
                    ? `${item.wallet_address.slice(0, 4)}...${item.wallet_address.slice(-4)}`
                    : `Lv.${item.level}`
                  : lbType === "team"
                  ? `${item.tag} · ${item.member_ids?.length || 0} members`
                  : `Lv.${item.level}`;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/30 transition-colors duration-150 border-b border-zinc-800/40 last:border-0"
                    data-testid={`rank-row-${i}`}
                  >
                    <span className={`text-sm font-semibold font-mono w-10 text-center ${i === 0 ? "text-indigo-400" : i === 1 ? "text-indigo-400" : i === 2 ? "text-indigo-300" : "text-zinc-600"}`}>
                      {item.position || i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center text-[11px] font-medium text-indigo-400 border border-zinc-700 shrink-0">
                      {name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white truncate font-medium">{name}</p>
                        {mode === "live" && item.wallet_address && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Live wallet data" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500">{sub}</p>
                    </div>
                    <div className="w-24 text-right hidden md:block">
                      <p className={`text-xs font-mono ${(item.stats?.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {(item.stats?.pnl || 0) >= 0 ? "+" : ""}${(item.stats?.pnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="w-24 text-right hidden md:block">
                      <p className="text-xs font-mono text-zinc-400">${((item.stats?.volume || 0) / 1000).toFixed(0)}k</p>
                    </div>
                    <div className="w-20 text-right hidden md:block">
                      <p className="text-xs text-zinc-400">{lbType === "team" && mode === "mock" ? item.stats?.avg_win_rate : item.stats?.win_rate}%</p>
                    </div>
                    <div className="w-20 text-right">
                      <Badge className={`text-[11px] ${i < 3 ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                        {mv.value}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
