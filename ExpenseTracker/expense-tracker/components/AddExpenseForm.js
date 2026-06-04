import { useState } from 'react';
import { CATEGORIES, createExpense, formatCurrency } from '../lib/expenses';

export default function AddExpenseForm({ onAdd, currency }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ name: '', amount: '', category: CATEGORIES[0], date: today });
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Enter an expense name');
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Enter a valid amount');
    setError('');
    onAdd(createExpense({ ...form, amount: parseFloat(form.amount) }));
    setForm(f => ({ ...f, name: '', amount: '' }));
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '20px' }}>
        Add Expense
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Expense name">
            <input
              type="text"
              placeholder="e.g. Groceries, Uber..."
              value={form.name}
              onChange={set('name')}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </Field>

          <Field label={`Amount (${formatCurrency(0, currency).charAt(0)})`}>
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={set('amount')}
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </Field>

          <Field label="Category">
            <select
              value={form.category}
              onChange={set('category')}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={form.date}
              onChange={set('date')}
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </Field>
        </div>

        {error && (
          <div style={{ fontSize: '12px', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
            ✗ {error}
          </div>
        )}

        <button
          type="submit"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            cursor: 'pointer',
            letterSpacing: '0.5px',
            transition: 'opacity 0.15s',
            alignSelf: 'flex-start',
          }}
          onMouseEnter={e => e.target.style.opacity = '0.85'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          Add expense →
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg-raised)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  padding: '8px 10px',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.15s',
  appearance: 'none',
  WebkitAppearance: 'none',
  colorScheme: 'dark',
};
