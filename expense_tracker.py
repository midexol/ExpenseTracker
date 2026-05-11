from expenses import Expense
import expenses
from datetime import datetime, timedelta

def main():
    print("Running Expense Tracker!")
    expense_file_path = "expenses.csv"
    budget_file_path = "budget.txt"
    
    # Check if budget is set, if not ask to set it
    budget = load_budget(budget_file_path)
    if budget is None:
        budget = get_budget()
        save_budget(budget, budget_file_path)
    
    # get user input for expense details 
    expense = get_user_expense()
    # write their expense to a file
    save_expense_to_file(expense, expense_file_path)
    # read file and summarize expenses by category
    summarize_expenses(expense_file_path, budget)

def get_budget():
    while True:
        try:
            budget = float(input("Enter your monthly budget: $"))
            if budget > 0:
                return budget
            else:
                print("Budget must be greater than 0.")
        except ValueError:
            print("Invalid input. Please enter a valid number.")

def save_budget(budget, budget_file_path):
    with open(budget_file_path, "w") as file:
        file.write(str(budget))

def load_budget(budget_file_path):
    try:
        with open(budget_file_path, "r") as file:
            budget = float(file.read().strip())
            return budget
    except FileNotFoundError:
        return None

def get_user_expense():
    
    expense_name = input("Enter the name of the expense: ")
    expense_amount = float(input("Enter the amount of the expense: "))
    
    # Auto-set date to today, but allow user to input past dates
    today = datetime.now().strftime("%Y-%m-%d")
    while True:
        expense_date = input(f"Enter the date of the expense (YYYY-MM-DD) [Press Enter for today ({today})]: ").strip()
        
        # If empty, use today's date
        if expense_date == "":
            expense_date = today
            break
        
        try:
            datetime.strptime(expense_date, "%Y-%m-%d")
            break
        except ValueError:
            print("Invalid date format. Please use YYYY-MM-DD.")
    
    print(f"Date set to: {expense_date}")
    
    expense_categories = [ "Food",
                           "Home",
                           "work",
                           "transportation",
                           "Fun",
                           "miscellaneous" ]
    
    while True:
        print("Select a category for the expense:")
        for i, category in enumerate(expense_categories):
            print(f"  {i+1}. {category}")
        
        category_choice = input("Enter the number corresponding to the category: ")
        
        if category_choice.isdigit() and 1 <= int(category_choice) <= len(expense_categories):
            Expense_category = expense_categories[int(category_choice) - 1]
            print(f"You've selected: {Expense_category}")
            break
        else:
            print("Invalid choice. Please try again.")
    return Expense(name=expense_name, category=Expense_category, amount=expense_amount, date=expense_date)

def save_expense_to_file(expense, expense_file_path):
    with open(expense_file_path, "a") as file:
        file.write(f"{expense.date},{expense.name},{expense.category},{expense.amount}\n")

def read_expenses_from_file(expense_file_path="expenses.csv"):
    expenses = []
    try:
        with open(expense_file_path, "r") as file:
            for line in file:
                parts = line.strip().split(",")
                date, name, category, amount = parts[0], parts[1], parts[2], parts[3]
                expenses.append(Expense(name=name, category=category, amount=float(amount), date=date))
    except FileNotFoundError:
        pass
    return expenses 

def summarize_expenses(expense_file_path="expenses.csv", budget=None):
    expenses = read_expenses_from_file(expense_file_path)
    
    if not expenses:
        print("No expenses recorded yet.")
        return
    
    # Display all expenses with dates
    print("\nAll Expenses:")
    for expense in expenses:
        print(f"  {expense.date} - {expense.name} ({expense.category}): ${expense.amount:.2f}")
    
    # Group expenses by category and sum amounts
    amount_by_category = {}
    total_spent = 0
    for expense in expenses:
        if expense.category not in amount_by_category:
            amount_by_category[expense.category] = 0
        amount_by_category[expense.category] += expense.amount
        total_spent += expense.amount
    
    print("\nExpense Summary by Category:")
    for category, total_amount in amount_by_category.items():
        print(f"  {category}: ${total_amount:.2f}")
    
    print(f"\nTotal Expenses: ${total_spent:.2f}")
    
    # Budget information
    if budget:
        remaining_budget = budget - total_spent
        print(f"\n--- BUDGET SUMMARY ---")
        print(f"Monthly Budget: ${budget:.2f}")
        print(f"Total Spent: ${total_spent:.2f}")
        print(f"Remaining Budget: ${remaining_budget:.2f}")
        
        # Calculate daily allowance based on days left in month
        today = datetime.now()
        days_in_month = (datetime(today.year, today.month % 12 + 1, 1) - timedelta(days=1)).day
        days_left = days_in_month - today.day
        
        if days_left > 0:
            daily_allowance = remaining_budget / days_left
            print(f"Days Remaining in Month: {days_left}")
            print(f"Daily Allowance: ${daily_allowance:.2f}")
        
        # Check if over budget
        if remaining_budget < 0:
            print(f"\n⚠️  WARNING: You are OVER BUDGET by ${abs(remaining_budget):.2f}!")
        elif remaining_budget < budget * 0.1:
            print(f"\n⚠️  CAUTION: You have only 10% of your budget remaining!")
        else:
            print(f"\n✓ You are within budget.")

if __name__ == "__main__":
    main()