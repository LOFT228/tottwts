from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import random
import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import httpx
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ========= MODELS =========

class TeamCreate(BaseModel):
    name: str
    tag: str

class TeamMessageCreate(BaseModel):
    sender_id: str
    content: str

class SocialPostCreate(BaseModel):
    player_id: str
    content: str
    post_type: str = "trash_talk"

class AIInsightRequest(BaseModel):
    player_id: str
    context: Optional[str] = "general"

# ========= HELPERS =========

def gen_id():
    return str(uuid.uuid4())

def now_iso():
    return datetime.now(timezone.utc).isoformat()

# ========= CONSTANTS =========

GAMER_NAMES = [
    "CryptoViking", "SolanaSniper", "DeFiDegen", "LiquidatorX",
    "PerpWizard", "NeonTrader", "VoidRunner", "PhantomKing",
    "AlphaHunter", "BearSlayer", "MoonShot", "FlashCrash",
    "LeverageKing", "TokenSamurai", "ChainBreaker", "ByteTrader"
]

TEAM_NAMES = [
    ("Alpha Wolves", "AWLF"), ("Neon Bulls", "NBUL"),
    ("Phantom Traders", "PHTM"), ("Void Sharks", "VSRK")
]

BADGE_DEFS = [
    {"id": "first-blood", "name": "First Blood", "description": "Execute your first trade", "icon": "sword", "rarity": "common"},
    {"id": "whale-alert", "name": "Whale Alert", "description": "$100k+ total volume", "icon": "fish", "rarity": "rare"},
    {"id": "streak-master", "name": "Streak Master", "description": "10+ win streak", "icon": "flame", "rarity": "epic"},
    {"id": "diamond-hands", "name": "Diamond Hands", "description": "Hold position 24h+", "icon": "gem", "rarity": "rare"},
    {"id": "speed-demon", "name": "Speed Demon", "description": "100+ trades in a day", "icon": "zap", "rarity": "rare"},
    {"id": "profit-machine", "name": "Profit Machine", "description": "$10k+ P&L", "icon": "trending-up", "rarity": "epic"},
    {"id": "team-player", "name": "Team Player", "description": "Join a team", "icon": "users", "rarity": "common"},
    {"id": "quest-crusher", "name": "Quest Crusher", "description": "Complete 10 quests", "icon": "target", "rarity": "rare"},
    {"id": "lucky-seven", "name": "Lucky Seven", "description": "7-day login streak", "icon": "clover", "rarity": "common"},
    {"id": "legendary-trader", "name": "Legendary Trader", "description": "Top 3 in competition", "icon": "crown", "rarity": "legendary"},
    {"id": "degen-king", "name": "Degen King", "description": "Highest leverage trade", "icon": "skull", "rarity": "epic"},
    {"id": "the-oracle", "name": "The Oracle", "description": "5 winning trades in a row", "icon": "eye", "rarity": "legendary"},
]

QUEST_DEFS = [
    {"title": "Execute 5 Trades", "description": "Complete 5 trades today", "quest_type": "daily", "metric": "trades", "target": 5, "xp_reward": 100},
    {"title": "Achieve $1k Volume", "description": "Trade $1,000 in volume today", "quest_type": "daily", "metric": "volume", "target": 1000, "xp_reward": 150},
    {"title": "Win 3 Trades", "description": "Win at least 3 trades today", "quest_type": "daily", "metric": "wins", "target": 3, "xp_reward": 200},
    {"title": "Hold a Position 1hr", "description": "Maintain an open position for 1 hour", "quest_type": "daily", "metric": "hold_time", "target": 60, "xp_reward": 100},
    {"title": "Trade 3 Different Pairs", "description": "Trade 3 different trading pairs", "quest_type": "daily", "metric": "pairs", "target": 3, "xp_reward": 120},
    {"title": "Weekly Warrior", "description": "Execute 50 trades this week", "quest_type": "weekly", "metric": "trades", "target": 50, "xp_reward": 500},
    {"title": "Volume King", "description": "Achieve $50k volume this week", "quest_type": "weekly", "metric": "volume", "target": 50000, "xp_reward": 750},
    {"title": "Profit Master", "description": "Earn $5k P&L this week", "quest_type": "weekly", "metric": "pnl", "target": 5000, "xp_reward": 1000},
    {"title": "First Steps", "description": "Complete your first trade ever", "quest_type": "achievement", "metric": "trades", "target": 1, "xp_reward": 50},
    {"title": "Team Up", "description": "Join or create a team", "quest_type": "achievement", "metric": "team", "target": 1, "xp_reward": 200},
    {"title": "Social Butterfly", "description": "Post 5 messages in the social feed", "quest_type": "achievement", "metric": "posts", "target": 5, "xp_reward": 150},
    {"title": "Streak Builder", "description": "Achieve a 5-day login streak", "quest_type": "achievement", "metric": "streak", "target": 5, "xp_reward": 300},
    {"title": "Centurion", "description": "Execute 100 trades total", "quest_type": "achievement", "metric": "trades", "target": 100, "xp_reward": 500},
]

TRASH_TALKS = [
    "Just liquidated a whale. Feels good.",
    "Who's ready to get rekt in the Showdown?",
    "Alpha Wolves gonna dominate this season.",
    "My PnL is higher than your portfolio.",
    "Just hit a 10x on SOL perps. EZ.",
    "Phantom Traders? More like Phantom Losers.",
    "New streak record. Try to beat that.",
    "This market is too easy right now.",
    "Bear market? Never heard of her.",
    "GG to everyone in the Flash Crash Cup.",
    "Void Sharks coming for that top spot.",
    "Just completed the Weekly Warrior quest.",
    "3 competitions in, still undefeated.",
    "Leverage is my middle name.",
    "Neon Bulls charging to number one.",
    "That 50x long was pure skill, not luck.",
    "Anyone wanna 1v1 PnL battle?",
    "The Oracle badge is mine. Called every move.",
    "Degen hours are the best hours.",
    "Season 5 is gonna be legendary.",
]

