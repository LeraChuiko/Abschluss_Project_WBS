# API contract

Base URL: `http://localhost:3000/api`  
Dates: `YYYY-MM-DD`. Month query: `YYYY-MM`.  
Protected routes need header `Authorization: Bearer <token>`.

| Action | Method + URL | Auth | Body / query | Success |
| --- | --- | --- | --- | --- |
| Health | `GET /health` | no | — | `200` `{ "ok": true }` |
| Register | `POST /auth/register` | no | `{ "email", "password", "name?" }` | `201` `{ token, user }` |
| Login | `POST /auth/login` | no | `{ "email", "password" }` | `200` `{ token, user }` |
| Me | `GET /auth/me` | yes | — | `200` user |
| Dashboard | `GET /dashboard?month=YYYY-MM` | yes | — | `200` totals + `balance` |
| List transactions | `GET /transactions?month=YYYY-MM` | yes | month optional | `200` array |
| Create transaction | `POST /transactions` | yes | income or expense | `201` |
| Patch transaction | `PATCH /transactions/:id` | yes | fields | `200` |
| List debts | `GET /debts` | yes | — | `200` array |
| Create debt | `POST /debts` | yes | title, total, rate, start, months | `201` |
| Patch debt | `PATCH /debts/:id` | yes | fields | `200` |
| Delete debt | `DELETE /debts/:id` | yes | — | `204` |
| List savings goals | `GET /savings-goals` | yes | — | `200` array |
| Create savings goal | `POST /savings-goals` | yes | title, targetAmount, imageUrl? | `201` |
| Patch savings goal | `PATCH /savings-goals/:id` | yes | fields | `200` |
| Deposit to goal | `POST /savings-goals/:id/deposit` | yes | `{ "amount", "date?" }` | `200` |

Expense `expenseBlock`: `fixed` \| `periodic` \| `variable`.  
Income `incomeGroup`: `salary` \| `business` \| `freelance` \| `gift` \| `investment`.
