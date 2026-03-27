import React from "react";
import { useState, useEffect } from "react";
import { AREAS, areaMap, AREA_SHORT_MAP, SEMANAS, SEM_SAT } from "../data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM } from "../theme.js";
import { today, fmtDate, uid, weekDates, buildWeekTemplate } from "../utils.js";
import { loadKey, saveKey } from "../storage.js";
import { Empty } from "./UI.jsx";

function Agenda({ reviews, revLogs, alertThemes, subtopics, onAulaChecked }) {
  const [week, setWeek] = useState(null);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState("current");
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [addingTo, setAddingTo] = useState(null);
  const [newItem, setNewItem] = useState("");
  const [semIdx, setSemIdx] = useState(0);
  const [justToggled, setJustToggled] = useState(null);

  function currentSatKey() {
    const now = new Date(); const dow = now.getDay();
    const daysSinceSat = dow === 6 ? 0 : dow + 1;
    const sat = new Date(now); sat.setDate(now.getDate() - daysSinceSat); sat.setHours(12, 0, 0, 0);
    return sat.toISOString().slice(0, 10);
  }
  useEffect(() => {
    const satKey = currentSatKey();
    Promise.all([loadKey("rp_agenda_v7", null), loadKey("rp_agenda_history", [])]).then(([raw, hist]) => {
      const nh = hist || [];
      // Handle both old format (array with custom props) and new format (object with .days)
      const saved = raw && raw.days ? raw.days : (Array.isArray(raw) ? raw : null);
      const savedWeekKey = raw && raw._weekKey ? raw._weekKey : (raw && raw.days ? raw._weekKey : undefined);
      const savedSemana = raw && raw._semana ? raw._semana : undefined;
      if (saved && savedWeekKey === satKey) {
        const todayDow = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"][new Date().getDay()];
        const dayOrder = ["sab", "dom", "seg", "ter", "qua", "qui", "sex"];
        const todayIdx = dayOrder.indexOf(todayDow);
        const rollovers = [];
        const updated = saved.map((day) => {
          if (dayOrder.indexOf(day.id) >= todayIdx) return day;
          const pendingReviews = day.items.filter((it) => !it.done && it.isReview);
          if (!pendingReviews.length) return day;
          rollovers.push(...pendingReviews.map((it) => ({ ...it, id: uid(), text: it.text.replace(/^⚠️\s*/, "") + "", done: false })));
          return { ...day, items: day.items.filter((it) => it.done || !it.isReview) };
        });
        if (rollovers.length > 0) {
          const rolled = updated.map((day) => day.id !== todayDow ? day : {
            ...day, items: [...day.items, ...rollovers.map((r) => ({ ...r, text: "⚠️ " + r.text.replace(/^🔄\s*/, "🔄 ") }))]
          });
          setWeek(rolled); saveKey("rp_agenda_v7", { _weekKey: satKey, _semana: savedSemana, days: rolled });
        } else { setWeek(saved); saveKey("rp_agenda_v7", { _weekKey: satKey, _semana: savedSemana, days: saved }); }
        const idx = SEMANAS.findIndex((s) => SEM_SAT[s.semana] === satKey);
        if (idx >= 0) setSemIdx(idx);
      } else {
        if (saved && savedWeekKey) {
          const tot = saved.reduce((s, d) => s + d.items.length, 0);
          const don = saved.reduce((s, d) => s + d.items.filter((i) => i.done).length, 0);
          if (don > 0) { nh.unshift({ savedAt: savedWeekKey, label: `${savedSemana || "Semana"} — ${fmtDate(savedWeekKey)}`, progress: tot > 0 ? Math.round((don / tot) * 100) : 0, done: don, total: tot, days: saved }); saveKey("rp_agenda_history", nh.slice(0, 12)); }
        }
        let curIdx = SEMANAS.findIndex((s) => SEM_SAT[s.semana] === satKey);
        if (curIdx < 0) curIdx = 0;
        setSemIdx(curIdx);
        const w = buildWeekTemplate(curIdx, reviews, alertThemes);
        setWeek(w); saveKey("rp_agenda_v7", { _weekKey: satKey, _semana: SEMANAS[curIdx]?.semana, days: w });
      }
      setHistory(nh.slice(0, 12));
    });
  }, []);
  function rebuildForSem(ni) {
    setSemIdx(ni);
    const satKey = SEM_SAT[SEMANAS[ni]?.semana] || currentSatKey();
    const w = buildWeekTemplate(ni, reviews, alertThemes);
    setWeek(w); saveKey("rp_agenda_v7", { _weekKey: satKey, _semana: SEMANAS[ni]?.semana, days: w });
  }
  function save(days) {
    setWeek(days);
    saveKey("rp_agenda_v7", { _weekKey: currentSatKey(), _semana: SEMANAS[semIdx]?.semana, days });
  }
  function findAulaForItem(item) {
    // Match agenda item to a SEMANAS aula by id or text
    const sem = SEMANAS[semIdx];
    if (!sem) return null;
    if (item.id === "sa1" && sem.aulas[0]) return sem.aulas[0];
    if (item.id === "sa2" && sem.aulas[1]) return sem.aulas[1];
    // Fallback: match by text
    return sem.aulas.find((a) => (item.text || "").includes(a.topic)) || null;
  }
  function isAulaItem(item) {
    return item && (item.isAula || item.id === "sa1" || item.id === "sa2" || /Aula[:\s]/.test(item.text || ""));
  }
  function openSubtopicsFor(item) {
    const aula = findAulaForItem(item);
    if (aula && onAulaChecked) {
      const areaId = AREA_SHORT_MAP[aula.area];
      onAulaChecked(areaId || aula.area, aula.topic, SEMANAS[semIdx]?.semana);
    }
  }
  function toggleDone(did, iid) {
    const day = week.find((d) => d.id === did);
    const item = day?.items.find((it) => it.id === iid);
    const wasUnchecked = item && !item.done;
    save(week.map((d) => d.id !== did ? d : { ...d, items: d.items.map((it) => it.id !== iid ? it : { ...it, done: !it.done }) }));
    setJustToggled(iid);
    setTimeout(() => setJustToggled(null), 350);
    // If checking an aula item, trigger subtopic modal
    if (wasUnchecked && isAulaItem(item)) {
      openSubtopicsFor(item);
    }
  }
  function startEdit(did, item) { setEditing({ did, iid: item.id }); setEditText(item.text); }
  function commitEdit() { if (!editing) return; save(week.map((d) => d.id !== editing.did ? d : { ...d, items: d.items.map((it) => it.id !== editing.iid ? it : { ...it, text: editText }) })); setEditing(null); }
  function deleteItem(did, iid) { save(week.map((d) => d.id !== did ? d : { ...d, items: d.items.filter((it) => it.id !== iid) })); }
  function addItem(did) { if (!newItem.trim()) return; save(week.map((d) => d.id !== did ? d : { ...d, items: [...d.items, { id: uid(), text: newItem.trim(), done: false, fixed: false }] })); setNewItem(""); setAddingTo(null); }
  function archiveAndReset(newIdx) {
    const tot = week.reduce((s, d) => s + d.items.length, 0); const don = week.reduce((s, d) => s + d.items.filter((i) => i.done).length, 0);
    const entry = { savedAt: today(), label: `${SEMANAS[semIdx]?.semana || "Semana"} — ${fmtDate(currentSatKey())}`, progress: tot > 0 ? Math.round((don / tot) * 100) : 0, done: don, total: tot, days: week };
    const nh = [entry, ...history].slice(0, 12); setHistory(nh); saveKey("rp_agenda_history", nh);
    const ni = newIdx ?? Math.min(semIdx + 1, SEMANAS.length - 1);
    rebuildForSem(ni);
  }

  // Streak calculation
  const streak = (() => {
    let count = 0;
    if (week) {
      const tot = week.reduce((s, d) => s + d.items.length, 0);
      const don = week.reduce((s, d) => s + d.items.filter((i) => i.done).length, 0);
      if (tot > 0 && don / tot >= 0.5) count++;
    }
    for (const h of (history || [])) {
      if (h.progress >= 50) count++; else break;
    }
    return count;
  })();

  const todayDayFallback = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"][new Date().getDay()];
  if (!week) return <Empty msg="Carregando…" />;
  const ti = week.reduce((s, d) => s + d.items.length, 0);
  const di = week.reduce((s, d) => s + d.items.filter((i) => i.done).length, 0);
  const prog = ti > 0 ? Math.round((di / ti) * 100) : 0;
  const pCol = prog >= 85 ? C.green : prog >= 60 ? C.yellow : C.blue;
  const semana = SEMANAS[semIdx];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.lg }}>
      {/* Progress header + streak */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R.xl, padding: `${S.xl}px`, boxShadow: SH.sm }}>
        <div style={{ display: "flex", alignItems: "center", gap: S.xl }}>
          <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
            <svg width="56" height="56" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="28" cy="28" r="22" fill="none" stroke={C.border2} strokeWidth="4.5" />
              <circle cx="28" cy="28" r="22" fill="none" stroke={pCol} strokeWidth="4.5" strokeDasharray={`${(prog / 100) * 138.2} 138.2`} strokeLinecap="round" style={{ transition: "stroke-dasharray .6s cubic-bezier(.4,0,.2,1)" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, fontFamily: FN, color: pCol }}>{prog}%</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 }}>{semana?.semana || "Semana atual"}</div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 4, display: "flex", gap: S.md, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontFamily: FN, fontWeight: 700, color: C.text2 }}>{di}/{ti}</span>
              <span>itens · sáb {fmtDate(SEM_SAT[semana?.semana] || currentSatKey())} → sex</span>
            </div>
          </div>
          {streak > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 12px", background: C.yellow + "12", borderRadius: R.md, border: `1px solid ${C.yellow}25`, flexShrink: 0 }}>
              <span style={{ fontSize: 18 }}>{"🔥"}</span>
              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: FN, color: C.yellow }}>{streak}</span>
              <span style={{ fontSize: 9, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>streak</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: S.md, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: C.card, border: `1px solid ${C.border}`, borderRadius: R.pill, padding: 3, gap: 2, boxShadow: SH.sm }}>
          {["current", "history"].map((v) => <button key={v} onClick={() => setView(v)} style={{ background: view === v ? C.purple + "20" : "none", border: view === v ? `1px solid ${C.purple}35` : "1px solid transparent", borderRadius: R.pill, padding: "8px 18px", color: view === v ? C.purple : C.text3, fontSize: 12, fontFamily: F, cursor: "pointer", fontWeight: view === v ? 700 : 500, boxShadow: view === v ? SH.glow(C.purple) : "none", minHeight: 36, transition: "all .2s ease" }}>{v === "current" ? "Semana" : "Histórico"}</button>)}
        </div>
        <div style={{ flex: 1 }} />
        <select value={semIdx} onChange={(e) => rebuildForSem(Number(e.target.value))} style={{ ...inp(), width: "auto", fontSize: 11, padding: "6px 10px" }}>
          {SEMANAS.map((s, i) => <option key={i} value={i}>{s.semana} — {s.aulas.map((a) => a.area).join(" + ")}</option>)}
        </select>
        <button onClick={() => { if (confirm("Arquivar semana atual e ir para a próxima?")) archiveAndReset(); }} style={btn(C.blue, { padding: "7px 16px", fontSize: 12 })}>Próxima semana →</button>
      </div>
      {view === "current" && semana && (() => {
        const satStr = SEM_SAT[semana.semana];
        const dates = satStr ? weekDates(satStr) : {};
        const weekDateSet = new Set(Object.values(dates));
        const revs = reviews.filter((r) => r.nextDue && weekDateSet.has(r.nextDue)).map((r) => ({ theme: r.theme, area: r.area, nextDue: r.nextDue })).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
        return (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.lg, padding: `${S.xl}px`, boxShadow: SH.sm }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: S.lg }}>{semana.semana} — aulas + revisões agendadas</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {semana.aulas.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", minHeight: 36, padding: "6px 0", gap: 0 }}>
                  <span style={{ ...tag(areaMap[AREA_SHORT_MAP[a.area]]?.color || C.blue), width: 48, minWidth: 48, textAlign: "center", fontSize: 10, padding: "3px 0", display: "inline-flex", justifyContent: "center" }}>{a.area}</span>
                  <span style={{ width: 28, textAlign: "center", fontSize: 14, flexShrink: 0 }}>{"📖"}</span>
                  <span style={{ flex: 1, fontSize: 13, color: C.text }}>{a.topic}</span>
                </div>
              ))}
              {revs.length > 0 && <div style={{ height: 1, background: C.border, margin: `${S.sm}px 0` }} />}
              {revs.map((r, i) => { const ao = areaMap[r.area]; return (
                <div key={i} style={{ display: "flex", alignItems: "center", minHeight: 36, padding: "6px 0", gap: 0 }}>
                  <span style={{ ...tag(ao?.color || C.text3), width: 48, minWidth: 48, textAlign: "center", fontSize: 10, padding: "3px 0", display: "inline-flex", justifyContent: "center" }}>{ao?.short}</span>
                  <span style={{ width: 28, textAlign: "center", fontSize: 14, flexShrink: 0 }}>{"🔄"}</span>
                  <span style={{ flex: 1, fontSize: 13, color: C.text2 }}>{r.theme}</span>
                  <span style={{ fontSize: 11, color: C.text3, fontFamily: FM, flexShrink: 0, minWidth: 48, textAlign: "right" }}>{fmtDate(r.nextDue)}</span>
                </div>
              ); })}
              {revs.length === 0 && <div style={{ padding: "8px 0", fontSize: 11, color: C.text3, fontStyle: "italic" }}>Nenhuma revisão agendada para esta semana</div>}
            </div>
          </div>
        );
      })()}
      {view === "current" && (
        <div style={{ display: "flex", flexDirection: "column", gap: S.lg }}>
          {week.map((day) => {
            const isToday = day.id === todayDayFallback; const dd = day.items.filter((i) => i.done).length;
            const dayProg = day.items.length > 0 ? Math.round((dd / day.items.length) * 100) : 0;
            return (
              <div key={day.id} style={{ background: C.card, border: `1px solid ${isToday ? C.blue + "50" : C.border}`, borderRadius: R.xl, overflow: "hidden", boxShadow: isToday ? SH.glow(C.blue) : SH.sm }}>
                <div style={{ padding: `${S.xl}px ${S.xl}px ${S.lg}px`, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: S.md }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: isToday ? C.blue : C.text, letterSpacing: -0.2 }}>{day.label}</span>
                    {isToday && <span style={{ ...tag(C.blue), fontSize: 10, padding: "3px 10px" }}>hoje</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: S.md }}>
                    {/* Mini progress bar */}
                    <div style={{ width: 48, height: 4, borderRadius: 2, background: C.border2, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: dayProg === 100 ? C.green : C.blue, width: `${dayProg}%`, transition: "width .4s cubic-bezier(.4,0,.2,1)" }} />
                    </div>
                    <span style={{ fontSize: 12, color: dayProg === 100 ? C.green : C.text3, fontFamily: FN, fontWeight: 700 }}>{dd}/{day.items.length}</span>
                    <button onClick={() => setAddingTo(addingTo === day.id ? null : day.id)} style={{ background: C.card2, border: `1px solid ${C.border2}`, borderRadius: R.pill, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.text3, fontSize: 16, fontWeight: 600, minWidth: 32, transition: "all 0.15s" }}>+</button>
                  </div>
                </div>
                <div style={{ padding: `${S.lg}px ${S.xl}px ${S.xl}px`, display: "flex", flexDirection: "column", gap: S.sm }}>
                  {day.items.map((item) => {
                    const isEd = editing?.did === day.id && editing?.iid === item.id;
                    const wasPulsed = justToggled === item.id;
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: S.md, padding: "12px 14px", background: item.done ? C.card : C.card2, borderRadius: R.md, border: `1px solid ${item.done ? C.green + "15" : C.border}`, transition: "all .2s ease" }}>
                        <div onClick={() => toggleDone(day.id, item.id)} className={wasPulsed && item.done ? "pulse-check" : ""} style={{ width: 22, height: 22, borderRadius: 7, border: item.done ? `2px solid ${C.green}` : `2px solid ${C.border2}`, background: item.done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all .2s cubic-bezier(.4,0,.2,1)" }}>
                          {item.done && <span style={{ fontSize: 11, color: "#000", fontWeight: 800 }}>{"✓"}</span>}
                        </div>
                        {isEd ? <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }} style={{ ...inp(), flex: 1, padding: "4px 8px", fontSize: 13, background: "none", border: "none", borderBottom: `1px solid ${C.border2}`, borderRadius: 0 }} />
                          : <span style={{ flex: 1, fontSize: 13, lineHeight: 1.4, color: item.done ? C.text3 : C.text, textDecoration: item.done ? "line-through" : "none", opacity: item.done ? 0.5 : 1, transition: "opacity .2s, color .2s" }}>{item.text}</span>}
                        {!isEd && (() => {
                          const aula = isAulaItem(item) ? findAulaForItem(item) : null;
                          let stCount = 0;
                          if (aula && subtopics) {
                            const areaId = AREA_SHORT_MAP[aula.area];
                            const key = `${areaId || aula.area}__${aula.topic}`;
                            stCount = (subtopics[key] || []).length;
                          }
                          return (
                            <div style={{ display: "flex", gap: 2, flexShrink: 0, alignItems: "center" }}>
                              {stCount > 0 && <span style={{ fontSize: 10, color: C.purple, fontFamily: FM, padding: "2px 7px", background: C.purple + "14", borderRadius: R.pill, border: `1px solid ${C.purple}25`, fontWeight: 600 }}>{stCount} sub</span>}
                              {aula && <button onClick={(e) => { e.stopPropagation(); openSubtopicsFor(item); }} style={{ background: C.purple + "14", border: `1px solid ${C.purple}25`, cursor: "pointer", color: C.purple, fontSize: 10, padding: "3px 8px", borderRadius: R.pill, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontFamily: FM, gap: 3, transition: "opacity 0.15s", opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.opacity = "1"} onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"} title="Gerenciar subtemas">{"📋"} subtemas</button>}
                              <button onClick={() => startEdit(day.id, item)} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 13, padding: "4px 6px", borderRadius: R.sm, display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, opacity: 0.4, transition: "opacity 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "0.4"}>{"✏"}</button>
                              {!item.fixed && <button onClick={() => deleteItem(day.id, item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 13, padding: "4px 6px", borderRadius: R.sm, display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, opacity: 0.4, transition: "opacity 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "0.4"}>{"✕"}</button>}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                  {addingTo === day.id && <div className="fade-in" style={{ display: "flex", gap: S.sm, marginTop: S.xs }}>
                    <input autoFocus value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addItem(day.id); if (e.key === "Escape") { setAddingTo(null); setNewItem(""); } }} placeholder="Novo item…" style={{ ...inp(), flex: 1, padding: "10px 14px", fontSize: 13 }} />
                    <button onClick={() => addItem(day.id)} style={btn(C.blue, { padding: "10px 16px", fontSize: 13 })}>+</button>
                  </div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {view === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {history.length === 0 && <Empty icon={"📅"} msg="Nenhuma semana arquivada ainda." />}
          {history.map((entry, i) => <HistoryEntry key={i} entry={entry} />)}
        </div>
      )}
    </div>
  );
}

function HistoryEntry({ entry }) {
  const [open, setOpen] = useState(false);
  const pC = entry.progress >= 85 ? C.green : entry.progress >= 60 ? C.yellow : C.red;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => setOpen((o) => !o)}>
        <div style={{ width: 46, height: 46, borderRadius: R.md, background: pC + "18", border: `2px solid ${pC}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: SH.glow(pC) }}><span style={{ fontSize: 14, fontWeight: 700, color: pC, ...NUM }}>{entry.progress}%</span></div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{entry.label}</div><div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{entry.done}/{entry.total} concluídos</div></div>
        <span style={{ color: C.text3, transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>{"▼"}</span>
      </div>
      {open && <div className="fade-in" style={{ padding: "0 18px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {entry.days.map((day) => <div key={day.id}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{day.label}</div>
          {day.items.map((it) => <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", opacity: it.done ? 0.4 : 0.85 }}>
            <span style={{ fontSize: 11, color: it.done ? C.green : C.text3 }}>{it.done ? "✓" : "○"}</span>
            <span style={{ fontSize: 12, textDecoration: it.done ? "line-through" : "none" }}>{it.text}</span>
          </div>)}
        </div>)}
      </div>}
    </div>
  );
}

export { Agenda };
