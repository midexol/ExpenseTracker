import { useState, useEffect } from 'react';
import { CURRENCIES, getRemainingDays, saveBudgetSettings } from '../lib/expenses';

export default function Sidebar({ budget, setBudget, currency, setCurrency, budgetType, setBudgetType, onReset }) {
  const [inputVal, setInputVal] = useState(budget.amount);
  const remainingDays = getRemainingDays(budgetType);

  useEffect(() => {
    setInputVal(budget.amount);
  }, [budget.amount]);

  const handleBudgetBlur = () => {
    const val = parseFloat(inputVal) || 0;
    const updated = { ...budget, amount: val, type: budgetType, currency };
    setBudget(updated);
    saveBudgetSettings(updated);
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    const updated = { ...budget, currency: newCurrency };
    setBudget(updated);
    saveBudgetSettings(updated);
  };

  const handleTypeChange = (type) => {
    setBudgetType(type);
    const updated = { ...budget, type };
    setBudget(updated);
    saveBudgetSettings(updated);
  };

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      padding: '28px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--accent)' }}>
          xpnsr.
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
          expense tracker
        </div>
      </div>

      <Section label="Currency">
        <div style={{ display: 'flex', gap: '6px' }}>
          {Object.entries(CURRENCIES).map(([key, val]) => (
            <Pill key={key} active={currency === key} onClick={() => handleCurrencyChange(key)}>
              {val.symbol} {key}
            </Pill>
          ))}
        </div>
      </Section>

      <Section label="Budget Period">
        <div style={{ display: 'flex', gap: '6px' }}>
          {['Monthly', 'Weekly'].map(type => (
            <Pill key={type} active={budgetType === type} onClick={() => handleTypeChange(type)}>
              {type}
            </Pill>
          ))}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
          {remainingDays} day{remainingDays !== 1 ? 's' : ''} remaining
        </div>
      </Section>

      <Section label="Budget Amount">
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px'
          }}>
            {CURRENCIES[currency].symbol}
          </span>
          <input
            type="number"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onBlur={handleBudgetBlur}
            style={{
              width: '100%',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              padding: '8px 10px 8px 26px',
              fontSize: '14px',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          />
        </div>
      </Section>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={onReset}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            color: 'var(--danger)',
            fontSize: '12px',
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.target.style.background = 'var(--danger-dim)'}
          onMouseLeave={e => e.target.style.background = 'transparent'}
        >
          Reset all data
        </button>
      </div>
    </aside>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: active ? 'var(--accent-dim)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        fontSize: '12px',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