# ========= SEED ENDPOINT =========

@api_router.post("/seed")
async def seed_data():
    count = await db.players.count_documents({})
    if count > 0:
        return {"message": "Data already seeded", "seeded": False}

    player_ids = [gen_id() for _ in range(16)]
    team_ids = [gen_id() for _ in range(4)]
    comp_ids = [gen_id() for _ in range(3)]

    players = []
    for i, pid in enumerate(player_ids):
        level = random.randint(5, 45)
        xp_per_level = 1000
        total_xp = level * xp_per_level + random.randint(0, xp_per_level - 1)
        current_xp = total_xp % xp_per_level
        pnl = round(random.uniform(-5000, 50000), 2)
        volume = round(random.uniform(10000, 500000), 2)
        win_rate = round(random.uniform(35, 85), 1)
        trades_count = random.randint(20, 500)
        current_streak = random.randint(0, 15)
        best_streak = max(current_streak, random.randint(5, 25))
        team_idx = i // 4 if i < 16 else None
        badge_count = random.randint(1, 6)
        player_badges = random.sample([b["id"] for b in BADGE_DEFS], badge_count)

        players.append({
            "id": pid,
            "username": GAMER_NAMES[i],
            "avatar_url": f"https://api.dicebear.com/7.x/bottts-neutral/svg?seed={GAMER_NAMES[i]}",
            "level": level,
            "xp": current_xp,
            "total_xp": total_xp,
            "xp_to_next": xp_per_level,
            "stats": {
                "pnl": pnl, "volume": volume, "win_rate": win_rate,
                "trades_count": trades_count, "current_streak": current_streak,
                "best_streak": best_streak,
                "avg_leverage": round(random.uniform(1.5, 20), 1),
                "best_trade": round(random.uniform(500, 15000), 2),
                "worst_trade": round(random.uniform(-5000, -100), 2),
            },
            "badges": player_badges,
            "team_id": team_ids[team_idx] if team_idx is not None else None,
            "competition_ids": [comp_ids[0], comp_ids[2]],
            "rank": 0,
            "joined_at": now_iso(),
        })

    players.sort(key=lambda p: p["stats"]["pnl"], reverse=True)
    for i, p in enumerate(players):
        p["rank"] = i + 1

    teams = []
    for i, tid in enumerate(team_ids):
        team_players = [p for p in players if p["team_id"] == tid]
        team_pnl = sum(p["stats"]["pnl"] for p in team_players)
        team_volume = sum(p["stats"]["volume"] for p in team_players)
        avg_wr = sum(p["stats"]["win_rate"] for p in team_players) / max(len(team_players), 1)
        teams.append({
            "id": tid, "name": TEAM_NAMES[i][0], "tag": TEAM_NAMES[i][1],
            "captain_id": team_players[0]["id"] if team_players else None,
            "member_ids": [p["id"] for p in team_players],
            "stats": {
                "pnl": round(team_pnl, 2), "volume": round(team_volume, 2),
                "avg_win_rate": round(avg_wr, 1),
                "total_trades": sum(p["stats"]["trades_count"] for p in team_players),
            },
            "competition_ids": [comp_ids[0]],
            "created_at": now_iso(),
        })

    now = datetime.now(timezone.utc)
    competitions = [
        {
            "id": comp_ids[0], "name": "Solana Season Showdown",
            "description": "The ultimate Solana trading competition. Teams and individuals battle for glory and prizes.",
            "comp_type": "team", "status": "active",
            "start_date": (now - timedelta(days=5)).isoformat(),
            "end_date": (now + timedelta(days=9)).isoformat(),
            "prize_pool": 50000,
            "prize_distribution": {"1st": 25000, "2nd": 15000, "3rd": 10000},
            "scoring": {"pnl_weight": 0.4, "volume_weight": 0.25, "winrate_weight": 0.2, "streak_weight": 0.15},
            "participant_ids": player_ids, "team_ids": team_ids,
            "total_volume": round(sum(p["stats"]["volume"] for p in players), 2),
            "total_trades": sum(p["stats"]["trades_count"] for p in players),
            "created_at": now_iso(),
        },
        {
            "id": comp_ids[1], "name": "Flash Crash Cup",
            "description": "Speed trading competition. Most profitable in 24 hours wins.",
            "comp_type": "individual", "status": "upcoming",
            "start_date": (now + timedelta(days=3)).isoformat(),
            "end_date": (now + timedelta(days=4)).isoformat(),
            "prize_pool": 15000,
            "prize_distribution": {"1st": 8000, "2nd": 4500, "3rd": 2500},
            "scoring": {"pnl_weight": 0.6, "volume_weight": 0.2, "winrate_weight": 0.1, "streak_weight": 0.1},
            "participant_ids": [], "team_ids": [],
            "total_volume": 0, "total_trades": 0, "created_at": now_iso(),
        },
        {
            "id": comp_ids[2], "name": "Perp Masters Season 4",
            "description": "The legendary multi-week competition. Only the best survive.",
            "comp_type": "individual", "status": "completed",
            "start_date": (now - timedelta(days=30)).isoformat(),
            "end_date": (now - timedelta(days=2)).isoformat(),
            "prize_pool": 100000,
            "prize_distribution": {"1st": 50000, "2nd": 30000, "3rd": 20000},
            "scoring": {"pnl_weight": 0.35, "volume_weight": 0.3, "winrate_weight": 0.2, "streak_weight": 0.15},
            "participant_ids": player_ids[:12], "team_ids": [],
            "total_volume": round(sum(p["stats"]["volume"] for p in players[:12]) * 3, 2),
            "total_trades": sum(p["stats"]["trades_count"] for p in players[:12]) * 3,
            "created_at": now_iso(),
        },
    ]

    quests = []
    for qdef in QUEST_DEFS:
        progress = random.randint(0, qdef["target"])
        quests.append({
            "id": gen_id(), **qdef,
            "progress": progress, "completed": progress >= qdef["target"],
            "expires_at": (now + timedelta(days=1 if qdef["quest_type"] == "daily" else 7 if qdef["quest_type"] == "weekly" else 365)).isoformat(),
            "created_at": now_iso(),
        })

    achievements = [{"id": b["id"], **b, "created_at": now_iso()} for b in BADGE_DEFS]

    social_posts = []
    for content in TRASH_TALKS:
        poster = random.choice(players)
        social_posts.append({
            "id": gen_id(), "player_id": poster["id"],
            "player_name": poster["username"], "player_avatar": poster["avatar_url"],
            "player_level": poster["level"], "content": content,
            "post_type": random.choice(["trash_talk", "highlight", "achievement"]),
            "likes": random.randint(0, 50), "liked_by": [],
            "created_at": (now - timedelta(hours=random.randint(1, 72))).isoformat(),
        })

    await db.players.insert_many(players)
    await db.teams.insert_many(teams)
    await db.competitions.insert_many(competitions)
    await db.quests.insert_many(quests)
    await db.achievements.insert_many(achievements)
    await db.social_posts.insert_many(social_posts)

    return {"message": "Data seeded successfully", "seeded": True}

