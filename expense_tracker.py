from expenses import Expense
import expenses
from datetime import datetime, timedelta
import sys
import os

try:
    import streamlit as st
    import pandas as pd
    HAS_STREAMLIT = True
except ImportError:
    HAS_STREAMLIT = False

def is_running_streamlit():
    """Check if script is being run via streamlit"""
    return HAS_STREAMLIT and hasattr(st, 'set_page_config')

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
            print(f"\n You are within budget.")

def streamlit_ui():
    """Streamlit web interface for expense tracker"""
    st.set_page_config(page_title="Expense Tracker", layout="wide")
    st.title("💰 Expense Tracker")
    
    # File paths
    EXPENSE_FILE = "expenses.csv"
    BUDGET_FILE = "budget.txt"
    
    # Categories from CLI
    CATEGORIES = ["Food", "Home", "work", "transportation", "Fun", "miscellaneous"]
    
    # Initialize session state
    if "expenses_df" not in st.session_state:
        if os.path.exists(EXPENSE_FILE):
            st.session_state.expenses_df = pd.read_csv(EXPENSE_FILE)
        else:
            st.session_state.expenses_df = pd.DataFrame(columns=["Date", "Name", "Category", "Amount"])
    
    # Sidebar for budget management
    with st.sidebar:
        st.header("Budget Settings")
        
        # Load or set budget
        if os.path.exists(BUDGET_FILE):
            with open(BUDGET_FILE, "r") as f:
                current_budget = float(f.read().strip())
        else:
            current_budget = 0
        
        new_budget = st.number_input(
            "Monthly Budget ($)",
            value=current_budget,
            min_value=0.0,
            step=100.0
        )
        
        if new_budget != current_budget:
            with open(BUDGET_FILE, "w") as f:
                f.write(str(new_budget))
            st.success("Budget updated!")
            current_budget = new_budget
    
    # Main content area
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.header("Add New Expense")
        
        with st.form("expense_form"):
            col_a, col_b = st.columns(2)
            
            with col_a:
                date = st.date_input("Date", value=datetime.now())
                category = st.selectbox("Category", CATEGORIES)
            
            with col_b:
                amount = st.number_input("Amount ($)", min_value=0.0, step=0.01)
                name = st.text_input("Expense Name", placeholder="e.g., Groceries, Uber, Movie")
            
            submitted = st.form_submit_button("➕ Add Expense", use_container_width=True)
        
        if submitted:
            if not name:
                st.error("Please enter an expense name")
            elif amount <= 0:
                st.error("Amount must be greater than 0")
            else:
                # Create new row
                new_row = pd.DataFrame({
                    "Date": [date.strftime("%Y-%m-%d")],
                    "Name": [name],
                    "Category": [category],
                    "Amount": [amount]
                })
                
                # Append to existing data
                st.session_state.expenses_df = pd.concat(
                    [st.session_state.expenses_df, new_row],
                    ignore_index=True
                )
                
                # Save to CSV
                st.session_state.expenses_df.to_csv(EXPENSE_FILE, index=False)
                st.success(f"✅ Added ${amount} for {name}")
                st.rerun()
    
    with col2:
        st.header("Budget Status")
        if current_budget > 0 and not st.session_state.expenses_df.empty:
            total_spent = st.session_state.expenses_df["Amount"].sum()
            remaining = current_budget - total_spent
            percentage = (total_spent / current_budget) * 100
            
            st.metric("Total Spent", f"${total_spent:.2f}")
            st.metric("Remaining", f"${remaining:.2f}")
            
            # Progress bar
            progress_color = "🟢" if remaining >= 0 else "🔴"
            st.write(f"{progress_color} {percentage:.0f}% of budget used")
            st.progress(min(percentage / 100, 1.0))
        else:
            st.info("Set a budget to see spending overview")
    
    # Expenses summary
    st.divider()
    st.header("📊 Expenses Summary")
    
    if not st.session_state.expenses_df.empty:
        # Convert Date column to datetime for sorting
        df_display = st.session_state.expenses_df.copy()
        df_display["Date"] = pd.to_datetime(df_display["Date"])
        df_display = df_display.sort_values("Date", ascending=False)
        
        # Show recent expenses
        st.subheader("Recent Expenses")
        st.dataframe(df_display, use_container_width=True)
        
        # Category breakdown
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("By Category")
            category_summary = st.session_state.expenses_df.groupby("Category")["Amount"].sum().sort_values(ascending=False)
            st.bar_chart(category_summary)
        
        with col2:
            st.subheader("Category Breakdown")
            st.write(category_summary)
    else:
        st.info("No expenses yet. Add one to get started!")

if __name__ == "__main__":
    if is_running_streamlit():
        streamlit_ui()
    else:
        main()