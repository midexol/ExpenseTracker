# Quick Start Guide - Expense Tracker

## Running the App
```bash
streamlit run expense_tracker.py
```

## Main Features Overview

### 💰 Budget Management
- **Set Budget**: Use +/− buttons or direct input field
- **Clear Budget**: Clears the budget amount without removing expenses
- **Choose Period**: Select Monthly or Weekly budget tracking
- **View Days Remaining**: See how many days are left in your budget period

### 🌍 Currency Support
Supported currencies:
- **USD** - Dollar ($)
- **NGN** - Naira (₦) 
- **GBP** - Pounds (£)
- **EUR** - Euro (€)
- **CAD** - Canadian Dollar (C$)
- **AUD** - Australian Dollar (A$)

Switch currencies anytime - all amounts auto-convert!

### 📝 Add Expenses
1. Enter expense name
2. Select category (Food, Home, Work, Transportation, Fun, Miscellaneous)
3. Enter amount
4. Select date (defaults to today)
5. Click "Add Expense"

### ✏️ Edit & Delete Entries
- **Edit**: Click ✏️ button next to any expense
- **Delete**: Click 🗑️ button next to any expense
- **Changes saved automatically** to CSV

### 📊 Budget Status
Shows:
- Total spent this period
- Remaining budget
- Daily allowance for remaining days
- Percentage of budget used
- Color-coded warning status

### 🗑️ Data Management
- **Clear Budget**: Removes budget amount only
- **Reset All Data**: Clears all expenses AND budget locally
  - ⚠️ Requires confirmation
  - ✓ Server data unaffected
  - ✓ Clean slate for fresh start

### 📈 Analytics
- **Monthly Summary**: Spending trends over time
- **Category Breakdown**: Money spent per category
- **Visual Charts**: Bar charts for spending patterns
- **Detailed Tables**: Category totals and monthly comparisons

## Budget Period Calculation

### Monthly Budget
- Runs from today until last day of current month
- Remaining days = Days left in month
- Daily allowance = Budget ÷ Remaining days

### Weekly Budget
- Runs from today until next Sunday
- Remaining days = Days until Sunday
- Daily allowance = Budget ÷ Remaining days

## File Storage

### expenses.csv
Stores all expense entries:
```csv
Date,Name,Category,Amount
2026-05-12,Groceries,Food,45.50
2026-05-12,Uber,Transportation,12.75
```

### budget.txt
Stores budget and period type:
```json
{"amount": 2500.0, "type": "Monthly"}
```

## Tips & Tricks

1. **Currency Switching**: All amounts automatically recalculate - no manual intervention needed
2. **Backdated Expenses**: Can add expenses from past dates
3. **Bulk Edit**: Edit any expense even after it's been saved
4. **Month View**: Expandable section shows month-to-month comparison
5. **Daily Tracking**: Daily allowance helps you track daily spending patterns

## Troubleshooting

### Budget won't update?
- Try refreshing the page
- Check that numbers are entered correctly
- Ensure CSV file isn't corrupted

### Currency conversion failed?
- Verify the new currency is selected
- Check that expenses exist before converting
- Amounts are rounded to 2 decimal places

### Can't find an expense?
- Expenses are sorted newest first
- Use browser Find (Ctrl+F) to search
- Check if it was deleted accidentally

### Data mysteriously reset?
- Check the browser cache/cookies
- Verify CSV file exists in project folder
- Review if "Reset All Data" was clicked

## Support Notes

- All changes save automatically to CSV
- No internet connection required
- Works completely offline
- All data stored locally
- Can run on any machine with Python and Streamlit
