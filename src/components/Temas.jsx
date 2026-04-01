import React, { useState, useMemo } from "react";
import { AREAS, INTERVALS, INT_LABELS, areaMap, SEMANAS, SEM_SAT, AREA_SHORT_MAP } from "../data.js";
import { C, DARK, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM, TY, perfIcon, perfIconColor } from "../theme.js";
import { perfColor, today, diffDays, fmtDate, addDays, nxtIdx } from "../utils.js";
import { Fld, Empty } from "./UI.jsx";
import { CONFIDENCE_OPTS } from "./SubtopicModal.jsx";

/* Extract week number from "(Sem. XX)" */
function extractWeek(theme) {
  if (!theme) return null;
  const m = theme.match(/\(Sem\.\s*(\d+)\)/i);
  return m ? parseInt(m[1], 10) : null;
}

/* Parse "Sem. 08" → 8 */
function parseWeekLabel(label) {
  const m = label.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function Temas({ reviews, revLogs, subtopics, onEditInterval, onSaveSubtopics }) {
  const [filterArea, setFilterArea] = useState("all");
  const [search, setSearch] = useState("");
  const [collapsedWeeks, setCollapsedWeeks] = useState({});
  const [expandedThemes, setExpandedThemes] = useState({});
  const [stEditMode, setStEditMode] = useState({});
  const [editingSt, setEditingSt] = useState(null);
  const [newStItem, setNewStItem] = useState("");
  const [weekLimit, setWeekLimit] = useState(12);
  const [stSugFocused, setStSugFocused] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { stKey, area, theme, name }
  const [viewMode, setViewMode] = useState(() => { try { return localStorage.getItem("rp26_temas_view") || "list"; } catch { return "list"; } });

  // Separate parent reviews from subtopic reviews
  const { parentReviews, subtopicReviews } = useMemo(() => {
    const parents = [], subs = [];
    reviews.forEach((r) => (r.isSubtopic ? subs : parents).push(r));
    return { parentReviews: parents, subtopicReviews: subs };
  }, [reviews]);

  // Collect all known subtopic names for autocomplete
  const allSubNames = useMemo(() => {
    const names = new Set();
    if (subtopics) Object.values(subtopics).forEach(items => items.forEach(n => names.add(n)));
    subtopicReviews.forEach(s => { if (s.theme) names.add(s.theme); });
    (revLogs || []).forEach(l => { if (l.subtopicScores) l.subtopicScores.forEach(s => names.add(s.name)); });
    return [...names].sort();
  }, [subtopics, subtopicReviews, revLogs]);

  // Index revLogs by area+theme for stats
  const logsByTheme = useMemo(() => {
    const map = {};
    (revLogs || []).forEach((l) => {
      if (l.isSubtopic) return;
      const k = `${l.area}__${(l.theme || "").toLowerCase().trim()}`;
      if (!map[k]) map[k] = [];
      map[k].push(l);
    });
    return map;
  }, [revLogs]);

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
      const overdueCount = aulas.filter((a) => a.reviews.some((r) => r.nextDue <= today())).length;
      const studiedCount = aulas.filter((a) => a.reviews.length > 0).length;
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
        w.allRevs.some((r) => r.theme && r.theme.toLowerCase().includes(q))
      );
    }
    return items;
  }, [cronograma, filterArea, search]);

  // Stats — count weeks with at least 1 studied aula
  const weeksStudied = cronograma.filter((w) => w.studiedCount > 0).length;
  const totalWeeks = cronograma.length;
  const totalOverdue = cronograma.reduce((s, w) => s + w.overdueCount, 0);
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

  function removeStItem(stKey, area, theme, name) {
    setConfirmDelete({ stKey, area, theme, name });
  }
  function confirmRemoveSt() {
    if (!confirmDelete) return;
    const { stKey, area, theme, name } = confirmDelete;
    const key = stKey || `${area}__${theme}`;
    const topic = key.split("__").slice(1).join("__");
    const existing = subtopics[key] || [];
    onSaveSubtopics(area, topic, existing.filter((s) => s.toLowerCase() !== name.toLowerCase()));
    setConfirmDelete(null);
  }

  // Gallery: flatten all aulas into individual items
  const galleryItems = useMemo(() => {
    const items = [];
    filtered.forEach((week) => {
      week.aulas.forEach((aula) => {
        if (filterArea !== "all" && aula.areaId !== filterArea) return;
        const aObj = areaMap[aula.areaId];
        const rev = aula.reviews[0]; // primary review
        const k = rev ? `${rev.area}__${(rev.theme || "").toLowerCase().trim()}` : null;
        const logs = k ? (logsByTheme[k] || []) : [];
        const avg = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.pct || 0), 0) / logs.length) : null;
        const isDue = rev ? rev.nextDue <= today() : false;
        const days = rev ? diffDays(rev.nextDue, today()) : null;
        const { items: stItems } = rev ? getSubtopicsForTheme(rev) : { items: [] };
        const subRevs = rev ? getSubReviewsForTheme(rev) : [];
        const stCount = Math.max(stItems.length, subRevs.length);
        items.push({ week: week.wk, aula, aObj, rev, avg, isDue, days, logs, stCount, isPast: week.isPast });
      });
    });
    return items;
  }, [filtered, filterArea, logsByTheme]);

  const visibleWeeks = filtered.slice(0, weekLimit);
  const hasMoreWeeks = filtered.length > weekLimit;
  const [galleryLimit, setGalleryLimit] = useState(24);
  const visibleGallery = galleryItems.slice(0, galleryLimit);
  const hasMoreGallery = galleryItems.length > galleryLimit;

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

      {/* ── View Toggle ── */}
      <div style={{ display: "flex", gap: 4, background: C.surface, borderRadius: R.pill, padding: 3 }}>
        {[{ id: "list", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>, label: "Lista" }, { id: "gallery", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, label: "Galeria" }].map((v) => {
          const active = viewMode === v.id;
          return (
            <button key={v.id} onClick={() => { setViewMode(v.id); try { localStorage.setItem("rp26_temas_view", v.id); } catch {} }}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 14px", borderRadius: R.pill, border: active ? `1px solid ${C.purple}35` : "1px solid transparent", background: active ? C.purple + "18" : "transparent", color: active ? C.purple : C.text3, fontSize: 12, fontWeight: active ? 700 : 500, fontFamily: F, cursor: "pointer", transition: "all 0.15s ease", minHeight: H.sm }}>
              {v.icon}{v.label}
            </button>
          );
        })}
      </div>

      {/* ── Summary ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.card, borderRadius: R.lg, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
        <span style={{ ...TY.caption, color: C.text2 }}>{weeksStudied}/{totalWeeks} semanas</span>
        <div style={{ flex: "1 1 60px", display: "flex", height: 6, borderRadius: R.pill, overflow: "hidden", background: C.border, minWidth: 60 }}>
          <div style={{ width: `${totalWeeks > 0 ? (weeksStudied / totalWeeks) * 100 : 0}%`, background: C.green, transition: "width 0.3s" }} />
        </div>
        {totalOverdue > 0
          ? <span style={{ ...TY.caption, color: C.red, fontWeight: 600 }}>{totalOverdue} vencida{totalOverdue > 1 ? "s" : ""}</span>
          : <span style={{ ...TY.caption, color: C.green, fontWeight: 600 }}>Em dia</span>}
        {stCount > 0 && <span style={{ ...TY.caption, color: C.text3 }}>{stCount} sub</span>}
      </div>

      {/* ── Gallery View ── */}
      {viewMode === "gallery" && (
        galleryItems.length === 0
          ? <Empty icon="🔍" msg={search ? `Nenhum tema para "${search}"` : "Nenhum tema encontrado."} />
          : <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {visibleGallery.map((item, idx) => {
                const { week, aula, aObj, rev, avg, isDue, days, stCount, isPast } = item;
                const aColor = aObj?.color || C.text3;
                return (
                  <div key={idx} className="card-interactive" style={{
                    background: C.card, borderRadius: R.xl, padding: "16px 14px",
                    border: isDue ? `1px solid ${C.red}30` : (C === DARK ? `1px solid ${C.border}` : "none"),
                    boxShadow: SH.sm,
                    display: "flex", flexDirection: "column", gap: 8,
                    borderTop: `3px solid ${aColor}`,
                    cursor: rev ? "default" : "default",
                  }}>
                    {/* Week badge */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, fontFamily: FM }}>Sem. {week}</span>
                      {isDue && <span style={{ fontSize: 9, fontWeight: 700, color: C.red, background: C.red + "14", padding: "2px 6px", borderRadius: R.pill }}>{days === 0 ? "hoje" : `${Math.abs(days)}d`}</span>}
                    </div>

                    {/* Topic */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3, letterSpacing: -0.2, flex: 1 }}>
                      {aula.topic}
                    </div>

                    {/* Area tag */}
                    <span style={{ ...tag(aColor), alignSelf: "flex-start", fontSize: 9 }}>{aula.area}</span>

                    {/* Performance */}
                    {rev ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: R.pill, background: C.surface, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${rev.lastPerf}%`, background: perfColor(rev.lastPerf), borderRadius: R.pill, transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: perfColor(rev.lastPerf), fontFamily: FN, lineHeight: 1 }}>{rev.lastPerf}%</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: C.text3, fontStyle: "italic" }}>{isPast ? "Sem revisão" : "Futura"}</div>
                    )}

                    {/* Footer: interval + subtopics */}
                    {rev && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>{INT_LABELS[rev.intervalIndex]}</span>
                        {stCount > 0 && <span style={{ fontSize: 10, color: C.purple, fontFamily: FM, fontWeight: 600 }}>{stCount} sub</span>}
                        {avg !== null && <span style={{ fontSize: 10, color: C.text3 }}>μ {avg}%</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {hasMoreGallery && (
              <button onClick={() => setGalleryLimit((v) => v + 24)}
                style={btn(C.surface, { color: C.text2, border: `1px solid ${C.border}`, width: "100%", textAlign: "center", padding: "12px 18px" })}>
                Mais temas ({galleryItems.length - galleryLimit} restantes)
              </button>
            )}
          </>
      )}

      {/* ── List View (Weeks) ── */}
      {viewMode === "list" && (filtered.length === 0
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

                          {/* Review stats for this aula */}
                          {hasRevs && (() => {
                            const logs = aula.reviews.flatMap((r) => {
                              const k = `${r.area}__${(r.theme || "").toLowerCase().trim()}`;
                              return logsByTheme[k] || [];
                            });
                            if (logs.length === 0) return null;
                            const avg = Math.round(logs.reduce((s, l) => s + (l.pct || 0), 0) / logs.length);
                            return (
                              <div style={{ display: "flex", gap: 8, alignItems: "center", paddingLeft: 4 }}>
                                <span style={{ fontSize: 11, color: C.text3 }}>{logs.length}× revisado</span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: perfColor(avg) }}>média {avg}%</span>
                              </div>
                            );
                          })()}

                          {/* Reviews for this aula */}
                          {hasRevs ? aula.reviews.map((r) => {
                            const isDue = r.nextDue <= today();
                            const days = diffDays(r.nextDue, today());
                            const { key: stKey, items: stItems } = getSubtopicsForTheme(r);
                            const subRevs = getSubReviewsForTheme(r);
                            // Merge subtopics from: registered list + review cards + revLog subtopicScores
                            const _lk = `${r.area}__${(r.theme || "").toLowerCase().trim()}`;
                            const _tl = logsByTheme[_lk] || [];
                            const _lsm = new Map();
                            _tl.forEach((l) => { if (l.subtopicScores) l.subtopicScores.forEach((s) => _lsm.set(s.name, s.pct)); });
                            const _allSet = new Map();
                            stItems.forEach(s => _allSet.set(s.toLowerCase(), s));
                            subRevs.forEach(s => { if (s.theme && !_allSet.has(s.theme.toLowerCase())) _allSet.set(s.theme.toLowerCase(), s.theme); });
                            _lsm.forEach((_, name) => { if (!_allSet.has(name.toLowerCase())) _allSet.set(name.toLowerCase(), name); });
                            const allStItems = [..._allSet.values()];
                            // Sort worst → best performance
                            const _pctOf = (name) => { const sr = subRevs.find(s => s.theme?.toLowerCase() === name.toLowerCase()); if (sr) return sr.lastPerf; for (const [k, v] of _lsm) { if (k.toLowerCase() === name.toLowerCase()) return v; } return 999; };
                            allStItems.sort((a, b) => _pctOf(a) - _pctOf(b));
                            const isExpanded = expandedThemes[r.id];
                            const hasSubtopics = allStItems.length > 0;
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
                                  <select value={r.intervalIndex} onChange={(e) => { const ni = Number(e.target.value); onEditInterval(r.id, ni, addDays(today(), INTERVALS[ni])); }} onClick={(e) => e.stopPropagation()}
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
                                      {allStItems.length} sub {isExpanded ? "▲" : "▼"}
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
                                    {allStItems.map((st, i) => {
                                      const subRev = subRevs.find((sr) => sr.theme && sr.theme.toLowerCase() === st.toLowerCase());
                                      // Fallback: get last % from revLog with the date it was scored
                                      let logPct = null, logDate = null, logInterval = null, logDays = null;
                                      if (!subRev) {
                                        const k = `${r.area}__${(r.theme || "").toLowerCase().trim()}`;
                                        const themeLogs = logsByTheme[k] || [];
                                        for (let li = 0; li < themeLogs.length; li++) {
                                          const ss = themeLogs[li].subtopicScores;
                                          if (ss) {
                                            const match = ss.find((s) => s.name.toLowerCase() === st.toLowerCase());
                                            if (match) { logPct = match.pct; logDate = themeLogs[li].date; break; }
                                          }
                                        }
                                        // If no individual score, use parent theme's overall perf + lastStudied
                                        if (logPct == null && r.lastPerf != null) { logPct = r.lastPerf; logDate = r.lastStudied; }
                                        if (logPct != null && logDate) {
                                          const estIdx = nxtIdx(0, logPct);
                                          logInterval = estIdx;
                                          logDays = diffDays(addDays(logDate, INTERVALS[estIdx]), today());
                                        }
                                      }
                                      const conf = subRev?.history?.slice(-1)[0]?.confidence;
                                      const confObj = conf ? CONFIDENCE_OPTS.find((c) => c.id === conf) : null;
                                      const displayPct = subRev ? subRev.lastPerf : logPct;
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
                                          {displayPct !== null ? (
                                            <span style={{ fontSize: 11, fontWeight: 700, color: perfColor(displayPct), fontFamily: FN, whiteSpace: "nowrap" }}>
                                              {displayPct}%{subRev ? (() => { const d = diffDays(subRev.nextDue, today()); return <> <span style={{ color: C.text3, fontWeight: 500, marginLeft: 3 }}>{INT_LABELS[subRev.intervalIndex]}</span> <span style={{ color: d <= 0 ? C.red : C.text3, fontWeight: 500 }}>{d <= 0 ? (d === 0 ? "hoje" : `${Math.abs(d)}d atraso`) : `em ${d}d`}</span></>; })() : logInterval != null ? <> <span style={{ color: C.text3, fontWeight: 500, marginLeft: 3 }}>{INT_LABELS[logInterval]}</span> <span style={{ color: logDays <= 0 ? C.red : C.text3, fontWeight: 500 }}>{logDays <= 0 ? (logDays === 0 ? "hoje" : `${Math.abs(logDays)}d atraso`) : `em ${logDays}d`}</span></> : null}
                                            </span>
                                          ) : (
                                            <span style={{ fontSize: 10, color: C.text3, fontStyle: "italic" }}>Pendente</span>
                                          )}
                                          {isEditing && stKey && stItems.some(s => s.toLowerCase() === st.toLowerCase()) && (
                                            <button onClick={() => removeStItem(stKey, r.area, r.theme, st)}
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
                                    {isEditing && stKey && (() => {
                                      const q = (editingSt === r.id ? newStItem : "").toLowerCase().trim();
                                      const currentItems = (subtopics[stKey] || []).map(s => s.toLowerCase());
                                      const suggestions = q.length >= 2 ? allSubNames.filter(n => n.toLowerCase().includes(q) && !currentItems.includes(n.toLowerCase())).slice(0, 6) : [];
                                      return (
                                      <div style={{ position: "relative" }}>
                                        <div style={{ display: "flex", gap: 6 }}>
                                          <input value={editingSt === r.id ? newStItem : ""} onFocus={() => { setEditingSt(r.id); setStSugFocused(true); }}
                                            onBlur={() => setTimeout(() => setStSugFocused(false), 150)}
                                            onChange={(e) => { setEditingSt(r.id); setNewStItem(e.target.value); }}
                                            onKeyDown={(e) => { if (e.key === "Enter") addStItem(stKey, r.area); }}
                                            placeholder="Adicionar subtema…" style={{ ...inp(), flex: 1, padding: "5px 8px", fontSize: 11 }} />
                                          <button onClick={() => addStItem(stKey, r.area)}
                                            style={btn(C.purple, { padding: "5px 10px", fontSize: 11, opacity: (editingSt === r.id && newStItem.trim()) ? 1 : 0.4 })}>+</button>
                                        </div>
                                        {stSugFocused && suggestions.length > 0 && (
                                          <div style={{ position: "absolute", top: "100%", left: 0, right: 40, zIndex: 50, background: C.card, border: `1px solid ${C.border}`, borderRadius: R.md, marginTop: 2, boxShadow: SH.lg, overflow: "hidden" }}>
                                            {suggestions.map((s, si) => (
                                              <div key={si} onMouseDown={(e) => { e.preventDefault(); const existing = subtopics[stKey] || []; if (!existing.includes(s)) { onSaveSubtopics(r.area, stKey.split("__").slice(1).join("__"), [...existing, s]); } setNewStItem(""); }}
                                                style={{ padding: "6px 10px", fontSize: 11, cursor: "pointer", borderBottom: si < suggestions.length - 1 ? `1px solid ${C.border}` : "none", color: C.text2 }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = C.surface}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                                {s}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      );
                                    })()}
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
        }))}

      {viewMode === "list" && hasMoreWeeks && (
        <button onClick={() => setWeekLimit((v) => v + 12)}
          style={btn(C.surface, { color: C.text2, border: `1px solid ${C.border}`, width: "100%", textAlign: "center", padding: "12px 18px" })}>
          Mais semanas ({filtered.length - weekLimit} restantes)
        </button>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: R.xl, padding: 24, maxWidth: 340, width: "100%", boxShadow: SH.lg, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Remover subtema?</div>
            <div style={{ fontSize: 13, color: C.text2 }}>"{confirmDelete.name}" será removido do dicionário.</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={btn(C.surface, { padding: "10px 20px", color: C.text2, border: `1px solid ${C.border}` })}>Cancelar</button>
              <button onClick={confirmRemoveSt} style={btn(C.red, { padding: "10px 20px" })}>Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export { Temas };
