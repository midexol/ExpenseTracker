from expenses import Expense
from datetime import datetime, timedelta
import os
import json

try:
    import streamlit as st
    import pandas as pd
    import altair as alt
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
                           "Work",
                           "Transportation",
                           "Fun",
                           "Miscellaneous" ]
    
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
                # Skip malformed lines
                if len(parts) < 4:
                    continue
                try:
                    date, name, category, amount = parts[0], parts[1], parts[2], parts[3]
                    expenses.append(Expense(name=name, category=category, amount=float(amount), date=date))
                except (ValueError, IndexError):
                    # Skip lines that can't be parsed
                    continue
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
            print(f"\nWARNING: You are OVER BUDGET by ${abs(remaining_budget):.2f}!")
        elif remaining_budget < budget * 0.1:
            print(f"\nCAUTION: You have only 10% of your budget remaining!")
        else:
            print(f"\n You are within budget.")

def get_remaining_days(budget_type):
    """Calculate remaining days for the budget period"""
    today = datetime.now()
    
    if budget_type == "Monthly":
        # Get last day of current month
        if today.month == 12:
            last_day = datetime(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = datetime(today.year, today.month + 1, 1) - timedelta(days=1)
        remaining_days = (last_day.date() - today.date()).days + 1
    else:  # Weekly
        # Calculate days until end of week (Sunday)
        days_until_sunday = (6 - today.weekday()) % 7
        if days_until_sunday == 0 and today.weekday() != 6:
            days_until_sunday = 7
        remaining_days = days_until_sunday if days_until_sunday > 0 else 7
    
    return remaining_days

def load_budget_settings(budget_file_path):
    """Load budget and its type from file"""
    try:
        with open(budget_file_path, "r") as file:
            content = file.read().strip()
            if content.startswith("{"):
                # JSON format with type
                data = json.loads(content)
                return data.get("amount", 0.0), data.get("type", "Monthly")
            else:
                # Legacy format - just a number
                return float(content), "Monthly"
    except (FileNotFoundError, ValueError, json.JSONDecodeError):
        return 0.0, "Monthly"

def save_budget_settings(budget_amount, budget_type, budget_file_path):
    """Save budget and its type to file"""
    with open(budget_file_path, "w") as file:
        data = {"amount": budget_amount, "type": budget_type}
        file.write(json.dumps(data))

def streamlit_ui():
    """Streamlit web interface for expense tracker"""
    st.set_page_config(page_title="Expense Tracker", layout="wide")
    
    # Custom styling
    st.markdown("""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        
        * {
            font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        h1, h2, h3 {
            font-weight: 600;
            letter-spacing: -0.5px;
        }
        </style>
    """, unsafe_allow_html=True)
    
    st.title("Expense Tracker")
    
    # File paths
    EXPENSE_FILE = "expenses.csv"
    BUDGET_FILE = "budget.txt"
    
    # Exchange rates
    EXCHANGE_RATES = {
        "USD": 1.0,
        "NGN": 1*1400  # 1 NGN ≈ 1400 USD
    }
    
    # Categories from CLI
    CATEGORIES = ["Food", "Home", "work", "transportation", "Fun", "miscellaneous"]
    
    # Initialize session state for currency and base currency
    if "currency" not in st.session_state:
        st.session_state.currency = "USD"
        st.session_state.currency_symbol = "$"
        st.session_state.base_currency = "USD"  # Currency used for data entry
    
    # Initialize session state for budget and budget type
    if "current_budget" not in st.session_state or "budget_type" not in st.session_state:
        budget_amount, budget_type = load_budget_settings(BUDGET_FILE)
        st.session_state.current_budget = budget_amount
        st.session_state.budget_type = budget_type
    
    # Initialize session state for expenses
    if "expenses_df" not in st.session_state:
        if os.path.exists(EXPENSE_FILE):
            try:
                # Check if file has headers by reading first line
                with open(EXPENSE_FILE, "r") as f:
                    first_line = f.readline().strip()
                
                # If first line contains "Date" (header), read normally; otherwise read without header
                if "Date" in first_line or first_line.lower() == "date,name,category,amount":
                    df = pd.read_csv(EXPENSE_FILE, dtype={"Date": str, "Name": str, "Category": str, "Amount": float})
                else:
                    df = pd.read_csv(EXPENSE_FILE, header=None, dtype={0: str, 1: str, 2: str, 3: float})
                    df.columns = ["Date", "Name", "Category", "Amount"]
                
                st.session_state.expenses_df = df if df.shape[0] > 0 else pd.DataFrame(columns=["Date", "Name", "Category", "Amount"])
            except Exception as e:
                st.warning(f"Could not read expenses file: {e}")
                st.session_state.expenses_df = pd.DataFrame(columns=["Date", "Name", "Category", "Amount"])
        else:
            st.session_state.expenses_df = pd.DataFrame(columns=["Date", "Name", "Category", "Amount"])
    
    # Sidebar for budget management
    with st.sidebar:
        st.header("Settings")
        
        # Currency selection with better handling
        st.subheader("Currency Settings")
        currency_map = {
            "Dollar ($)": ("USD", "$"),
            "Naira (₦)": ("NGN", "₦")
        }
        selected_currency = st.radio("Select Currency", list(currency_map.keys()), label_visibility="collapsed")
        new_currency, new_symbol = currency_map[selected_currency]
        
        # Handle currency conversion - ONLY convert when currency actually changes
        if new_currency != st.session_state.currency:
            if not st.session_state.expenses_df.empty:
                # Convert all amounts from base currency to new currency
                old_rate = EXCHANGE_RATES[st.session_state.base_currency]
                new_rate = EXCHANGE_RATES[new_currency]
                
                # Convert to USD first, then to new currency
                conversion_factor = new_rate / old_rate
                st.session_state.expenses_df["Amount"] = (st.session_state.expenses_df["Amount"] * conversion_factor).round(2)
                st.session_state.current_budget = round(st.session_state.current_budget * conversion_factor, 2)
                
                # Update CSV with converted amounts
                st.session_state.expenses_df.to_csv(EXPENSE_FILE, index=False)
                save_budget_settings(st.session_state.current_budget, st.session_state.budget_type, BUDGET_FILE)
                
                st.session_state.base_currency = new_currency
                st.success(f"Currency converted to {new_symbol}")
            else:
                st.session_state.base_currency = new_currency
        
        st.session_state.currency = new_currency
        st.session_state.currency_symbol = new_symbol
        
        st.divider()
        
        # Budget management with type selection
        st.subheader("Budget Settings")
        
        # Budget type selector (Monthly or Weekly)
        budget_type = st.radio(
            "Budget Period",
            options=["Monthly", "Weekly"],
            index=0 if st.session_state.budget_type == "Monthly" else 1,
            label_visibility="collapsed"
        )
        
        if budget_type != st.session_state.budget_type:
            st.session_state.budget_type = budget_type
            save_budget_settings(st.session_state.current_budget, budget_type, BUDGET_FILE)
            st.success(f"Budget period changed to {budget_type}")
        
        # Calculate and display remaining days
        remaining_days = get_remaining_days(st.session_state.budget_type)
        st.caption(f"Days remaining: {remaining_days}")
        
        # Direct input field
        direct_budget = st.number_input(
            "Set Budget Directly",
            value=st.session_state.current_budget,
            min_value=0.0,
            step=10.0,
            label_visibility="collapsed"
        )
        
        if direct_budget != st.session_state.current_budget:
            st.session_state.current_budget = direct_budget
            save_budget_settings(direct_budget, st.session_state.budget_type, BUDGET_FILE)
            st.success("Budget updated!")
            st.rerun()
        
        st.divider()
        
        # Data Management
        st.subheader("Data Management")
        
        col_data1, col_data2 = st.columns(2)
        
        with col_data1:
            if st.button("Clear Budget", use_container_width=True, key="clear_budget"):
                st.session_state.current_budget = 0.0
                save_budget_settings(0.0, st.session_state.budget_type, BUDGET_FILE)
                st.success("Budget cleared!")
                st.rerun()
        
        with col_data2:
            if st.button("Reset All Data", use_container_width=True, key="reset_data", type="secondary"):
                # Show confirmation dialog
                st.warning("This will clear all local expenses and budget. This cannot be undone!")
                col_confirm1, col_confirm2 = st.columns(2)
                with col_confirm1:
                    if st.button("Confirm Reset", key="confirm_reset"):
                        # Reset expenses
                        st.session_state.expenses_df = pd.DataFrame(columns=["Date", "Name", "Category", "Amount"])
                        st.session_state.expenses_df.to_csv(EXPENSE_FILE, index=False)
                        # Reset budget
                        st.session_state.current_budget = 0.0
                        save_budget_settings(0.0, "Monthly", BUDGET_FILE)
                        st.success("All local data has been reset!")
                        st.rerun()
                with col_confirm2:
                    if st.button("Cancel", key="cancel_reset"):
                        st.info("Reset cancelled")
    
    # Main content area
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.header("Add New Expense")
        
        with st.form("expense_form", clear_on_submit=True):
            col_a, col_b = st.columns(2)
            
            with col_a:
                date = st.date_input("Date", value=datetime.now())
                category = st.selectbox("Category", CATEGORIES)
            
            with col_b:
                amount = st.number_input("Amount", min_value=0.01, step=0.01, format="%.2f")
                name = st.text_input("Expense Name", placeholder="e.g., Groceries, Uber, Movie")
            
            submitted = st.form_submit_button("Add Expense", use_container_width=True)
        
        if submitted:
            if not name:
                st.error("Please enter an expense name")
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
                st.success(f"Added {st.session_state.currency_symbol}{amount} for {name}")
                st.rerun()
    
    with col2:
        st.header("Budget Status")
        remaining_days = get_remaining_days(st.session_state.budget_type)
        period_label = "Month" if st.session_state.budget_type == "Monthly" else "Week"
        
        if st.session_state.current_budget > 0 and not st.session_state.expenses_df.empty:
            total_spent = st.session_state.expenses_df["Amount"].sum()
            remaining = st.session_state.current_budget - total_spent
            percentage = (total_spent / st.session_state.current_budget) * 100
            daily_allowance = remaining / remaining_days if remaining_days > 0 else 0
            
            st.metric("Total Spent", f"{st.session_state.currency_symbol}{total_spent:.2f}")
            st.metric("Remaining", f"{st.session_state.currency_symbol}{remaining:.2f}")
            st.metric(f"Daily Allowance ({period_label})", f"{st.session_state.currency_symbol}{daily_allowance:.2f}")
            
            st.write(f"{percentage:.0f}% of budget used")
            
            # Color code progress bar
            if percentage >= 100:
                st.error(f"You are OVER budget by {st.session_state.currency_symbol}{abs(remaining):.2f}!")
                st.progress(1.0)
            elif percentage >= 80:
                st.warning(f"Approaching budget limit!")
                st.progress(min(percentage / 100, 1.0))
            else:
                st.success(f"You are within budget")
                st.progress(percentage / 100)
        elif st.session_state.current_budget > 0:
            remaining_days = get_remaining_days(st.session_state.budget_type)
            daily_allowance = st.session_state.current_budget / remaining_days if remaining_days > 0 else 0
            st.metric("Total Spent", f"{st.session_state.currency_symbol}0.00")
            st.metric("Remaining", f"{st.session_state.currency_symbol}{st.session_state.current_budget:.2f}")
            st.metric(f"Daily Allowance ({period_label})", f"{st.session_state.currency_symbol}{daily_allowance:.2f}")
            st.write("0% of budget used")
            st.progress(0.0)
        else:
            st.info("Set a budget to see spending overview")
    
    # Expenses summary with edit/delete
    st.divider()
    st.header("Expenses Summary")
    
    if not st.session_state.expenses_df.empty:
        # Convert Date column to datetime for sorting
        df_display = st.session_state.expenses_df.copy()
        df_display["Date"] = pd.to_datetime(df_display["Date"])
        df_display = df_display.sort_values("Date", ascending=False)
        
        # Show recent expenses with edit/delete functionality
        st.subheader("Recent Expenses")
        
        # Create a table with edit/delete buttons
        for display_idx, (idx, row) in enumerate(df_display.iterrows()):
            col1, col2, col3, col4, col5 = st.columns([3, 2, 2, 1, 1])
            
            with col1:
                st.write(f"**{row['Name']}** ({row['Category']})")
            with col2:
                st.write(f"{st.session_state.currency_symbol}{row['Amount']:.2f}")
            with col3:
                st.write(f"{row['Date'].strftime('%Y-%m-%d')}")
            with col4:
                if st.button("Edit", key=f"edit_{display_idx}", help="Edit entry"):
                    # Store the actual index from the original dataframe
                    st.session_state.edit_index = idx
            with col5:
                if st.button("Delete", key=f"delete_{display_idx}", help="Delete entry"):
                    # Delete the entry
                    st.session_state.expenses_df = st.session_state.expenses_df.drop(idx).reset_index(drop=True)
                    st.session_state.expenses_df.to_csv(EXPENSE_FILE, index=False)
                    st.success("Entry deleted!")
                    st.rerun()
        
        # Edit modal
        if "edit_index" in st.session_state:
            edit_idx = st.session_state.edit_index
            expense = st.session_state.expenses_df.iloc[edit_idx]
            
            st.divider()
            st.subheader("Edit Expense")
            
            with st.form("edit_form"):
                col_a, col_b = st.columns(2)
                
                with col_a:
                    new_date = st.date_input("Date", value=pd.to_datetime(expense['Date']).date())
                    new_category = st.selectbox("Category", CATEGORIES, index=CATEGORIES.index(expense['Category']))
                
                with col_b:
                    new_amount = st.number_input("Amount", value=float(expense['Amount']), min_value=0.01, step=0.01, format="%.2f")
                    new_name = st.text_input("Expense Name", value=expense['Name'])
                
                col_submit1, col_submit2 = st.columns(2)
                
                with col_submit1:
                    if st.form_submit_button("Save Changes"):
                        # Update the expense
                        st.session_state.expenses_df.loc[edit_idx, 'Date'] = new_date.strftime("%Y-%m-%d")
                        st.session_state.expenses_df.loc[edit_idx, 'Name'] = new_name
                        st.session_state.expenses_df.loc[edit_idx, 'Category'] = new_category
                        st.session_state.expenses_df.loc[edit_idx, 'Amount'] = new_amount
                        
                        # Save to CSV
                        st.session_state.expenses_df.to_csv(EXPENSE_FILE, index=False)
                        
                        # Clear edit state
                        del st.session_state.edit_index
                        st.success("Entry updated!")
                        st.rerun()
                
                with col_submit2:
                    if st.form_submit_button("Cancel"):
                        del st.session_state.edit_index
                        st.rerun()
        
        # Monthly analysis (hidden by default, expandable)
        with st.expander("Monthly Summary"):
            df_with_month = df_display.copy()
            df_with_month["Month"] = df_with_month["Date"].dt.to_period("M")
            
            monthly_summary = df_with_month.groupby("Month")["Amount"].sum().sort_index(ascending=False)
            
            col_monthly1, col_monthly2 = st.columns(2)
            
            with col_monthly1:
                st.write("**Spending by Month**")
                monthly_df = monthly_summary.reset_index()
                monthly_df.columns = ["Month", "Amount"]
                # Format month as "Month Year" (e.g., "May 2026")
                monthly_df["Month"] = monthly_df["Month"].dt.strftime("%B %Y")
                monthly_df["Amount"] = monthly_df["Amount"].apply(lambda x: f"{st.session_state.currency_symbol}{x:.2f}")
                st.dataframe(monthly_df, use_container_width=True, hide_index=True)
            
            with col_monthly2:
                st.write("**Monthly Trend**")
                # Create a dataframe with formatted month names for the chart
                monthly_for_chart = df_with_month.groupby("Month")["Amount"].sum().sort_index(ascending=False)
                monthly_chart_df = monthly_for_chart.reset_index()
                monthly_chart_df.columns = ["Month", "Amount"]
                monthly_chart_df["Month"] = monthly_chart_df["Month"].dt.strftime("%b %Y")
                monthly_chart_df = monthly_chart_df.sort_values("Month")
                
                chart = alt.Chart(monthly_chart_df).mark_bar(color="#4A90E2").encode(
                    x=alt.X("Month:N", title="Month"),
                    y=alt.Y("Amount:Q", title="Amount")
                ).properties(height=300)
                
                st.altair_chart(chart, use_container_width=True)
        
        # Category breakdown
        st.divider()
        st.subheader("Analytics")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.write("**Spending by Category**")
            category_summary = st.session_state.expenses_df.groupby("Category")["Amount"].sum().sort_values(ascending=False)
            
            # Create bar chart with cool colors
            cat_df = category_summary.reset_index()
            cat_df.columns = ["Category", "Amount"]
            
            chart = alt.Chart(cat_df).mark_bar(color="#4A90E2").encode(
                x=alt.X("Amount:Q"),
                y=alt.Y("Category:N", sort="-x")
            ).properties(height=300)
            
            st.altair_chart(chart, use_container_width=True)
        
        with col2:
            st.write("**Category Totals**")
            category_summary_df = category_summary.reset_index()
            category_summary_df.columns = ["Category", "Amount"]
            category_summary_df["Amount"] = category_summary_df["Amount"].apply(lambda x: f"{st.session_state.currency_symbol}{x:.2f}")
            st.dataframe(category_summary_df, use_container_width=True, hide_index=True)
    else:
        st.info("No expenses yet. Add one to get started!")

if __name__ == "__main__":
    if is_running_streamlit():
        streamlit_ui()
    else:
        main()
