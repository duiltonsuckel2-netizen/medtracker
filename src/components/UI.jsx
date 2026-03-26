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
  return (
    <div style={{ ...card, background: C.surface, border: `1px solid ${green ? C.green + "33" : C.border}`, textAlign: "center", padding: `${S.xl + 12}px ${S.xl}px`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {icon && <div style={{ width: 48, height: 48, borderRadius: 14, background: green ? C.green + "12" : C.card2, border: `1px solid ${green ? C.green + "25" : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>}
      <div style={{ fontSize: 13, color: green ? C.green : C.text3, maxWidth: 260, lineHeight: 1.5 }}>{msg}</div>
      {action && onAction && <button onClick={onAction} style={{ ...btn(C.blue), padding: "8px 18px", fontSize: 12, marginTop: 4 }}>{action}</button>}
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
