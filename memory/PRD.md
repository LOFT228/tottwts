# Adrena Trading Competition Platform — PRD

## Problem Statement
Build a trading competition platform for Adrena, the Solana perpetual DEX. The platform should make competitions more engaging, rewarding, and fun than any other perp DEX on Solana.

## User Choices / Design Preferences
- Competition format: Team-based + Multi-metric scoring
- Features: All (Leaderboard, Quests, Streaks, Raffles, Social, AI Insights)
- Design: Gamified/esports-inspired (badges, XP bars, level-ups) + Dark futuristic crypto-native
- AI: OpenAI for trading insights

## Architecture

### Backend (FastAPI + MongoDB)
- `server.py` — Main FastAPI app with ~35 API endpoints
- MongoDB collections: players, teams, competitions, quests, achievements, social_posts

### Frontend (React + Tailwind + ShadCN)
- 7 pages: Arena, Leaderboard, Teams, Quests, Profile, Social, Tournament
- Key components: WalletButton, TradingPanel, WalletProvider, WalletContext
- SolanaWalletProvider wraps app with Phantom + Backpack adapters
- WalletContext auto-registers connected wallets and fetches live positions

## What's Been Implemented

### Session 1 (MVP) - Core Platform
- Full-stack cyberpunk/esports-themed dashboard
- 6 pages: Arena, Leaderboard, Teams, Quests, Profile, Social Feed
- Multi-metric leaderboard (P&L, volume, win rate, streak, composite)
- Team-based competitions with expandable member lists
- Quest/achievement system with XP and 12 collectible badges
- Social trash-talk feed with likes
- AI-powered trading insights via OpenAI
- 15 API endpoints serving 16 mock players, 4 teams, 3 competitions, 13 quests, 20 social posts

### Session 2 - Real Adrena API Integration
- Integrated real Adrena protocol API (https://datapi.adrena.trade)
- 4 proxy endpoints: pool stats, liquidity info, APR data, wallet position lookup (60s caching)
- Arena page shows live protocol data (real-time from Adrena)
- Profile page: wallet position lookup for any Solana wallet
- Backend trading endpoints: open-long, open-short, close-long, close-short
- TradingPanel UI component for in-app trading

### Session 4 - Animations, Team Chat, WebSocket, Auto-enroll, Tx Signing (Current)
- **Animations overhaul** (App.css): `blurIn`, `pulseGlowGreen/Purple`, `float`, `glitch`, `neonFlicker`, `livePing` keyframes; `stagger-blur`, `card-glow-hover` hover stroke classes; neon text stroke classes (`stroke-cyan/green/purple`); scanlines overlay
- **Sidebar neon**: ADRENA logo now has `neonFlicker` animation + glow; active nav items get cyan box-shadow stroke
- **Team Chat**: Full WebSocket-backed chat (`/api/ws/chat/{teamId}`) with REST fallback; Members/Chat tab toggle per team; animated messages with `AnimatePresence`; live dot indicator on Chat tab
- **Auto-enroll**: `POST /api/players/register-wallet` now auto-adds wallet player to all active competitions
- **WebSocket leaderboard**: `/api/ws/leaderboard` pushes full leaderboard every 20s; frontend shows WS LIVE/POLLING/Connecting badges; fallback to REST poll
- **Solana tx signing**: TradingPanel uses `sendTransaction` from wallet adapter + `VersionedTransaction.deserialize`; progress steps (building → signing → confirming → done); shows tx signature + Solscan link on success
- **Backpack wallet adapter** added alongside Phantom
- **WalletContext** (`/src/contexts/WalletContext.js`): Auto-registers wallet on connect, fetches live positions
- **Wallet auto-registration**: On connect, calls `/api/players/register-wallet` to create/fetch profile
- **Profile page overhaul**: Shows connected wallet's real profile, live position data with refresh, connect wallet banner
- **WalletButton upgrade**: Shows player username + P&L dropdown, "View Profile" link
- **Live Leaderboard tab**: Real Adrena position-based rankings for wallet-registered players
- **Tournament page**: Refresh button, empty state, score breakdown section, better UX
- **Webpack polyfills**: Fixed crypto/stream errors for Backpack adapter in craco.config.js

## API Endpoints
- `GET /api/competitions` — List competitions
- `GET /api/leaderboard` — Mock competition leaderboard
- `GET /api/leaderboard/live` — Real wallet-based leaderboard
- `GET /api/players` / `GET /api/players/{id}` — Player data
- `POST /api/players/register-wallet` — Register/fetch wallet player
- `GET /api/teams` / `POST /api/teams` — Team management
- `GET /api/quests` / `POST /api/quests/{id}/complete` — Quest tracking
- `GET /api/social` / `POST /api/social` — Social feed
- `POST /api/ai/insights` — AI trading insights
- `GET /api/adrena/pool-stats` — Real Adrena pool data
- `GET /api/adrena/positions/{wallet}` — Real wallet positions
- `POST /api/adrena/trade/open-long` / `open-short` — Trade execution
- `GET /api/tournaments/bracket` — Bracket tournament data
- `POST /api/seed` — Seed mock data

## Testing Results
- Session 1: 100% pass rate (28 backend tests)
- Session 2: 100% pass rate (32 backend + frontend)
- Session 3: 100% pass rate (13 backend + all frontend pages)

## Prioritized Backlog

### P0 (Critical for Production)
- Real wallet signing for trade execution (requires Solana wallet signing integration)
- Auto-enroll trading wallets in competitions when they trade on Adrena

### P1 (High Priority)
- Real-time WebSocket leaderboard updates
- Raffle/reward distribution system
- Competition registration flow (join/leave competitions)

### P2 (Nice to Have)
- NFT badge minting for achievements
- Multi-wallet support (auto-switch between wallets)
- Historical competition data and graphs
- Team chat within competition context

## Next Tasks
1. Implement wallet transaction signing for actual trade execution
2. Auto-enroll wallets into active competitions when they register
3. Add WebSocket for real-time leaderboard updates
4. Build raffle/reward distribution system