# ========= COMPETITION ENDPOINTS =========

@api_router.get("/competitions")
async def get_competitions(status: Optional[str] = None):
    query = {"status": status} if status else {}
    return await db.competitions.find(query, {"_id": 0}).to_list(100)

@api_router.get("/competitions/{comp_id}")
async def get_competition(comp_id: str):
    comp = await db.competitions.find_one({"id": comp_id}, {"_id": 0})
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    return comp

# ========= LEADERBOARD =========

@api_router.get("/leaderboard")
async def get_leaderboard(lb_type: str = "individual", metric: str = "composite", limit: int = 50):
    if lb_type == "team":
        items = await db.teams.find({}, {"_id": 0}).to_list(100)
        sort_keys = {
            "pnl": lambda t: t["stats"]["pnl"],
            "volume": lambda t: t["stats"]["volume"],
        }
        if metric in sort_keys:
            items.sort(key=sort_keys[metric], reverse=True)
        else:
            for t in items:
                t["composite_score"] = round(
                    t["stats"]["pnl"] * 0.4 + t["stats"]["volume"] * 0.00025 + t["stats"]["avg_win_rate"] * 100 * 0.2, 2
                )
            items.sort(key=lambda t: t.get("composite_score", 0), reverse=True)
    else:
        items = await db.players.find({}, {"_id": 0}).to_list(100)
        sort_keys = {
            "pnl": lambda p: p["stats"]["pnl"],
            "volume": lambda p: p["stats"]["volume"],
            "winrate": lambda p: p["stats"]["win_rate"],
            "streak": lambda p: p["stats"]["current_streak"],
        }
        if metric in sort_keys:
            items.sort(key=sort_keys[metric], reverse=True)
        else:
            for p in items:
                p["composite_score"] = round(
                    p["stats"]["pnl"] * 0.004 + p["stats"]["volume"] * 0.00025 +
                    p["stats"]["win_rate"] * 2 + p["stats"]["current_streak"] * 15, 2
                )
            items.sort(key=lambda p: p.get("composite_score", 0), reverse=True)

    for i, item in enumerate(items):
        item["position"] = i + 1
    return items[:limit]

# ========= PLAYER ENDPOINTS =========

@api_router.get("/players")
async def get_players():
    return await db.players.find({}, {"_id": 0}).to_list(100)

@api_router.get("/players/{player_id}")
async def get_player(player_id: str):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

# ========= TEAM ENDPOINTS =========

@api_router.get("/teams")
async def get_teams():
    return await db.teams.find({}, {"_id": 0}).to_list(100)

@api_router.get("/teams/{team_id}")
async def get_team(team_id: str):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    members = await db.players.find({"team_id": team_id}, {"_id": 0}).to_list(100)
    team["members"] = members
    return team

@api_router.post("/teams")
async def create_team(data: TeamCreate):
    team = {
        "id": gen_id(), "name": data.name, "tag": data.tag,
        "captain_id": None, "member_ids": [],
        "stats": {"pnl": 0, "volume": 0, "avg_win_rate": 0, "total_trades": 0},
        "competition_ids": [], "created_at": now_iso(),
    }
    await db.teams.insert_one(team)
    team.pop("_id", None)
    return team

# ========= TEAM CHAT =========

@api_router.get("/teams/{team_id}/chat")
async def get_team_chat(team_id: str, limit: int = 60):
    msgs = await db.team_messages.find({"team_id": team_id}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return list(reversed(msgs))

@api_router.post("/teams/{team_id}/chat")
async def post_team_chat(team_id: str, data: TeamMessageCreate):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    player = await db.players.find_one({"id": data.sender_id}, {"_id": 0})
    msg = {
        "id": gen_id(), "team_id": team_id,
        "sender_id": data.sender_id,
        "sender_name": player["username"] if player else "Anonymous",
        "sender_level": player["level"] if player else 1,
        "content": data.content,
        "created_at": now_iso(),
    }
    await db.team_messages.insert_one(msg)
    msg.pop("_id", None)
    # Broadcast to WebSocket listeners
    await chat_manager.broadcast(team_id, msg)
    return msg

# ========= QUEST ENDPOINTS =========

@api_router.get("/quests")
async def get_quests(quest_type: Optional[str] = None):
    query = {"quest_type": quest_type} if quest_type else {}
    return await db.quests.find(query, {"_id": 0}).to_list(100)

@api_router.post("/quests/{quest_id}/complete")
async def complete_quest(quest_id: str):
    quest = await db.quests.find_one({"id": quest_id}, {"_id": 0})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    await db.quests.update_one({"id": quest_id}, {"$set": {"completed": True, "progress": quest["target"]}})
    return {"message": "Quest completed", "xp_earned": quest["xp_reward"]}

# ========= ACHIEVEMENTS =========

@api_router.get("/achievements")
async def get_achievements():
    return await db.achievements.find({}, {"_id": 0}).to_list(100)

# ========= SOCIAL ENDPOINTS =========

@api_router.get("/social")
async def get_social_feed(post_type: Optional[str] = None, limit: int = 50):
    query = {"post_type": post_type} if post_type else {}
    return await db.social_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)

