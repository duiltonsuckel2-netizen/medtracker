import React, { useState, useMemo } from "react";
import { AREAS, INTERVALS, INT_LABELS, areaMap } from "../data.js";
import { C, FM, FN, R, S, SH, card, inp, btn, tag, NUM } from "../theme.js";
import { perfColor } from "../utils.js";
import { Fld, Empty } from "./UI.jsx";

function Temas({ reviews, onEditInterval }) {
  const [filterArea, setFilterArea] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    let r = reviews;
    if (filterArea !== "all") r = r.filter((x) => x.area === filterArea);
    if (search) r = r.filter((x) => x.theme.toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [reviews, filterArea, search]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tema…" style={{ ...inp(), maxWidth: 220, padding: "8px 14px", fontSize: 13 }} />
        <button onClick={() => setFilterArea("all")} style={btn(filterArea === "all" ? C.card2 : C.card, { padding: "6px 12px", fontSize: 11, border: `1px solid ${filterArea === "all" ? C.border2 : C.border}` })}>Todos</button>
        {AREAS.map((a) => <button key={a.id} onClick={() => setFilterArea(a.id)} style={btn(filterArea === a.id ? a.color : C.card, { padding: "6px 12px", fontSize: 11, border: `1px solid ${filterArea === a.id ? a.color : C.border}` })}>{a.short}</button>)}
      </div>
      <div style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>{filtered.length} temas · clique no intervalo para editar</div>
      {filtered.length === 0 ? <Empty msg="Nenhum tema encontrado." /> : filtered.map((r) => {
        const a = areaMap[r.area];
        return (
          <div key={r.id} style={{ ...card, padding: `${S.md}px ${S.lg}px`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={tag(a?.color || "#6B7280")}>{a?.short}</span>
            <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{r.theme}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: perfColor(r.lastPerf), ...NUM }}>{r.lastPerf}%</span>
            <select value={r.intervalIndex} onChange={(e) => onEditInterval(r.id, Number(e.target.value))} style={{ ...inp(), width: "auto", padding: "4px 8px", fontSize: 11 }}>
              {INTERVALS.map((_, i) => <option key={i} value={i}>{INT_LABELS[i]}</option>)}
            </select>
          </div>
        );
      })}
    </div>
  );
}
export { Temas };
