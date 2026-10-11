# Personal Finance Predictor

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

Beim ersten Mal: **Registrieren**, dann **Anmelden**. Die API erwartet `Authorization: Bearer …`.
