# Locked product rules (v1)

These answers replace guesses. If a rule is not here, we ask — we do not invent it.

- Currency is always EUR. No conversion.
- A month is a calendar month, for example September 2026.
- On the screen a date may look like `21/09/2026`. In the API and database the same day is stored as `2026-09-21`.
- Timezone for “which calendar day is this?” is `Europe/Berlin`.
- No login, no users, no JWT. Single-user app.
- Full CRUD for incomes, production expenses, mandatory expenses, savings goals, debts.
- Delete is hard delete (the record is gone).
- Starting capital is 0. A start amount is added as a normal income.
- Transfer into a savings goal reduces the free leftover.
- A purchase paid from a savings goal does not change page 1 (dashboard month).
- Debt remaining balance is updated by the user (create/edit). No automatic monthly decrease.
- An installment payment on page 1 is a **mandatory expense** row (same list as rent/insurance). The **debt card** is a separate record that stores leftover debt. When you pay, you add the expense AND you edit the debt leftover yourself.
- Dashboard months appear when there is at least one record in that month. We do not generate empty months in advance.
- We do not build: multi-currency, Excel export, mobile app, extra category trees besides `project` on production expenses.
