"use client";

export function AttributesRadarChart() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "0.5rem 0" }}>
      <svg width="220" height="180" viewBox="0 0 200 180">
        {/* Outer Pentagon */}
        <polygon
          points="100,20 170,60 145,140 55,140 30,60"
          fill="none"
          stroke="var(--border-light)"
          strokeWidth="1.5"
        />
        {/* Inner Pentagon */}
        <polygon
          points="100,45 145,72 130,120 70,120 55,72"
          fill="none"
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {/* Value Pentagon */}
        <polygon
          points="100,30 155,65 138,130 62,125 40,65"
          fill="rgba(24, 173, 242, 0.2)"
          stroke="var(--highlight)"
          strokeWidth="2"
        />
        {/* Axis Lines */}
        <line x1="100" y1="90" x2="100" y2="20" stroke="var(--border)" strokeWidth="1" />
        <line x1="100" y1="90" x2="170" y2="60" stroke="var(--border)" strokeWidth="1" />
        <line x1="100" y1="90" x2="145" y2="140" stroke="var(--border)" strokeWidth="1" />
        <line x1="100" y1="90" x2="55" y2="140" stroke="var(--border)" strokeWidth="1" />
        <line x1="100" y1="90" x2="30" y2="60" stroke="var(--border)" strokeWidth="1" />

        {/* Vertex Labels */}
        <text x="100" y="12" fill="var(--text-dim)" fontSize="10" fontWeight="800" textAnchor="middle">INT</text>
        <text x="180" y="62" fill="var(--text-dim)" fontSize="10" fontWeight="800" textAnchor="start">WIS</text>
        <text x="152" y="152" fill="var(--text-dim)" fontSize="10" fontWeight="800" textAnchor="start">END</text>
        <text x="48" y="152" fill="var(--text-dim)" fontSize="10" fontWeight="800" textAnchor="end">STR</text>
        <text x="20" y="62" fill="var(--text-dim)" fontSize="10" fontWeight="800" textAnchor="end">VIT</text>
      </svg>
    </div>
  );
}
