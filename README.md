## Adrena x Autonom Trading Competition

Full‑stack project:
- **Backend**: FastAPI (`backend/server.py`)
- **Frontend**: React (CRA + CRACO) (`frontend/`)
- **DB**: MongoDB

## Prerequisites
- **Node.js**: 18/20 LTS recommended (frontend toolchain may fail on Node 22+)
- **Yarn**: classic (v1). (The repo pins Yarn 1 in `frontend/package.json`.)
- **Python**: 3.10+ recommended
- **Docker Desktop** (optional but recommended) for MongoDB

## Configuration

### Backend env (`backend/.env`)
Create `backend/.env` (you can copy from `backend/.env.example`):

- **MONGO_URL**: Mongo connection string
- **DB_NAME**: database name
- **CORS_ORIGINS**: comma-separated origins allowed by CORS (e.g. `http://localhost:3000`)
- **OPENAI_API_KEY** (optional): enables `/api/ai/insights`
- **OPENAI_MODEL** (optional): defaults to `gpt-4o-mini`

### Frontend env (`frontend/.env`)
Optional. If you don't set anything, frontend defaults to backend at `http://<host>:8000`.

- **REACT_APP_BACKEND_URL**: e.g. `http://localhost:8000`

## Run locally (Windows / PowerShell)

### 1) Start MongoDB
With Docker:

```powershell
docker run -d --name mongo -p 27017:27017 mongo:7
```

### 2) Start backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn server:app --reload --port 8000
```

### 3) Start frontend

```powershell
cd frontend
yarn install
yarn start
```

Open:
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8000`

Tip: after backend starts, you can seed demo data:
- POST `http://localhost:8000/api/seed`

## Deploy with Docker (recommended)
You can deploy using `docker compose` (Mongo + backend + frontend). See `docker-compose.yml`.

```powershell
docker compose up --build
```

Then open `http://localhost:3000`.

## Upload to GitHub
See `docs/GITHUB.md`.
