import React, { useState, useMemo } from "react";
import { AREAS, INTERVALS, INT_LABELS, areaMap, SEMANAS, SEM_SAT, AREA_SHORT_MAP } from "../data.js";
import { C, F, FM, FN, R, S, SH, card, inp, btn, tag, NUM, TY, perfIcon, perfIconColor } from "../theme.js";
import { perfColor, today, diffDays, fmtDate } from "../utils.js";
import { Fld, Empty } from "./UI.jsx";
import { CONFIDENCE_OPTS } from "./SubtopicModal.jsx";

/* Extract week number from "(Sem. XX)" */
function extractWeek(theme) {
  const m = theme.match(/\(Sem\.\s*(\d+)\)/i);
  return m ? parseInt(m[1], 10) : null;
}

/* Parse "Sem. 08" → 8 */
function parseWeekLabel(label) {
  const m = label.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function Temas({ reviews, subtopics, onEditInterval, onSaveSubtopics }) {
  const [filterArea, setFilterArea] = useState("all");
  const [search, setSearch] = useState("");
  const [collapsedWeeks, setCollapsedWeeks] = useState({});
  const [expandedThemes, setExpandedThemes] = useState({});
  const [stEditMode, setStEditMode] = useState({});
  const [editingSt, setEditingSt] = useState(null);
  const [newStItem, setNewStItem] = useState("");
  const [weekLimit, setWeekLimit] = useState(12);

  // Separate parent reviews from subtopic reviews
  const { parentReviews, subtopicReviews } = useMemo(() => {
    const parents = [], subs = [];
    reviews.forEach((r) => (r.isSubtopic ? subs : parents).push(r));
    return { parentReviews: parents, subtopicReviews: subs };
  }, [reviews]);

  // Index reviews by week number
  const reviewsByWeek = useMemo(() => {
    const map = {};
    parentReviews.forEach((r) => {
      const wk = extractWeek(r.theme);
      if (wk !== null) {
        if (!map[wk]) map[wk] = [];
        map[wk].push(r);
      }
    });
    return map;
  }, [parentReviews]);

  // Build the cronograma: for each SEMANA, find matching reviews per aula
  const cronograma = useMemo(() => {
    return SEMANAS.map((sem) => {
      const wk = parseWeekLabel(sem.semana);
      const weekReviews = reviewsByWeek[wk] || [];
      const satDate = SEM_SAT[sem.semana];
      const isPast = satDate && satDate <= today();

      const aulas = sem.aulas.map((aula) => {
        const aulaAreaId = AREA_SHORT_MAP[aula.area]; // "CM" → "clinica"
        // Find reviews matching this week + area
        const matchingRevs = weekReviews.filter((r) => r.area === aulaAreaId);
        return { ...aula, areaId: aulaAreaId, reviews: matchingRevs };
      });

      const allRevs = aulas.flatMap((a) => a.reviews);
      const overdueCount = allRevs.filter((r) => r.nextDue <= today()).length;
      const studiedCount = allRevs.length;
      const totalAulas = aulas.length;

      return { sem, wk, aulas, satDate, isPast, overdueCount, studiedCount, totalAulas, allRevs };
    });
  }, [reviewsByWeek]);

  // Apply filters
  const filtered = useMemo(() => {
    let items = cronograma;
    if (filterArea !== "all") {
      items = items.filter((w) => w.aulas.some((a) => a.areaId === filterArea));
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((w) =>
        w.aulas.some((a) => a.topic.toLowerCase().includes(q)) ||
        w.allRevs.some((r) => r.theme.toLowerCase().includes(q))
      );
    }
    return items;
  }, [cronograma, filterArea, search]);

  // Stats
  const totalStudied = cronograma.reduce((s, w) => s + w.studiedCount, 0);
  const totalOverdue = cronograma.reduce((s, w) => s + w.overdueCount, 0);
  const totalAulas = cronograma.reduce((s, w) => s + w.totalAulas, 0);
  const stCount = subtopicReviews.length;

  function toggleWeek(wk) { setCollapsedWeeks((p) => ({ ...p, [wk]: !p[wk] })); }
  function toggleExpand(id) { setExpandedThemes((p) => ({ ...p, [id]: !p[id] })); }
  function toggleStEdit(id) { setStEditMode((p) => ({ ...p, [id]: !p[id] })); }

  function getSubtopicsForTheme(r) {
    if (!subtopics) return { key: null, items: [] };
    const directKey = `${r.area}__${r.theme}`;
    if (subtopics[directKey]?.length > 0) return { key: directKey, items: subtopics[directKey] };
    const normalize = (s) => s.toLowerCase().replace(/\s*\(sem\.\s*\d+\)\s*/gi, " ").replace(/\b(i{1,3}|iv|v)\b/g, " ").replace(/[—–\-]/g, " ").replace(/\s+/g, " ").trim();
    const stopWords = new Set(["sem", "das", "dos", "del", "und", "the", "and", "para", "com", "por"]);
    const keywords = (s) => normalize(s).split(/\s+/).filter((w) => w.length >= 3 && !stopWords.has(w));
    const rTheme = normalize(r.theme), rWords = keywords(r.theme);
    let bestMatch = null, bestKey = null, bestScore = 0;
    for (const [key, items] of Object.entries(subtopics)) {
      if (!items?.length) continue;
      const [kArea] = key.split("__");
      if (kArea !== r.area) continue;
      const kTopic = key.slice(kArea.length + 2), kNorm = normalize(kTopic);
      if (rTheme === kNorm || rTheme.includes(kNorm) || kNorm.includes(rTheme)) return { key, items };
      const kWords = keywords(kTopic);
      if (!kWords.length) continue;
      const shared = kWords.filter((w) => rWords.some((rw) => rw.includes(w) || w.includes(rw)));
      const score = shared.length / Math.max(kWords.length, 1);
      if (score > bestScore) { bestScore = score; bestMatch = items; bestKey = key; }
    }
    return bestScore >= 0.5 ? { key: bestKey, items: bestMatch } : { key: null, items: [] };
  }

  function getSubReviewsForTheme(r) {
    return subtopicReviews.filter((s) => s.area === r.area && s.parentTheme === r.theme);
  }

  function addStItem(stKey, area) {
    if (!newStItem.trim() || !stKey) return;
    const existing = subtopics[stKey] || [];
    if (existing.includes(newStItem.trim())) return;
    onSaveSubtopics(area, stKey.split("__").slice(1).join("__"), [...existing, newStItem.trim()]);
    setNewStItem("");
  }

  function removeStItem(stKey, area, idx) {
    const existing = subtopics[stKey] || [];
    onSaveSubtopics(area, stKey.split("__").slice(1).join("__"), existing.filter((_, i) => i !== idx));
  }

  const visibleWeeks = filtered.slice(0, weekLimit);
  const hasMoreWeeks = filtered.length > weekLimit;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Search & Filters ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tema…"
          style={{ ...inp(), padding: "10px 14px", fontSize: 14 }} />
        <div style={{ display: "flex", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", paddingBottom: 2 }}>
          <button onClick={() => setFilterArea("all")} style={btn(filterArea === "all" ? C.card2 : C.card, { padding: "6px 14px", fontSize: 11, border: `1px solid ${filterArea === "all" ? C.border2 : C.border}`, whiteSpace: "nowrap", flexShrink: 0 })}>Todos</button>
          {AREAS.map((a) => (
            <button key={a.id} onClick={() => setFilterArea(a.id)} style={btn(filterArea === a.id ? a.color : C.card, { padding: "6px 14px", fontSize: 11, border: `1px solid ${filterArea === a.id ? a.color : C.border}`, whiteSpace: "nowrap", flexShrink: 0 })}>{a.short}</button>
          ))}
        </div>
      </div>

      {/* ── Summary ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.card, borderRadius: R.lg, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
        <span style={{ ...TY.caption, color: C.text2 }}>{totalStudied}/{totalAulas} aulas estudadas</span>
        <div style={{ flex: "1 1 60px", display: "flex", height: 6, borderRadius: R.pill, overflow: "hidden", background: C.border, minWidth: 60 }}>
          <div style={{ width: `${(totalStudied / totalAulas) * 100}%`, background: C.green, transition: "width 0.3s" }} />
        </div>
        {totalOverdue > 0
          ? <span style={{ ...TY.caption, color: C.red, fontWeight: 600 }}>{totalOverdue} vencida{totalOverdue > 1 ? "s" : ""}</span>
          : <span style={{ ...TY.caption, color: C.green, fontWeight: 600 }}>Em dia</span>}
        {stCount > 0 && <span style={{ ...TY.caption, color: C.text3 }}>{stCount} sub</span>}
      </div>

      {/* ── Weeks ── */}
      {filtered.length === 0
        ? <Empty icon="🔍" msg={search ? `Nenhum tema para "${search}"` : "Nenhum tema encontrado."} />
        : visibleWeeks.map((week) => {
          const isCollapsed = collapsedWeeks[week.wk];
          const hasOverdue = week.overdueCount > 0;
          const dateLabel = week.satDate ? fmtDate(week.satDate) : "";

          return (
            <div key={week.wk} className="fade-in">
              {/* ── Week Header ── */}
              <div
                onClick={() => toggleWeek(week.wk)}
                role="button" tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleWeek(week.wk)}
                style={{
                  cursor: "pointer", userSelect: "none",
                  background: C.card,
                  borderRadius: isCollapsed ? R.xl : `${R.xl}px ${R.xl}px 0 0`,
                  border: `1px solid ${hasOverdue ? C.red + "40" : C.border}`,
                  borderBottom: isCollapsed ? undefined : "none",
                  padding: "12px 16px",
                  display: "flex", flexDirection: "column", gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {hasOverdue && <div style={{ width: 8, height: 8, borderRadius: 4, background: C.red, flexShrink: 0 }} />}
                  <span style={{ ...TY.h3, color: C.text, flex: 1 }}>Semana {week.wk}</span>
                  {dateLabel && <span style={{ ...TY.caption, color: C.text3, fontFamily: FM }}>{dateLabel}</span>}
                  {week.isPast
                    ? <span style={{ ...TY.caption, color: week.studiedCount > 0 ? C.green : C.text3, fontFamily: FM, fontWeight: 600 }}>{week.studiedCount}/{week.totalAulas}</span>
                    : <span style={{ ...tag(C.text3), fontSize: 9 }}>futura</span>}
                  <span style={{ fontSize: 12, color: C.text3 }}>{isCollapsed ? "▶" : "▼"}</span>
                </div>

                {/* Mini progress */}
                <div style={{ height: 3, borderRadius: R.pill, background: C.border, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(week.studiedCount / week.totalAulas) * 100}%`, background: hasOverdue ? C.red : week.studiedCount > 0 ? C.green : C.border, borderRadius: R.pill, transition: "width 0.3s" }} />
                </div>
              </div>

              {/* ── Aulas ── */}
              {!isCollapsed && (
                <div style={{
                  border: `1px solid ${hasOverdue ? C.red + "40" : C.border}`,
                  borderTop: "none",
                  borderRadius: `0 0 ${R.xl}px ${R.xl}px`,
                  overflow: "hidden",
                }}>
                  {week.aulas.map((aula, ai) => {
                    const areaId = aula.areaId;
                    const aObj = areaMap[areaId];
                    const aColor = aObj?.color || "#6B7280";
                    const hasRevs = aula.reviews.length > 0;

                    // Filter by area if active
                    if (filterArea !== "all" && areaId !== filterArea) return null;

                    return (
                      <div key={ai}>
                        {/* Aula row */}
                        <div style={{
                          padding: "12px 16px",
                          background: C.card,
                          borderTop: ai > 0 ? `1px solid ${C.border}` : "none",
                          borderLeft: `3px solid ${aColor}`,
                          display: "flex", flexDirection: "column", gap: 8,
                        }}>
                          {/* Topic name + area */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ ...tag(aColor) }}>{aula.area}</span>
                            <span style={{ ...TY.body, fontWeight: 600, flex: 1, minWidth: 0, lineHeight: 1.3 }}>{aula.topic}</span>
                          </div>

                          {/* Reviews for this aula */}
                          {hasRevs ? aula.reviews.map((r) => {
                            const isDue = r.nextDue <= today();
                            const days = diffDays(r.nextDue, today());
                            const { key: stKey, items: stItems } = getSubtopicsForTheme(r);
                            const subRevs = getSubReviewsForTheme(r);
                            const isExpanded = expandedThemes[r.id];
                            const hasSubtopics = stItems.length > 0 || subRevs.length > 0;
                            const isEditing = stEditMode[r.id];

                            return (
                              <div key={r.id}>
                                <div style={{
                                  display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                                  padding: "8px 10px", background: C.surface, borderRadius: R.md,
                                  border: `1px solid ${isDue ? C.red + "30" : C.border}`,
                                }}>
                                  {/* Perf pill */}
                                  <div style={{
                                    display: "flex", alignItems: "center", gap: 4,
                                    background: perfColor(r.lastPerf) + "15",
                                    padding: "3px 10px", borderRadius: R.pill,
                                  }}>
                                    <span style={{ fontSize: 11, color: perfIconColor(r.lastPerf) }}>{perfIcon(r.lastPerf)}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: perfColor(r.lastPerf), ...NUM }}>{r.lastPerf}%</span>
                                  </div>

                                  {/* Due label */}
                                  {isDue ? (
                                    <span style={{ ...TY.caption, color: C.red, fontWeight: 600, background: C.red + "14", padding: "2px 8px", borderRadius: R.pill }}>
                                      {days === 0 ? "Revisar hoje" : `Atrasada ${Math.abs(days)}d`}
                                    </span>
                                  ) : (
                                    <span style={{ ...TY.caption, color: C.text3 }}>em {days}d</span>
                                  )}

                                  <div style={{ flex: 1 }} />

                                  {/* Interval */}
                                  <select value={r.intervalIndex} onChange={(e) => onEditInterval(r.id, Number(e.target.value))} onClick={(e) => e.stopPropagation()}
                                    style={{ ...inp(), width: 65, padding: "2px 4px", fontSize: 11, background: C.card }}>
                                    {INTERVALS.map((_, i) => <option key={i} value={i}>{INT_LABELS[i]}</option>)}
                                  </select>

                                  {/* Subtopics toggle */}
                                  {hasSubtopics && (
                                    <button onClick={() => toggleExpand(r.id)} style={{
                                      background: C.purple + "14", border: `1px solid ${C.purple}30`,
                                      borderRadius: R.pill, padding: "3px 10px", cursor: "pointer",
                                      fontSize: 10, color: C.purple, fontFamily: FM, fontWeight: 600,
                                      display: "flex", alignItems: "center", gap: 3,
                                    }}>
                                      {stItems.length} sub {isExpanded ? "▲" : "▼"}
                                    </button>
                                  )}
                                </div>

                                {/* Subtopics panel */}
                                {isExpanded && hasSubtopics && (
                                  <div style={{
                                    background: C.surface, marginTop: 4, borderRadius: R.md,
                                    borderLeft: `3px solid ${C.purple}50`,
                                    padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4,
                                  }}>
                                    {stItems.map((st, i) => {
                                      const subRev = subRevs.find((sr) => sr.theme.toLowerCase() === st.toLowerCase());
                                      const conf = subRev?.history?.slice(-1)[0]?.confidence;
                                      const confObj = conf ? CONFIDENCE_OPTS.find((c) => c.id === conf) : null;
                                      return (
                                        <div key={i} style={{
                                          display: "flex", alignItems: "center", gap: 6,
                                          padding: "5px 8px", borderRadius: R.sm,
                                          background: i % 2 === 0 ? C.card : "transparent",
                                        }}>
                                          {confObj
                                            ? <span style={{ fontSize: 12 }} title={confObj.label}>{confObj.icon}</span>
                                            : <span style={{ fontSize: 11, color: C.purple }}>›</span>}
                                          <span style={{ ...TY.caption, flex: 1, minWidth: 0 }}>{st}</span>
                                          {subRev ? (
                                            <span style={{ fontSize: 11, fontWeight: 700, color: perfColor(subRev.lastPerf), fontFamily: FN, whiteSpace: "nowrap" }}>
                                              {subRev.lastPerf}% <span style={{ color: C.text3, fontWeight: 500 }}>{INT_LABELS[subRev.intervalIndex]}</span>
                                              {subRev.nextDue <= today() && <span style={{ color: C.red }}> ●</span>}
                                            </span>
                                          ) : (
                                            <span style={{ fontSize: 10, color: C.text3, fontStyle: "italic" }}>Pendente</span>
                                          )}
                                          {isEditing && (
                                            <button onClick={() => stKey && removeStItem(stKey, r.area, i)}
                                              style={{ background: C.red + "14", border: `1px solid ${C.red}30`, borderRadius: R.sm, cursor: "pointer", color: C.red, fontSize: 10, padding: "2px 5px" }}>✕</button>
                                          )}
                                        </div>
                                      );
                                    })}
                                    <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                                      <button onClick={() => toggleStEdit(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.purple, fontSize: 11, fontWeight: 600, padding: 0 }}>
                                        {isEditing ? "Fechar" : "Editar"}
                                      </button>
                                    </div>
                                    {isEditing && stKey && (
                                      <div style={{ display: "flex", gap: 6 }}>
                                        <input value={editingSt === r.id ? newStItem : ""} onFocus={() => setEditingSt(r.id)}
                                          onChange={(e) => { setEditingSt(r.id); setNewStItem(e.target.value); }}
                                          onKeyDown={(e) => { if (e.key === "Enter") addStItem(stKey, r.area); }}
                                          placeholder="Adicionar subtema…" style={{ ...inp(), flex: 1, padding: "5px 8px", fontSize: 11 }} />
                                        <button onClick={() => addStItem(stKey, r.area)}
                                          style={btn(C.purple, { padding: "5px 10px", fontSize: 11, opacity: (editingSt === r.id && newStItem.trim()) ? 1 : 0.4 })}>+</button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }) : (
                            <span style={{ ...TY.caption, color: C.text3, fontStyle: "italic", paddingLeft: 4 }}>
                              {week.isPast ? "Sem registro de revisão" : "Ainda não estudado"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

      {hasMoreWeeks && (
        <button onClick={() => setWeekLimit((v) => v + 12)}
          style={btn(C.surface, { color: C.text2, border: `1px solid ${C.border}`, width: "100%", textAlign: "center", padding: "12px 18px" })}>
          Mais semanas ({filtered.length - weekLimit} restantes)
        </button>
      )}
    </div>
  );
}
export { Temas };
