import React from "react";
import { C, F, FM, FN, R, S, SH, NUM, btn, TY } from "../theme.js";

function Lbl({ children }) {
  return (
    <span style={{
      ...TY.overline,
      color: C.text3,
      marginBottom: 6,
      display: "block",
    }}>
      {children}
    </span>
  );
}

function Fld({ label, children, style, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <Lbl>{label}</Lbl>
      {children}
      {error && (
        <span style={{ fontSize: 11, color: C.red, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 13 }}>!</span> {error}
        </span>
      )}
    </div>
  );
}

function Empty({ msg, green, icon, action, onAction }) {
  return (
    <div style={{
      color: green ? C.green : C.text3,
      fontSize: 13,
      padding: "40px 20px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
    }}>
      {icon && (
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: green ? C.green + "12" : C.card2,
          border: `1px solid ${green ? C.green + "25" : C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>
          {icon}
        </div>
      )}
      <span style={{ fontStyle: icon ? "normal" : "italic", maxWidth: 280, lineHeight: 1.5 }}>{msg}</span>
      {action && onAction && (
        <button onClick={onAction} style={{
          ...btn(C.blue),
          padding: "10px 20px",
          fontSize: 13,
          marginTop: 4,
        }}>
          {action}
        </button>
      )}
    </div>
  );
}

function ChartTip({ active, payload, label, averages }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: R.sm,
      padding: "10px 14px",
      boxShadow: SH.md,
      minWidth: 140,
    }}>
      <div style={{ ...TY.overline, color: C.text3, marginBottom: 6, fontSize: 10, letterSpacing: 0.3 }}>{label}</div>
      {payload.map((p, i) => {
        const avg = averages?.[p.dataKey];
        const diff = avg != null && p.value != null ? p.value - avg : null;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: F, fontWeight: 600, color: C.text, lineHeight: 1.8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: p.color || C.blue, flexShrink: 0 }} />
            <span style={{ color: C.text3, fontWeight: 400 }}>{p.name}</span>
            <span style={{ marginLeft: "auto", ...NUM }}>{p.value ?? "-"}%</span>
            {diff != null && (
              <span style={{
                fontSize: 10, fontWeight: 600, fontFamily: FN,
                color: diff >= 0 ? C.green : C.red,
                marginLeft: 2,
              }}>
                {diff >= 0 ? "+" : ""}{Math.round(diff)}
              </span>
            )}
          </div>
        );
      })}
      {payload.some((_, i) => averages?.[payload[i]?.dataKey] != null) && (
        <div style={{ fontSize: 10, color: C.text3, marginTop: 4, borderTop: `1px solid ${C.border}`, paddingTop: 4 }}>
          vs. sua m\u00e9dia
        </div>
      )}
    </div>
  );
}

function Skeleton({ width = "100%", height = 16, radius = R.sm, dark = true, style }) {
  return (
    <div
      className={dark ? "skeleton-shimmer" : "skeleton-shimmer-light"}
      style={{
        width, height, borderRadius: radius,
        background: C.card2,
        ...style,
      }}
    />
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: R.xl,
      padding: S.xl,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={10} />
      <Skeleton width="80%" height={10} />
    </div>
  );
}

export { Lbl, Fld, Empty, ChartTip, Skeleton, SkeletonCard };
