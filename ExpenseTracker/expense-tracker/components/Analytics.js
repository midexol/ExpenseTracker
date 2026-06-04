import { groupByCategory, groupByMonth, formatCurrency, formatMonth } from '../lib/expenses';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';

const CATEGORY_COLORS = {
  Food: '#c8f542',
  Home: '#5DCAA5',
  Work: '#378ADD',
  Transportation: '#EF9F27',
  Fun: '#ED93B1',
  Miscellaneous: '#B4B2A9',
};

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 12px',
        fontSize: '12px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-primary)',
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
        <div style={{ color: 'var(--accent)' }}>{formatCurrency(payload[0].value, currency)}</div>
      </div>
    );
  }
  return null;
};

export default function Analytics({ expenses, currency }) {
  if (expenses.length === 0) return null;

  const byCat = groupByCategory(expenses);
  const catData = Object.entries(byCat)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const byMonth = groupByMonth(expenses);
  const monthData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ name: formatMonth(month).slice(0, 7), fullName: formatMonth(month), value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Category breakdown */}
        <ChartCard title="Spending by category">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-display)' }}
                width={90}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {catData.map((entry, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#888'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly trend */}
        <ChartCard title="Monthly trend">
          {monthData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthData} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{
                          background: 'var(--bg-raised)', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                          fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)',
                        }}>
                          <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>{payload[0].payload.fullName}</div>
                          <div style={{ color: 'var(--accent)' }}>{formatCurrency(payload[0].value, currency)}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--accent)', r: 3 }}
                  activeDot={{ fill: 'var(--accent)', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              Add expenses across multiple months to see trend
            </div>
          )}
        </ChartCard>
      </div>

      {/* Category totals table */}
      <ChartCard title="Category breakdown">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
          {catData.map(({ name, value }) => (
            <div key={name} style={{
              background: 'var(--bg-raised)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              borderLeft: `3px solid ${CATEGORY_COLORS[name] || '#888'}`,
            }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '4px' }}>{name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {formatCurrency(value, currency)}
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
        {title}
      </div>
      {children}
    </div>
  );
}
