import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useWalletContext } from "@/contexts/WalletContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Users, TrendingUp, Activity, Shield, Plus, ChevronDown, ChevronUp, MessageSquare, Send, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const WS_BASE = process.env.REACT_APP_BACKEND_URL
  ? process.env.REACT_APP_BACKEND_URL.replace(/^https/, "wss").replace(/^http/, "ws")
  : "ws://localhost:8001";

export default function Teams() {
  const { player } = useWalletContext();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [activeTab, setActiveTab] = useState({}); // teamId -> "members"|"chat"
  const [teamDetails, setTeamDetails] = useState({});
  const [chatMessages, setChatMessages] = useState({}); // teamId -> msgs[]
  const [chatInput, setChatInput] = useState("");
  const [wsConnected, setWsConnected] = useState({});
  const wsRefs = useRef({});
  const chatEndRef = useRef(null);
  const [newTeam, setNewTeam] = useState({ name: "", tag: "" });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    api.getTeams().then((r) => { setTeams(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const connectChatWS = useCallback((teamId) => {
    if (wsRefs.current[teamId]) return;
    const ws = new WebSocket(`${WS_BASE}/api/ws/chat/${teamId}`);
    ws.onopen = () => setWsConnected(prev => ({ ...prev, [teamId]: true }));
    ws.onclose = () => {
      setWsConnected(prev => ({ ...prev, [teamId]: false }));
      delete wsRefs.current[teamId];
    };
    ws.onerror = () => {
      setWsConnected(prev => ({ ...prev, [teamId]: false }));
      // Fallback: load via REST
      api.getTeamChat(teamId).then(r => {
        setChatMessages(prev => ({ ...prev, [teamId]: r.data }));
      }).catch(() => {});
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "history") {
          setChatMessages(prev => ({ ...prev, [teamId]: msg.data }));
        } else if (msg.type === "ping") {
          // ignore
        } else if (msg.id) {
          setChatMessages(prev => ({
            ...prev,
            [teamId]: [...(prev[teamId] || []), msg],
          }));
        }
      } catch {}
    };
    wsRefs.current[teamId] = ws;
  }, []);

  const disconnectChatWS = useCallback((teamId) => {
    if (wsRefs.current[teamId]) {
      wsRefs.current[teamId].close();
      delete wsRefs.current[teamId];
    }
  }, []);

  useEffect(() => {
    return () => {
      Object.keys(wsRefs.current).forEach(tid => wsRefs.current[tid]?.close());
    };
  }, []);

  const toggleExpand = async (teamId) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null);
      disconnectChatWS(teamId);
      return;
    }
    setExpandedTeam(teamId);
    setActiveTab(prev => ({ ...prev, [teamId]: prev[teamId] || "members" }));

    if (!teamDetails[teamId]) {
      try {
        const res = await api.getTeam(teamId);
        setTeamDetails(prev => ({ ...prev, [teamId]: res.data }));
      } catch (e) { console.error(e); }
    }
    // Connect chat WS
    connectChatWS(teamId);
    // Load chat history via REST as fallback
    if (!chatMessages[teamId]) {
      try {
        const cr = await api.getTeamChat(teamId);
        setChatMessages(prev => ({ ...prev, [teamId]: cr.data }));
      } catch {}
    }
  };

  const sendMessage = async (teamId) => {
    if (!chatInput.trim()) return;
    const senderId = player?.id || (teamDetails[teamId]?.members?.[0]?.id);
    if (!senderId) { toast.error("Connect wallet or select a player to chat"); return; }
    try {
      await api.postTeamChat(teamId, { sender_id: senderId, content: chatInput.trim() });
      setChatInput("");
      // If WS not connected, manually refresh
      if (!wsRefs.current[teamId] || wsRefs.current[teamId].readyState !== 1) {
        const cr = await api.getTeamChat(teamId);
        setChatMessages(prev => ({ ...prev, [teamId]: cr.data }));
      }
    } catch (e) { toast.error("Failed to send message"); }
  };

  const handleCreate = async () => {
    if (!newTeam.name || !newTeam.tag) { toast.error("Fill in all fields"); return; }
    try {
      const res = await api.createTeam(newTeam);
      setTeams(prev => [...prev, res.data]);
      setNewTeam({ name: "", tag: "" });
      setDialogOpen(false);
      toast.success("Team created!");
    } catch { toast.error("Failed to create team"); }
  };

  const msgs = (teamId) => chatMessages[teamId] || [];

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="teams-page">
      <div className="flex items-center justify-between animate-blur-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Teams</h1>
          <p className="text-[11px] text-zinc-500 mt-1">Squad up. Dominate together.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-indigo-500 text-white font-semibold text-xs h-9 px-5 hover:bg-indigo-600 transition-colors"
              data-testid="create-team-btn"
            >
              <span className="flex items-center gap-1"><Plus size={14} /> Create Team</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800" data-testid="create-team-dialog" aria-describedby="create-team-desc">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Team</DialogTitle>
              <p id="create-team-desc" className="text-xs text-zinc-500">Form a squad and compete together.</p>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder="Team Name" value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white focus:border-indigo-500 transition-colors" data-testid="team-name-input" />
              <Input placeholder="Tag (e.g. WOLF)" value={newTeam.tag} onChange={(e) => setNewTeam({ ...newTeam, tag: e.target.value.toUpperCase().slice(0, 4) })} className="bg-zinc-900 border-zinc-800 text-white uppercase focus:border-indigo-500 transition-colors" maxLength={4} data-testid="team-tag-input" />
              <Button onClick={handleCreate} className="w-full bg-indigo-500 text-white font-semibold text-xs hover:bg-indigo-600" data-testid="confirm-create-team-btn">
                Create Team
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4" data-testid="teams-grid">
        {teams.map((team, i) => {
          const isExpanded = expandedTeam === team.id;
          const details = teamDetails[team.id];
          const tab = activeTab[team.id] || "members";
          const isWsOn = wsConnected[team.id];
          const teamMsgs = msgs(team.id);

          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 14, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card
                className={`bg-card border-zinc-800 overflow-hidden transition-all duration-200 ${isExpanded ? "border-indigo-500/25" : ""}`}
                data-testid={`team-card-${i}`}
              >
                <CardContent className="p-0">
                  {/* Team Header */}
                  <button
                    onClick={() => toggleExpand(team.id)}
                    className="w-full flex items-center gap-4 p-5 text-left group"
                    data-testid={`team-expand-${i}`}
                  >
                    <div className={`w-12 h-12 rounded-md flex items-center justify-center border transition-all duration-200 ${isExpanded ? "bg-indigo-500/10 border-indigo-500/40" : "bg-zinc-800/80 border-zinc-800"}`}>
                      <Shield size={20} className={isExpanded ? "text-indigo-400" : "text-zinc-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm text-white group-hover:text-indigo-400 transition-colors">{team.name}</h3>
                        <Badge className="bg-zinc-800 border-zinc-700 text-zinc-400 text-[11px]">{team.tag}</Badge>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{team.member_ids?.length || 0} members</p>
                    </div>
                    <div className="hidden sm:flex gap-6">
                      <StatMini label="P&L" value={`${team.stats.pnl >= 0 ? "+" : ""}$${team.stats.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} positive={team.stats.pnl >= 0} />
                      <StatMini label="Volume" value={`$${(team.stats.volume / 1000).toFixed(0)}k`} />
                      <StatMini label="Win Rate" value={`${team.stats.avg_win_rate}%`} />
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-indigo-400" /> : <ChevronDown size={16} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />}
                  </button>

                  {/* Expanded Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, filter: "blur(8px)" }}
                        animate={{ height: "auto", opacity: 1, filter: "blur(0px)" }}
                        exit={{ height: 0, opacity: 0, filter: "blur(8px)" }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        {/* Tab Bar */}
                        <div className="border-t border-zinc-800/50 flex" data-testid={`team-tabs-${i}`}>
                          <TabBtn active={tab === "members"} onClick={() => setActiveTab(p => ({ ...p, [team.id]: "members" }))} icon={<Users size={12} />} label="Members" />
                          <TabBtn active={tab === "chat"} onClick={() => setActiveTab(p => ({ ...p, [team.id]: "chat" }))} icon={<MessageSquare size={12} />} label="Chat">
                            {isWsOn
                              ? <span className="live-dot ml-1.5" />
                              : <WifiOff size={8} className="text-zinc-600 ml-1" />
                            }
                          </TabBtn>
                        </div>

                        {/* Members Tab */}
                        {tab === "members" && details?.members && (
                          <div className="px-5 py-4 space-y-2 bg-zinc-900/30" data-testid={`team-members-${i}`}>
                            <p className="text-[11px] text-zinc-500 mb-3">Squad Roster</p>
                            {details.members.map((m, j) => (
                              <motion.div
                                key={m.id}
                                initial={{ opacity: 0, x: -10, filter: "blur(6px)" }}
                                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                transition={{ delay: j * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="flex items-center gap-3 p-2.5 rounded-md bg-zinc-800/20 hover:bg-zinc-800/40 transition-colors border border-transparent hover:border-zinc-800"
                                data-testid={`team-member-${j}`}
                              >
                                <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center text-[11px] text-indigo-400 border border-zinc-700">
                                  {m.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-white">{m.username}</p>
                                  <p className="text-[11px] text-zinc-500">Lv.{m.level}</p>
                                </div>
                                <p className={`text-xs font-semibold font-mono ${m.stats.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {m.stats.pnl >= 0 ? "+" : ""}${m.stats.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                                {m.id === details.captain_id && (
                                  <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[10px]">CPT</Badge>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* Chat Tab */}
                        {tab === "chat" && (
                          <div className="flex flex-col h-80 bg-zinc-900/20" data-testid={`team-chat-${i}`}>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                              {teamMsgs.length === 0 && (
                                <div className="text-center py-8">
                                  <MessageSquare size={24} className="text-zinc-700 mx-auto mb-2" />
                                  <p className="text-[11px] text-zinc-500">No messages yet. Be the first to talk!</p>
                                </div>
                              )}
                              <AnimatePresence initial={false}>
                                {teamMsgs.map((msg, mi) => {
                                  const isMe = player && msg.sender_id === player.id;
                                  return (
                                    <motion.div
                                      key={msg.id}
                                      initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                      className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                                      data-testid={`chat-msg-${mi}`}
                                    >
                                      <div className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-[9px] border ${isMe ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
                                        {msg.sender_name?.slice(0, 2).toUpperCase()}
                                      </div>
                                      <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                                        <span className="text-[10px] text-zinc-500">{isMe ? "You" : msg.sender_name}</span>
                                        <div className={`px-3 py-1.5 rounded-md text-xs ${isMe ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-zinc-800/50 text-zinc-200 border border-zinc-800"}`}>
                                          {msg.content}
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </AnimatePresence>
                              <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <div className="border-t border-zinc-800/50 p-3 flex gap-2">
                              <Input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage(team.id)}
                                placeholder={player ? "Message your squad..." : "Connect wallet to chat..."}
                                disabled={!player}
                                className="bg-zinc-900 border-zinc-800 text-white text-xs flex-1 focus:border-indigo-500/50 transition-colors placeholder:text-zinc-600"
                                data-testid={`chat-input-${i}`}
                              />
                              <Button
                                size="sm"
                                onClick={() => sendMessage(team.id)}
                                disabled={!chatInput.trim() || !player}
                                className="bg-indigo-500 text-white hover:bg-indigo-600 h-9 px-3 transition-colors"
                                data-testid={`chat-send-${i}`}
                              >
                                <Send size={12} />
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all duration-150 border-b-2 ${
        active
          ? "text-indigo-400 border-indigo-500 bg-indigo-500/5"
          : "text-zinc-600 border-transparent hover:text-zinc-400 hover:bg-zinc-800/30"
      }`}
    >
      {icon} {label} {children}
    </button>
  );
}

function StatMini({ label, value, positive }) {
  return (
    <div className="text-right">
      <p className="text-[11px] text-zinc-500">{label}</p>
      <p className={`text-sm font-semibold font-mono ${positive === true ? "text-emerald-400" : positive === false ? "text-red-400" : "text-white"}`}>{value}</p>
    </div>
  );
}
