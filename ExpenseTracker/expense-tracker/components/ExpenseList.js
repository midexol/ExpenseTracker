import { useState } from 'react';
import { CATEGORIES, formatCurrency } from '../lib/expenses';

export default function ExpenseList({ expenses, currency, onDelete, onUpdate }) {
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filter, setFilter] = useState('All');

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = filter === 'All' ? sorted : sorted.filter(e => e.category === filter);

  const startEdit = (expense) => {
    setEditId(expense.id);
    setEditForm({ ...expense });
  };

  const cancelEdit = () => setEditId(null);

  const saveEdit = () => {
    onUpdate({ ...editForm, amount: parseFloat(editForm.amount) });
    setEditId(null);
  };

  const set = (key) => (e) => setEditForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header + filter */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Recent Expenses
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: filter === cat ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: filter === cat ? 'var(--accent-dim)' : 'transparent',
                color: filter === cat ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          No expenses yet. Add one above.
        </div>
      ) : (
        <div>
          {filtered.map((expense, i) => (
            <div key={expense.id}>
              {editId === expense.id ? (
                <EditRow
                  form={editForm}
                  set={set}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  currency={currency}
                />
              ) : (
                <ExpenseRow
                  expense={expense}
                  currency={currency}
                  onEdit={() => startEdit(expense)}
                  onDelete={() => onDelete(expense.id)}
                  isLast={i === filtered.length - 1}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpenseRow({ expense, currency, onEdit, onDelete, isLast }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto',
        alignItems: 'center',
        gap: '16px',
        padding: '14px 24px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        background: hovered ? 'var(--bg-raised)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
          {expense.name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px' }}>
          <CategoryBadge cat={expense.category} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{expense.date}</span>
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' }}>
        {formatCurrency(expense.amount, currency)}
      </div>

      <IconButton title="Edit" onClick={onEdit} icon="✏" />
      <IconButton title="Delete" onClick={onDelete} icon="✕" danger />
    </div>
  );
}

function EditRow({ form, set, onSave, onCancel, currency }) {
  return (
    <div style={{
      padding: '12px 24px',
      background: 'var(--bg-raised)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
        <input value={form.name} onChange={set('name')} placeholder="Name" style={inlineInput} />
        <input type="number" value={form.amount} onChange={set('amount')} placeholder="Amount" style={{ ...inlineInput, fontFamily: 'var(--font-mono)' }} />
        <select value={form.category} onChange={set('category')} style={inlineInput}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={form.date} onChange={set('date')} style={{ ...inlineInput, fontFamily: 'var(--font-mono)', colorScheme: 'dark' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onSave} style={{ ...actionBtn, background: 'var(--accent)', color: 'var(--accent-text)', border: 'none' }}>Save</button>
        <button onClick={onCancel} style={{ ...actionBtn, color: 'var(--text-muted)' }}>Cancel</button>
      </div>
    </div>
  );
}

function IconButton({ icon, onClick, danger, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '28px', height: '28px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: hov ? (danger ? 'var(--danger-dim)' : 'var(--bg-raised)') : 'transparent',
        color: danger ? 'var(--danger)' : 'var(--text-muted)',
        fontSize: '11px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {icon}
    </button>
  );
}

function CategoryBadge({ cat }) {
  const colors = {
    Food: '#3B6D11', Home: '#0F6E56', Work: '#185FA5',
    Transportation: '#854F0B', Fun: '#993556', Miscellaneous: '#5F5E5A',
  };
  const bg = colors[cat] || '#444';
  return (
    <span style={{
      background: bg + '33',
      color: bg,
      filter: 'brightness(1.6)',
      fontSize: '10px',
      padding: '1px 6px',
      borderRadius: '4px',
      fontWeight: 500,
    }}>
      {cat}
    </span>
  );
}

const inlineInput = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  padding: '6px 8px',
  fontSize: '12px',
  outline: 'none',
  width: '100%',
};

const actionBtn = {
  padding: '5px 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  fontSize: '12px',
  fontFamily: 'var(--font-display)',
  cursor: 'pointer',
  fontWeight: 500,
};
