import React, { useState } from "react";
import { AREAS, areaMap } from "../data.js";
import { C, FM, FN, R, S, SH, card, btn, tag, NUM } from "../theme.js";
import { fmtDate, perc, perfColor } from "../utils.js";
import { Empty } from "./UI.jsx";

function Sessoes({ sessions }) {
  const [filterArea, setFilterArea] = useState("all");
  const filtered = filterArea === "all" ? sessions : sessions.filter((s) => s.area === filterArea);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button onClick={() => setFilterArea("all")} style={btn(filterArea === "all" ? C.card2 : C.card, { padding: "6px 12px", fontSize: 11, border: `1px solid ${filterArea === "all" ? C.border2 : C.border}` })}>Todas</button>
        {AREAS.map((a) => <button key={a.id} onClick={() => setFilterArea(a.id)} style={btn(filterArea === a.id ? a.color : C.card, { padding: "6px 12px", fontSize: 11, border: `1px solid ${filterArea === a.id ? a.color : C.border}` })}>{a.short}</button>)}
      </div>
      {filtered.length === 0 ? <Empty msg="Nenhuma sessão registrada." /> : filtered.slice(0, 50).map((s) => {
        const a = areaMap[s.area]; const p = perc(s.acertos, s.total);
        return (
          <div key={s.id} style={{ ...card, padding: `${S.md}px ${S.lg}px`, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: perfColor(p), ...NUM, minWidth: 48 }}>{p}%</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.theme}</div>
              <div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>{fmtDate(s.date)} · {s.total}q · {s.acertos} acertos</div>
            </div>
            <span style={tag(a?.color || "#6B7280")}>{a?.short}</span>
          </div>
        );
      })}
    </div>
  );
}
export { Sessoes };
