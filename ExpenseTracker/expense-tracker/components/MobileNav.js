import { useState } from 'react';
import { CURRENCIES, getRemainingDays, saveBudgetSettings } from '../lib/expenses';

const TABS = [
  { id: 'dashboard', icon: '⊞', label: 'Home'     },
  { id: 'expenses',  icon: '≡',  label: 'Expenses' },
  { id: 'analytics', icon: '◉',  label: 'Charts'   },
  { id: 'settings',  icon: '⚙',  label: 'Settings' },
];

export default function MobileNav({
  activeTab, setActiveTab,
  budget, setBudget, currency, setCurrency,
  budgetType, setBudgetType, onReset, resetConfirm,
}) {
  const showSettings = activeTab === 'settings';

  return (
    <>
      {showSettings && (
        <SettingsSheet
          budget={budget} setBudget={setBudget}
          currency={currency} setCurrency={setCurrency}
          budgetType={budgetType} setBudgetType={setBudgetType}
          onReset={onReset} resetConfirm={resetConfirm}
        />
      )}

      <nav className="mobile-only" style={{
        position:'fixed', bottom:0, left:0, right:0,
        height:'var(--nav-height)',
        background:'rgba(20,14,10,0.92)',
        backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
        borderTop:'1px solid var(--glass-border)',
        display:'flex',
        zIndex:100,
        paddingBottom:'env(safe-area-inset-bottom)',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex:1,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:'3px',
                background:'none', border:'none',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                cursor:'pointer',
                transition:'color 0.2s',
                padding:'8px 0',
                position:'relative',
              }}
            >
              {active && (
                <span style={{
                  position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
                  width:'24px', height:'2px',
                  background:'linear-gradient(90deg,#f59e0b,#e07a5f)',
                  borderRadius:'0 0 2px 2px',
                }} />
              )}
              <span style={{ fontSize:'17px', lineHeight:1 }}>{tab.icon}</span>
              <span style={{ fontSize:'10px', fontWeight: active ? 600 : 400, letterSpacing:'0.3px' }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

function SettingsSheet({ budget, setBudget, currency, setCurrency, budgetType, setBudgetType, onReset, resetConfirm }) {
  const [inputVal, setInputVal] = useState(budget.amount);

  const handleBlur = () => {
    const val = parseFloat(inputVal) || 0;
    const updated = { ...budget, amount: val };
    setBudget(updated);
    saveBudgetSettings(updated);
  };

  const handleCurrency = (c) => {
    setCurrency(c);
    saveBudgetSettings({ ...budget, currency: c });
  };

  const handleType = (t) => {
    setBudgetType(t);
    const updated = { ...budget, type: t };
    setBudget(updated);
    saveBudgetSettings(updated);
  };

  const remaining = getRemainingDays(budgetType);

  return (
    <div className="mobile-only" style={{
      position:'fixed', bottom:'var(--nav-height)', left:0, right:0,
      background:'rgba(22,15,11,0.97)',
      backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)',
      borderTop:'1px solid var(--glass-border)',
      padding:'24px 20px 20px',
      zIndex:99,
      display:'flex', flexDirection:'column', gap:'22px',
    }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:'18px', fontWeight:700, letterSpacing:'-0.5px' }}>
        Settings
      </div>

      {/* Currency */}
      <SettingRow label="Currency">
        <div style={{ display:'flex', gap:'8px' }}>
          {Object.entries(CURRENCIES).map(([key, val]) => (
            <ToggleBtn key={key} active={currency === key} onClick={() => handleCurrency(key)}>
              {val.symbol} {key}
            </ToggleBtn>
          ))}
        </div>
      </SettingRow>

      {/* Period */}
      <SettingRow label={`Budget period · ${remaining} day${remaining!==1?'s':''} left`}>
        <div style={{ display:'flex', gap:'8px' }}>
          {['Monthly','Weekly'].map(t => (
            <ToggleBtn key={t} active={budgetType === t} onClick={() => handleType(t)}>{t}</ToggleBtn>
          ))}
        </div>
      </SettingRow>

      {/* Budget amount */}
      <SettingRow label={`Budget amount (${CURRENCIES[currency].symbol})`}>
        <input
          type="number"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onBlur={handleBlur}
          style={{
            width:'100%',
            background:'rgba(255,255,255,0.07)',
            border:'1px solid var(--glass-border)',
            borderRadius:'var(--radius-sm)',
            color:'var(--text-primary)',
            padding:'12px 14px',
            fontSize:'16px',
            fontFamily:'var(--font-mono)',
            outline:'none',
          }}
        />
      </SettingRow>

      {/* Reset */}
      <button
        onClick={onReset}
        style={{
          padding:'12px',
          borderRadius:'var(--radius-sm)',
          border: resetConfirm ? '1px solid var(--danger)' : '1px solid var(--glass-border)',
          color: resetConfirm ? 'var(--danger)' : 'var(--text-muted)',
          background: resetConfirm ? 'var(--danger-dim)' : 'transparent',
          fontSize:'13px', fontWeight:500, cursor:'pointer', transition:'all 0.2s',
        }}
      >
        {resetConfirm ? '⚠ Tap again to confirm reset' : 'Reset all data'}
      </button>
    </div>
  );
}

function SettingRow({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
      <div style={{ fontSize:'10px', color:'var(--text-muted)', fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex:1, padding:'11px 10px',
      borderRadius:'var(--radius-sm)',
      border: active ? '1px solid rgba(245,158,11,0.5)' : '1px solid var(--glass-border)',
      background: active ? 'linear-gradient(135deg,rgba(245,158,11,0.18),rgba(224,122,95,0.12))' : 'rgba(255,255,255,0.04)',
      color: active ? 'var(--accent)' : 'var(--text-secondary)',
      fontSize:'13px', fontWeight: active ? 600 : 400, cursor:'pointer', transition:'all 0.2s',
    }}>
      {children}
    </button>
  );
}
