# Familien Finance Predictor

Abschlussprojekt: Familienbudget in EUR (Zeitzone Berlin).  
Budget, Einnahmen, Raten, Sparziele und Hinweise.

- `finance-predictor-backend` — Express, TypeScript, MongoDB Atlas, JWT  
- `finance-predictor-frontend` — React, Vite, Tailwind  

API: [API_CONTRACT.md](API_CONTRACT.md)

## Live-Demo

- App: [https://familien-finance.onrender.com](https://familien-finance.onrender.com)  
- API-Check: [https://familien-finance-api.onrender.com/api/health](https://familien-finance-api.onrender.com/api/health)

Kein Auth0. Login ist eigene Registrierung mit JWT. Es gibt **keine E-Mail-Bestätigung** — die Adresse muss nur wie eine E-Mail aussehen, ein echtes Postfach ist nicht nötig.

### Demo-Konto (gemeinsames Beispielbudget)

Damit Prüfer die App mit Daten sehen, ohne selbst alles einzutippen:

```
E-Mail: test@demo.local
Passwort: testdemo
```

Dieses Konto ist **eines für alle**. Wer sich so anmeldet, sieht denselben Demo-Haushalt und kann Zahlen ändern. Das ist nur zum Anschauen, nicht für echte Finanzen.

### Eigenes Konto

**Registrieren** mit eigener E-Mail und eigenem Passwort. Dann ist der Haushalt leer und **nur deiner**: andere User sehen ihn nicht.

Render Free kann nach Pause etwas länger starten.

## Start lokal

Zwei Terminals. Zuerst die API, dann die Website.

### 1. Backend (`http://localhost:3000`)

```bash
cd finance-predictor-backend
npm install
```

Datei `.env` im selben Ordner (nicht auf GitHub):

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

**Registrieren** oder **Anmelden**. Header: `Authorization: Bearer …`.  
**Angemeldet bleiben**: JWT 30 Tage, sonst 12 Stunden.

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
- Environment: `VITE_API_URL=https://familien-finance-api.onrender.com/api`  

Redirects (SPA): `/*` → `/index.html`.
