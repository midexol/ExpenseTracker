import { useState, useEffect } from 'react';
import { CURRENCIES, getRemainingDays, saveBudgetSettings } from '../lib/expenses';

export default function Sidebar({ budget, setBudget, currency, setCurrency, budgetType, setBudgetType, onReset, resetConfirm }) {
  const [inputVal, setInputVal] = useState(budget.amount);
  const remainingDays = getRemainingDays(budgetType);

  useEffect(() => { setInputVal(budget.amount); }, [budget.amount]);

  const handleBudgetBlur = () => {
    const val = parseFloat(inputVal) || 0;
    const updated = { ...budget, amount: val, type: budgetType, currency };
    setBudget(updated);
    saveBudgetSettings(updated);
  };

  const handleCurrencyChange = (c) => {
    setCurrency(c);
    saveBudgetSettings({ ...budget, currency: c });
  };

  const handleTypeChange = (t) => {
    setBudgetType(t);
    const updated = { ...budget, type: t };
    setBudget(updated);
    saveBudgetSettings(updated);
  };

  return (
    <aside className="desktop-only" style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRight: '1px solid var(--glass-border)',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '36px',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      zIndex: 10,
    }}>
      {/* Logo */}
      <div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '26px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #f59e0b, #e07a5f)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px',
        }}>
          xpnsr.
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          personal finance tracker
        </div>
      </div>

      <Section label="Currency">
        <div style={{ display: 'flex', gap: '8px' }}>
          {Object.entries(CURRENCIES).map(([key, val]) => (
            <ToggleBtn key={key} active={currency === key} onClick={() => handleCurrencyChange(key)}>
              {val.symbol} {key}
            </ToggleBtn>
          ))}
        </div>
      </Section>

      <Section label="Budget Period">
        <div style={{ display: 'flex', gap: '8px' }}>
          {['Monthly', 'Weekly'].map(type => (
            <ToggleBtn key={type} active={budgetType === type} onClick={() => handleTypeChange(type)}>
              {type}
            </ToggleBtn>
          ))}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
          {remainingDays} day{remainingDays !== 1 ? 's' : ''} remaining
        </div>
      </Section>

      <Section label="Monthly Budget">
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontSize: '14px',
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
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              padding: '10px 12px 10px 28px',
              fontSize: '14px',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--glass-border-focus)';
              e.target.style.boxShadow = '0 0 0 3px var(--glow-amber)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--glass-border)';
              e.target.style.boxShadow = 'none';
              handleBudgetBlur();
            }}
          />
        </div>
      </Section>

      <div style={{ marginTop: 'auto' }}>
        <button
          onClick={onReset}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            border: resetConfirm ? '1px solid var(--danger)' : '1px solid var(--glass-border)',
            color: resetConfirm ? 'var(--danger)' : 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'all 0.2s',
            background: resetConfirm ? 'var(--danger-dim)' : 'transparent',
          }}
        >
          {resetConfirm ? '⚠ Tap again to confirm reset' : 'Reset all data'}
        </button>
      </div>
    </aside>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1,
      padding: '8px 10px',
      borderRadius: 'var(--radius-sm)',
      border: active ? '1px solid rgba(245,158,11,0.5)' : '1px solid var(--glass-border)',
      background: active ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(224,122,95,0.15))' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--text-muted)',
      fontSize: '12px',
      fontWeight: active ? 600 : 400,
      transition: 'all 0.2s',
      cursor: 'pointer',
    }}>
      {children}
    </button>
  );
}
