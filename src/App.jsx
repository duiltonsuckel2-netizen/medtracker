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
import { SubtopicModal, SubtopicReviewModal } from "./components/SubtopicModal.jsx";
import { SkeletonCard } from "./components/UI.jsx";
import { Flashcards } from "./components/Flashcards.jsx";
import { generateFlashcardDecks, mergeDecks, reviewCard } from "./flashcards.js";

function App() {
  const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem("rp26_dark") !== "false"; } catch { return true; } });
  const [tab, setTab] = useState("dashboard");
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [revLogs, setRevLogs] = useState([]);
  const [exams, setExams] = useState([]);
  const [subtopics, setSubtopics] = useState({});
  const [flashcardDecks, setFlashcardDecks] = useState([]);
  const [ready, setReady] = useState(false);
  const [subtopicModal, setSubtopicModal] = useState(null);
  const [flash, setFlash] = useState("");
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [tabKey, setTabKey] = useState(0);

  useEffect(() => { injectKeyframes(); }, []);

  applyTheme(darkMode);
  const toggleTheme = () => { const next = !darkMode; setDarkMode(next); try { localStorage.setItem("rp26_dark", String(next)); } catch {} };
  const BACKUP_KEYS = ["rp26_sessions","rp26_reviews","rp26_revlogs","rp26_exams","rp26_subtopics","rp26_flashcards","rp26_seeded12","rp26_dark","rp_agenda_v7","rp_agenda_history","rp_streak_start","rp_max_streak"];
  function exportBackup() {
    const data = {}; BACKUP_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v !== null) data[k] = JSON.parse(v); });
    data._exportDate = new Date().toISOString(); data._version = "medtracker-backup-v1";
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `medtracker-backup-${today()}.json`; a.click(); URL.revokeObjectURL(url);
    notify("Backup salvo!");
  }
  function importBackup() {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = (e) => { const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = (ev) => { try {
      const data = JSON.parse(ev.target.result); if (!data._version) return alert("Arquivo inválido.");
      BACKUP_KEYS.forEach(k => { if (data[k] !== undefined) localStorage.setItem(k, JSON.stringify(data[k])); });
      notify("Backup restaurado! Recarregando..."); setTimeout(() => window.location.reload(), 1000);
    } catch { alert("Erro ao ler o arquivo."); } }; reader.readAsText(f); };
    input.click();
  }
  const [showBackupMenu, setShowBackupMenu] = useState(false);

  function switchTab(id) {
    if (id === tab) return;
    setTab(id);
    setTabKey((k) => k + 1);
  }

  useEffect(() => {
    Promise.all([loadKey("rp26_sessions", []), loadKey("rp26_reviews", []), loadKey("rp26_revlogs", []), loadKey("rp26_exams", []), loadKey("rp26_subtopics", {}), loadKey("rp26_seeded12", false), loadKey("rp26_flashcards", [])]).then(([s, r, rl, e, st, seeded, fc]) => {
      if (!seeded) {
        const revs = SEED_REVIEWS.map((r) => ({ ...r, id: uid(), key: `${r.area}__${r.theme.toLowerCase().trim()}`, history: [{ date: r.lastStudied, pct: r.lastPerf }] }));
        const logs = SEED_LOGS.map((l) => ({ ...l, id: uid() }));
        const se = buildUnicamp2024Exam();
        setSessions([]); setReviews(revs); setRevLogs(logs); setExams([se]); setSubtopics({});
        const seedFc = generateFlashcardDecks([se], revs, []);
        setFlashcardDecks(seedFc); saveKey("rp26_flashcards", seedFc);
        saveKey("rp26_reviews", revs); saveKey("rp26_revlogs", logs); saveKey("rp26_sessions", []); saveKey("rp26_exams", [se]); saveKey("rp26_subtopics", {}); saveKey("rp26_seeded12", true);
      } else {
        const loadedSessions = Array.isArray(s) ? s : [];
        const loadedReviews = Array.isArray(r) ? r : [];
        const loadedExams = Array.isArray(e) ? e : [];
        const loadedFc = Array.isArray(fc) ? fc : [];
        // Reset HAS review to due today (as if not yet reviewed)
        const hasKey = "clinica__sd. metabólica i — has e dislipidemia (sem. 08)";
        const fixedReviews = loadedReviews.map((r) => r.key === hasKey ? { ...r, intervalIndex: 0, nextDue: "2026-03-27", lastPerf: null, lastStudied: null, history: [] } : r);
        setSessions(loadedSessions); setReviews(fixedReviews); setRevLogs(Array.isArray(rl) ? rl : []); setExams(loadedExams); setSubtopics(st && typeof st === "object" && !Array.isArray(st) ? st : {});
        saveKey("rp26_reviews", fixedReviews);
        // Auto-generate or upgrade flashcards immediately with loaded data
        if (loadedExams.length > 0) {
          const needsUpgrade = loadedFc.length > 0 && loadedFc.some(d => !d._v || d._v < 2);
          if (loadedFc.length === 0 || needsUpgrade) {
            const newDecks = generateFlashcardDecks(loadedExams, loadedReviews, loadedSessions);
            if (newDecks.length > 0) {
              const finalFc = needsUpgrade ? mergeDecks(loadedFc, newDecks) : newDecks;
              setFlashcardDecks(finalFc); saveKey("rp26_flashcards", finalFc);
            } else { setFlashcardDecks(loadedFc); }
          } else { setFlashcardDecks(loadedFc); }
        } else { setFlashcardDecks(loadedFc); }
      }
      setReady(true);
    });
  }, []);
  const notify = (msg) => { setFlash(msg); setTimeout(() => setFlash(""), 2500); };
  const pS = (v) => { setSessions(v); saveKey("rp26_sessions", v); };
  const pR = (v) => { setReviews(v); saveKey("rp26_reviews", v); };
  const pL = (v) => { setRevLogs(v); saveKey("rp26_revlogs", v); };
  const pE = (v) => { setExams(v); saveKey("rp26_exams", v); };
  const pSt = (v) => { setSubtopics(v); saveKey("rp26_subtopics", v); };
  const pFc = (v) => { setFlashcardDecks(v); saveKey("rp26_flashcards", v); };
  function saveSubtopics(area, topic, items) {
    const key = `${area}__${topic}`;
    pSt({ ...subtopics, [key]: items });
  }
  function getSubtopics(area, topic) {
    return subtopics[`${area}__${topic}`] || [];
  }
  function addSubtopicReview(area, parentTheme, subtema, pct) {
    const key = `${area}__${parentTheme.toLowerCase().trim()}::${subtema.toLowerCase().trim()}`;
    const ex = reviews.find((r) => r.key === key);
    const ni = nxtIdx(ex?.intervalIndex || 0, pct);
    const rev = {
      id: ex?.id || uid(), key, area, theme: subtema, parentTheme,
      isSubtopic: true,
      intervalIndex: ni, nextDue: addDays(today(), INTERVALS[ni]),
      lastPerf: pct, lastStudied: today(),
      history: [...(ex?.history || []), { date: today(), pct }]
    };
    pR(ex ? reviews.map((r) => r.key === key ? rev : r) : [rev, ...reviews]);
    pL([{ id: uid(), date: today(), area, theme: `${parentTheme} › ${subtema}`, parentTheme, subtema, pct, isSubtopic: true }, ...revLogs]);
  }
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
  function undoMarkReview(revId) {
    const rev = reviews.find((r) => r.id === revId); if (!rev) return;
    const hist = rev.history || [];
    if (hist.length <= 1) {
      // Only one entry — reset to due today with no perf
      pR(reviews.map((r) => r.id !== revId ? r : { ...r, intervalIndex: 0, nextDue: today(), lastPerf: null, lastStudied: null, history: [] }));
    } else {
      const prev = hist[hist.length - 2];
      const ni = nxtIdx(rev.intervalIndex > 0 ? rev.intervalIndex - 1 : 0, prev.pct);
      pR(reviews.map((r) => r.id !== revId ? r : { ...r, intervalIndex: prev.intervalIndex ?? ni, nextDue: today(), lastPerf: prev.pct, lastStudied: prev.date, history: hist.slice(0, -1) }));
    }
    // Remove the most recent log for this theme
    const revTheme = rev.theme;
    const logIdx = revLogs.findIndex((l) => l.theme === revTheme && l.date === today());
    if (logIdx >= 0) pL(revLogs.filter((_, i) => i !== logIdx));
    notify("↩ Revisão desfeita — voltou para hoje");
  }
  function editReview(revId, ni, nd) { pR(reviews.map((r) => r.id !== revId ? r : { ...r, intervalIndex: ni, nextDue: nd })); notify("✓ Corrigido"); }
  function addExam(exam) { const newExams = [{ ...exam, id: uid() }, ...exams]; pE(newExams); notify("✓ Prova registrada"); setTimeout(() => { const newDecks = generateFlashcardDecks(newExams, reviews, sessions); const merged = mergeDecks(flashcardDecks, newDecks); pFc(merged); }, 100); }
  function delSession(id) { pS(sessions.filter((s) => s.id !== id)); }
  function delExam(id) { pE(exams.filter((e) => e.id !== id)); }
  function updateExam(id, updates) { pE(exams.map((e) => e.id !== id ? e : { ...e, ...updates })); notify("✓ Prova atualizada"); regenerateFlashcards(); }
  function regenerateFlashcards() {
    setTimeout(() => {
      const newDecks = generateFlashcardDecks(exams, reviews, sessions);
      const merged = mergeDecks(flashcardDecks, newDecks);
      pFc(merged);
    }, 100);
  }
  function handleFlashcardReview(deckId, cardId, qualityKey) {
    const updated = reviewCard(flashcardDecks, deckId, cardId, qualityKey);
    pFc(updated);
  }
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
    { id: "dashboard", label: "Dashboard" },
    { id: "revisoes", label: `Revisões${dueR.length ? ` (${dueR.length})` : ""}` },
    { id: "provas", label: "Provas" },
    { id: "temas", label: "Temas" },
    { id: "agenda", label: "Agenda" },
  ];


  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F, color: C.text }}>
      {/* HEADER */}
      <div style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 20px)", background: `linear-gradient(160deg, rgba(129,140,248,0.12) 0%, rgba(196,181,253,0.10) 50%, transparent 100%)`, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px 10px", maxWidth: 1200, margin: "0 auto", gap: 0 }}>
          <div onClick={() => switchTab("dashboard")} style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0, marginRight: 14, cursor: "pointer" }}>
            <img src={import.meta.env.BASE_URL + "logo-cropped.png"} alt="MedTracker" style={{ width: 42, height: 42 }} />
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.6, fontFamily: F }}><span style={{ color: C.purple }}>Med</span><span style={{ color: C.text, fontWeight: 700 }}>Tracker</span></span>
          </div>
          {/* Desktop tabs */}
          <div className="desktop-tabs" style={{ display: "flex", gap: 4, flex: 1, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch", padding: "2px 0" }}>
            {TABS.map((t) => { const active = tab === t.id; return (
              <button key={t.id} onClick={() => switchTab(t.id)} style={{ padding: "7px 14px", background: active ? `linear-gradient(135deg, rgba(129,140,248,0.25), rgba(196,181,253,0.3))` : "transparent", border: active ? `1px solid rgba(196,181,253,0.35)` : "1px solid transparent", borderRadius: R.pill, cursor: "pointer", whiteSpace: "nowrap", color: active ? C.text : C.text3, fontSize: 13, fontFamily: F, fontWeight: active ? 700 : 500, transition: "all .25s cubic-bezier(.4,0,.2,1)", opacity: active ? 1 : 0.6, boxShadow: active ? `0 0 16px rgba(129,140,248,0.15)` : "none", flexShrink: 0, transform: active ? "scale(1)" : "scale(.97)" }}>{t.label}</button>
            ); })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, marginLeft: "auto" }}>
            {flash && (<span className="fade-in" style={{ fontSize: 10, color: C.green, fontFamily: FM, fontWeight: 600, background: `rgba(34,197,94,0.1)`, padding: "4px 10px", borderRadius: R.pill, border: `1px solid rgba(34,197,94,0.2)` }}>{flash}</span>)}
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowBackupMenu(v => !v)} style={{ background: "none", border: "none", width: 28, height: 28, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.text3, opacity: 0.35, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.7"} onMouseLeave={e => e.currentTarget.style.opacity = "0.35"}>{"💾"}</button>
              {showBackupMenu && <div className="fade-in" style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: R.lg, boxShadow: SH.lg, overflow: "hidden", zIndex: 200, minWidth: 180 }}>
                <button onClick={() => { exportBackup(); setShowBackupMenu(false); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", color: C.text, fontSize: 13, fontFamily: F, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = C.surface} onMouseLeave={e => e.currentTarget.style.background = "none"}>{"📤"} Exportar backup</button>
                <button onClick={() => { importBackup(); setShowBackupMenu(false); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: C.text, fontSize: 13, fontFamily: F, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = C.surface} onMouseLeave={e => e.currentTarget.style.background = "none"}>{"📥"} Restaurar backup</button>
              </div>}
            </div>
            <button onClick={toggleTheme} style={{ background: "none", border: "none", width: 28, height: 28, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.text3, opacity: 0.35, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.7"} onMouseLeave={e => e.currentTarget.style.opacity = "0.35"}>{darkMode ? "☀" : "☽"}</button>
          </div>
        </div>
      </div>
      {showSessionModal && <SessionModal onSave={(s) => { addSession(s); setShowSessionModal(false); }} onClose={() => setShowSessionModal(false)} />}
      {subtopicModal && <SubtopicModal area={subtopicModal.area} topic={subtopicModal.topic} semana={subtopicModal.semana} existing={getSubtopics(subtopicModal.area, subtopicModal.topic)} onSave={(items) => { saveSubtopics(subtopicModal.area, subtopicModal.topic, items); setSubtopicModal(null); notify(items.length > 0 ? `✓ ${items.length} subtema${items.length > 1 ? "s" : ""} salvo${items.length > 1 ? "s" : ""}` : "✓ Aula marcada"); }} onClose={() => setSubtopicModal(null)} />}
      {/* CONTENT */}
      <div style={{ padding: `${S.xl}px`, maxWidth: 1200, margin: "0 auto", paddingBottom: 100 }}>
        <div key={tabKey} className="fade-in">
          <div style={{ display: tab === "agenda" ? "block" : "none" }}><Agenda reviews={reviews} revLogs={revLogs} alertThemes={alertThemes} subtopics={subtopics} onAulaChecked={(area, topic, semana) => setSubtopicModal({ area, topic, semana })} /></div>
          {tab === "dashboard" && <Dashboard revLogs={revLogs} sessions={sessions} exams={exams} reviews={reviews} dueCount={dueR.length} onNotionSync={handleNotionSync} onNewSession={() => setShowSessionModal(true)} onAlerts={() => switchTab("alertas")} flashcardDecks={flashcardDecks} onNavigateFlashcards={() => switchTab("flashcards")} />}
          {tab === "alertas" && <Dashboard revLogs={revLogs} sessions={sessions} exams={exams} reviews={reviews} dueCount={dueR.length} onNotionSync={handleNotionSync} onNewSession={() => setShowSessionModal(true)} onAlerts={() => switchTab("alertas")} forceTab="alerts" flashcardDecks={flashcardDecks} onNavigateFlashcards={() => switchTab("flashcards")} />}
          {tab === "sessoes" && <Sessoes sessions={sessions} onAdd={addSession} onDel={delSession} />}
          {tab === "revisoes" && <Revisoes due={dueR} upcoming={upR} revLogs={revLogs} reviews={reviews} sessions={sessions} subtopics={subtopics} onMark={markReview} onQuick={addRevLog} onEditLog={editRevLog} onDelLog={delRevLog} onSubtopicReview={addSubtopicReview} onSaveSubtopics={saveSubtopics} onUndoMark={undoMarkReview} />}
          {tab === "provas" && <Provas exams={exams} revLogs={revLogs} sessions={sessions} onAdd={addExam} onDel={delExam} onUpdate={updateExam} />}
          {tab === "temas" && <Temas reviews={reviews} subtopics={subtopics} onEditInterval={editReview} onSaveSubtopics={saveSubtopics} />}
          {tab === "flashcards" && <Flashcards decks={flashcardDecks} onReview={handleFlashcardReview} />}
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
