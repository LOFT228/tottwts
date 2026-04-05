# Adrena Trading Competition Platform

Gamified trading competition dashboard for [Adrena](https://adrena.xyz) — a Solana perpetual DEX.

**Stack**: React 19 + FastAPI + MongoDB + Solana Wallets + Adrena Protocol API

## Quick Start

### Backend
```powershell
cd backend
copy .env.example .env          # fill in your MongoDB URL
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn server:app --reload --port 8001
```

### Frontend
```powershell
cd frontend
npm install
npm start
```

Then open **http://localhost:3000** and seed demo data: `POST http://localhost:8001/api/seed`

## Documentation

- **[docs/GITHUB.md](docs/GITHUB.md)** — Project overview, features, tech stack, API endpoints, structure
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Full setup guide, environment variables, troubleshooting
