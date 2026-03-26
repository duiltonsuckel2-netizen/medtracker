import React, { useState, useMemo } from "react";
import { AREAS, INTERVALS, INT_LABELS, areaMap } from "../data.js";
import { C, FM, FN, R, S, SH, card, inp, btn, tag, NUM, perfIcon, perfIconColor } from "../theme.js";
import { perfColor, today, diffDays, fmtDate } from "../utils.js";
import { Fld, Empty } from "./UI.jsx";

const PAGE_SIZE = 25;

function Temas({ reviews, onEditInterval }) {
  const [filterArea, setFilterArea] = useState("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filtered = useMemo(() => {
    let r = reviews;
    if (filterArea !== "all") r = r.filter((x) => x.area === filterArea);
    if (search) r = r.filter((x) => x.theme.toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [reviews, filterArea, search]);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Buscar tema…" style={{ ...inp(), maxWidth: 220, padding: "8px 14px", fontSize: 13 }} />
        <button onClick={() => { setFilterArea("all"); setVisibleCount(PAGE_SIZE); }} style={btn(filterArea === "all" ? C.card2 : C.card, { padding: "6px 12px", fontSize: 11, border: `1px solid ${filterArea === "all" ? C.border2 : C.border}` })}>Todos</button>
        {AREAS.map((a) => <button key={a.id} onClick={() => { setFilterArea(a.id); setVisibleCount(PAGE_SIZE); }} style={btn(filterArea === a.id ? a.color : C.card, { padding: "6px 12px", fontSize: 11, border: `1px solid ${filterArea === a.id ? a.color : C.border}` })}>{a.short}</button>)}
      </div>
      <div style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>{filtered.length} temas · clique no intervalo para editar</div>
      {filtered.length === 0
        ? <Empty icon={"🔍"} msg={search ? `Nenhum tema para "${search}"` : "Nenhum tema encontrado."} />
        : visible.map((r) => {
          const a = areaMap[r.area];
          const aColor = a?.color || "#6B7280";
          const isDue = r.nextDue <= today();
          const days = diffDays(r.nextDue, today());
          const borderColor = isDue ? C.red + "60" : aColor + "40";
          return (
            <div key={r.id} className="fade-in" style={{ ...card, padding: `${S.md}px ${S.lg}px`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderLeft: `3px solid ${borderColor}`, boxShadow: isDue ? SH.glow(C.red) : SH.md }}>
              <span style={{ ...tag(aColor), borderLeft: `3px solid ${aColor}` }}>{a?.short}</span>
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{r.theme}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: perfIconColor(r.lastPerf) }}>{perfIcon(r.lastPerf)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: perfColor(r.lastPerf), ...NUM }}>{r.lastPerf}%</span>
              </span>
              {isDue && <span style={{ fontSize: 10, fontWeight: 600, color: C.red, padding: "2px 8px", background: C.red + "12", borderRadius: R.pill, border: `1px solid ${C.red}25` }}>{days === 0 ? "hoje" : `${Math.abs(days)}d atrás`}</span>}
              <select value={r.intervalIndex} onChange={(e) => onEditInterval(r.id, Number(e.target.value))} style={{ ...inp(), width: "auto", padding: "4px 8px", fontSize: 11 }}>
                {INTERVALS.map((_, i) => <option key={i} value={i}>{INT_LABELS[i]}</option>)}
              </select>
            </div>
          );
        })
      }
      {hasMore && <button onClick={() => setVisibleCount((v) => v + PAGE_SIZE)} style={btn(C.surface, { color: C.text2, border: `1px solid ${C.border}`, width: "100%", textAlign: "center" })}>Carregar mais ({filtered.length - visibleCount} restantes)</button>}
    </div>
  );
}
export { Temas };
