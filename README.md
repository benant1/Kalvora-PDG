# Backend API (LUMYNIS)

Backend Node.js + Express pour multi-platform-site.

## Prérequis
- Node.js >= 18

## Installation
```powershell
cd "c:\Users\Thecode2\Desktop\lUMYNIS2\backend"
npm install
```

## Démarrer
Créez `.env` à partir de `.env.example` si nécessaire.
```powershell
npm run dev
```
Le serveur démarre par défaut sur `http://localhost:4000`.

## Endpoints
- `GET /health`
- `GET /api/v1`
- Auth:
  - `POST /api/v1/auth/signup` body: `{ "name", "email", "password", "confirmPassword", "role"? }`
  - `POST /api/v1/auth/login` body: `{ "email", "password" }`
  - `GET /api/v1/auth/me` (protected) header: `Authorization: Bearer <token>`
  - `POST /api/v1/auth/logout` (protected) header: `Authorization: Bearer <token>`
- Blog:
  - `GET /api/v1/blog?q=...`
  - `GET /api/v1/blog/:slug`
- Market:
  - `GET /api/v1/market?q=...&category=...&min=...&max=...`
  - `GET /api/v1/market/:id`
- Requests:
  - `GET /api/v1/requests`
  - `POST /api/v1/requests` body: `{ "title": "Ma demande" }`
  - `PATCH /api/v1/requests/:id/close` (protected) header: `Authorization: Bearer <token>`

## Structure
```
backend/
  controllers/
    blogController.js
    marketController.js
    requestsController.js
  routes/
    index.js
    blog.js
    market.js
    requests.js
  server.js
  package.json
  .env.example
  README.md
```
