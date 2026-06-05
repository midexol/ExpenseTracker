import { useState, useEffect } from 'react';
import Head from 'next/head';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import AddExpenseForm from '../components/AddExpenseForm';
import BudgetStatus from '../components/BudgetStatus';
import ExpenseList from '../components/ExpenseList';
import Analytics from '../components/Analytics';
import {
  loadExpenses, saveExpenses, loadBudgetSettings, saveBudgetSettings,
  convertAmount, getTotalSpent, formatCurrency,
} from '../lib/expenses';

export default function Home() {
  const [expenses, setExpenses]     = useState([]);
  const [budget, setBudget]         = useState({ amount: 0, type: 'Monthly', currency: 'NGN' });
  const [currency, setCurrency]     = useState('NGN');
  const [budgetType, setBudgetType] = useState('Monthly');
  const [prevCurrency, setPrevCurrency] = useState('NGN');
  const [mounted, setMounted]       = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [activeTab, setActiveTab]   = useState('dashboard');

  useEffect(() => {
    const saved      = loadExpenses();
    const savedBudget = loadBudgetSettings();
    setExpenses(saved);
    setBudget(savedBudget);
    setCurrency(savedBudget.currency || 'NGN');
    setPrevCurrency(savedBudget.currency || 'NGN');
    setBudgetType(savedBudget.type || 'Monthly');
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || currency === prevCurrency) return;
    const converted = expenses.map(e => ({
      ...e,
      amount: parseFloat(convertAmount(e.amount, prevCurrency, currency).toFixed(2)),
    }));
    const newAmt = parseFloat(convertAmount(budget.amount, prevCurrency, currency).toFixed(2));
    setExpenses(converted);
    saveExpenses(converted);
    const newBudget = { ...budget, amount: newAmt, currency };
    setBudget(newBudget);
    saveBudgetSettings(newBudget);
    setPrevCurrency(currency);
  }, [currency]); // eslint-disable-line

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
    setExpenses([]); saveExpenses([]);
    const def = { amount: 0, type: 'Monthly', currency: 'NGN' };
    setBudget(def); saveBudgetSettings(def);
    setCurrency('NGN'); setBudgetType('Monthly'); setResetConfirm(false);
  };

  if (!mounted) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'16px' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.08)',
        borderTop: '2px solid #f59e0b',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ color:'var(--text-muted)', fontSize:'12px', letterSpacing:'1px' }}>loading...</div>
    </div>
  );

  const total = getTotalSpent(expenses);

  /* ── shared props ── */
  const sidebarProps = {
    budget, setBudget, currency, setCurrency,
    budgetType, setBudgetType, onReset: handleReset, resetConfirm,
  };

  return (
    <>
      <Head>
        <title>xpnsr — expense tracker</title>
        <meta name="description" content="Personal expense tracker" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* ── DESKTOP layout ── */}
      <div className="desktop-only" style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
        <Sidebar {...sidebarProps} />

        <main style={{ flex:1, padding:'40px', display:'flex', flexDirection:'column', gap:'20px', minWidth:0 }}>
          <DesktopHeader total={total} currency={currency} budget={budget} budgetType={budgetType} />

          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'20px', alignItems:'start' }}>
            <AddExpenseForm onAdd={addExpense} currency={currency} />
            <BudgetStatus expenses={expenses} budget={budget} currency={currency} budgetType={budgetType} />
          </div>

          {expenses.length > 0 && <Analytics expenses={expenses} currency={currency} />}
          <ExpenseList expenses={expenses} currency={currency} onDelete={deleteExpense} onUpdate={updateExpense} />
        </main>
      </div>

      {/* ── MOBILE layout ── */}
      <div className="mobile-only" style={{ flexDirection:'column', minHeight:'100vh', position:'relative', zIndex:1 }}>
        {/* Top bar */}
        <div style={{
          padding:'16px 16px 12px',
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          borderBottom:'1px solid var(--glass-border)',
          background:'rgba(28,20,16,0.6)',
          backdropFilter:'blur(16px)',
          WebkitBackdropFilter:'blur(16px)',
          position:'sticky', top:0, zIndex:50,
        }}>
          <div style={{
            fontFamily:'var(--font-display)', fontSize:'20px', fontWeight:700,
            background:'linear-gradient(135deg,#f59e0b,#e07a5f)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>xpnsr.</div>

          {budget.amount > 0 && (
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'0.8px' }}>SPENT</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'16px', fontWeight:700, color:'var(--text-primary)' }}>
                {formatCurrency(total, currency)}
              </div>
            </div>
          )}
        </div>

        {/* Tab content */}
        <div style={{ flex:1, padding:'16px', display:'flex', flexDirection:'column', gap:'14px' }}>
          <MobileContent
            tab={activeTab}
            expenses={expenses} budget={budget} currency={currency} budgetType={budgetType}
            onAdd={addExpense} onDelete={deleteExpense} onUpdate={updateExpense}
            setActiveTab={setActiveTab}
          />
        </div>

        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} {...sidebarProps} />
      </div>
    </>
  );
}

