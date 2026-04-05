## Upload project to GitHub

Target repository:
`LOFT228/tottwts`

## Option A — From this folder (recommended)
Open PowerShell in the project root and run:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/LOFT228/tottwts.git
git push -u origin main
```

If GitHub asks for auth, use one of:
- GitHub Desktop
- `gh auth login` (GitHub CLI)
- HTTPS with a Personal Access Token

## Option B — If repo already exists locally
If `git status` works and you already have commits:

```powershell
git remote -v
git remote set-url origin https://github.com/LOFT228/tottwts.git
git push -u origin HEAD
```

## What NOT to commit
- `backend/.env` (secrets)
- any credentials / API keys

Use the provided examples:
- `backend/.env.example`
