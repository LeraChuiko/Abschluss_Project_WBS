# Familien Finance Predictor

Webanwendung zur Analyse, Planung und Prognose von Familienbudgets in EUR (Zeitzone Berlin). 
Ermöglicht das Verwalten von Einnahmen, Fixkosten, Ratenzahlungen und Sparzielen.

## 🛠 Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js (TypeScript)
- **Datenbank**: MongoDB Atlas (Mongoose)
- **Authentifizierung**: Custom JWT-basiertes Auth-System

## 🌐 Live-Demo

- **Frontend**: [https://familien-finance.onrender.com](https://familien-finance.onrender.com)
- **API Health Check**: [https://familien-finance-api.onrender.com/api/health](https://familien-finance-api.onrender.com/api/health)

### Demo-Zugang
- **E-Mail**: `test@demo.local`
- **Passwort**: `testdemo`

## 🚀 Hauptfunktionen

- **Budgetrechner & Prognosen**: Automatische Berechnung von monatlichen Überschüssen und Sparraten.
- **Benutzerverwaltung**: Sicheres Login und Registrierung ohne Drittanbieter-Abhängigkeiten (Auth0).
- **Isolierte Datenhaltung**: Jeder registrierte Nutzer greift ausschließlich auf seinen eigenen Haushalt zu.
- **Responsive UI**: Optimiert für Desktop und mobile Endgeräte.

## ⚙️ Architektur & API

Die Anwendung ist in Client und Server getrennt:
- `finance-predictor-backend`: TypeScript REST API mit Validierung und MongoDB-Anbindung.
- `finance-predictor-frontend`: Single Page Application (SPA) mit Zustandshaltung und Bearer-Token-Header.

---
*Entwickelt als Abschlussprojekt im Rahmen der Weiterbildung "AI Software Engineering".*
- Root Directory: `finance-predictor-frontend`  
- Build: `npm install && npm run build`  
- Publish directory: `dist`  
- Environment: `VITE_API_URL=https://familien-finance-api.onrender.com/api`  

Redirects (SPA): `/*` → `/index.html`.

💼 **[Connect with me on LinkedIn](https://www.linkedin.com/in/valeriia-chuiko/)**
