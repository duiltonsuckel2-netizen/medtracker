import React, { useState } from "react";
import { AREAS, areaMap } from "../data.js";
import { C, FM, FN, R, S, SH, card, btn, tag, NUM, perfIcon, perfIconColor } from "../theme.js";
import { fmtDate, perc, perfColor } from "../utils.js";
import { Empty } from "./UI.jsx";

const PAGE_SIZE = 20;

function Sessoes({ sessions }) {
  const [filterArea, setFilterArea] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filtered = filterArea === "all" ? sessions : sessions.filter((s) => s.area === filterArea);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button onClick={() => { setFilterArea("all"); setVisibleCount(PAGE_SIZE); }} style={btn(filterArea === "all" ? C.card2 : C.card, { padding: "6px 12px", fontSize: 11, border: `1px solid ${filterArea === "all" ? C.border2 : C.border}` })}>Todas</button>
        {AREAS.map((a) => <button key={a.id} onClick={() => { setFilterArea(a.id); setVisibleCount(PAGE_SIZE); }} style={btn(filterArea === a.id ? a.color : C.card, { padding: "6px 12px", fontSize: 11, border: `1px solid ${filterArea === a.id ? a.color : C.border}` })}>{a.short}</button>)}
      </div>
      {filtered.length === 0
        ? <Empty icon={"📚"} msg="Nenhuma sessão registrada." />
        : visible.map((s) => {
          const a = areaMap[s.area]; const p = perc(s.acertos, s.total);
          const borderColor = p >= 85 ? C.green + "60" : p >= 60 ? C.yellow + "60" : C.red + "60";
          return (
            <div key={s.id} className="fade-in" style={{ ...card, padding: `${S.md}px ${S.lg}px`, display: "flex", alignItems: "center", gap: 12, borderLeft: `3px solid ${borderColor}` }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 48 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: perfColor(p), ...NUM }}>{p}%</span>
                <span style={{ fontSize: 11, color: perfIconColor(p) }}>{perfIcon(p)}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.theme}</div>
                <div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>{fmtDate(s.date)} · {s.total}q · {s.acertos} acertos</div>
              </div>
              <span style={{ ...tag(a?.color || "#6B7280"), borderLeft: `3px solid ${a?.color || "#6B7280"}` }}>{a?.short}</span>
            </div>
          );
        })
      }
      {hasMore && <button onClick={() => setVisibleCount((v) => v + PAGE_SIZE)} style={btn(C.surface, { color: C.text2, border: `1px solid ${C.border}`, width: "100%", textAlign: "center" })}>Carregar mais ({filtered.length - visibleCount} restantes)</button>}
    </div>
  );
}
export { Sessoes };
