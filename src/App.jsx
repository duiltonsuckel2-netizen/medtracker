import React, { Suspense } from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { AREAS, INTERVALS, INT_LABELS, SEED_REVIEWS, SEED_LOGS, areaMap, buildUnicamp2024Exam, LOG_NAME_MAP } from "./data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, applyTheme, injectKeyframes } from "./theme.js";
import { today, addDays, perc, uid, fmtDate, nxtIdx } from "./utils.js";
import { loadKey, saveKey } from "./storage.js";
import { Agenda } from "./components/Agenda.jsx";
import { SessionModal } from "./components/SessionModal.jsx";
import { Sessoes } from "./components/Sessoes.jsx";
import { SubtopicModal, SubtopicReviewModal } from "./components/SubtopicModal.jsx";
import { SkeletonCard } from "./components/UI.jsx";
import { generateFlashcardDecks, mergeDecks, reviewCard } from "./flashcards.js";
import { initSync, createSync, joinSync, disconnectSync, debouncedPush, getSyncId, pushToCloud, pullFromCloud, forceSync } from "./sync.js";

const Dashboard = React.lazy(() => import("./components/Dashboard.jsx").then(m => ({ default: m.Dashboard })));
const Revisoes = React.lazy(() => import("./components/Revisoes.jsx").then(m => ({ default: m.Revisoes })));
const Temas = React.lazy(() => import("./components/Temas.jsx").then(m => ({ default: m.Temas })));
const Provas = React.lazy(() => import("./components/Provas.jsx").then(m => ({ default: m.Provas })));
const Flashcards = React.lazy(() => import("./components/Flashcards.jsx").then(m => ({ default: m.Flashcards })));

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
  const [undoAction, setUndoAction] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [tabKey, setTabKey] = useState(0);

  useEffect(() => { injectKeyframes(); }, []);
  applyTheme(darkMode);
  const toggleTheme = () => { const next = !darkMode; setDarkMode(next); try { localStorage.setItem("rp26_dark", String(next)); } catch {} };
  const BACKUP_KEYS = ["rp26_sessions","rp26_reviews","rp26_revlogs","rp26_exams","rp26_subtopics","rp26_flashcards","rp26_seeded12","rp26_dark","rp_agenda_v7","rp_agenda_history","rp_streak_start","rp_max_streak","rp26_mig_v4","rp26_mig_v5","rp26_mig_v6","rp26_mig_v7","rp26_mig_v8","rp26_mig_v9"];
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
      const data = JSON.parse(ev.target.result);
      if (!data._version) return alert("Arquivo inválido — não é um backup do MedTracker.");
      if (!data._version.startsWith("medtracker-backup-")) return alert("Formato de backup não reconhecido.");
      if (!confirm(`Restaurar backup de ${data._exportDate ? new Date(data._exportDate).toLocaleDateString("pt-BR") : "data desconhecida"}? Isso vai substituir todos os dados atuais.`)) return;
      BACKUP_KEYS.forEach(k => { if (data[k] !== undefined) localStorage.setItem(k, JSON.stringify(data[k])); });
      // Mark all migrations as done — imported data is already migrated
      ["rp26_mig_v4","rp26_mig_v5","rp26_mig_v6","rp26_mig_v7","rp26_mig_v8","rp26_mig_v9"].forEach(k => localStorage.setItem(k, "1"));
      notify("Backup restaurado! Recarregando..."); setTimeout(() => window.location.reload(), 1000);
    } catch { alert("Erro ao ler o arquivo."); } }; reader.readAsText(f); };
    input.click();
  }
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [syncStatus, setSyncStatus] = useState("off"); // off | syncing | synced | error
  const [syncId, setSyncId] = useState(getSyncId());
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncInput, setSyncInput] = useState("");

  // Sync initialization
  const [syncBanner, setSyncBanner] = useState(false);
  useEffect(() => {
    initSync(
      () => setSyncBanner(true), // on remote update: show banner
      (status) => setSyncStatus(status)
    ).then((active) => {
      if (active) setSyncStatus("synced");
    });
  }, []);

  function triggerSync() { debouncedPush(); }
  const [showSyncActions, setShowSyncActions] = useState(false);
  async function handlePushOnly() {
    setShowSyncActions(false);
    setSyncStatus("syncing");
    const ok = await pushToCloud();
    if (ok) { setSyncStatus("synced"); notify("Dados enviados para a nuvem!"); }
    else { setSyncStatus("error"); notify("Erro ao enviar"); }
  }
  async function handlePullOnly() {
    setShowSyncActions(false);
    setSyncStatus("syncing");
    const ok = await pullFromCloud();
    if (ok) { setSyncStatus("synced"); notify("Dados recebidos! Recarregando..."); setTimeout(() => window.location.reload(), 800); }
    else { setSyncStatus("error"); notify("Erro ao receber"); }
  }

  function switchTab(id) {
    if (id !== tab) {
      setTab(id);
      setTabKey((k) => k + 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        let loadedReviews = Array.isArray(r) ? r : [];
        let loadedExams = Array.isArray(e) ? e : [];
        const loadedFc = Array.isArray(fc) ? fc : [];
        // Migration v4: fix HAS card + remove 1d interval (based on real Notion data)
        if (!localStorage.getItem("rp26_mig_v4")) {
          localStorage.setItem("rp26_mig_v4", "1");
          // Canonical card identity
          const hasTheme = "Sd. Metabólica I — HAS e Dislipidemia (Sem. 08)";
          const hasKey = `clinica__${hasTheme.toLowerCase().trim()}`;
          // Match any HAS variant (main cards only, preserve subtopics)
          const isHasMainCard = (rv) => !rv.isSubtopic && rv.area === "clinica" && (
            rv.key.includes("metabólica") || rv.key.includes("metabolica") ||
            rv.key.includes("dislipidemia") || rv.key.includes("has e") ||
            rv.key.includes("has —") || rv.key.includes("hipertensão arterial")
          );
          // 1) Shift all intervalIndex down by 1 (removed old 1d interval)
          loadedReviews = loadedReviews.map((rv) => ({ ...rv, intervalIndex: Math.max(0, rv.intervalIndex - 1) }));
          // 2) Remove all HAS variants (may exist with different keys)
          loadedReviews = loadedReviews.filter((rv) => !isHasMainCard(rv));
          // 3) Add single canonical card — state from Notion:
          //    Mar 10: 78%, Mar 17: 83% → gap 14d → idx 1, nextDue Mar 24
          //    Today is Mar 27 so 3 days overdue → shows as "pendente"
          loadedReviews.unshift({
            id: uid(), key: hasKey, area: "clinica", theme: hasTheme,
            intervalIndex: 1, nextDue: "2026-03-24", lastPerf: 83,
            lastStudied: "2026-03-17",
            history: [{ date: "2026-03-10", pct: 78 }, { date: "2026-03-17", pct: 83 }]
          });
          saveKey("rp26_reviews", loadedReviews);
        }
        // Migration v5: fix intervalIndex for Hemorragia Dig II and SUS (Notion says 1 mês = idx 2)
        if (!localStorage.getItem("rp26_mig_v5")) {
          localStorage.setItem("rp26_mig_v5", "1");
          const fixes = {
            "cirurgia__hemorragia digestiva ii — proctologia (sem. 08)": 2,
            "preventiva__sus — evolução histórica e financiamento (sem. 09)": 2,
          };
          let changed = false;
          loadedReviews = loadedReviews.map((rv) => {
            const fixIdx = fixes[rv.key];
            if (fixIdx !== undefined && rv.intervalIndex !== fixIdx) {
              changed = true;
              return { ...rv, intervalIndex: fixIdx };
            }
            return rv;
          });
          if (changed) saveKey("rp26_reviews", loadedReviews);
        }
        // Migration v6: rename abbreviated log themes → official names + fix "Sd. Disfágica (Sem. 02)" review
        let loadedLogs = Array.isArray(rl) ? rl : [];
        if (!localStorage.getItem("rp26_mig_v6")) {
          localStorage.setItem("rp26_mig_v6", "1");
          // 1) Rename revLogs themes
          let logsChanged = false;
          loadedLogs = loadedLogs.map((l) => {
            const mapped = LOG_NAME_MAP[l.theme];
            if (mapped) { logsChanged = true; return { ...l, theme: mapped }; }
            return l;
          });
          if (logsChanged) saveKey("rp26_revlogs", loadedLogs);
          // 2) Fix review card "Sd. Disfágica (Sem. 02)" → "Hipertensão Porta (Sem. 02)"
          const oldKey = "cirurgia__sd. disfágica (sem. 02)";
          const newTheme = "Hipertensão Porta (Sem. 02)";
          const newKey = `cirurgia__${newTheme.toLowerCase().trim()}`;
          let revChanged = false;
          loadedReviews = loadedReviews.map((rv) => {
            if (rv.key === oldKey) { revChanged = true; return { ...rv, theme: newTheme, key: newKey }; }
            return rv;
          });
          if (revChanged) saveKey("rp26_reviews", loadedReviews);
        }
        // Migration v7: normalize all review card + log theme names to include semester
        if (!localStorage.getItem("rp26_mig_v7")) {
          localStorage.setItem("rp26_mig_v7", "1");
          let rcChanged = false, rlChanged = false;
          loadedReviews = loadedReviews.map((rv) => {
            if (rv.isSubtopic) return rv;
            const mapped = LOG_NAME_MAP[rv.theme];
            if (mapped && mapped !== rv.theme) {
              rcChanged = true;
              const newKey = `${rv.area}__${mapped.toLowerCase().trim()}`;
              return { ...rv, theme: mapped, key: newKey };
            }
            return rv;
          });
          // Deduplicate: if renaming created a duplicate key, merge histories
          const seen = new Map();
          const deduped = [];
          for (const rv of loadedReviews) {
            if (seen.has(rv.key)) {
              const existing = seen.get(rv.key);
              existing.history = [...(existing.history || []), ...(rv.history || [])];
              if (rv.lastStudied > existing.lastStudied) { existing.lastStudied = rv.lastStudied; existing.lastPerf = rv.lastPerf; existing.intervalIndex = rv.intervalIndex; existing.nextDue = rv.nextDue; }
              rcChanged = true;
            } else { seen.set(rv.key, rv); deduped.push(rv); }
          }
          if (rcChanged) { loadedReviews = deduped; saveKey("rp26_reviews", loadedReviews); }
          loadedLogs = loadedLogs.map((l) => {
            if (l.isSubtopic) return l;
            const mapped = LOG_NAME_MAP[l.theme];
            if (mapped && mapped !== l.theme) { rlChanged = true; return { ...l, theme: mapped }; }
            return l;
          });
          if (rlChanged) saveKey("rp26_revlogs", loadedLogs);
        }
        // Fix any reviews with missing nextDue (caused by editReview bug)
        let fixedDue = false;
        const td = today();
        loadedReviews = loadedReviews.map((rv) => {
          if (!rv.nextDue) { fixedDue = true; return { ...rv, nextDue: td }; }
          return rv;
        });
        if (fixedDue) saveKey("rp26_reviews", loadedReviews);
        // Migration v8: fix reviews whose nextDue was incorrectly calculated by the
        // previous fixedDue formula (lastStudied + interval → often a past date).
        // These reviews should be due today, not weeks in the past.
        if (!localStorage.getItem("rp26_mig_v8")) {
          localStorage.setItem("rp26_mig_v8", "1");
          let v8changed = false;
          loadedReviews = loadedReviews.map((rv) => {
            if (!rv.lastStudied || !rv.nextDue || rv.nextDue >= td) return rv;
            // Check if nextDue matches the old fixedDue formula
            const oldCalc = addDays(rv.lastStudied, INTERVALS[rv.intervalIndex || 0]);
            if (rv.nextDue === oldCalc) { v8changed = true; return { ...rv, nextDue: td }; }
            return rv;
          });
          if (v8changed) saveKey("rp26_reviews", loadedReviews);
        }
        // Migration v9: recalculate all review intervals from history
        // (fixes corruption caused by sync merging old cloud data)
        if (!localStorage.getItem("rp26_mig_v9")) {
          localStorage.setItem("rp26_mig_v9", "1");
          let v9changed = false;
          const td9 = today();
          loadedReviews = loadedReviews.map((rv) => {
            const hist = rv.history || [];
            if (hist.length === 0) return rv;
            // Replay history to get correct intervalIndex
            let idx = 0;
            for (const entry of hist) {
              idx = nxtIdx(idx, entry.pct);
            }
            const lastEntry = hist[hist.length - 1];
            const correctLastStudied = lastEntry.date || rv.lastStudied;
            const correctLastPerf = lastEntry.pct != null ? lastEntry.pct : rv.lastPerf;
            const correctNextDue = addDays(correctLastStudied, INTERVALS[idx]);
            if (rv.intervalIndex !== idx || rv.nextDue !== correctNextDue || rv.lastStudied !== correctLastStudied) {
              v9changed = true;
              return { ...rv, intervalIndex: idx, nextDue: correctNextDue, lastStudied: correctLastStudied, lastPerf: correctLastPerf };
            }
            return rv;
          });
          if (v9changed) saveKey("rp26_reviews", loadedReviews);
        }
        // Restore seed exam if all exams were deleted
        if (loadedExams.length === 0) {
          const restoredExam = buildUnicamp2024Exam();
          loadedExams = [restoredExam];
          saveKey("rp26_exams", loadedExams);
        }
        // Recover subtopics from review cards if rp26_subtopics was lost/empty
        let loadedSt = st && typeof st === "object" && !Array.isArray(st) ? st : {};
        if (Object.keys(loadedSt).length === 0) {
          const recovered = {};
          loadedReviews.forEach((rv) => {
            if (rv.subtopicNames && rv.subtopicNames.length > 0 && !rv.isSubtopic) {
              const k = `${rv.area}__${rv.theme}`;
              if (!recovered[k] || rv.subtopicNames.length > recovered[k].length) {
                recovered[k] = rv.subtopicNames;
              }
            }
          });
          if (Object.keys(recovered).length > 0) {
            loadedSt = recovered;
            saveKey("rp26_subtopics", recovered);
          }
        }
        setSessions(loadedSessions); setReviews(loadedReviews); setRevLogs(loadedLogs); setExams([...loadedExams]); setSubtopics(loadedSt);
        // Auto-generate or merge flashcards on every load (picks up new THEME_SUMMARIES)
        if (loadedExams.length > 0) {
          const newDecks = generateFlashcardDecks(loadedExams, loadedReviews, loadedSessions);
          if (newDecks.length > 0) {
            const finalFc = loadedFc.length > 0 ? mergeDecks(loadedFc, newDecks) : newDecks;
            setFlashcardDecks(finalFc); saveKey("rp26_flashcards", finalFc);
          } else { setFlashcardDecks(loadedFc); }
        } else { setFlashcardDecks(loadedFc); }
      }
      // Migration v3: fix all intervalIndex by real gap, restore HAS correctly
      const migKey3 = "rp26_mig_v3_fix_intervals";
      if (seeded && !localStorage.getItem(migKey3)) {
        localStorage.setItem(migKey3, "1");
        let revs = [...loadedReviews];
        const td3 = today();
        const IVALS = [7, 14, 30, 60, 90, 120, 180];
        // 1) Recalculate intervalIndex from real gap (nextDue - lastStudied)
        revs = revs.map((rv) => {
          if (!rv.lastStudied || !rv.nextDue) return rv;
          const gap = Math.round((new Date(rv.nextDue) - new Date(rv.lastStudied)) / 86400000);
          let bestIdx = 0;
          for (let i = 0; i < IVALS.length; i++) {
            if (Math.abs(gap - IVALS[i]) <= Math.abs(gap - IVALS[bestIdx])) bestIdx = i;
          }
          return { ...rv, intervalIndex: bestIdx };
        });
        // 2) Fix HAS card (old theme had "Dislipidemia" or "Metabólica")
        const hasNewTheme = "HAS — Hipertensão Arterial (Sem. 08)";
        const hasNewKey = `clinica__${hasNewTheme.toLowerCase().trim()}`;
        const oldIdx = revs.findIndex((rv) => rv.area === "clinica" && (rv.key.includes("metabólica") || rv.key.includes("metabolica") || rv.key.includes("dislipidemia") || rv.key.includes("has e")));
        if (oldIdx >= 0) {
          revs[oldIdx] = { ...revs[oldIdx], theme: hasNewTheme, key: hasNewKey, nextDue: td3 };
        } else {
          const migLogs = Array.isArray(rl) ? rl : [];
          const hasLogs = migLogs.filter((l) => l.area === "clinica" && l.theme && (l.theme.toLowerCase().includes("has") || l.theme.toLowerCase().includes("hipertens")));
          const lastLog = hasLogs.sort((a, b) => b.date.localeCompare(a.date))[0];
          revs.unshift({
            id: uid(), key: hasNewKey, area: "clinica", theme: hasNewTheme,
            intervalIndex: 1, nextDue: td3, lastPerf: lastLog?.pct || 78,
            lastStudied: lastLog?.date || "2026-03-10",
            history: hasLogs.length > 0 ? hasLogs.map((l) => ({ date: l.date, pct: l.pct })) : [{ date: "2026-03-10", pct: 78 }]
          });
        }
        // 3) Remove any standalone Dislipidemia card
        revs = revs.filter((rv) => {
          const k = rv.key.toLowerCase();
          return !(k.includes("dislipidemia") && !k.includes("has"));
        });
        loadedReviews = revs;
        setReviews(revs); saveKey("rp26_reviews", revs);
      }
      setReady(true);
    });
  }, []);
  const undoTimerRef = React.useRef(null);
  const notify = (msg) => { setFlash(msg); setTimeout(() => setFlash(""), 2500); };
  const pS = (v) => { if (typeof v === "function") { setSessions((prev) => { const next = v(prev); saveKey("rp26_sessions", next); return next; }); } else { setSessions(v); saveKey("rp26_sessions", v); } triggerSync(); };
  const pR = (v) => { if (typeof v === "function") { setReviews((prev) => { const next = v(prev); saveKey("rp26_reviews", next); return next; }); } else { setReviews(v); saveKey("rp26_reviews", v); } triggerSync(); };
  const pL = (v) => { if (typeof v === "function") { setRevLogs((prev) => { const next = v(prev); saveKey("rp26_revlogs", next); return next; }); } else { setRevLogs(v); saveKey("rp26_revlogs", v); } triggerSync(); };
  const pE = (v) => { if (typeof v === "function") { setExams((prev) => { const next = v(prev); saveKey("rp26_exams", next); return next; }); } else { setExams(v); saveKey("rp26_exams", v); } triggerSync(); };
  const pSt = (v) => { if (typeof v === "function") { setSubtopics((prev) => { const next = v(prev); saveKey("rp26_subtopics", next); return next; }); } else { setSubtopics(v); saveKey("rp26_subtopics", v); } triggerSync(); };
  const pFc = (v) => { if (typeof v === "function") { setFlashcardDecks((prev) => { const next = v(prev); saveKey("rp26_flashcards", next); return next; }); } else { setFlashcardDecks(v); saveKey("rp26_flashcards", v); } triggerSync(); };
  function saveSubtopics(area, topic, items) {
    const key = `${area}__${topic}`;
    pSt((prev) => ({ ...prev, [key]: items }));
    // Persist subtopic names on matching review cards for reliable lookup
    if (items.length > 0) {
      const tWords = topic.toLowerCase().replace(/[—–\-]/g, " ").split(/\s+/).filter((w) => w.length >= 3);
      pR((prevReviews) => {
        const updated = prevReviews.map((r) => {
          if (r.area !== area || r.isSubtopic) return r;
          const rWords = r.theme.toLowerCase().replace(/\s*\(sem\.\s*\d+\)\s*/gi, " ").replace(/[—–\-]/g, " ").split(/\s+/).filter((w) => w.length >= 3);
          const shared = tWords.filter((tw) => rWords.some((rw) => rw.includes(tw) || tw.includes(rw)));
          if (shared.length >= Math.ceil(tWords.length * 0.5)) return { ...r, subtopicNames: items };
          return r;
        });
        return updated.some((r, i) => r !== prevReviews[i]) ? updated : prevReviews;
      });
    }
  }
  function getSubtopics(area, topic) {
    return subtopics[`${area}__${topic}`] || [];
  }
  function addSubtopicReview(area, parentTheme, subtema, pct) {
    const key = `${area}__${parentTheme.toLowerCase().trim()}::${subtema.toLowerCase().trim()}`;
    pR((prevReviews) => {
      const ex = prevReviews.find((r) => r.key === key);
      const ni = nxtIdx(ex?.intervalIndex || 0, pct);
      const rev = {
        id: ex?.id || uid(), key, area, theme: subtema, parentTheme,
        isSubtopic: true,
        intervalIndex: ni, nextDue: addDays(today(), INTERVALS[ni]),
        lastPerf: pct, lastStudied: today(),
        history: [...(ex?.history || []), { date: today(), pct }]
      };
      return ex ? prevReviews.map((r) => r.key === key ? rev : r) : [rev, ...prevReviews];
    });
    pL((prevLogs) => [{ id: uid(), date: today(), area, theme: `${parentTheme} › ${subtema}`, parentTheme, subtema, pct, isSubtopic: true }, ...prevLogs]);
  }
  function addSession(session) {
    if (!session.theme || !session.area) return;
    const s = { ...session, id: uid(), createdAt: today() }; pS((prev) => [s, ...prev]);
    const key = `${session.area}__${session.theme.toLowerCase().trim()}`;
    const pct = perc(session.acertos, session.total);
    pR((prevReviews) => {
      const ex = prevReviews.find((r) => r.key === key);
      const ni = nxtIdx(ex?.intervalIndex || 0, pct);
      const rev = { id: ex?.id || uid(), key, area: session.area, theme: session.theme, intervalIndex: ni, nextDue: addDays(today(), INTERVALS[ni]), lastPerf: pct, lastStudied: today(), history: [...(ex?.history || []), { date: today(), pct }] };
      return ex ? prevReviews.map((r) => r.key === key ? rev : r) : [rev, ...prevReviews];
    });
  }
  function addRevLog(areaId, theme, total, acertos) {
    if (!theme || !areaId) return;
    const pct = perc(acertos, total);
    pL((prevLogs) => [{ id: uid(), date: today(), area: areaId, theme, total, acertos, pct }, ...prevLogs]);
    const key = `${areaId}__${theme.toLowerCase().trim()}`;
    pR((prevReviews) => {
      const ex = prevReviews.find((r) => r.key === key);
      if (ex) { const ni = nxtIdx(ex.intervalIndex, pct); return prevReviews.map((r) => r.key === key ? { ...r, intervalIndex: ni, nextDue: addDays(today(), INTERVALS[ni]), lastPerf: pct, lastStudied: today(), history: [...(r.history || []), { date: today(), pct }] } : r); }
      return [{ id: uid(), key, area: areaId, theme, intervalIndex: nxtIdx(0, pct), nextDue: addDays(today(), INTERVALS[nxtIdx(0, pct)]), lastPerf: pct, lastStudied: today(), history: [{ date: today(), pct }] }, ...prevReviews];
    });
    notify("✓ Revisão registrada");
  }
  function markReview(revId, acertos, total, subtopicScores) {
    const pct = perc(acertos, total);
    // Read rev from current state for log entry (before pR runs)
    const rev = reviews.find((r) => r.id === revId); if (!rev) return;
    const ni = nxtIdx(rev.intervalIndex, pct);
    // Update main card + subtopic cards in one batch
    pR((prevReviews) => {
      const prevRev = prevReviews.find((r) => r.id === revId); if (!prevRev) return prevReviews;
      const niInner = nxtIdx(prevRev.intervalIndex, pct);
      const entry = { date: today(), pct, _prev: { intervalIndex: prevRev.intervalIndex, nextDue: prevRev.nextDue, lastPerf: prevRev.lastPerf, lastStudied: prevRev.lastStudied } };
      let newReviews = prevReviews.map((r) => r.id !== revId ? r : { ...r, intervalIndex: niInner, nextDue: addDays(today(), INTERVALS[niInner]), lastPerf: pct, lastStudied: today(), history: [...(r.history || []), entry] });
      if (subtopicScores && subtopicScores.length > 0) {
        subtopicScores.forEach((s) => {
          const sKey = `${prevRev.area}__${prevRev.theme.toLowerCase().trim()}::${s.name.toLowerCase().trim()}`;
          const ex = newReviews.find((r) => r.key === sKey);
          const sni = nxtIdx(ex?.intervalIndex || 0, s.pct);
          const sRev = {
            id: ex?.id || uid(), key: sKey, area: prevRev.area, theme: s.name, parentTheme: prevRev.theme,
            isSubtopic: true, intervalIndex: sni, nextDue: addDays(today(), INTERVALS[sni]),
            lastPerf: s.pct, lastStudied: today(),
            history: [...(ex?.history || []), { date: today(), pct: s.pct }]
          };
          newReviews = ex ? newReviews.map((r) => r.key === sKey ? sRev : r) : [sRev, ...newReviews];
        });
      }
      return newReviews;
    });
    // Single log entry with inline subtopic scores
    const logEntry = { id: uid(), date: today(), area: rev.area, theme: rev.theme, total, acertos, pct };
    if (subtopicScores && subtopicScores.length > 0) logEntry.subtopicScores = subtopicScores;
    pL((prevLogs) => [logEntry, ...prevLogs]);
    notify("✓ Concluída — próximo: " + INT_LABELS[ni]);
  }
  function undoMarkReview(revId) {
    const targetRev = reviews.find((r) => r.id === revId);
    pR((prevReviews) => {
      const rev = prevReviews.find((r) => r.id === revId); if (!rev) return prevReviews;
      const hist = rev.history || [];
      if (hist.length === 0) return prevReviews;
      const last = hist[hist.length - 1];
      const prev = last._prev;
      if (prev) {
        return prevReviews.map((r) => r.id !== revId ? r : { ...r, intervalIndex: prev.intervalIndex, nextDue: prev.nextDue, lastPerf: prev.lastPerf, lastStudied: prev.lastStudied, history: hist.slice(0, -1) });
      }
      const prevEntry = hist.length >= 2 ? hist[hist.length - 2] : null;
      return prevReviews.map((r) => r.id !== revId ? r : { ...r, nextDue: today(), lastPerf: prevEntry?.pct ?? rev.lastPerf, lastStudied: prevEntry?.date ?? rev.lastStudied, history: hist.slice(0, -1) });
    });
    pL((prevLogs) => {
      const logIdx = prevLogs.findIndex((l) => l.date === today() && targetRev && l.area === targetRev.area && l.theme === targetRev.theme);
      return logIdx >= 0 ? prevLogs.filter((_, i) => i !== logIdx) : prevLogs;
    });
    notify("↩ Revisão desfeita — voltou para hoje");
  }
  function editReview(revId, ni, nd) { pR((prev) => prev.map((r) => r.id !== revId ? r : { ...r, intervalIndex: ni, nextDue: nd || addDays(r.lastStudied || today(), INTERVALS[ni]) })); notify("✓ Corrigido"); }
  function addExam(exam) { const newExams = [{ ...exam, id: uid() }, ...exams]; pE(newExams); notify("✓ Prova registrada"); setTimeout(() => { const newDecks = generateFlashcardDecks(newExams, reviews, sessions); const merged = mergeDecks(flashcardDecks, newDecks); pFc(merged); }, 100); }
  function delSession(id) { pS((prev) => prev.filter((s) => s.id !== id)); }
  function delExam(id) { pE((prev) => prev.filter((e) => e.id !== id)); }
  function updateExam(id, updates) { pE((prev) => prev.map((e) => e.id !== id ? e : { ...e, ...updates })); notify("✓ Prova atualizada"); regenerateFlashcards(); }
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
  function editRevLog(logId, updates) { pL((prev) => prev.map((l) => l.id !== logId ? l : { ...l, ...updates, pct: updates.acertos != null && updates.total != null ? perc(updates.acertos, updates.total) : l.pct })); notify("✓ Revisão atualizada"); }
  function delRevLog(logId) {
    const deleted = revLogs.find((l) => l.id === logId);
    if (!deleted) return;
    pL((prev) => prev.filter((l) => l.id !== logId));
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoAction({ type: "revlog", item: deleted });
    undoTimerRef.current = setTimeout(() => { setUndoAction(null); undoTimerRef.current = null; }, 6000);
  }
  function handleUndo() {
    if (!undoAction) return;
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null; }
    if (undoAction.type === "revlog") {
      setRevLogs((prev) => { const updated = [undoAction.item, ...prev]; saveKey("rp26_revlogs", updated); return updated; });
    }
    setUndoAction(null);
    notify("✓ Revisão restaurada");
  }
  function handleNotionSync(newRevs) {
    if (!Array.isArray(newRevs)) return;
    const existing = [...reviews];
    newRevs.forEach((nr) => {
      if (!nr.theme || !nr.area) return;
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
    { id: "agenda", label: "Agenda" },
    { id: "provas", label: "Provas" },
    { id: "temas", label: "Temas" },
  ];


  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F, color: C.text }}>
      {/* HEADER */}
      <div style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 20px)", background: `linear-gradient(160deg, rgba(129,140,248,0.12) 0%, rgba(196,181,253,0.10) 50%, transparent 100%)`, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px 10px", maxWidth: 1200, margin: "0 auto", gap: 0 }}>
          <div onClick={() => switchTab("dashboard")} style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0, marginRight: 14, cursor: "pointer" }}>
            <img src={import.meta.env.BASE_URL + "logo-cropped.png"} alt="MedTracker" style={{ width: window.innerWidth < 768 ? 52 : 42, height: window.innerWidth < 768 ? 52 : 42 }} />
            <span style={{ fontSize: window.innerWidth < 768 ? 24 : 20, fontWeight: 800, letterSpacing: -0.6, fontFamily: F }}><span style={{ color: C.purple }}>Med</span><span style={{ color: C.text, fontWeight: 700 }}>Tracker</span></span>
          </div>
          {/* Desktop tabs */}
          <div className="desktop-tabs" style={{ display: "flex", gap: 4, flex: 1, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch", padding: "2px 0" }}>
            {TABS.map((t) => { const active = tab === t.id; return (
              <button key={t.id} onClick={() => switchTab(t.id)} style={{ padding: "7px 14px", background: active ? `linear-gradient(135deg, rgba(129,140,248,0.25), rgba(196,181,253,0.3))` : "transparent", border: active ? `1px solid rgba(196,181,253,0.35)` : "1px solid transparent", borderRadius: R.pill, cursor: "pointer", whiteSpace: "nowrap", color: active ? C.text : C.text3, fontSize: 13, fontFamily: F, fontWeight: active ? 700 : 500, transition: "all .25s cubic-bezier(.4,0,.2,1)", opacity: active ? 1 : 0.6, boxShadow: active ? `0 0 16px rgba(129,140,248,0.15)` : "none", flexShrink: 0, transform: active ? "scale(1)" : "scale(.97)" }}>{t.label}</button>
            ); })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, marginLeft: "auto" }}>
            {flash && (<span className="fade-in" style={{ fontSize: 10, color: C.green, fontFamily: FM, fontWeight: 600, background: `rgba(34,197,94,0.1)`, padding: "4px 10px", borderRadius: R.pill, border: `1px solid rgba(34,197,94,0.2)` }}>{flash}</span>)}
            {/* Sync button — visible when sync is active */}
            {syncId && (
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowSyncActions(v => !v)} title={syncStatus === "synced" ? "Sincronizado" : syncStatus === "syncing" ? "Sincronizando..." : syncStatus === "error" ? "Erro — toque para tentar" : "Sincronizar"} style={{ background: "none", border: "none", width: 28, height: 28, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: syncStatus === "synced" ? C.green : syncStatus === "error" ? C.red : C.yellow, opacity: syncStatus === "syncing" ? 0.6 : 0.8, transition: "all 0.3s", animation: syncStatus === "syncing" ? "spin 1s linear infinite" : "none" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6"/><path d="M2.5 22v-6h6"/><path d="M2.5 11.5a10 10 0 0 1 18.2-4.5"/><path d="M21.5 12.5a10 10 0 0 1-18.2 4.5"/></svg>
                </button>
                {showSyncActions && <div className="fade-in" style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: R.lg, boxShadow: SH.lg, overflow: "hidden", zIndex: 200, minWidth: 220 }}>
                  <div style={{ padding: "8px 14px", fontSize: 10, color: C.text3, borderBottom: `1px solid ${C.border}`, fontFamily: FM }}>Sync: {syncId}</div>
                  <button onClick={handlePushOnly} style={{ width: "100%", padding: "12px 14px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", color: C.blue, fontSize: 13, fontFamily: F, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = C.surface} onMouseLeave={e => e.currentTarget.style.background = "none"}>{"☁️ ⬆"} Enviar daqui → nuvem</button>
                  <button onClick={handlePullOnly} style={{ width: "100%", padding: "12px 14px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", color: C.purple, fontSize: 13, fontFamily: F, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = C.surface} onMouseLeave={e => e.currentTarget.style.background = "none"}>{"☁️ ⬇"} Receber da nuvem → aqui</button>
                  <button onClick={() => setShowSyncActions(false)} style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 12, fontFamily: F, textAlign: "center" }}>Fechar</button>
                </div>}
              </div>
            )}
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowBackupMenu(v => !v)} style={{ background: "none", border: "none", width: 28, height: 28, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.text3, opacity: 0.35, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.7"} onMouseLeave={e => e.currentTarget.style.opacity = "0.35"}>{"💾"}</button>
              {showBackupMenu && <div className="fade-in" style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: R.lg, boxShadow: SH.lg, overflow: "hidden", zIndex: 200, minWidth: 200 }}>
                <div style={{ padding: "8px 16px", fontSize: 10, color: C.text3, borderBottom: `1px solid ${C.border}`, fontFamily: FM, display: "flex", justifyContent: "space-between" }}>
                  <span>v2.3 — 29/03</span>
                  {syncId && <span style={{ color: syncStatus === "synced" ? C.green : syncStatus === "error" ? C.red : C.yellow }}>{syncStatus === "synced" ? "sincronizado" : syncStatus === "syncing" ? "sincronizando..." : syncStatus === "error" ? "erro sync" : ""}</span>}
                </div>
                {syncId ? (
                  <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: C.text3 }}>Código:</span>
                    <span style={{ fontSize: 14, fontFamily: FM, fontWeight: 700, color: C.purple, letterSpacing: 1.5 }}>{syncId}</span>
                  </div>
                ) : null}
                <button onClick={() => { setShowBackupMenu(false); setShowSyncModal(true); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", color: syncId ? C.green : C.purple, fontSize: 13, fontFamily: F, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = C.surface} onMouseLeave={e => e.currentTarget.style.background = "none"}>{syncId ? "☁️ Sync ativo" : "☁️ Ativar sincronização"}</button>
                <button onClick={() => { exportBackup(); setShowBackupMenu(false); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", color: C.text, fontSize: 13, fontFamily: F, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = C.surface} onMouseLeave={e => e.currentTarget.style.background = "none"}>{"📤"} Exportar backup</button>
                <button onClick={() => { importBackup(); setShowBackupMenu(false); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", color: C.text, fontSize: 13, fontFamily: F, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = C.surface} onMouseLeave={e => e.currentTarget.style.background = "none"}>{"📥"} Restaurar backup</button>
                <button onClick={() => { setShowBackupMenu(false); caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k)))).then(() => { navigator.serviceWorker?.getRegistrations().then(rs => rs.forEach(r => r.unregister())); setTimeout(() => window.location.reload(true), 300); }).catch(() => window.location.reload(true)); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: C.yellow, fontSize: 13, fontFamily: F, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = C.surface} onMouseLeave={e => e.currentTarget.style.background = "none"}>{"🔄"} Forçar atualização</button>
              </div>}
            </div>
            <button onClick={toggleTheme} style={{ background: "none", border: "none", width: 28, height: 28, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.text3, opacity: 0.45, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.8"} onMouseLeave={e => e.currentTarget.style.opacity = "0.45"} title={darkMode ? "Modo claro" : "Modo escuro"}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{darkMode ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></> : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}</svg></button>
          </div>
        </div>
      </div>
      {showSyncModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) setShowSyncModal(false); }}>
          <div className="fade-in" style={{ background: C.card, borderRadius: 20, padding: 24, maxWidth: 400, width: "100%", border: `1px solid ${C.border2}`, boxShadow: SH.lg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Sincronização</div>
              <button onClick={() => setShowSyncModal(false)} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            {syncId ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: C.surface, borderRadius: R.md, padding: 14, border: `1px solid ${C.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>Seu código de sincronização</div>
                  <div style={{ fontSize: 28, fontFamily: FM, fontWeight: 800, color: C.purple, letterSpacing: 3 }}>{syncId}</div>
                  <div style={{ fontSize: 11, color: C.green, marginTop: 6 }}>Sincronização ativa</div>
                </div>
                <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.5 }}>Use este código nos outros dispositivos pra sincronizar automaticamente.</div>
                <button onClick={handlePushOnly} style={btn(C.blue, { width: "100%", fontSize: 13 })}>Enviar dados daqui → nuvem</button>
                <button onClick={handlePullOnly} style={btn(C.purple, { width: "100%", fontSize: 13, marginTop: 6 })}>Receber dados da nuvem → aqui</button>
                <button onClick={() => { disconnectSync(); setSyncId(null); setSyncStatus("off"); setShowSyncModal(false); notify("Sync desconectado"); }} style={btn(C.card2, { width: "100%", fontSize: 13, color: C.red })}>Desconectar sync</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: C.surface, borderRadius: R.md, padding: 12, border: `1px solid ${C.border}`, fontSize: 12, color: C.text3, lineHeight: 1.5 }}>
                  Sincronize seus dados entre iPhone, iPad e computador automaticamente via nuvem.
                </div>
                <button onClick={async () => { const id = await createSync(); setSyncId(id); setSyncStatus("synced"); notify("Sync criado!"); await initSync(() => setSyncBanner(true), (s) => setSyncStatus(s)); }} style={btn(C.purple, { width: "100%", fontSize: 13 })}>Criar código de sync (1o dispositivo)</button>
                <div style={{ fontSize: 12, color: C.text3, textAlign: "center" }}>ou</div>
                <div style={{ fontSize: 12, color: C.text3 }}>Já tem um código? Digite abaixo:</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={syncInput} onChange={(e) => setSyncInput(e.target.value.toUpperCase())} placeholder="Ex: ABC123" maxLength={6} style={{ ...inp(), flex: 1, fontSize: 18, textAlign: "center", fontFamily: FM, fontWeight: 700, letterSpacing: 3 }} />
                  <button disabled={syncInput.length < 6} onClick={async () => { try { const id = await joinSync(syncInput, () => setSyncBanner(true)); setSyncId(id); setSyncStatus("synced"); setShowSyncModal(false); notify("Conectado! Recarregando..."); setTimeout(() => window.location.reload(), 1500); } catch (e) { alert("Código não encontrado."); } }} style={btn(C.blue, { padding: "10px 20px", fontSize: 13, opacity: syncInput.length < 6 ? 0.4 : 1 })}>Entrar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showSessionModal && <SessionModal onSave={(s) => { addSession(s); setShowSessionModal(false); }} onClose={() => setShowSessionModal(false)} />}
      {subtopicModal && <SubtopicModal area={subtopicModal.area} topic={subtopicModal.topic} semana={subtopicModal.semana} existing={getSubtopics(subtopicModal.area, subtopicModal.topic)} onSave={(items) => { saveSubtopics(subtopicModal.area, subtopicModal.topic, items); setSubtopicModal(null); notify(items.length > 0 ? `✓ ${items.length} subtema${items.length > 1 ? "s" : ""} salvo${items.length > 1 ? "s" : ""}` : "✓ Aula marcada"); }} onClose={() => setSubtopicModal(null)} />}
      {/* SYNC BANNER */}
      {syncBanner && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, padding: "10px 16px", background: C.purple, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>Dados atualizados de outro dispositivo</span>
          <button onClick={() => window.location.reload()} style={{ background: "#fff", border: "none", borderRadius: 8, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.purple }}>Atualizar</button>
          <button onClick={() => setSyncBanner(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}
      {/* CONTENT */}
      <div style={{ padding: `${S.xl}px`, maxWidth: 1200, margin: "0 auto", paddingBottom: 100 }}>
        <div key={tabKey} className="fade-in">
          <Suspense fallback={<div style={{ display: "flex", flexDirection: "column", gap: S.lg, paddingTop: 20 }}><SkeletonCard /><SkeletonCard /></div>}>
            <div style={{ display: tab === "agenda" ? "block" : "none" }}><Agenda reviews={reviews} revLogs={revLogs} alertThemes={alertThemes} subtopics={subtopics} onAulaChecked={(area, topic, semana) => setSubtopicModal({ area, topic, semana })} /></div>
            {tab === "dashboard" && <Dashboard revLogs={revLogs} sessions={sessions} exams={exams} reviews={reviews} dueCount={dueR.length} onNotionSync={handleNotionSync} onNewSession={() => setShowSessionModal(true)} onAlerts={() => switchTab("alertas")} flashcardDecks={flashcardDecks} onNavigateFlashcards={() => switchTab("flashcards")} />}
            {tab === "alertas" && <Dashboard revLogs={revLogs} sessions={sessions} exams={exams} reviews={reviews} dueCount={dueR.length} onNotionSync={handleNotionSync} onNewSession={() => setShowSessionModal(true)} onAlerts={() => switchTab("alertas")} forceTab="alerts" flashcardDecks={flashcardDecks} onNavigateFlashcards={() => switchTab("flashcards")} />}
            {tab === "sessoes" && <Sessoes sessions={sessions} onAdd={addSession} onDel={delSession} />}
            {tab === "revisoes" && <Revisoes due={dueR} upcoming={upR} revLogs={revLogs} reviews={reviews} sessions={sessions} subtopics={subtopics} onMark={markReview} onQuick={addRevLog} onEditLog={editRevLog} onDelLog={delRevLog} onSubtopicReview={addSubtopicReview} onSaveSubtopics={saveSubtopics} onUndoMark={undoMarkReview} />}
            {tab === "provas" && <Provas exams={exams} revLogs={revLogs} sessions={sessions} onAdd={addExam} onDel={delExam} onUpdate={updateExam} />}
            {tab === "temas" && <Temas reviews={reviews} subtopics={subtopics} onEditInterval={editReview} onSaveSubtopics={saveSubtopics} />}
            {tab === "flashcards" && <Flashcards decks={flashcardDecks} onReview={handleFlashcardReview} />}
          </Suspense>
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
      {/* Undo toast */}
      {undoAction && (
        <div className="fade-in" style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: C.card, border: `1px solid ${C.border}`, borderRadius: R.lg, boxShadow: SH.lg, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, minWidth: 260 }}>
          <span style={{ fontSize: 13, color: C.text, fontFamily: F }}>Revisão removida</span>
          <button onClick={handleUndo} style={{ background: C.blue, color: "#fff", border: "none", borderRadius: R.pill, padding: "6px 16px", fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer" }}>Desfazer</button>
          <button onClick={() => { if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null; } setUndoAction(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 14, padding: "2px 4px" }}>✕</button>
        </div>
      )}
    </div>
  );
}

export default App;
