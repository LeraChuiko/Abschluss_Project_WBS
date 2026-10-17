# API contract

Base URL: `http://localhost:3000/api`  
Dates: `YYYY-MM-DD`. Month query: `YYYY-MM`.  
Protected routes need header `Authorization: Bearer <token>`.  
Budget data is per account: `Transaction`, `Debt`, `SavingsGoal` and `Hinweis` store `userId` from the token. Lists and dashboard return only the current user. Unknown or other users' ids respond `404`. Do not send `userId` in the request body.

| Action | Method + URL | Auth | Body / query | Success |
| --- | --- | --- | --- | --- |
| Health | `GET /health` | no | — | `200` `{ "ok": true }` |
| Register | `POST /auth/register` | no | `{ "email", "password", "name?" }` | `201` `{ token, user }` |
| Login | `POST /auth/login` | no | `{ "email", "password" }` | `200` `{ token, user }` |
| Me | `GET /auth/me` | yes | — | `200` user |
| Dashboard | `GET /dashboard?month=YYYY-MM` or `?year=YYYY` | yes | — | `200` totals, or `{ year, months[] }` |
| List transactions | `GET /transactions?month=YYYY-MM` or `?year=YYYY` | yes | month/year optional | `200` array |
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
| List hints | `GET /hinweise` | yes | — | `200` array |
| Create hint | `POST /hinweise` | yes | `{ "title", "month", "note?" }` | `201` |
| Delete hint | `DELETE /hinweise/:id` | yes | — | `204` |

Expense `expenseBlock`: `fixed` \| `periodic` \| `variable`.  
Income `incomeGroup`: `salary` \| `business` \| `freelance` \| `gift` \| `investment`.
