import React from "react";
import { C, F, FM, FN, R, S, SH, card, btn, NUM } from "../theme.js";

function Lbl({ children }) { return <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: S.xs, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: FM }}>{children}</div>; }

function Fld({ label, children, error }) {
  return (
    <div>
      <Lbl>{label}</Lbl>
      {children}
      {error && <div style={{ fontSize: 11, color: C.red, fontWeight: 500, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 13 }}>!</span> {error}</div>}
    </div>
  );
}

function Empty({ msg, green, icon, action, onAction }) {
  const emptyIllustration = green ? (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" stroke={C.green} strokeWidth="2" strokeDasharray="4 3" opacity="0.3" />
      <circle cx="24" cy="24" r="14" fill={C.green + "12"} />
      <path d="M17 24l5 5 9-9" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" stroke={C.border2} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
      <circle cx="24" cy="24" r="10" fill={C.card2} />
      <circle cx="20" cy="22" r="1.5" fill={C.text3} opacity="0.5" />
      <circle cx="28" cy="22" r="1.5" fill={C.text3} opacity="0.5" />
      <path d="M20 28c1.5-1.5 6.5-1.5 8 0" stroke={C.text3} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
  return (
    <div className={green ? "celebrate-pulse" : ""} style={{ ...card, background: C.surface, border: `1px solid ${green ? C.green + "33" : C.border}`, textAlign: "center", padding: "32px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ marginBottom: 4 }}>{icon || emptyIllustration}</div>
      <div style={{ fontSize: 13, color: green ? C.green : C.text3, maxWidth: 280, lineHeight: 1.6, fontWeight: 500 }}>{msg}</div>
      {action && onAction && <button onClick={onAction} style={{ ...btn(C.blue), padding: "10px 22px", fontSize: 12, marginTop: 6, borderRadius: R.lg }}>{action}</button>}
    </div>
  );
}

function ChartTip({ active, payload, label, averages }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R.md, padding: "10px 14px", boxShadow: SH.lg, minWidth: 140 }}>
      {label && <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => {
        const avg = averages?.[p.dataKey];
        const diff = avg != null && p.value != null ? p.value - avg : null;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
            <span style={{ fontSize: 12, color: C.text2 }}>{p.name}:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FN }}>{p.value}%</span>
            {diff != null && <span style={{ fontSize: 10, fontWeight: 600, fontFamily: FN, color: diff >= 0 ? C.green : C.red }}>{diff >= 0 ? "+" : ""}{Math.round(diff)}</span>}
          </div>
        );
      })}
      {payload.some((_, i) => averages?.[payload[i]?.dataKey] != null) && <div style={{ fontSize: 10, color: C.text3, marginTop: 4, borderTop: `1px solid ${C.border}`, paddingTop: 4 }}>vs. sua média</div>}
    </div>
  );
}

function Skeleton({ width = "100%", height = 16, radius = R.sm }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, background: C.card2 }} />;
}

function SkeletonCard() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R.xl, padding: S.xl, display: "flex", flexDirection: "column", gap: 12 }}>
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={10} />
      <Skeleton width="80%" height={10} />
    </div>
  );
}

export { Lbl, Fld, Empty, ChartTip, Skeleton, SkeletonCard };
