import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageSquare, Flame, Trophy, Star, Send } from "lucide-react";
import { XShareButton } from "@/components/XShareButton";
import { tweetSocialPost } from "@/lib/twitter";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Social() {
  const [posts, setPosts] = useState([]);
  const [players, setPlayers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, plRes] = await Promise.all([api.getSocialFeed({}), api.getPlayers()]);
        setPosts(pRes.data);
        setPlayers(plRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handlePost = async () => {
    if (!newPost.trim() || players.length === 0) return;
    try {
      const res = await api.createPost({ player_id: players[0].id, content: newPost.trim(), post_type: "trash_talk" });
      setPosts((prev) => [res.data, ...prev]);
      setNewPost("");
      toast.success("Posted to the arena");
    } catch (e) { toast.error("Failed to post"); }
  };

  const handleLike = async (postId) => {
    try {
      await api.likePost(postId);
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    } catch (e) { console.error(e); }
  };

  const filteredPosts = filter === "all" ? posts : posts.filter((p) => p.post_type === filter);
  const typeIcons = { trash_talk: Flame, highlight: Trophy, achievement: Star };
  const typeColors = { trash_talk: "text-red-400", highlight: "text-indigo-400", achievement: "text-indigo-400" };

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="social-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Social Feed</h1>
        <p className="text-[11px] text-zinc-500 mt-1">Talk trash. Flex wins. Get hyped.</p>
      </div>

      {/* New Post */}
      <Card className="bg-card border-zinc-800" data-testid="new-post-card">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-md bg-zinc-800 flex items-center justify-center text-[11px] text-indigo-400 border border-zinc-700 shrink-0">
              {players[0]?.username?.slice(0, 2).toUpperCase() || "??"}
            </div>
            <div className="flex-1">
              <Textarea
                placeholder="Drop a message in the arena..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white text-sm resize-none min-h-[60px] focus:border-indigo-500 placeholder:text-zinc-600"
                data-testid="new-post-input"
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={handlePost} disabled={!newPost.trim()} className="bg-indigo-500 text-white font-semibold text-xs h-8 px-4 hover:bg-indigo-600" data-testid="submit-post-btn">
                  <Send size={12} className="mr-1" /> Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-zinc-900/80 border border-zinc-800" data-testid="social-filter-tabs">
          <TabsTrigger value="all" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs" data-testid="filter-all">All</TabsTrigger>
          <TabsTrigger value="trash_talk" className="data-[state=active]:bg-red-400/15 data-[state=active]:text-red-400 text-xs" data-testid="filter-trash-talk">Trash Talk</TabsTrigger>
          <TabsTrigger value="highlight" className="data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-400 text-xs" data-testid="filter-highlights">Highlights</TabsTrigger>
          <TabsTrigger value="achievement" className="data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-400 text-xs" data-testid="filter-achievements">Achievements</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Posts Feed */}
      <div className="space-y-3" data-testid="posts-feed">
        {filteredPosts.map((post, i) => {
          const TypeIcon = typeIcons[post.post_type] || MessageSquare;
          const typeColor = typeColors[post.post_type] || "text-zinc-400";
          return (
            <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="bg-card border-zinc-800 hover:border-zinc-700 transition-colors duration-150" data-testid={`post-${i}`}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-md bg-zinc-800/80 flex items-center justify-center text-[11px] text-indigo-400 border border-zinc-800 shrink-0">
                      {post.player_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-white">{post.player_name}</span>
                        <Badge className="bg-zinc-800 border-zinc-700 text-zinc-500 text-[10px]">Lv.{post.player_level}</Badge>
                        <TypeIcon size={11} className={typeColor} />
                        <span className="text-[11px] text-zinc-600 ml-auto">{timeAgo(post.created_at)}</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <button onClick={() => handleLike(post.id)} className="flex items-center gap-1.5 text-zinc-600 hover:text-red-400 transition-colors duration-150" data-testid={`like-btn-${i}`}>
                          <Heart size={13} />
                          <span className="text-xs">{post.likes}</span>
                        </button>
                        <XShareButton
                          onClick={() => tweetSocialPost(post.content, post.player_name)}
                          label="Share on X"
                          data-testid={`share-post-${i}`}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
