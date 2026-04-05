# About the Project

## What is this?

**Adrena Trading Competition Platform** — a gamified trading competition dashboard built for [Adrena](https://adrena.xyz), a Solana perpetual DEX. The platform turns trading competitions into an engaging experience with leaderboards, team battles, quests, social features, and AI-powered insights.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Tailwind CSS, ShadCN UI, Framer Motion |
| **Backend** | Python FastAPI, ~35 REST API endpoints + WebSocket |
| **Database** | MongoDB (Atlas) |
| **Blockchain** | Solana (Phantom & Backpack wallet adapters) |
| **AI** | OpenAI API (trading insights) |
| **Real Data** | Adrena Protocol API (`datapi.adrena.trade`) |

---

## Pages (9 total)

| Page | What it does |
|---|---|
| **Arena** | Main dashboard — live pool stats, protocol data from Adrena API |
| **Leaderboard** | Multi-metric rankings (P&L, volume, win rate, streak). Gold/silver/bronze podium. WebSocket live updates |
| **Teams** | Team-based competitions with member lists, team chat via WebSocket |
| **Quests** | Achievement/quest system — XP, 12 collectible badges, streak tracking |
| **Tournament** | Bracket-style tournament with score breakdowns |
| **Duels** | 1v1 trading duels between players |
| **Predictions** | Market prediction challenges |
| **Social** | Trash-talk social feed with likes |
| **Profile** | Wallet-connected player profile, live position data from Adrena |

---

## Key Features

- **Solana Wallet Integration** — Connect Phantom or Backpack, auto-register as a player
- **Real Data from Adrena Protocol** — Live pool stats, APR data, wallet positions via Adrena API
- **In-App Trading** — Open/close long and short positions with real Solana transaction signing
- **WebSocket Live Updates** — Leaderboard pushes every 20s, team chat in real-time
- **AI Trading Insights** — OpenAI-powered analysis via `/api/ai/insights`
- **Demo Data Seeding** — `POST /api/seed` creates 16 players, 4 teams, 3 competitions, quests, badges, social posts

---

## API Endpoints (main ones)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/competitions` | List competitions |
| `GET` | `/api/leaderboard` | Competition leaderboard |
| `GET` | `/api/leaderboard/live` | Real wallet-based rankings |
| `POST` | `/api/players/register-wallet` | Register wallet as player |
| `GET` | `/api/teams` | List teams |
| `GET` | `/api/quests` | List quests |
| `GET` | `/api/social` | Social feed |
| `POST` | `/api/ai/insights` | AI trading insights |
| `GET` | `/api/adrena/pool-stats` | Live Adrena pool data |
| `GET` | `/api/adrena/positions/{wallet}` | Wallet position lookup |
| `POST` | `/api/seed` | Seed demo data |
| `WS` | `/api/ws/leaderboard` | Live leaderboard stream |
| `WS` | `/api/ws/chat/{teamId}` | Team chat |

---

## Project Structure

```
├── backend/
│   ├── server.py          # FastAPI app (~35 endpoints + WebSocket)
│   ├── requirements.txt   # Python dependencies
│   ├── .env.example        # Environment template
│   └── tests/             # API tests
├── frontend/
│   ├── src/
│   │   ├── pages/         # 9 page components
│   │   ├── components/    # Layout, Sidebar, TradingPanel, WalletButton, ShadCN UI
│   │   ├── contexts/      # WalletContext (Solana integration)
│   │   ├── lib/           # API client, utils
│   │   └── hooks/         # Custom hooks
│   ├── public/
│   └── package.json
├── docs/
│   ├── DEPLOYMENT.md      # How to run the project
│   └── GITHUB.md          # This file — project overview
├── memory/
│   └── PRD.md             # Product requirements
└── README.md
```
