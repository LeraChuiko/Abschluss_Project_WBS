# Familien Finance Predictor

Abschlussprojekt: Budget, Einnahmen, Raten, Sparziele und Hinweise.

- `finance-predictor-backend` — Express + TypeScript + MongoDB Atlas  
- `finance-predictor-frontend` — React + Vite  

API-Liste: [API_CONTRACT.md](API_CONTRACT.md)

## Start

Zwei Terminals. Zuerst die API, dann die Website.

### 1. Backend (`http://localhost:3000`)

```bash
cd finance-predictor-backend
npm install
```

Datei `.env` im selben Ordner (nicht auf GitHub legen):

```
PORT=3000
MONGO_URI=dein-mongodb-atlas-uri
JWT_SECRET=langes-zufaelliges-passwort
```

```bash
npm run dev
```

Check: `http://localhost:3000/api/health` → `{ "ok": true }`

### 2. Frontend (`http://localhost:5173`)

```bash
cd finance-predictor-frontend
npm install
npm run dev
```

Browser: **http://localhost:5173**

Beim ersten Mal: **Registrieren**, dann **Anmelden**. Die API erwartet `Authorization: Bearer …`. Mit **Angemeldet bleiben** gilt JWT **30 Tage**, ohne Häkchen **12 Stunden** (nur dieses Browser-Fenster).

## Deploy auf Render

Zwei Services. MongoDB Atlas: Network Access `0.0.0.0/0`.

**1. Web Service (API)**  
- Root Directory: `finance-predictor-backend`  
- Build: `npm install && npm run build`  
- Start: `npm start`  
- Environment: `MONGO_URI`, `JWT_SECRET`  

**2. Static Site (Frontend)**  
- Root Directory: `finance-predictor-frontend`  
- Build: `npm install && npm run build`  
- Publish directory: `dist`  
- Environment: `VITE_API_URL=https://DEIN-API.onrender.com/api`  

Redirects (SPA): `/*` → `/index.html`. Nach dem ersten Deploy Frontend neu bauen, sobald die API-URL feststeht.