@api_router.post("/social")
async def create_social_post(data: SocialPostCreate):
    player = await db.players.find_one({"id": data.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    post = {
        "id": gen_id(), "player_id": data.player_id,
        "player_name": player["username"], "player_avatar": player["avatar_url"],
        "player_level": player["level"], "content": data.content,
        "post_type": data.post_type, "likes": 0, "liked_by": [],
        "created_at": now_iso(),
    }
    await db.social_posts.insert_one(post)
    post.pop("_id", None)
    return post

@api_router.post("/social/{post_id}/like")
async def like_post(post_id: str):
    result = await db.social_posts.update_one({"id": post_id}, {"$inc": {"likes": 1}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post liked"}

# ========= AI INSIGHTS =========

@api_router.post("/ai/insights")
async def get_ai_insights(request: AIInsightRequest):
    player = await db.players.find_one({"id": request.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return {"insight": "AI insights unavailable. No API key configured.", "player_id": request.player_id}
    try:
        import httpx as _httpx
        stats = player["stats"]
        prompt = f"""Analyze this trader's performance:
Username: {player['username']} | Level: {player['level']}
P&L: ${stats['pnl']:,.2f} | Volume: ${stats['volume']:,.2f} | Win Rate: {stats['win_rate']}%
Current Streak: {stats['current_streak']} | Best Streak: {stats['best_streak']}
Trades: {stats['trades_count']} | Avg Leverage: {stats['avg_leverage']}x
Best Trade: ${stats['best_trade']:,.2f} | Worst Trade: ${stats['worst_trade']:,.2f}
Context: {request.context}
Give 2-3 specific, actionable insights."""
        async with _httpx.AsyncClient() as client_http:
            resp = await client_http.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": "You are an expert DeFi trading analyst for the Adrena perp DEX on Solana. Give concise, actionable trading insights. Be direct, use trading terminology. Keep responses under 150 words."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 300
                },
                timeout=15.0
            )
            data = resp.json()
            insight_text = data["choices"][0]["message"]["content"]
        return {"insight": insight_text, "player_id": player["id"]}
    except Exception as e:
        logger.error(f"AI insight error: {e}")
        return {"insight": f"Unable to generate insights: {str(e)}", "player_id": request.player_id}

# ========= STATS =========

@api_router.get("/stats")
async def get_platform_stats():
    player_count = await db.players.count_documents({})
    team_count = await db.teams.count_documents({})
    active_comps = await db.competitions.count_documents({"status": "active"})
    pipeline = [{"$group": {"_id": None, "total_volume": {"$sum": "$stats.volume"}, "total_trades": {"$sum": "$stats.trades_count"}}}]
    agg = await db.players.aggregate(pipeline).to_list(1)
    return {
        "total_players": player_count, "total_teams": team_count,
        "active_competitions": active_comps,
        "total_volume": round(agg[0]["total_volume"], 2) if agg else 0,
        "total_trades": agg[0]["total_trades"] if agg else 0,
    }

@api_router.post("/reset")
async def reset_data():
    for col in ["players", "teams", "competitions", "quests", "achievements", "social_posts"]:
        await db[col].drop()
    return {"message": "All data reset"}

# ========= ADRENA LIVE API PROXY =========

ADRENA_BASE = "https://datapi.adrena.trade"
_adrena_cache = {}
CACHE_TTL = 60  # seconds

async def adrena_fetch(path, params=None):
    cache_key = f"{path}:{str(params)}"
    now = time.time()
    if cache_key in _adrena_cache and now - _adrena_cache[cache_key]["ts"] < CACHE_TTL:
        return _adrena_cache[cache_key]["data"]
    try:
        async with httpx.AsyncClient(timeout=10) as client_http:
            resp = await client_http.get(f"{ADRENA_BASE}{path}", params=params)
            resp.raise_for_status()
            data = resp.json()
            _adrena_cache[cache_key] = {"data": data, "ts": now}
            return data
    except Exception as e:
        logger.error(f"Adrena API error for {path}: {e}")
        raise HTTPException(status_code=502, detail=f"Adrena API error: {str(e)}")

@api_router.get("/adrena/pool-stats")
async def get_adrena_pool_stats():
    return await adrena_fetch("/pool-high-level-stats")

@api_router.get("/adrena/liquidity")
async def get_adrena_liquidity():
    return await adrena_fetch("/liquidity-info")

@api_router.get("/adrena/apr")
async def get_adrena_apr():
    return await adrena_fetch("/apr")

@api_router.get("/adrena/positions/{wallet}")
async def get_adrena_positions(wallet: str, limit: int = 20):
    return await adrena_fetch("/position", {"user_wallet": wallet, "limit": limit})

# ========= TRADING ENDPOINTS =========

class TradeRequest(BaseModel):
    owner: str
    symbol: str = "SOL"
    collateral_mint: str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    collateral_amount: str = "10"
    leverage: str = "2"
    slippage: str = "0.3"

@api_router.post("/adrena/trade/open-long")
async def open_long_trade(req: TradeRequest):
    params = {
        "owner": req.owner, "symbol": req.symbol,
        "collateral_mint": req.collateral_mint,
        "collateral_amount": req.collateral_amount,
        "leverage": req.leverage, "slippage": req.slippage,
    }
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            resp = await c.get(f"{ADRENA_BASE}/open-long", params=params)
            return resp.json()
    except Exception as e:
        logger.error(f"Open long error: {e}")
        raise HTTPException(status_code=502, detail=str(e))

@api_router.post("/adrena/trade/open-short")
async def open_short_trade(req: TradeRequest):
    params = {
        "owner": req.owner, "symbol": req.symbol,
        "collateral_mint": req.collateral_mint,
        "collateral_amount": req.collateral_amount,
        "leverage": req.leverage, "slippage": req.slippage,
    }
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            resp = await c.get(f"{ADRENA_BASE}/open-short", params=params)
            return resp.json()
    except Exception as e:
        logger.error(f"Open short error: {e}")
        raise HTTPException(status_code=502, detail=str(e))

class CloseRequest(BaseModel):
    owner: str
    symbol: str = "SOL"
    price_slippage: str = "0.3"

@api_router.post("/adrena/trade/close-long")
async def close_long_trade(req: CloseRequest):
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            resp = await c.get(f"{ADRENA_BASE}/close-long", params={"owner": req.owner, "symbol": req.symbol, "price_slippage": req.price_slippage})
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@api_router.post("/adrena/trade/close-short")
async def close_short_trade(req: CloseRequest):
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            resp = await c.get(f"{ADRENA_BASE}/close-short", params={"owner": req.owner, "symbol": req.symbol, "price_slippage": req.price_slippage})
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

# ========= WALLET REGISTRATION =========

class WalletRegister(BaseModel):
    wallet_address: str
    username: Optional[str] = None

class BulkWalletImport(BaseModel):
    wallets: List[str]

class PredictionCreate(BaseModel):
    predictor_wallet: str
    predictor_name: Optional[str] = None
    target_player_id: str
    prediction_type: str   # wins / top3 / top10 / busts / rank_exact
    predicted_rank: Optional[int] = None
    stake: int = 100
    competition_id: Optional[str] = None

class DuelCreate(BaseModel):
    challenger_wallet: str
    challenger_name: Optional[str] = None
    opponent_id: str
    stake: int = 100
    duration_hours: int = 24
    metric: str = "pnl"  # pnl / volume / winrate

@api_router.post("/players/register-wallet")
async def register_wallet(data: WalletRegister):
    existing = await db.players.find_one({"wallet_address": data.wallet_address}, {"_id": 0})
    if existing:
        return existing
    # Fetch real positions to calculate stats
    try:
        pos_data = await adrena_fetch("/position", {"user_wallet": data.wallet_address, "limit": 100})
        positions = pos_data.get("data", [])
    except Exception:
        positions = []
    total_pnl = sum(p.get("pnl", 0) or 0 for p in positions)
    total_volume = sum(p.get("volume", 0) or 0 for p in positions)
    wins = sum(1 for p in positions if (p.get("pnl", 0) or 0) > 0)
    win_rate = round((wins / len(positions)) * 100, 1) if positions else 0
    short_addr = data.wallet_address[:4] + "..." + data.wallet_address[-4:]
    player = {
        "id": gen_id(), "username": data.username or short_addr,
        "wallet_address": data.wallet_address,
        "avatar_url": f"https://api.dicebear.com/7.x/bottts-neutral/svg?seed={data.wallet_address[:8]}",
        "level": max(1, min(50, len(positions) // 5 + 1)),
        "xp": len(positions) * 50, "total_xp": len(positions) * 50,
        "xp_to_next": 1000,
        "stats": {
            "pnl": round(total_pnl, 2), "volume": round(total_volume, 2),
            "win_rate": win_rate, "trades_count": len(positions),
            "current_streak": 0, "best_streak": 0,
            "avg_leverage": 0, "best_trade": 0, "worst_trade": 0,
        },
        "badges": [], "team_id": None, "competition_ids": [],
        "rank": 0, "joined_at": now_iso(),
    }
    await db.players.insert_one(player)
    player.pop("_id", None)

    # Auto-enroll in all active competitions
    active_comps = await db.competitions.find({"status": "active"}, {"_id": 0}).to_list(20)
    for comp in active_comps:
        if player["id"] not in comp.get("participant_ids", []):
            await db.competitions.update_one(
                {"id": comp["id"]},
                {"$addToSet": {"participant_ids": player["id"]}}
            )
    player["competition_ids"] = [c["id"] for c in active_comps]
    logger.info(f"Wallet {data.wallet_address[:8]}... registered + enrolled in {len(active_comps)} competition(s)")
    return player

# ========= BULK WALLET IMPORT =========

@api_router.post("/players/bulk-register")
async def bulk_register_wallets(data: BulkWalletImport):
    """Import up to 100 real wallets at once into the competition"""
    wallets = list(set(data.wallets[:100]))  # dedupe & cap
    results = []
    active_comps = await db.competitions.find({"status": "active"}, {"_id": 0}).to_list(10)

    for wallet_address in wallets:
        existing = await db.players.find_one({"wallet_address": wallet_address}, {"_id": 0})
        if existing:
            results.append({"wallet": wallet_address, "status": "existing", "player_id": existing["id"]})
            continue
        short_addr = wallet_address[:4] + "..." + wallet_address[-4:]
        player = {
            "id": gen_id(), "username": short_addr,
            "wallet_address": wallet_address,
            "avatar_url": f"https://api.dicebear.com/7.x/bottts-neutral/svg?seed={wallet_address[:8]}",
            "level": 1, "xp": 0, "total_xp": 0, "xp_to_next": 1000,
            "stats": {"pnl": 0, "volume": 0, "win_rate": 0, "trades_count": 0,
                      "current_streak": 0, "best_streak": 0, "avg_leverage": 0,
                      "best_trade": 0, "worst_trade": 0},
            "badges": [], "team_id": None, "competition_ids": [],
            "rank": 0, "joined_at": now_iso(),
        }
        await db.players.insert_one(player)
        player.pop("_id", None)
        for comp in active_comps:
            await db.competitions.update_one(
                {"id": comp["id"]}, {"$addToSet": {"participant_ids": player["id"]}}
            )
        results.append({"wallet": wallet_address, "status": "created", "player_id": player["id"]})

    created = sum(1 for r in results if r["status"] == "created")
    logger.info(f"Bulk import: {created} new wallets registered")
    return {
        "total": len(wallets), "created": created,
        "existing": len(wallets) - created,
        "enrolled_in_competitions": len(active_comps),
        "results": results,
    }

# ========= PREDICTIONS =========

def calc_odds(current_rank: int, prediction_type: str) -> float:
    """Dynamic odds based on current leaderboard position"""
    rank = max(1, current_rank)
    if prediction_type == "wins":
        if rank == 1: return 1.5
        if rank <= 3: return 3.5
        if rank <= 7: return 8.0
        if rank <= 12: return 15.0
        return 25.0
    if prediction_type == "top3":
        if rank <= 2: return 1.3
        if rank <= 3: return 1.8
        if rank <= 6: return 4.0
        if rank <= 10: return 9.0
        return 18.0
    if prediction_type == "top10":
        if rank <= 5: return 1.15
        if rank <= 10: return 1.4
        if rank <= 15: return 4.0
        return 10.0
    if prediction_type == "busts":
        # Odds for finishing with negative P&L — harder to predict for top traders
        if rank <= 3: return 20.0
        if rank <= 8: return 10.0
        if rank <= 15: return 5.0
        return 2.5
    if prediction_type == "rank_exact":
        return max(5.0, rank * 2.0)  # exact rank: high odds
    return 2.0

@api_router.get("/predictions")
async def get_predictions(competition_id: Optional[str] = None, limit: int = 50):
    query = {}
    if competition_id:
        query["competition_id"] = competition_id
    preds = await db.predictions.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return preds

@api_router.get("/predictions/stats")
async def get_prediction_stats(competition_id: Optional[str] = None):
    """Aggregate community sentiment per player per prediction type"""
    query = {"status": "active"}
    if competition_id:
        query["competition_id"] = competition_id
    preds = await db.predictions.find(query, {"_id": 0}).to_list(500)
    stats = {}
    for p in preds:
        pid = p["target_player_id"]
        if pid not in stats:
            stats[pid] = {
                "target_player_id": pid,
                "target_player_name": p.get("target_player_name", ""),
                "total_predictions": 0, "total_stake": 0, "by_type": {}
            }
        stats[pid]["total_predictions"] += 1
        stats[pid]["total_stake"] += p.get("stake", 0)
        ptype = p["prediction_type"]
        stats[pid]["by_type"][ptype] = stats[pid]["by_type"].get(ptype, 0) + 1
    return list(stats.values())

@api_router.get("/predictions/my/{predictor_wallet}")
async def get_my_predictions(predictor_wallet: str):
    preds = await db.predictions.find(
        {"predictor_wallet": predictor_wallet}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return preds

@api_router.post("/predictions")
async def place_prediction(data: PredictionCreate):
    # Get target player current rank
    target = await db.players.find_one({"id": data.target_player_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Target player not found")

    # Get active competition if not specified
    comp_id = data.competition_id
    if not comp_id:
        active = await db.competitions.find_one({"status": "active"}, {"_id": 0})
        comp_id = active["id"] if active else "general"

    # Calculate current rank from leaderboard
    all_players = await db.players.find({}, {"_id": 0, "stats": 1, "id": 1}).to_list(100)
    all_players.sort(key=lambda p: p.get("stats", {}).get("pnl", 0), reverse=True)
    current_rank = next((i + 1 for i, p in enumerate(all_players) if p["id"] == data.target_player_id), 99)

    odds = calc_odds(current_rank, data.prediction_type)
    stake = max(10, min(10000, data.stake))
    payout = round(stake * odds, 0)

    pred = {
        "id": gen_id(),
        "predictor_wallet": data.predictor_wallet,
        "predictor_name": data.predictor_name or (data.predictor_wallet[:4] + "..." + data.predictor_wallet[-4:]),
        "target_player_id": data.target_player_id,
        "target_player_name": target.get("username", "Unknown"),
        "target_rank_at_bet": current_rank,
        "prediction_type": data.prediction_type,
        "predicted_rank": data.predicted_rank,
        "stake": stake,
        "odds": odds,
        "potential_payout": payout,
        "status": "active",
        "competition_id": comp_id,
        "created_at": now_iso(),
        "settled_at": None,
        "result": None,
    }
    await db.predictions.insert_one(pred)
    pred.pop("_id", None)
    return pred

@api_router.get("/predictions/leaderboard-with-odds")
async def get_leaderboard_with_odds(limit: int = 20):
    """Leaderboard players with live prediction odds + community sentiment"""
    players = await db.players.find({}, {"_id": 0}).to_list(100)
    players.sort(key=lambda p: p.get("stats", {}).get("pnl", 0), reverse=True)
    players = players[:limit]

    pred_stats_raw = await db.predictions.find({"status": "active"}, {"_id": 0}).to_list(1000)

    result = []
    for i, player in enumerate(players):
        rank = i + 1
        player_preds = [p for p in pred_stats_raw if p["target_player_id"] == player["id"]]
        sentiment = {}
        for pt in ["wins", "top3", "top10", "busts", "rank_exact"]:
            count = sum(1 for p in player_preds if p["prediction_type"] == pt)
            sentiment[pt] = count
        result.append({
            **player,
            "position": rank,
            "odds": {
                "wins": calc_odds(rank, "wins"),
                "top3": calc_odds(rank, "top3"),
                "top10": calc_odds(rank, "top10"),
                "busts": calc_odds(rank, "busts"),
            },
            "community_bets": len(player_preds),
            "total_staked": sum(p.get("stake", 0) for p in player_preds),
            "sentiment": sentiment,
        })
    return result



@api_router.get("/leaderboard/live")
async def get_live_leaderboard():
    """Leaderboard from all registered wallets using real Adrena position data"""
    wallet_players = await db.players.find({"wallet_address": {"$exists": True}}, {"_id": 0}).to_list(100)
    for p in wallet_players:
        try:
            pos_data = await adrena_fetch("/position", {"user_wallet": p["wallet_address"], "limit": 50})
            positions = pos_data.get("data", [])
            total_pnl = sum(pos.get("pnl", 0) or 0 for pos in positions)
            total_volume = sum(pos.get("volume", 0) or 0 for pos in positions)
            wins = sum(1 for pos in positions if (pos.get("pnl", 0) or 0) > 0)
            p["stats"]["pnl"] = round(total_pnl, 2)
            p["stats"]["volume"] = round(total_volume, 2)
            p["stats"]["win_rate"] = round((wins / len(positions)) * 100, 1) if positions else 0
            p["stats"]["trades_count"] = len(positions)
        except Exception:
            pass
    wallet_players.sort(key=lambda p: p["stats"]["pnl"], reverse=True)
    for i, p in enumerate(wallet_players):
        p["position"] = i + 1
    return wallet_players

# ========= TRADING DUELS =========

@api_router.post("/duels")
async def create_duel(data: DuelCreate):
    """Create a 1v1 trading duel challenge"""
    opponent = await db.players.find_one({"id": data.opponent_id}, {"_id": 0})
    if not opponent:
        raise HTTPException(status_code=404, detail="Opponent not found")

    challenger = await db.players.find_one({"wallet_address": data.challenger_wallet}, {"_id": 0})
    challenger_name = data.challenger_name or (data.challenger_wallet[:4] + "..." + data.challenger_wallet[-4:])

    stake = max(10, min(10000, data.stake))
    duration = max(1, min(168, data.duration_hours))  # 1h to 7 days
    now_dt = datetime.now(timezone.utc)

    duel = {
        "id": gen_id(),
        "challenger_wallet": data.challenger_wallet,
        "challenger_name": challenger_name,
        "challenger_id": challenger["id"] if challenger else None,
        "challenger_pnl_start": challenger["stats"]["pnl"] if challenger else 0,
        "opponent_id": data.opponent_id,
        "opponent_name": opponent.get("username", "Unknown"),
        "opponent_wallet": opponent.get("wallet_address"),
        "opponent_pnl_start": opponent["stats"]["pnl"],
        "stake": stake,
        "duration_hours": duration,
        "metric": data.metric if data.metric in ("pnl", "volume", "winrate") else "pnl",
        "status": "pending",  # pending / active / completed / expired / declined
        "winner_id": None,
        "winner_name": None,
        "challenger_delta": 0,
        "opponent_delta": 0,
        "created_at": now_iso(),
        "accepted_at": None,
        "expires_at": (now_dt + timedelta(hours=24)).isoformat(),  # 24h to accept
        "end_time": None,
    }
    await db.duels.insert_one(duel)
    duel.pop("_id", None)
    logger.info(f"Duel created: {challenger_name} vs {opponent['username']} | {stake} chips | {duration}h | metric: {data.metric}")
    return duel

@api_router.get("/duels")
async def get_duels(status: Optional[str] = None, limit: int = 50):
    query = {"status": status} if status else {}
    duels = await db.duels.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return duels

@api_router.get("/duels/my/{wallet}")
async def get_my_duels(wallet: str):
    duels = await db.duels.find(
        {"$or": [{"challenger_wallet": wallet}, {"opponent_wallet": wallet}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return duels

@api_router.post("/duels/{duel_id}/accept")
async def accept_duel(duel_id: str):
    duel = await db.duels.find_one({"id": duel_id}, {"_id": 0})
    if not duel:
        raise HTTPException(status_code=404, detail="Duel not found")
    if duel["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Duel is {duel['status']}, cannot accept")

    now_dt = datetime.now(timezone.utc)
    expires = datetime.fromisoformat(duel["expires_at"].replace("Z", "+00:00")) if duel.get("expires_at") else now_dt + timedelta(days=1)
    if now_dt > expires:
        await db.duels.update_one({"id": duel_id}, {"$set": {"status": "expired"}})
        raise HTTPException(status_code=400, detail="Duel challenge has expired")

    # Snapshot current stats
    challenger = await db.players.find_one({"wallet_address": duel["challenger_wallet"]}, {"_id": 0})
    opponent = await db.players.find_one({"id": duel["opponent_id"]}, {"_id": 0})

    end_time = (now_dt + timedelta(hours=duel["duration_hours"])).isoformat()
    update = {
        "status": "active",
        "accepted_at": now_iso(),
        "end_time": end_time,
        "challenger_pnl_start": challenger["stats"]["pnl"] if challenger else 0,
        "opponent_pnl_start": opponent["stats"]["pnl"] if opponent else 0,
    }
    await db.duels.update_one({"id": duel_id}, {"$set": update})
    logger.info(f"Duel {duel_id} accepted. Ends at {end_time}")
    return {**duel, **update}

@api_router.post("/duels/{duel_id}/decline")
async def decline_duel(duel_id: str):
    duel = await db.duels.find_one({"id": duel_id}, {"_id": 0})
    if not duel:
        raise HTTPException(status_code=404, detail="Duel not found")
    if duel["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Duel is {duel['status']}, cannot decline")
    await db.duels.update_one({"id": duel_id}, {"$set": {"status": "declined"}})
    return {"message": "Duel declined"}

@api_router.post("/duels/{duel_id}/resolve")
async def resolve_duel(duel_id: str):
    """Resolve duel by comparing stat delta since acceptance"""
    duel = await db.duels.find_one({"id": duel_id}, {"_id": 0})
    if not duel:
        raise HTTPException(status_code=404, detail="Duel not found")
    if duel["status"] != "active":
        raise HTTPException(status_code=400, detail=f"Duel is {duel['status']}, cannot resolve")

    challenger = await db.players.find_one({"wallet_address": duel["challenger_wallet"]}, {"_id": 0})
    opponent = await db.players.find_one({"id": duel["opponent_id"]}, {"_id": 0})

    metric = duel.get("metric", "pnl")
    if metric == "pnl":
        c_delta = (challenger["stats"]["pnl"] if challenger else 0) - duel.get("challenger_pnl_start", 0)
        o_delta = (opponent["stats"]["pnl"] if opponent else 0) - duel.get("opponent_pnl_start", 0)
    elif metric == "volume":
        c_delta = challenger["stats"]["volume"] if challenger else 0
        o_delta = opponent["stats"]["volume"] if opponent else 0
    else:
        c_delta = challenger["stats"]["win_rate"] if challenger else 0
        o_delta = opponent["stats"]["win_rate"] if opponent else 0

    if c_delta > o_delta:
        winner_id = duel.get("challenger_id") or duel["challenger_wallet"]
        winner_name = duel["challenger_name"]
    elif o_delta > c_delta:
        winner_id = duel["opponent_id"]
        winner_name = duel["opponent_name"]
    else:
        winner_id = "draw"
        winner_name = "Draw"

    update = {
        "status": "completed",
        "winner_id": winner_id,
        "winner_name": winner_name,
        "challenger_delta": round(c_delta, 2),
        "opponent_delta": round(o_delta, 2),
    }
    await db.duels.update_one({"id": duel_id}, {"$set": update})
    logger.info(f"Duel {duel_id} resolved. Winner: {winner_name} (C:{c_delta:.2f} vs O:{o_delta:.2f})")
    return {**duel, **update}

@api_router.get("/duels/stats")
async def get_duel_stats():
    """Global duel statistics"""
    total = await db.duels.count_documents({})
    active = await db.duels.count_documents({"status": "active"})
    completed = await db.duels.count_documents({"status": "completed"})
    pipeline = [
        {"$match": {"status": {"$in": ["active", "completed"]}}},
        {"$group": {"_id": None, "total_staked": {"$sum": "$stake"}}}
    ]
    agg = await db.duels.aggregate(pipeline).to_list(1)
    return {
        "total_duels": total,
        "active_duels": active,
        "completed_duels": completed,
        "total_staked": agg[0]["total_staked"] if agg else 0,
    }

# ========= BRACKET TOURNAMENT =========

@api_router.get("/tournaments/bracket")
async def get_bracket_tournament():
    teams = await db.teams.find({}, {"_id": 0}).to_list(100)
    if len(teams) < 2:
        return {"rounds": [], "champion": None}
    # Sort teams by composite score
    for t in teams:
        t["composite_score"] = round(
            t["stats"]["pnl"] * 0.4 + t["stats"]["volume"] * 0.00025 + t["stats"]["avg_win_rate"] * 100 * 0.2, 2
        )
    teams.sort(key=lambda t: t["composite_score"], reverse=True)
    # Build bracket
    rounds = []
    if len(teams) >= 4:
        sf1_winner = teams[0] if teams[0]["composite_score"] >= teams[3]["composite_score"] else teams[3]
        sf2_winner = teams[1] if teams[1]["composite_score"] >= teams[2]["composite_score"] else teams[2]
        rounds.append({
            "name": "Semi-Finals", "matches": [
                {"id": "sf1", "team1": teams[0], "team2": teams[3], "winner_id": sf1_winner["id"]},
                {"id": "sf2", "team1": teams[1], "team2": teams[2], "winner_id": sf2_winner["id"]},
            ]
        })
        final_winner = sf1_winner if sf1_winner["composite_score"] >= sf2_winner["composite_score"] else sf2_winner
        rounds.append({
            "name": "Finals", "matches": [
                {"id": "f1", "team1": sf1_winner, "team2": sf2_winner, "winner_id": final_winner["id"]},
            ]
        })
        return {"rounds": rounds, "champion": final_winner}
    elif len(teams) >= 2:
        winner = teams[0] if teams[0]["composite_score"] >= teams[1]["composite_score"] else teams[1]
        rounds.append({
            "name": "Finals", "matches": [
                {"id": "f1", "team1": teams[0], "team2": teams[1], "winner_id": winner["id"]},
            ]
        })
        return {"rounds": rounds, "champion": winner}

app.include_router(api_router)

# ========= WEBSOCKET MANAGERS =========

class LeaderboardWSManager:
    def __init__(self):
        self.connections: list = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.connections:
            self.connections.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.connections:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

class ChatWSManager:
    def __init__(self):
        self.rooms: dict = {}  # team_id -> [WebSocket]

    async def connect(self, team_id: str, ws: WebSocket):
        await ws.accept()
        self.rooms.setdefault(team_id, []).append(ws)

    def disconnect(self, team_id: str, ws: WebSocket):
        room = self.rooms.get(team_id, [])
        if ws in room:
            room.remove(ws)

    async def broadcast(self, team_id: str, msg: dict):
        dead = []
        for ws in self.rooms.get(team_id, []):
            try:
                await ws.send_json(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(team_id, ws)

lb_manager = LeaderboardWSManager()
chat_manager = ChatWSManager()

async def build_mock_leaderboard():
    players = await db.players.find({}, {"_id": 0}).to_list(100)
    for p in players:
        p["composite_score"] = round(
            p["stats"]["pnl"] * 0.004 + p["stats"]["volume"] * 0.00025 +
            p["stats"]["win_rate"] * 2 + p["stats"]["current_streak"] * 15, 2
        )
    players.sort(key=lambda p: p.get("composite_score", 0), reverse=True)
    for i, p in enumerate(players):
        p["position"] = i + 1
    return players[:20]

@app.websocket("/api/ws/leaderboard")
async def ws_leaderboard(websocket: WebSocket):
    await lb_manager.connect(websocket)
    try:
        data = await build_mock_leaderboard()
        await websocket.send_json({"type": "leaderboard", "data": data})
        while True:
            await asyncio.sleep(20)
            fresh = await build_mock_leaderboard()
            await websocket.send_json({"type": "leaderboard", "data": fresh})
    except WebSocketDisconnect:
        lb_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WS leaderboard error: {e}")
        lb_manager.disconnect(websocket)

@app.websocket("/api/ws/chat/{team_id}")
async def ws_team_chat(websocket: WebSocket, team_id: str):
    await chat_manager.connect(team_id, websocket)
    try:
        # Send recent messages on connect
        msgs = await db.team_messages.find({"team_id": team_id}, {"_id": 0}).sort("created_at", -1).to_list(60)
        await websocket.send_json({"type": "history", "data": list(reversed(msgs))})
        # Keep alive & handle incoming pings
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=30)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        chat_manager.disconnect(team_id, websocket)
    except Exception as e:
        logger.error(f"WS chat error: {e}")
        chat_manager.disconnect(team_id, websocket)


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
