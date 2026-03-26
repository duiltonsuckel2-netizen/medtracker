import React from "react";
import { useState, useEffect } from "react";
import { AREAS, INTERVALS, INT_LABELS, SEED_REVIEWS, SEED_LOGS, areaMap, buildUnicamp2024Exam } from "./data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, applyTheme, injectKeyframes } from "./theme.js";
import { today, addDays, perc, uid, fmtDate, nxtIdx } from "./utils.js";
import { loadKey, saveKey } from "./storage.js";
import { Agenda } from "./components/Agenda.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { SessionModal } from "./components/SessionModal.jsx";
import { Sessoes } from "./components/Sessoes.jsx";
import { Revisoes } from "./components/Revisoes.jsx";
import { Temas } from "./components/Temas.jsx";
import { Provas } from "./components/Provas.jsx";
import { SkeletonCard } from "./components/UI.jsx";

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
  const [tabKey, setTabKey] = useState(0);

  useEffect(() => { injectKeyframes(); }, []);

  applyTheme(darkMode);
  const toggleTheme = () => { const next = !darkMode; setDarkMode(next); try { localStorage.setItem("rp26_dark", String(next)); } catch {} };

  function switchTab(id) {
    if (id === tab) return;
    setTab(id);
    setTabKey((k) => k + 1);
  }

  useEffect(() => {
    Promise.all([loadKey("rp26_sessions", []), loadKey("rp26_reviews", []), loadKey("rp26_revlogs", []), loadKey("rp26_exams", []), loadKey("rp26_seeded12", false)]).then(([s, r, rl, e, seeded]) => {
      if (!seeded) {
        const revs = SEED_REVIEWS.map((r) => ({ ...r, id: uid(), key: `${r.area}__${r.theme.toLowerCase().trim()}`, history: [{ date: r.lastStudied, pct: r.lastPerf }] }));
        const logs = SEED_LOGS.map((l) => ({ ...l, id: uid() }));
        const se = buildUnicamp2024Exam();
        setSessions([]); setReviews(revs); setRevLogs(logs); setExams([se]);
        saveKey("rp26_reviews", revs); saveKey("rp26_revlogs", logs); saveKey("rp26_sessions", []); saveKey("rp26_exams", [se]); saveKey("rp26_seeded12", true);
      } else { setSessions(Array.isArray(s) ? s : []); setReviews(Array.isArray(r) ? r : []); setRevLogs(Array.isArray(rl) ? rl : []); setExams(Array.isArray(e) ? e : []); }
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
    notify("✓ Sessão registrada — 1ª revisão em " + INTERVALS[ni] + "d");
  }
  function addRevLog(areaId, theme, total, acertos) {
    const pct = perc(acertos, total); pL([{ id: uid(), date: today(), area: areaId, theme, total, acertos, pct }, ...revLogs]);
    const key = `${areaId}__${theme.toLowerCase().trim()}`; const ex = reviews.find((r) => r.key === key);
    if (ex) { const ni = nxtIdx(ex.intervalIndex, pct); pR(reviews.map((r) => r.key === key ? { ...r, intervalIndex: ni, nextDue: addDays(today(), INTERVALS[ni]), lastPerf: pct, lastStudied: today(), history: [...(r.history || []), { date: today(), pct }] } : r)); }
    else { pR([{ id: uid(), key, area: areaId, theme, intervalIndex: nxtIdx(0, pct), nextDue: addDays(today(), INTERVALS[nxtIdx(0, pct)]), lastPerf: pct, lastStudied: today(), history: [{ date: today(), pct }] }, ...reviews]); }
    notify("✓ Revisão registrada");
  }
  function markReview(revId, acertos, total) {
    const pct = perc(acertos, total); const rev = reviews.find((r) => r.id === revId); if (!rev) return;
    const ni = nxtIdx(rev.intervalIndex, pct);
    pR(reviews.map((r) => r.id !== revId ? r : { ...r, intervalIndex: ni, nextDue: addDays(today(), INTERVALS[ni]), lastPerf: pct, lastStudied: today(), history: [...(r.history || []), { date: today(), pct }] }));
    pL([{ id: uid(), date: today(), area: rev.area, theme: rev.theme, total, acertos, pct }, ...revLogs]);
    notify("✓ Concluída — próximo: " + INT_LABELS[ni]);
  }
  function editReview(revId, ni, nd) { pR(reviews.map((r) => r.id !== revId ? r : { ...r, intervalIndex: ni, nextDue: nd })); notify("✓ Corrigido"); }
  function addExam(exam) { pE([{ ...exam, id: uid() }, ...exams]); notify("✓ Prova registrada"); }
  function delSession(id) { pS(sessions.filter((s) => s.id !== id)); }
  function delExam(id) { pE(exams.filter((e) => e.id !== id)); }
  function updateExam(id, updates) { pE(exams.map((e) => e.id !== id ? e : { ...e, ...updates })); notify("✓ Prova atualizada"); }
  function editRevLog(logId, updates) { pL(revLogs.map((l) => l.id !== logId ? l : { ...l, ...updates, pct: updates.acertos != null && updates.total != null ? perc(updates.acertos, updates.total) : l.pct })); notify("✓ Revisão atualizada"); }
  function delRevLog(logId) { pL(revLogs.filter((l) => l.id !== logId)); notify("✓ Revisão removida"); }
  function handleNotionSync(newRevs) {
    const existing = [...reviews];
    newRevs.forEach((nr) => {
      const key = `${nr.area}__${nr.theme.toLowerCase().trim()}`;
      const idx = existing.findIndex((r) => r.key === key);
      const built = { ...nr, id: idx >= 0 ? existing[idx].id : uid(), key, history: idx >= 0 ? existing[idx].history : [{ date: nr.lastStudied, pct: nr.lastPerf }] };
      if (idx >= 0) existing[idx] = built; else existing.unshift(built);
    });
    pR(existing); notify(`✓ ${newRevs.length} revisões importadas do Notion`);
  }

  if (!ready) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F, padding: S.xl }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: S.lg, paddingTop: 80 }}>
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    </div>
  );

  const dueR = reviews.filter((r) => r.nextDue <= today()).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  const upR = reviews.filter((r) => r.nextDue > today()).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  const alertThemes = [];
  const TAB_ICONS = { agenda:"📅", dashboard:"📊", revisoes:"🔄", provas:"📝", temas:"📚" };
  const TABS = [
    { id: "agenda", label: "Agenda" },
    { id: "dashboard", label: "Dashboard" },
    { id: "revisoes", label: `Revisões${dueR.length ? ` (${dueR.length})` : ""}` },
    { id: "provas", label: "Provas" },
    { id: "temas", label: "Temas" },
  ];


  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F, color: C.text }}>
      {/* HEADER */}
      <div style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 20px)", background: `linear-gradient(160deg, rgba(129,140,248,0.12) 0%, rgba(196,181,253,0.10) 50%, transparent 100%)`, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px 10px", maxWidth: 1200, margin: "0 auto", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginRight: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: `0 0 12px ${C.blue}30` }}>{"⚕"}</div>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.5, color: C.text }}>MedTracker</span>
          </div>
          {/* Desktop tabs */}
          <div className="desktop-tabs" style={{ display: "flex", gap: 4, flex: 1, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch", padding: "2px 0" }}>
            {TABS.map((t) => { const active = tab === t.id; return (
              <button key={t.id} onClick={() => switchTab(t.id)} style={{ padding: "7px 14px", background: active ? `linear-gradient(135deg, rgba(129,140,248,0.25), rgba(196,181,253,0.3))` : "transparent", border: active ? `1px solid rgba(196,181,253,0.35)` : "1px solid transparent", borderRadius: R.pill, cursor: "pointer", whiteSpace: "nowrap", color: active ? C.text : C.text3, fontSize: 13, fontFamily: F, fontWeight: active ? 700 : 500, transition: "all .25s cubic-bezier(.4,0,.2,1)", opacity: active ? 1 : 0.6, boxShadow: active ? `0 0 16px rgba(129,140,248,0.15)` : "none", flexShrink: 0, transform: active ? "scale(1)" : "scale(.97)" }}>{t.label}</button>
            ); })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
            {flash && (<span className="fade-in" style={{ fontSize: 10, color: C.green, fontFamily: FM, fontWeight: 600, background: `rgba(34,197,94,0.1)`, padding: "4px 10px", borderRadius: R.pill, border: `1px solid rgba(34,197,94,0.2)` }}>{flash}</span>)}
            <button onClick={toggleTheme} style={{ background: `linear-gradient(135deg, rgba(129,140,248,0.15), rgba(196,181,253,0.2))`, border: `1px solid rgba(196,181,253,0.25)`, borderRadius: R.pill, width: 32, height: 32, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease", flexShrink: 0, color: C.purple }}>{darkMode ? "☀" : "☽"}</button>
          </div>
        </div>
      </div>
      {showSessionModal && <SessionModal onSave={(s) => { addSession(s); setShowSessionModal(false); }} onClose={() => setShowSessionModal(false)} />}
      {/* CONTENT */}
      <div style={{ padding: `${S.xl}px`, maxWidth: 1200, margin: "0 auto", paddingBottom: 100 }}>
        <div key={tabKey} className="fade-in">
          <div style={{ display: tab === "agenda" ? "block" : "none" }}><Agenda reviews={reviews} revLogs={revLogs} alertThemes={alertThemes} onAddSubtemaNote={() => {}} /></div>
          {tab === "dashboard" && <Dashboard revLogs={revLogs} sessions={sessions} exams={exams} reviews={reviews} dueCount={dueR.length} onNotionSync={handleNotionSync} onNewSession={() => setShowSessionModal(true)} onAlerts={() => switchTab("alertas")} />}
          {tab === "alertas" && <Dashboard revLogs={revLogs} sessions={sessions} exams={exams} reviews={reviews} dueCount={dueR.length} onNotionSync={handleNotionSync} onNewSession={() => setShowSessionModal(true)} onAlerts={() => switchTab("alertas")} forceTab="alerts" />}
          {tab === "sessoes" && <Sessoes sessions={sessions} onAdd={addSession} onDel={delSession} />}
          {tab === "revisoes" && <Revisoes due={dueR} upcoming={upR} revLogs={revLogs} reviews={reviews} sessions={sessions} onMark={markReview} onQuick={addRevLog} onEditLog={editRevLog} onDelLog={delRevLog} />}
          {tab === "provas" && <Provas exams={exams} revLogs={revLogs} sessions={sessions} onAdd={addExam} onDel={delExam} onUpdate={updateExam} />}
          {tab === "temas" && <Temas reviews={reviews} onEditInterval={editReview} />}
        </div>
      </div>
      {/* BOTTOM NAV — mobile only */}
      <nav className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.card, borderTop: `1px solid ${C.border}`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)", zIndex: 100, display: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "6px 4px 2px" }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            const hasNotif = t.id === "revisoes" && dueR.length > 0;
            return (
              <button key={t.id} onClick={() => switchTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 8px", color: active ? C.blue : C.text3, transition: "all .2s ease", position: "relative", minWidth: 52 }}>
                <span style={{ fontSize: 18, transform: active ? "scale(1.15)" : "scale(1)", transition: "transform .2s cubic-bezier(.4,0,.2,1)" }}>{TAB_ICONS[t.id]}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, fontFamily: F, transition: "color .2s" }}>{t.id === "revisoes" ? "Revisões" : t.label}</span>
                {hasNotif && <span style={{ position: "absolute", top: 2, right: 4, width: 16, height: 16, borderRadius: 8, background: C.red, color: "#fff", fontSize: 9, fontWeight: 700, fontFamily: FN, display: "flex", alignItems: "center", justifyContent: "center" }}>{dueR.length}</span>}
                {active && <span style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 20, height: 3, borderRadius: 2, background: C.blue, transition: "all .25s cubic-bezier(.4,0,.2,1)" }} />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;
