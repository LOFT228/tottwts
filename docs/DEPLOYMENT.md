# How to Run the Project

## What You Need

- **Python 3.10+** — for the backend
- **Node.js 18 or 20 LTS** — for the frontend (Node 22+ may cause issues)
- **npm** or **yarn** — for installing frontend dependencies
- **MongoDB** — either [MongoDB Atlas](https://www.mongodb.com/atlas) (cloud, free tier) or a local instance

---

## 1. Backend Setup

```powershell
cd backend
```

### Create `.env` file
Copy the example and fill in your values:
```powershell
copy .env.example .env
```

Edit `backend/.env`:
```
MONGO_URL=mongodb+srv://your_user:your_pass@your_cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=adrena
CORS_ORIGINS=http://localhost:3000
```

### Install dependencies and run
```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn server:app --reload --port 8001
```

Backend will be at: **http://localhost:8001**

### Seed demo data (first time)
After the backend is running, seed the database with test players, teams, and competitions:
```
POST http://localhost:8001/api/seed
```
You can use a browser, Postman, or curl.

---

## 2. Frontend Setup

```powershell
cd frontend
npm install
npm start
```

Frontend will be at: **http://localhost:3000**

> If `npm install` fails with postinstall errors on Windows, try:
> ```powershell
> npm install --ignore-scripts
> ```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URL` | Yes | MongoDB connection string |
| `DB_NAME` | Yes | Database name (e.g. `adrena`) |
| `CORS_ORIGINS` | Yes | Allowed frontend origin (e.g. `http://localhost:3000`) |
| `OPENAI_API_KEY` | No | Enables AI trading insights endpoint |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |

### Frontend (`frontend/.env`)
Optional. If not set, frontend defaults to `http://localhost:8001`.

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_BACKEND_URL` | No | Backend URL (e.g. `http://localhost:8001`) |
