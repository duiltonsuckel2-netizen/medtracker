import React, { useState, useMemo } from "react";
import { AREAS, INTERVALS, INT_LABELS, areaMap } from "../data.js";
import { C, F, FM, FN, R, S, SH, card, inp, btn, tag, NUM, perfIcon, perfIconColor } from "../theme.js";
import { perfColor, today, diffDays, fmtDate } from "../utils.js";
import { Fld, Empty } from "./UI.jsx";
import { CONFIDENCE_OPTS } from "./SubtopicModal.jsx";

const PAGE_SIZE = 25;

function Temas({ reviews, subtopics, onEditInterval, onSaveSubtopics }) {
  const [filterArea, setFilterArea] = useState("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedThemes, setExpandedThemes] = useState({});
  const [editingSt, setEditingSt] = useState(null);
  const [newStItem, setNewStItem] = useState("");

  // Separate parent themes from subtopics
  const { parentReviews, subtopicReviews } = useMemo(() => {
    const parents = [];
    const subs = [];
    reviews.forEach((r) => {
      if (r.isSubtopic) subs.push(r);
      else parents.push(r);
    });
    return { parentReviews: parents, subtopicReviews: subs };
  }, [reviews]);

  const filtered = useMemo(() => {
    let r = parentReviews;
    if (filterArea !== "all") r = r.filter((x) => x.area === filterArea);
    if (search) r = r.filter((x) => (x.theme && x.theme.toLowerCase().includes(search.toLowerCase())) ||
      subtopicReviews.some((s) => s.area === x.area && s.parentTheme === x.theme && s.theme && s.theme.toLowerCase().includes(search.toLowerCase())));
    return r;
  }, [parentReviews, subtopicReviews, filterArea, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  function toggleExpand(id) {
    setExpandedThemes((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function getSubtopicsForTheme(r) {
    if (!subtopics) return { key: null, items: [] };
    const normalize = (s) => (s || "").toLowerCase().replace(/\s*\(sem\.\s*\d+\)\s*/gi, " ").replace(/\b(i{1,3}|iv|v)\b/g, " ").replace(/[—–\-]/g, " ").replace(/\s+/g, " ").trim();
    const stopWords = new Set(["sem", "das", "dos", "del", "und", "the", "and", "para", "com", "por"]);
    const keywords = (s) => normalize(s).split(/\s+/).filter((w) => w.length >= 3 && !stopWords.has(w));
    const rTheme = normalize(r.theme);
    const rWords = keywords(r.theme);
    let bestMatch = null;
    let bestKey = null;
    let bestScore = 0;
    for (const [key, items] of Object.entries(subtopics)) {
      if (!items || items.length === 0) continue;
      const [kArea] = key.split("__");
      if (kArea !== r.area) continue;
      const kTopic = key.slice(kArea.length + 2);
      const kNorm = normalize(kTopic);
      if (rTheme === kNorm || rTheme.includes(kNorm) || kNorm.includes(rTheme)) return { key, items };
      const kWords = keywords(kTopic);
      if (kWords.length === 0) continue;
      const shared = kWords.filter((w) => rWords.some((rw) => rw.includes(w) || w.includes(rw)));
      const score = shared.length / Math.max(kWords.length, 1);
      if (score > bestScore) { bestScore = score; bestMatch = items; bestKey = key; }
    }
    return bestScore >= 0.5 ? { key: bestKey, items: bestMatch } : { key: null, items: [] };
  }

  function getSubReviewsForTheme(r) {
    return subtopicReviews.filter((s) => s.area === r.area && s.parentTheme === r.theme);
  }

  function addStItem(stKey, area, topic) {
    if (!newStItem.trim() || !stKey) return;
    const existing = subtopics[stKey] || [];
    if (existing.includes(newStItem.trim())) return;
    onSaveSubtopics(area, stKey.split("__").slice(1).join("__"), [...existing, newStItem.trim()]);
    setNewStItem("");
  }

  function removeStItem(stKey, area, idx) {
    const existing = subtopics[stKey] || [];
    const topic = stKey.split("__").slice(1).join("__");
    onSaveSubtopics(area, topic, existing.filter((_, i) => i !== idx));
  }

  const totalCount = parentReviews.length + subtopicReviews.length;
  const stCount = subtopicReviews.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Buscar tema…" style={{ ...inp(), maxWidth: 220, padding: "8px 14px", fontSize: 13 }} />
        <button onClick={() => { setFilterArea("all"); setVisibleCount(PAGE_SIZE); }} style={btn(filterArea === "all" ? C.card2 : C.card, { padding: "6px 12px", fontSize: 11, border: `1px solid ${filterArea === "all" ? C.border2 : C.border}` })}>Todos</button>
        {AREAS.map((a) => <button key={a.id} onClick={() => { setFilterArea(a.id); setVisibleCount(PAGE_SIZE); }} style={btn(filterArea === a.id ? a.color : C.card, { padding: "6px 12px", fontSize: 11, border: `1px solid ${filterArea === a.id ? a.color : C.border}` })}>{a.short}</button>)}
      </div>
      <div style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>
        {filtered.length} temas{stCount > 0 ? ` · ${stCount} subtemas rastreados` : ""} · clique no intervalo para editar
      </div>
      {filtered.length === 0
        ? <Empty icon={"🔍"} msg={search ? `Nenhum tema para "${search}"` : "Nenhum tema encontrado."} />
        : visible.map((r) => {
          const a = areaMap[r.area];
          const aColor = a?.color || "#6B7280";
          const isDue = r.nextDue <= today();
          const days = diffDays(r.nextDue, today());
          const borderColor = isDue ? C.red + "60" : aColor + "40";
          const { key: stKey, items: stItems } = getSubtopicsForTheme(r);
          const subRevs = getSubReviewsForTheme(r);
          const isExpanded = expandedThemes[r.id];
          const hasSubtopics = stItems.length > 0 || subRevs.length > 0;

          return (
            <div key={r.id} className="fade-in" style={{ borderRadius: R.xl, overflow: "hidden", boxShadow: isDue ? SH.glow(C.red) : SH.md }}>
              <div style={{ ...card, padding: `${S.md}px ${S.lg}px`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderLeft: `3px solid ${borderColor}`, borderRadius: hasSubtopics && isExpanded ? `${R.xl} ${R.xl} 0 0` : R.xl, marginBottom: 0 }}>
                <span style={{ ...tag(aColor), borderLeft: `3px solid ${aColor}` }}>{a?.short}</span>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{r.theme}</span>
                {hasSubtopics && (
                  <button onClick={() => toggleExpand(r.id)} style={{ background: C.purple + "14", border: `1px solid ${C.purple}25`, borderRadius: R.pill, padding: "2px 8px", cursor: "pointer", fontSize: 10, color: C.purple, fontFamily: FM, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                    {stItems.length} sub {isExpanded ? "▲" : "▼"}
                  </button>
                )}
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: perfIconColor(r.lastPerf) }}>{perfIcon(r.lastPerf)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: perfColor(r.lastPerf), ...NUM }}>{r.lastPerf}%</span>
                </span>
                {isDue && <span style={{ fontSize: 10, fontWeight: 600, color: C.red, padding: "2px 8px", background: C.red + "12", borderRadius: R.pill, border: `1px solid ${C.red}25` }}>{days === 0 ? "hoje" : `${Math.abs(days)}d atrás`}</span>}
                <select value={r.intervalIndex} onChange={(e) => onEditInterval(r.id, Number(e.target.value))} style={{ ...inp(), width: "auto", padding: "4px 8px", fontSize: 11 }}>
                  {INTERVALS.map((_, i) => <option key={i} value={i}>{INT_LABELS[i]}</option>)}
                </select>
              </div>
              {/* Subtopics expansion */}
              {isExpanded && hasSubtopics && (
                <div style={{ background: C.surface, borderLeft: `3px solid ${C.purple}40`, borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: `${S.md}px ${S.lg}px`, display: "flex", flexDirection: "column", gap: 6 }}>
                  {stItems.map((st, i) => {
                    const subRev = subRevs.find((sr) => sr.theme.toLowerCase() === st.toLowerCase());
                    const conf = subRev?.history?.slice(-1)[0]?.confidence;
                    const confObj = conf ? CONFIDENCE_OPTS.find((c) => c.id === conf) : null;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: C.card, borderRadius: R.md, border: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 12, color: C.purple, fontWeight: 500 }}>›</span>
                        <span style={{ fontSize: 12, flex: 1 }}>{st}</span>
                        {confObj && <span style={{ fontSize: 12 }} title={confObj.label}>{confObj.icon}</span>}
                        {subRev ? (
                          <>
                            <span style={{ fontSize: 12, fontWeight: 700, color: perfColor(subRev.lastPerf), fontFamily: FN }}>{subRev.lastPerf}%</span>
                            <span style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>{INT_LABELS[subRev.intervalIndex]}</span>
                            {subRev.nextDue <= today() && <span style={{ fontSize: 9, color: C.red, fontWeight: 600, padding: "1px 6px", background: C.red + "12", borderRadius: R.pill }}>vencida</span>}
                          </>
                        ) : (
                          <span style={{ fontSize: 10, color: C.text3, fontStyle: "italic" }}>sem dados</span>
                        )}
                        {editingSt === `${r.id}_${i}` ? null : (
                          <button onClick={() => { if (stKey) removeStItem(stKey, r.area, i); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 12, padding: "2px 4px", opacity: 0.4 }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "0.4"}>✕</button>
                        )}
                      </div>
                    );
                  })}
                  {/* Add new subtopic inline */}
                  {stKey && (
                    <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                      <input value={editingSt === r.id ? newStItem : ""} onFocus={() => setEditingSt(r.id)} onChange={(e) => { setEditingSt(r.id); setNewStItem(e.target.value); }} onKeyDown={(e) => { if (e.key === "Enter") { addStItem(stKey, r.area, stKey.split("__").slice(1).join("__")); } }} placeholder="Adicionar subtema…" style={{ ...inp(), flex: 1, padding: "6px 10px", fontSize: 11 }} />
                      <button onClick={() => addStItem(stKey, r.area, stKey.split("__").slice(1).join("__"))} style={btn(C.purple, { padding: "6px 12px", fontSize: 11, opacity: (editingSt === r.id && newStItem.trim()) ? 1 : 0.4 })}>+</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      }
      {hasMore && <button onClick={() => setVisibleCount((v) => v + PAGE_SIZE)} style={btn(C.surface, { color: C.text2, border: `1px solid ${C.border}`, width: "100%", textAlign: "center" })}>Carregar mais ({filtered.length - visibleCount} restantes)</button>}
    </div>
  );
}
export { Temas };
