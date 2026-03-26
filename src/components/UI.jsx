import React from "react";
import { C, FM, FN, R, S, SH, card } from "../theme.js";

function Lbl({ children }) { return <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: S.xs, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: FM }}>{children}</div>; }
function Fld({ label, children }) { return <div><Lbl>{label}</Lbl>{children}</div>; }
function Empty({ msg, green }) { return <div style={{ ...card, background: C.surface, border: `1px solid ${green ? C.green + "33" : C.border}`, textAlign: "center", padding: `${S.xl}px` }}><div style={{ fontSize: 13, color: green ? C.green : C.text3 }}>{msg}</div></div>; }
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R.md, padding: "10px 14px", boxShadow: SH.lg }}>
      {label && <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ fontSize: 12, color: C.text2 }}>{p.name}:</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FN }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
}
export { Lbl, Fld, Empty, ChartTip };
