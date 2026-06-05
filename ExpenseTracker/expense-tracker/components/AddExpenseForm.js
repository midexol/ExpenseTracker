import { useState } from 'react';
import { CATEGORIES, createExpense, formatCurrency, CURRENCIES } from '../lib/expenses';

const CATEGORY_ICONS = {
  Food: '🍜', Home: '🏠', Work: '💼', Transportation: '🚗', Fun: '🎉', Miscellaneous: '📦',
};

export default function AddExpenseForm({ onAdd, currency }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ name: '', amount: '', category: CATEGORIES[0], date: today });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Enter an expense name');
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Enter a valid amount');
    setError('');
    onAdd(createExpense({ ...form, amount: parseFloat(form.amount) }));
    setForm(f => ({ ...f, name: '', amount: '' }));
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const sym = CURRENCIES[currency]?.symbol || '₦';

  return (
    <div style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow accent */}
      <div style={{
        position: 'absolute', bottom: '-40px', left: '-20px',
        width: '160px', height: '160px',
        background: 'radial-gradient(circle, rgba(224,122,95,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '20px' }}>
        Add Expense
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Name + Amount row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="What did you spend on?">
            <input
              type="text"
              placeholder="e.g. Groceries, Bolt..."
              value={form.name}
              onChange={set('name')}
              style={inputStyle}
              onFocus={focusStyle} onBlur={blurStyle}
            />
          </Field>
          <Field label={`Amount (${sym})`}>
            <input
              type="number"
              placeholder="0.00"
              min="0" step="0.01"
              value={form.amount}
              onChange={set('amount')}
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
              onFocus={focusStyle} onBlur={blurStyle}
            />
          </Field>
        </div>

        {/* Category pills */}
        <Field label="Category">
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat }))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '50px',
                  border: form.category === cat ? '1px solid rgba(245,158,11,0.6)' : '1px solid var(--glass-border)',
                  background: form.category === cat
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(224,122,95,0.15))'
                    : 'rgba(255,255,255,0.04)',
                  color: form.category === cat ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: form.category === cat ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                {cat}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Date">
          <input
            type="date"
            value={form.date}
            onChange={set('date')}
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)', colorScheme: 'dark', maxWidth: '200px' }}
            onFocus={focusStyle} onBlur={blurStyle}
          />
        </Field>

        {error && (
          <div style={{ fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ✕ {error}
          </div>
        )}

        <button
          type="submit"
          style={{
            background: success
              ? 'linear-gradient(135deg, #6ee7b7, #34d399)'
              : 'linear-gradient(135deg, #f59e0b, #e07a5f)',
            color: '#1c1410',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 24px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.3px',
            transition: 'all 0.3s',
            alignSelf: 'flex-start',
            boxShadow: success ? '0 4px 20px rgba(110,231,183,0.3)' : '0 4px 20px rgba(245,158,11,0.25)',
          }}
        >
          {success ? '✓ Added!' : 'Add expense →'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      <label style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  padding: '10px 12px',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

function focusStyle(e) {
  e.target.style.borderColor = 'var(--glass-border-focus)';
  e.target.style.boxShadow = '0 0 0 3px var(--glow-amber)';
}
function blurStyle(e) {
  e.target.style.borderColor = 'var(--glass-border)';
  e.target.style.boxShadow = 'none';
}
