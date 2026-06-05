import { useState } from 'react';
import { CATEGORIES, formatCurrency } from '../lib/expenses';

const CATEGORY_ICONS = { Food:'🍜', Home:'🏠', Work:'💼', Transportation:'🚗', Fun:'🎉', Miscellaneous:'📦' };
const CATEGORY_COLORS = { Food:'#d97706', Home:'#059669', Work:'#3b82f6', Transportation:'#8b5cf6', Fun:'#ec4899', Miscellaneous:'#6b7280' };

export default function ExpenseList({ expenses, currency, onDelete, onUpdate }) {
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filter, setFilter] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = filter === 'All' ? sorted : sorted.filter(e => e.category === filter);

  const startEdit = (exp) => { setEditId(exp.id); setEditForm({ ...exp }); };
  const cancelEdit = () => setEditId(null);
  const saveEdit = () => { onUpdate({ ...editForm, amount: parseFloat(editForm.amount) }); setEditId(null); };
  const set = (key) => (e) => setEditForm(f => ({ ...f, [key]: e.target.value }));

  const handleDelete = (id) => {
    if (deleteConfirm === id) { onDelete(id); setDeleteConfirm(null); }
    else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 2500);
    }
  };

  return (
    <div style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Transactions
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: '5px 11px',
              borderRadius: '50px',
              border: filter === cat ? '1px solid rgba(245,158,11,0.5)' : '1px solid var(--glass-border)',
              background: filter === cat ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: filter === cat ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: filter === cat ? 600 : 400,
            }}>
              {cat !== 'All' && CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🌿</div>
          No expenses yet. Add one above!
        </div>
      ) : (
        <div>
          {filtered.map((expense, i) => (
            <div key={expense.id}>
              {editId === expense.id ? (
                <EditRow form={editForm} set={set} onSave={saveEdit} onCancel={cancelEdit} isLast={i === filtered.length - 1} />
              ) : (
                <ExpenseRow
                  expense={expense} currency={currency}
                  onEdit={() => startEdit(expense)}
                  onDelete={() => handleDelete(expense.id)}
                  deleteConfirm={deleteConfirm === expense.id}
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

function ExpenseRow({ expense, currency, onEdit, onDelete, deleteConfirm, isLast }) {
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[expense.category] || '#888';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto auto',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 24px',
        borderBottom: isLast ? 'none' : '1px solid var(--glass-border)',
        background: hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      {/* Category icon bubble */}
      <div style={{
        width: '38px', height: '38px',
        borderRadius: '12px',
        background: `${color}22`,
        border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', flexShrink: 0,
      }}>
        {CATEGORY_ICONS[expense.category] || '📦'}
      </div>

      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{expense.name}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color, fontWeight: 500 }}>{expense.category}</span>
          <span>·</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{expense.date}</span>
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', flexShrink: 0 }}>
        {formatCurrency(expense.amount, currency)}
      </div>

      <IconBtn onClick={onEdit} title="Edit">✏</IconBtn>
      <IconBtn onClick={onDelete} title={deleteConfirm ? 'Confirm?' : 'Delete'} danger active={deleteConfirm}>
        {deleteConfirm ? '?' : '✕'}
      </IconBtn>
    </div>
  );
}

function EditRow({ form, set, onSave, onCancel, isLast }) {
  return (
    <div style={{
      padding: '16px 24px',
      background: 'rgba(245,158,11,0.05)',
      borderBottom: isLast ? 'none' : '1px solid var(--glass-border)',
      borderLeft: '3px solid var(--accent)',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {[
          { key: 'name', placeholder: 'Name', type: 'text' },
          { key: 'amount', placeholder: 'Amount', type: 'number' },
        ].map(({ key, placeholder, type }) => (
          <input key={key} type={type} value={form[key]} onChange={set(key)} placeholder={placeholder}
            style={editInputStyle} />
        ))}
        <select value={form.category} onChange={set('category')} style={editInputStyle}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={form.date} onChange={set('date')} style={{ ...editInputStyle, colorScheme: 'dark' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onSave} style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, #f59e0b, #e07a5f)', border: 'none', color: '#1c1410', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
          Save
        </button>
        <button onClick={onCancel} style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, danger, active, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
        border: (hov || active) ? (danger ? '1px solid rgba(251,113,133,0.5)' : '1px solid var(--glass-border-focus)') : '1px solid var(--glass-border)',
        background: (hov || active) ? (danger ? 'var(--danger-dim)' : 'rgba(245,158,11,0.1)') : 'transparent',
        color: danger ? 'var(--danger)' : 'var(--text-muted)',
        fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      {children}
    </button>
  );
}

const editInputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  padding: '7px 10px',
  fontSize: '12px',
  outline: 'none',
  width: '100%',
};
