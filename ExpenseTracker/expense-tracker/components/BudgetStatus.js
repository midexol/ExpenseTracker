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

  return (
    <div style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Warm glow orb */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '120px', height: '120px',
        background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        Budget Overview
      </div>

      {budget.amount > 0 ? (
        <>
          {/* Circular progress + main stat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <CircleProgress pct={pct} status={status?.status} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1 }}>
                {fmt(total)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                of {fmt(budget.amount)} {period}ly budget
              </div>
              {status?.status === 'over' && (
                <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600, marginTop: '4px' }}>
                  ↑ Over by {fmt(Math.abs(remaining))}
                </div>
              )}
              {status?.status === 'warning' && (
                <div style={{ fontSize: '11px', color: '#ffb347', fontWeight: 600, marginTop: '4px' }}>
                  ⚡ Approaching limit
                </div>
              )}
            </div>
          </div>

          {/* Metrics row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <MiniMetric label="Remaining" value={fmt(Math.max(remaining, 0))} accent={remaining > 0} danger={remaining < 0} />
            <MiniMetric label={`Daily / ${period}`} value={fmt(Math.max(dailyAllowance, 0))} />
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {remainingDays} day{remainingDays !== 1 ? 's' : ''} left in {period}
          </div>
        </>
      ) : (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '8px 0' }}>
          Set a budget in settings to track spending.
        </div>
      )}
    </div>
  );
}

function CircleProgress({ pct, status }) {
  const size = 72;
  const r = 28;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const color = status === 'over' ? 'var(--danger)' : status === 'warning' ? '#ffb347' : 'var(--accent)';

  return (
    <svg width={size} height={size} style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 4px ${color})` }}
      />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px`, fill: color, fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

function MiniMetric({ label, value, accent, danger }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px',
      border: '1px solid var(--glass-border)',
    }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '15px',
        fontWeight: 600,
        color: danger ? 'var(--danger)' : accent ? 'var(--accent)' : 'var(--text-primary)',
      }}>{value}</div>
    </div>
  );
}
