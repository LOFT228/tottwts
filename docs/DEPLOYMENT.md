## Deployment & Configuration

## Services
- **MongoDB**: stores players/teams/competitions/etc.
- **Backend (FastAPI)**: serves REST + WebSockets under `/api/*`
- **Frontend (React)**: UI

## Environment variables

### Backend (`backend/.env`)
Required:
- **MONGO_URL**: e.g. `mongodb://localhost:27017`
- **DB_NAME**: e.g. `adrena`

Recommended:
- **CORS_ORIGINS**: e.g. `http://localhost:3000` (comma-separated if multiple)

Optional:
- **OPENAI_API_KEY**: enables `POST /api/ai/insights`
- **OPENAI_MODEL**: defaults to `gpt-4o-mini`

### Frontend (`frontend/.env`)
Optional:
- **REACT_APP_BACKEND_URL**: e.g. `http://localhost:8000`

If not set, frontend will default to `http(s)://<current-host>:8000`.

## Local run (Windows / PowerShell)

Notes:
- Use **Node 18/20 LTS** for the frontend toolchain (see `.nvmrc`). CRA 5 builds may fail on Node 22+.
- On Windows, some dependencies may run Unix-only postinstall scripts. If `yarn install` fails, use `yarn install --ignore-scripts`.

### MongoDB
With Docker:

```powershell
docker run -d --name mongo -p 27017:27017 mongo:7
```

### Backend

```powershell
cd backend
copy .env.example .env
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn server:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
yarn install --ignore-scripts
yarn start
```

## Docker deployment (single machine)
Use the provided `docker-compose.yml`:

```powershell
docker compose up --build
```

URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## Production notes
- Put frontend behind a real domain + TLS (then WebSockets will automatically use `wss://`).
- Restrict **CORS_ORIGINS** to your real domain(s).
- Provide `OPENAI_API_KEY` only on backend (never in frontend).
