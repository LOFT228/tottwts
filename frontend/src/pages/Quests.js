import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Flame, Star, Zap, Clock, CheckCircle } from "lucide-react";
import { XShareButton } from "@/components/XShareButton";
import { tweetQuestComplete } from "@/lib/twitter";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Quests() {
  const [quests, setQuests] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [tab, setTab] = useState("daily");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, aRes] = await Promise.all([api.getQuests(), api.getAchievements()]);
        setQuests(qRes.data);
        setAchievements(aRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleComplete = async (questId) => {
    const quest = quests.find(q => q.id === questId);
    try {
      const res = await api.completeQuest(questId);
      setQuests((prev) => prev.map((q) => q.id === questId ? { ...q, completed: true, progress: q.target } : q));
      toast.success(`Quest completed! +${res.data.xp_earned} XP`, {
        action: {
          label: "Share on X",
          onClick: () => tweetQuestComplete(quest?.title || "Quest", res.data.xp_earned),
        },
      });
    } catch (e) { toast.error("Failed to complete quest"); }
  };

  const filteredQuests = quests.filter((q) => q.quest_type === tab);
  const completedCount = quests.filter((q) => q.completed).length;
  const totalXP = quests.filter((q) => q.completed).reduce((sum, q) => sum + q.xp_reward, 0);

  const rarityColors = {
    common: "border-zinc-600 bg-zinc-600/10 text-zinc-400",
    rare: "border-indigo-400 bg-indigo-400/10 text-indigo-400",
    epic: "border-indigo-500 bg-indigo-500/10 text-indigo-500",
    legendary: "border-indigo-400 bg-indigo-400/10 text-indigo-400",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="quests-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Quest Center</h1>
        <p className="text-[11px] text-zinc-500 mt-1">Complete challenges. Earn XP. Level up.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4" data-testid="quest-stats">
        <Card className="bg-card border-zinc-800">
          <CardContent className="p-4 text-center">
            <Target size={18} className="text-indigo-400 mx-auto mb-1" />
            <p className="text-xl font-semibold text-white font-mono">{completedCount}/{quests.length}</p>
            <p className="text-[11px] text-zinc-500">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-zinc-800">
          <CardContent className="p-4 text-center">
            <Zap size={18} className="text-indigo-400 mx-auto mb-1" />
            <p className="text-xl font-semibold text-indigo-400 font-mono">{totalXP.toLocaleString()}</p>
            <p className="text-[11px] text-zinc-500">XP Earned</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-zinc-800">
          <CardContent className="p-4 text-center">
            <Flame size={18} className="text-red-400 mx-auto mb-1" />
            <p className="text-xl font-semibold text-white font-mono">{achievements.length}</p>
            <p className="text-[11px] text-zinc-500">Badges</p>
          </CardContent>
        </Card>
      </div>

      {/* Quest Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-zinc-900/80 border border-zinc-800" data-testid="quest-tabs">
          <TabsTrigger value="daily" className="data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-400 text-xs" data-testid="tab-daily">
            <Clock size={12} className="mr-1" /> Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-400 text-xs" data-testid="tab-weekly">
            <Star size={12} className="mr-1" /> Weekly
          </TabsTrigger>
          <TabsTrigger value="achievement" className="data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-400 text-xs" data-testid="tab-achievement">
            <Target size={12} className="mr-1" /> Achievements
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Quest Cards */}
      <div className="space-y-3" data-testid="quest-list">
        {filteredQuests.map((quest, i) => {
          const pct = Math.min((quest.progress / quest.target) * 100, 100);
          return (
            <motion.div key={quest.id} initial={{ opacity: 0, y: 10, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
              <Card className={`bg-card border-zinc-800 ${quest.completed ? "opacity-60" : ""}`} data-testid={`quest-card-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center border ${quest.completed ? "bg-emerald-500/10 border-emerald-500/30" : "bg-zinc-800/50 border-zinc-800"}`}>
                    {quest.completed ? <CheckCircle size={18} className="text-emerald-400" /> : <Target size={18} className="text-zinc-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-white">{quest.title}</p>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[10px]">+{quest.xp_reward} XP</Badge>
                    </div>
                    <p className="text-[11px] text-zinc-500 mb-2">{quest.description}</p>
                    <div className="flex items-center gap-3">
                      <Progress value={pct} className="h-1.5 flex-1 bg-zinc-800 [&>div]:bg-indigo-500" />
                      <span className="text-[11px] text-zinc-500 font-mono">{quest.progress}/{quest.target}</span>
                    </div>
                  </div>
                  {!quest.completed && pct >= 100 && (
                    <Button size="sm" onClick={() => handleComplete(quest.id)} className="bg-indigo-500 text-white font-semibold text-xs hover:bg-indigo-600 h-8 px-3" data-testid={`claim-quest-${i}`}>
                      Claim
                    </Button>
                  )}
                  {quest.completed && (
                    <XShareButton
                      onClick={() => tweetQuestComplete(quest.title, quest.xp_reward)}
                      label="Share"
                      data-testid={`share-quest-${i}`}
                      className="text-zinc-700 hover:text-white shrink-0"
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Badges Collection */}
      <div>
        <h2 className="text-lg text-white mb-4 font-semibold">Badge Collection</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="badges-grid">
          {achievements.map((badge, i) => (
            <Card key={badge.id} className={`bg-card border ${rarityColors[badge.rarity]?.split(" ")[0] || "border-zinc-800"} hover:scale-[1.02] transition-transform duration-150`} data-testid={`badge-${i}`}>
              <CardContent className="p-4 text-center">
                <div className={`w-10 h-10 rounded-md mx-auto mb-2 flex items-center justify-center border ${rarityColors[badge.rarity] || ""}`}>
                  <Star size={18} />
                </div>
                <p className="text-xs text-white">{badge.name}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{badge.description}</p>
                <Badge className={`mt-2 text-[10px] ${rarityColors[badge.rarity] || ""}`}>{badge.rarity}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
