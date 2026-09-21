# API contract (menu for the frontend)

Think of this file as the restaurant **menu**.

- The **URL** is the dish name (`POST /api/incomes`).
- The **body** is the order (`date`, `name`, `amount`).
- The **status** is the kitchen answer (`201` = cooked, `400` = missing field, `404` = not found).

If the frontend asks for `/income` (singular) and the backend only knows `/incomes` (plural), the “waiter” cannot find the dish. That is why we write the names **once**, here, and both sides copy them.

Dates in requests: `2026-09-21` (year-month-day). The React form can still **show** `21/09/2026`.

| Action | Method + URL | Body | Success |
| --- | --- | --- | --- |
| Server alive? | `GET /api/health` | — | `200` `{ "ok": true }` |
| Create income | `POST /api/incomes` | `{ "date", "name", "amount" }` | `201` + saved object with `_id` |
| List incomes | `GET /api/incomes` | — | `200` array |
| One income | `GET /api/incomes/:id` | — | `200` object or `404` |
| Edit income | `PUT /api/incomes/:id` | `{ "date", "name", "amount" }` | `200` object or `404` |
| Delete income | `DELETE /api/incomes/:id` | — | `204` empty or `404` |
| Production expenses | same pattern under `/api/production-expenses` | `{ "date", "name", "amount", "project" }` | same codes |
| Mandatory expenses (page 1 table) | `/api/mandatory-expenses` | `{ "date", "name", "amount" }` | same codes |
| Savings goals | `/api/savings-goals` | `{ "name", "targetAmount", "currentAmount" }` | same codes |
| Transfer into a goal | `POST /api/savings-goals/:id/transfer` | `{ "amount" }` | `200` updated goal |
| Buy from a goal | `POST /api/savings-goals/:id/spend` | `{ "amount", "name" }` | `200` updated goal |
| Debts | `/api/debts` | `{ "name", "totalAmount", "remainingAmount", "monthlyPayment", "nextPaymentDate" }` | same codes |
| Dashboard numbers | `GET /api/dashboard` | query later | `200` months + totals |

We will fill dashboard query details when we build that route. Until then this table is the source of truth for names.
