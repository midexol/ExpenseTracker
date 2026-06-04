import { useState, useEffect } from 'react';
import Head from 'next/head';
import Sidebar from '../components/Sidebar';
import AddExpenseForm from '../components/AddExpenseForm';
import BudgetStatus from '../components/BudgetStatus';
import ExpenseList from '../components/ExpenseList';
import Analytics from '../components/Analytics';
import {
  loadExpenses, saveExpenses, loadBudgetSettings, saveBudgetSettings,
  convertAmount,
} from '../lib/expenses';

export default function Home() {
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState({ amount: 0, type: 'Monthly', currency: 'NGN' });
  const [currency, setCurrency] = useState('NGN');
  const [budgetType, setBudgetType] = useState('Monthly');
  const [prevCurrency, setPrevCurrency] = useState('NGN');
  const [mounted, setMounted] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    const saved = loadExpenses();
    const savedBudget = loadBudgetSettings();
    setExpenses(saved);
    setBudget(savedBudget);
    setCurrency(savedBudget.currency || 'NGN');
    setPrevCurrency(savedBudget.currency || 'NGN');
    setBudgetType(savedBudget.type || 'Monthly');
    setMounted(true);
  }, []);

  // Currency conversion: when currency changes, convert all amounts
  useEffect(() => {
    if (!mounted) return;
    if (currency === prevCurrency) return;

    const converted = expenses.map(e => ({
      ...e,
      amount: parseFloat(convertAmount(e.amount, prevCurrency, currency).toFixed(2)),
    }));
    const newBudgetAmount = parseFloat(convertAmount(budget.amount, prevCurrency, currency).toFixed(2));

    setExpenses(converted);
    saveExpenses(converted);

    const newBudget = { ...budget, amount: newBudgetAmount, currency };
    setBudget(newBudget);
    saveBudgetSettings(newBudget);
    setPrevCurrency(currency);
  }, [currency]);

  const addExpense = (expense) => {
    const updated = [expense, ...expenses];
    setExpenses(updated);
    saveExpenses(updated);
  };

  const deleteExpense = (id) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
  };

  const updateExpense = (updated) => {
    const list = expenses.map(e => e.id === updated.id ? updated : e);
    setExpenses(list);
    saveExpenses(list);
  };

  const handleReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    setExpenses([]);
    saveExpenses([]);
    const def = { amount: 0, type: 'Monthly', currency: 'NGN' };
    setBudget(def);
    saveBudgetSettings(def);
    setCurrency('NGN');
    setBudgetType('Monthly');
    setResetConfirm(false);
  };

  if (!mounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        loading...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>xpnsr — expense tracker</title>
        <meta name="description" content="Personal expense tracker" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>₦</text></svg>" />
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          budget={budget}
          setBudget={setBudget}
          currency={currency}
          setCurrency={setCurrency}
          budgetType={budgetType}
          setBudgetType={setBudgetType}
          onReset={handleReset}
          resetConfirm={resetConfirm}
        />

        <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {/* Page header */}
          <div style={{ marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Dashboard
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Top row: add form + budget status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>
            <AddExpenseForm onAdd={addExpense} currency={currency} />
            <BudgetStatus
              expenses={expenses}
              budget={budget}
              currency={currency}
              budgetType={budgetType}
            />
          </div>

          {/* Analytics */}
          {expenses.length > 0 && (
            <Analytics expenses={expenses} currency={currency} />
          )}

          {/* Expense list */}
          <ExpenseList
            expenses={expenses}
            currency={currency}
            onDelete={deleteExpense}
            onUpdate={updateExpense}
          />
        </main>
      </div>
    </>
  );
}
