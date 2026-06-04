import { getTotalSpent, getBudgetStatus, getDailyAllowance, formatCurrency, getRemainingDays } from '../lib/expenses';

export default function BudgetStatus({ expenses, budget, currency, budgetType }) {
  const total = getTotalSpent(expenses);
  const status = getBudgetStatus(total, budget.amount);
  const remaining = budget.amount - total;
  const dailyAllowance = getDailyAllowance(remaining, budgetType);
  const remainingDays = getRemainingDays(budgetType);
  const period = budgetType === 'Monthly' ? 'month' : 'week';

  const fmt = (n) => formatCurrency(n, currency);

  const pct = status ? Math.min(status.percentage, 100) : 0;
  const barColor = status?.status === 'over' ? 'var(--danger)' :
    status?.status === 'warning' ? 'var(--warning)' : 'var(--accent)';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        Budget Status
      </div>

      {budget.amount > 0 ? (
        <>
          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {status ? `${status.percentage.toFixed(0)}% used` : '0% used'}
              </span>
              {status?.status === 'over' && (
                <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600 }}>
                  OVER BUDGET
                </span>
              )}
              {status?.status === 'warning' && (
                <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: 600 }}>
                  APPROACHING LIMIT
                </span>
              )}
            </div>
            <div style={{
              height: '4px',
              background: 'var(--bg-raised)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: barColor,
                borderRadius: '2px',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Metric label="Spent" value={fmt(total)} />
            <Metric label="Remaining" value={fmt(Math.max(remaining, 0))} highlight={remaining > 0} danger={remaining < 0} />
            <Metric label="Budget" value={fmt(budget.amount)} />
            <Metric label={`Daily / ${period}`} value={fmt(Math.max(dailyAllowance, 0))} />
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {remainingDays} day{remainingDays !== 1 ? 's' : ''} left in {period}
          </div>
        </>
      ) : (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>
          Set a budget in the sidebar to track your spending.
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, highlight, danger }) {
  return (
    <div style={{
      background: 'var(--bg-raised)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px',
    }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '15px',
        fontWeight: 500,
        color: danger ? 'var(--danger)' : highlight ? 'var(--accent)' : 'var(--text-primary)',
      }}>
        {value}
      </div>
    </div>
  );
}
