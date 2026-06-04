# xpnsr — Expense Tracker

A dark-themed personal expense tracker built with Next.js. No backend required — data persists in `localStorage`.

## Stack

- **Next.js 14** (Pages Router)
- **Recharts** for analytics charts
- **LocalStorage** for persistence (no DB needed)
- Deployable to **Vercel** in one click

## Features

- Add, edit, delete expenses
- Budget tracking (monthly or weekly)
- Currency toggle: NGN ₦ / USD $ with auto-conversion
- Category breakdown bar chart
- Monthly trend line chart
- Daily allowance calculator
- Budget warnings (approaching / over budget)
- Filter expenses by category

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Option 1 — Vercel CLI (fastest)
```bash
npm install -g vercel
vercel
```

### Option 2 — GitHub + Vercel Dashboard
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Framework: **Next.js** (auto-detected)
5. Click **Deploy** — done

No environment variables needed.

## Project Structure

```
expense-tracker/
├── pages/
│   ├── _app.js          # Global styles
│   └── index.js         # Main dashboard page
├── components/
│   ├── Sidebar.js        # Currency, budget, settings
│   ├── AddExpenseForm.js # Add new expense
│   ├── BudgetStatus.js   # Budget metrics + progress bar
│   ├── ExpenseList.js    # List with edit/delete + category filter
│   └── Analytics.js      # Recharts bar + line + breakdown
├── lib/
│   └── expenses.js       # All business logic (ported from Python)
├── styles/
│   └── globals.css       # Dark theme + typography
└── vercel.json
```

## Data Storage

All data lives in the browser's `localStorage` — no server, no database. This means:
- Data is private to the user's browser
- Works offline
- Clearing browser data will clear expenses

To add cloud sync later, replace `loadExpenses`/`saveExpenses` in `lib/expenses.js` with API calls.