function MobileContent({ tab, expenses, budget, currency, budgetType, onAdd, onDelete, onUpdate, setActiveTab }) {
  switch (tab) {
    case 'dashboard':
      return (
        <>
          <MobileBudgetBanner expenses={expenses} budget={budget} currency={currency} budgetType={budgetType} />
          <AddExpenseForm onAdd={(e) => { onAdd(e); setActiveTab('expenses'); }} currency={currency} />
        </>
      );
    case 'expenses':
      return <ExpenseList expenses={expenses} currency={currency} onDelete={onDelete} onUpdate={onUpdate} />;
    case 'analytics':
      return expenses.length > 0
        ? <Analytics expenses={expenses} currency={currency} />
        : (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>📊</div>
            <div>Add expenses to see analytics</div>
          </div>
        );
    default:
      return null;
  }
}

function MobileBudgetBanner({ expenses, budget, currency, budgetType }) {
  const total     = getTotalSpent(expenses);
  const remaining = budget.amount - total;
  const pct       = budget.amount > 0 ? Math.min((total / budget.amount) * 100, 100) : 0;
  const barColor  = pct >= 100 ? 'var(--danger)' : pct >= 80 ? '#ffb347' : 'linear-gradient(90deg,#f59e0b,#e07a5f)';

  if (budget.amount <= 0) return (
    <div style={{
      background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
      borderRadius:'var(--radius-xl)', padding:'20px',
      backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
      textAlign:'center', color:'var(--text-muted)', fontSize:'13px',
    }}>
      Open <strong style={{ color:'var(--accent)' }}>Settings</strong> to set your budget
    </div>
  );

  return (
    <div style={{
      background:'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(224,122,95,0.08))',
      border:'1px solid rgba(245,158,11,0.2)',
      borderRadius:'var(--radius-xl)', padding:'20px',
      display:'flex', flexDirection:'column', gap:'14px',
      backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'1px', textTransform:'uppercase' }}>Spent</div>
          <div style={{
            fontFamily:'var(--font-display)', fontSize:'28px', fontWeight:700, letterSpacing:'-1px',
            background:'linear-gradient(135deg,#f59e0b,#e07a5f)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>{formatCurrency(total, currency)}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'1px', textTransform:'uppercase' }}>
            {remaining >= 0 ? 'Left' : 'Over'}
          </div>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:'20px', fontWeight:700,
            color: remaining >= 0 ? 'var(--success)' : 'var(--danger)',
          }}>{formatCurrency(Math.abs(remaining), currency)}</div>
        </div>
      </div>

      <div>
        <div style={{ height:'5px', background:'rgba(255,255,255,0.1)', borderRadius:'3px', overflow:'hidden' }}>
          <div style={{
            height:'100%', width:`${pct}%`, borderRadius:'3px',
            background: barColor,
            transition:'width 0.5s ease',
          }} />
        </div>
        <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'6px', fontFamily:'var(--font-mono)' }}>
          {pct.toFixed(0)}% of {formatCurrency(budget.amount, currency)} {budgetType.toLowerCase()} budget
        </div>
      </div>
    </div>
  );
}

function DesktopHeader({ budget, total, currency, budgetType }) {
  const dateStr = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const period  = budgetType === 'Monthly' ? 'this month' : 'this week';

  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'12px' }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'34px', fontWeight:700, letterSpacing:'-1.5px', lineHeight:1.1 }}>
          Dashboard
        </h1>
        <p style={{ fontSize:'13px', color:'var(--text-muted)', marginTop:'6px' }}>{dateStr}</p>
      </div>
      {budget.amount > 0 && (
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>spent {period}</div>
          <div style={{
            fontFamily:'var(--font-display)', fontSize:'30px', fontWeight:700, letterSpacing:'-1px',
            background:'linear-gradient(135deg,#f59e0b,#e07a5f)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>{formatCurrency(total, currency)}</div>
        </div>
      )}
    </div>
  );
}
