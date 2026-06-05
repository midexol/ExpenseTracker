import { groupByCategory, groupByMonth, formatCurrency, formatMonth } from '../lib/expenses';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from 'recharts';

const CAT_COLORS = {
  Food:'#d97706', Home:'#059669', Work:'#3b82f6',
  Transportation:'#8b5cf6', Fun:'#ec4899', Miscellaneous:'#6b7280',
};

const GlassTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'rgba(28,20,16,0.95)', backdropFilter:'blur(16px)',
      border:'1px solid var(--glass-border)', borderRadius:'var(--radius-sm)',
      padding:'10px 14px', fontSize:'12px', fontFamily:'var(--font-mono)',
    }}>
      <div style={{ color:'var(--text-muted)', marginBottom:'3px' }}>{label}</div>
      <div style={{ color:'var(--accent)', fontWeight:600 }}>
        {formatCurrency(payload[0].value, currency)}
      </div>
    </div>
  );
};

export default function Analytics({ expenses, currency }) {
  if (!expenses.length) return null;

  const byCat     = groupByCategory(expenses);
  const catData   = Object.entries(byCat)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const byMonth   = groupByMonth(expenses);
  const monthData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, value]) => ({
      name: new Date(m + '-01').toLocaleString('en-US', { month: 'short' }),
      fullName: formatMonth(m),
      value,
    }));

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

      {/* Charts row — stacks on mobile via CSS */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
        gap:'16px',
      }}>
        {/* Category bar chart */}
        <ChartCard title="Spending by category">
          <ResponsiveContainer width="100%" height={Math.max(160, catData.length * 38)}>
            <BarChart data={catData} layout="vertical" margin={{ left:0, right:16, top:0, bottom:0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category" dataKey="name"
                tick={{ fill:'rgba(253,248,240,0.5)', fontSize:11 }}
                width={98}
              />
              <Tooltip content={<GlassTooltip currency={currency} />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" radius={[0,6,6,0]}>
                {catData.map((entry, i) => (
                  <Cell key={i} fill={CAT_COLORS[entry.name] || '#888'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly line chart */}
        <ChartCard title="Monthly trend">
          {monthData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthData} margin={{ left:0, right:16, top:10, bottom:0 }}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#e07a5f" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" tick={{ fill:'rgba(253,248,240,0.4)', fontSize:10 }} />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div style={{
                        background:'rgba(28,20,16,0.95)', backdropFilter:'blur(16px)',
                        border:'1px solid var(--glass-border)', borderRadius:'var(--radius-sm)',
                        padding:'10px 14px', fontSize:'12px', fontFamily:'var(--font-mono)',
                      }}>
                        <div style={{ color:'var(--text-muted)', marginBottom:'3px' }}>{payload[0].payload.fullName}</div>
                        <div style={{ color:'#f59e0b', fontWeight:600 }}>{formatCurrency(payload[0].value, currency)}</div>
                      </div>
                    ) : null
                  }
                />
                <Line
                  type="monotone" dataKey="value"
                  stroke="url(#lineGrad)" strokeWidth={2.5}
                  dot={{ fill:'#f59e0b', r:4, stroke:'rgba(245,158,11,0.3)', strokeWidth:4 }}
                  activeDot={{ fill:'#f59e0b', r:6, stroke:'rgba(245,158,11,0.3)', strokeWidth:6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:'12px', textAlign:'center', padding:'0 24px' }}>
              Add expenses across multiple months to see your trend
            </div>
          )}
        </ChartCard>
      </div>

      {/* Breakdown tiles */}
      <ChartCard title="Breakdown">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:'10px' }}>
          {catData.map(({ name, value }) => {
            const pct   = ((value / total) * 100).toFixed(1);
            const color = CAT_COLORS[name] || '#888';
            return (
              <div key={name} style={{
                background:`${color}14`,
                borderRadius:'var(--radius-md)',
                padding:'14px',
                border:`1px solid ${color}30`,
                position:'relative', overflow:'hidden',
              }}>
                {/* Bottom progress bar */}
                <div style={{
                  position:'absolute', bottom:0, left:0,
                  height:'2px', width:`${pct}%`, maxWidth:'100%',
                  background:color,
                }} />
                <div style={{ fontSize:'11px', color:'rgba(253,248,240,0.45)', marginBottom:'6px' }}>{name}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'14px', fontWeight:600, color:'var(--text-primary)' }}>
                  {formatCurrency(value, currency)}
                </div>
                <div style={{ fontSize:'10px', color, marginTop:'3px', fontWeight:600 }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{
      background:'var(--glass-bg)',
      backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
      border:'1px solid var(--glass-border)',
      borderRadius:'var(--radius-xl)',
      padding:'22px',
    }}>
      <div style={{ fontSize:'11px', fontWeight:600, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'18px' }}>
        {title}
      </div>
      {children}
    </div>
  );
}
