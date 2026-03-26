import React from "react";
import { useState, useEffect } from "react";
import { AREAS, INTERVALS, INT_LABELS, SEED_REVIEWS, SEED_LOGS, areaMap, buildUnicamp2024Exam } from "./data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, applyTheme } from "./theme.js";
import { today, addDays, perc, uid, fmtDate, nxtIdx } from "./utils.js";
import { loadKey, saveKey } from "./storage.js";
import { Agenda } from "./components/Agenda.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { SessionModal } from "./components/SessionModal.jsx";
import { Sessoes } from "./components/Sessoes.jsx";
import { Revisoes } from "./components/Revisoes.jsx";
import { Temas } from "./components/Temas.jsx";
import { Provas } from "./components/Provas.jsx";

function App() {
  const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem("rp26_dark") !== "false"; } catch { return true; } });
  const [tab, setTab] = useState("dashboard");
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [revLogs, setRevLogs] = useState([]);
  const [exams, setExams] = useState([]);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState("");
  const [showSessionModal, setShowSessionModal] = useState(false);
  applyTheme(darkMode);
  const toggleTheme = () => { const next = !darkMode; setDarkMode(next); try { localStorage.setItem("rp26_dark", String(next)); } catch {} };
  useEffect(() => {
    Promise.all([loadKey("rp26_sessions", []), loadKey("rp26_reviews", []), loadKey("rp26_revlogs", []), loadKey("rp26_exams", []), loadKey("rp26_seeded12", false)]).then(([s, r, rl, e, seeded]) => {
      if (!seeded) {
        const revs = SEED_REVIEWS.map((r) => ({ ...r, id: uid(), key: `${r.area}__${r.theme.toLowerCase().trim()}`, history: [{ date: r.lastStudied, pct: r.lastPerf }] }));
        const logs = SEED_LOGS.map((l) => ({ ...l, id: uid() }));
        const se = buildUnicamp2024Exam();
        setSessions([]); setReviews(revs); setRevLogs(logs); setExams([se]);
        saveKey("rp26_reviews", revs); saveKey("rp26_revlogs", logs); saveKey("rp26_sessions", []); saveKey("rp26_exams", [se]); saveKey("rp26_seeded12", true);
      } else { setSessions(s); setReviews(r); setRevLogs(rl); setExams(e); }
      setReady(true);
    });
  }, []);
  const notify = (msg) => { setFlash(msg); setTimeout(() => setFlash(""), 2500); };
  const pS = (v) => { setSessions(v); saveKey("rp26_sessions", v); };
  const pR = (v) => { setReviews(v); saveKey("rp26_reviews", v); };
  const pL = (v) => { setRevLogs(v); saveKey("rp26_revlogs", v); };
  const pE = (v) => { setExams(v); saveKey("rp26_exams", v); };
  function addSession(session) {
    const s = { ...session, id: uid(), createdAt: today() }; pS([s, ...sessions]);
    const key = `${session.area}__${session.theme.toLowerCase().trim()}`;
    const ex = reviews.find((r) => r.key === key); const pct = perc(session.acertos, session.total); const ni = nxtIdx(0, pct);
    const rev = { id: ex?.id || uid(), key, area: session.area, theme: session.theme, intervalIndex: ni, nextDue: addDays(today(), INTERVALS[ni]), lastPerf: pct, lastStudied: today(), history: [...(ex?.history || []), { date: today(), pct }] };
    pR(ex ? reviews.map((r) => r.key === key ? rev : r) : [rev, ...reviews]);
    notify("\u2713 Sess\u00e3o registrada \u2014 1\u00aa revis\u00e3o em " + INTERVALS[ni] + "d");
  }
  function addRevLog(areaId, theme, total, acertos) {
    const pct = perc(acertos, total); pL([{ id: uid(), date: today(), area: areaId, theme, total, acertos, pct }, ...revLogs]);
    const key = `${areaId}__${theme.toLowerCase().trim()}`; const ex = reviews.find((r) => r.key === key);
    if (ex) { const ni = nxtIdx(ex.intervalIndex, pct); pR(reviews.map((r) => r.key === key ? { ...r, intervalIndex: ni, nextDue: addDays(today(), INTERVALS[ni]), lastPerf: pct, lastStudied: today(), history: [...(r.history || []), { date: today(), pct }] } : r)); }
    else { pR([{ id: uid(), key, area: areaId, theme, intervalIndex: nxtIdx(0, pct), nextDue: addDays(today(), INTERVALS[nxtIdx(0, pct)]), lastPerf: pct, lastStudied: today(), history: [{ date: today(), pct }] }, ...reviews]); }
    notify("\u2713 Revis\u00e3o registrada");
  }
  function markReview(revId, acertos, total) {
    const pct = perc(acertos, total); const rev = reviews.find((r) => r.id === revId); if (!rev) return;
    const ni = nxtIdx(rev.intervalIndex, pct);
    pR(reviews.map((r) => r.id !== revId ? r : { ...r, intervalIndex: ni, nextDue: addDays(today(), INTERVALS[ni]), lastPerf: pct, lastStudied: today(), history: [...(r.history || []), { date: today(), pct }] }));
    pL([{ id: uid(), date: today(), area: rev.area, theme: rev.theme, total, acertos, pct }, ...revLogs]);
    notify("\u2713 Conclu\u00edda \u2014 pr\u00f3ximo: " + INT_LABELS[ni]);
  }
  function editReview(revId, ni, nd) { pR(reviews.map((r) => r.id !== revId ? r : { ...r, intervalIndex: ni, nextDue: nd })); notify("\u2713 Corrigido"); }
  function addExam(exam) { pE([{ ...exam, id: uid() }, ...exams]); notify("\u2713 Prova registrada"); }
  function delSession(id) { pS(sessions.filter((s) => s.id !== id)); }
  function delExam(id) { pE(exams.filter((e) => e.id !== id)); }
  function updateExam(id, updates) { pE(exams.map((e) => e.id !== id ? e : { ...e, ...updates })); notify("\u2713 Prova atualizada"); }
  function editRevLog(logId, updates) { pL(revLogs.map((l) => l.id !== logId ? l : { ...l, ...updates, pct: updates.acertos != null && updates.total != null ? perc(updates.acertos, updates.total) : l.pct })); notify("\u2713 Revis\u00e3o atualizada"); }
  function delRevLog(logId) { pL(revLogs.filter((l) => l.id !== logId)); notify("\u2713 Revis\u00e3o removida"); }
  function handleNotionSync(newRevs) {
    const existing = [...reviews];
    newRevs.forEach((nr) => {
      const key = `${nr.area}__${nr.theme.toLowerCase().trim()}`;
      const idx = existing.findIndex((r) => r.key === key);
      const built = { ...nr, id: idx >= 0 ? existing[idx].id : uid(), key, history: idx >= 0 ? existing[idx].history : [{ date: nr.lastStudied, pct: nr.lastPerf }] };
      if (idx >= 0) existing[idx] = built; else existing.unshift(built);
    });
    pR(existing); notify(`\u2713 ${newRevs.length} revis\u00f5es importadas do Notion`);
  }
  if (!ready) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.text3, fontFamily: F, fontSize: 18 }}>carregando\u2026</div>;
  const dueR = reviews.filter((r) => r.nextDue <= today()).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  const upR = reviews.filter((r) => r.nextDue > today()).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  const alertThemes = [];
  const TABS = [
    { id: "agenda", label: "Agenda" },
    { id: "dashboard", label: "Dashboard" },
    { id: "revisoes", label: `Revis\u00f5es${dueR.length ? ` (${dueR.length})` : ""}` },
    { id: "provas", label: "Provas" },
    { id: "temas", label: "Temas" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F, color: C.text }}>
      <div style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 20px)", background: `linear-gradient(160deg, rgba(129,140,248,0.12) 0%, rgba(196,181,253,0.10) 50%, transparent 100%)`, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px 10px", maxWidth: 1200, margin: "0 auto", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginRight: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: `0 0 12px ${C.blue}30` }}>{"\u2695"}</div>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.5, color: C.text }}>Med</span>
          </div>
          <div style={{ display: "flex", gap: 4, flex: 1, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch", padding: "2px 0" }}>
            {TABS.map((t) => { const active = tab === t.id; return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "7px 14px", background: active ? `linear-gradient(135deg, rgba(129,140,248,0.25), rgba(196,181,253,0.3))` : "transparent", border: active ? `1px solid rgba(196,181,253,0.35)` : "1px solid transparent", borderRadius: R.pill, cursor: "pointer", whiteSpace: "nowrap", color: active ? C.text : C.text3, fontSize: 13, fontFamily: F, fontWeight: active ? 700 : 500, transition: "all 0.15s ease", opacity: active ? 1 : 0.5, boxShadow: active ? `0 0 16px rgba(129,140,248,0.15)` : "none", flexShrink: 0 }}>{t.label}</button>
            ); })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
            {flash && (<span style={{ fontSize: 10, color: C.green, fontFamily: FM, fontWeight: 600, background: `rgba(34,197,94,0.1)`, padding: "4px 10px", borderRadius: R.pill, border: `1px solid rgba(34,197,94,0.2)` }}>{flash}</span>)}
            <button onClick={toggleTheme} style={{ background: `linear-gradient(135deg, rgba(129,140,248,0.15), rgba(196,181,253,0.2))`, border: `1px solid rgba(196,181,253,0.25)`, borderRadius: R.pill, width: 32, height: 32, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease", flexShrink: 0, color: C.purple }}>{darkMode ? "\u2600" : "\u263D"}</button>
          </div>
        </div>
      </div>
      {showSessionModal && <SessionModal onAdd={(s) => { addSession(s); setShowSessionModal(false); }} onClose={() => setShowSessionModal(false)} />}
      <div style={{ padding: `${S.xl}px`, maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
        <div style={{ display: tab === "agenda" ? "block" : "none" }}><Agenda reviews={reviews} revLogs={revLogs} alertThemes={alertThemes} onAddSubtemaNote={() => {}} /></div>
        {tab === "dashboard" && <Dashboard revLogs={revLogs} sessions={sessions} exams={exams} reviews={reviews} dueCount={dueR.length} onNotionSync={handleNotionSync} onNewSession={() => setShowSessionModal(true)} onAlerts={() => setTab("alertas")} />}
        {tab === "alertas" && <Dashboard revLogs={revLogs} sessions={sessions} exams={exams} reviews={reviews} dueCount={dueR.length} onNotionSync={handleNotionSync} onNewSession={() => setShowSessionModal(true)} onAlerts={() => setTab("alertas")} forceTab="alerts" />}
        {tab === "sessoes" && <Sessoes sessions={sessions} onAdd={addSession} onDel={delSession} />}
        {tab === "revisoes" && <Revisoes due={dueR} upcoming={upR} revLogs={revLogs} reviews={reviews} sessions={sessions} onMark={markReview} onQuick={addRevLog} onEditLog={editRevLog} onDelLog={delRevLog} />}
        {tab === "provas" && <Provas exams={exams} revLogs={revLogs} sessions={sessions} onAdd={addExam} onDel={delExam} onUpdate={updateExam} />}
        {tab === "temas" && <Temas reviews={reviews} onEdit={editReview} />}
      </div>
    </div>
  );
}

export default App;
