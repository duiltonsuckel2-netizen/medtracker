import React from "react";
import { C, F, FM, R, S, SH, NUM } from "../theme.js";

function Lbl({ children }) {
  return (
    <span style={{
      fontSize: 10,
      color: C.text3,
      fontFamily: F,
      fontWeight: 600,
      marginBottom: 6,
      display: "block",
      textTransform: "uppercase",
      letterSpacing: 1,
    }}>
      {children}
    </span>
  );
}

function Fld({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <Lbl>{label}</Lbl>
      {children}
    </div>
  );
}

function Empty({ msg, green }) {
  return (
    <div style={{
      color: green ? C.green : C.text3,
      fontSize: 13,
      padding: "24px 0",
      textAlign: "center",
      fontStyle: green ? "normal" : "italic",
    }}>
      {msg}
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: R.sm,
      padding: "8px 12px",
      boxShadow: SH.md,
    }}>
      <div style={{ fontSize: 10, color: C.text3, marginBottom: 4, fontFamily: F, fontWeight: 600, letterSpacing: 0.3 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: F, fontWeight: 600, color: C.text, lineHeight: 1.6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: p.color || C.blue, flexShrink: 0 }} />
          <span style={{ color: C.text3, fontWeight: 400 }}>{p.name}</span>
          <span style={{ marginLeft: "auto", ...NUM }}>{p.value ?? "-"}%</span>
        </div>
      ))}
    </div>
  );
}

export { Lbl, Fld, Empty, ChartTip };
