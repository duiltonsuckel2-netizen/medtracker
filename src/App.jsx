import React, { Suspense } from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { AREAS, INTERVALS, INT_LABELS, INT_DAYS, SEED_REVIEWS, SEED_LOGS, SEED_SUBTOPICS, areaMap, buildUnicamp2024Exam, buildUfcspa2026Exam, buildUspSp2023Exam, LOG_NAME_MAP } from "./data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, applyTheme, injectKeyframes, modalBg } from "./theme.js";
import { today, addDays, perc, uid, fmtDate, nxtIdx, diffDays } from "./utils.js";
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
  const [darkMode, setDarkMode] = useState(() => { try { const d = localStorage.getItem("rp26_dark") !== "false"; applyTheme(d); return d; } catch { return true; } });
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
  useEffect(() => { applyTheme(darkMode); }, [darkMode]);
  const toggleTheme = () => { const next = !darkMode; applyTheme(next); setDarkMode(next); try { localStorage.setItem("rp26_dark", String(next)); } catch {} };
  const BACKUP_KEYS = ["rp26_sessions","rp26_reviews","rp26_revlogs","rp26_exams","rp26_subtopics","rp26_flashcards","rp26_seeded12","rp26_dark","rp_agenda_v7","rp_agenda_history","rp_streak_start","rp_max_streak","rp26_mig_v4","rp26_mig_v5","rp26_mig_v6","rp26_mig_v7","rp26_mig_v8","rp26_mig_v9","rp26_mig_v10b","rp26_mig_v11","rp26_mig_v12b","rp26_mig_v13","rp26_mig_v14","rp26_mig_v15","rp26_mig_v16","rp26_mig_v17","rp26_mig_v18","rp26_mig_v19","rp26_mig_v20","rp26_mig_v21","rp26_mig_v22"];
  function exportBackup() {
    const data = {}; BACKUP_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v !== null) { try { data[k] = JSON.parse(v); } catch { data[k] = v; } } });
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
      // NOTE: v23 (subtopic merge) is intentionally excluded — safe to re-run on imported data
      ["rp26_mig_v4","rp26_mig_v5","rp26_mig_v6","rp26_mig_v7","rp26_mig_v8","rp26_mig_v9","rp26_mig_v10b","rp26_mig_v11","rp26_mig_v12b","rp26_mig_v13","rp26_mig_v14","rp26_mig_v15","rp26_mig_v16","rp26_mig_v17","rp26_mig_v18","rp26_mig_v19","rp26_mig_v20","rp26_mig_v21","rp26_mig_v22"].forEach(k => localStorage.setItem(k, "1"));
      notify("Backup restaurado! Recarregando..."); setTimeout(() => window.location.reload(), 1000);
    } catch { alert("Erro ao ler o arquivo."); } }; reader.readAsText(f); };
    input.click();
  }
  function restoreAutoBackup(slot) {
    try {
      const raw = localStorage.getItem(`rp26_auto_backup_${slot}`);
      if (!raw) { notify("Nenhum backup automático nesse slot"); return; }
      const data = JSON.parse(raw);
      const when = data._savedAt ? new Date(data._savedAt).toLocaleString("pt-BR") : "desconhecido";
      if (!confirm(`Restaurar backup automático de ${when}? Isso substitui todos os dados atuais.`)) return;
      const keys = ["rp26_sessions", "rp26_reviews", "rp26_revlogs", "rp26_exams", "rp26_subtopics", "rp26_flashcards"];
      keys.forEach(k => { if (data[k] !== undefined) localStorage.setItem(k, JSON.stringify(data[k])); });
      notify("Restaurado! Recarregando..."); setTimeout(() => window.location.reload(), 800);
    } catch { notify("Erro ao restaurar backup"); }
  }
  const [showAutoBackupMenu, setShowAutoBackupMenu] = useState(false);
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [syncStatus, setSyncStatus] = useState("off"); // off | syncing | synced | error
  const [syncId, setSyncId] = useState(getSyncId());
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncInput, setSyncInput] = useState("");

  // Sync initialization — delayed until after data loads (see dataLoaded state)
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
    if (!dataLoaded) return;
    initSync(
      () => { setReviews(loadKey("rp26_reviews", [])); setRevLogs(loadKey("rp26_revlogs", [])); setSessions(loadKey("rp26_sessions", [])); setExams(loadKey("rp26_exams", [])); setSubtopics(loadKey("rp26_subtopics", {})); }, // on remote update: refresh state from localStorage (no triggerSync)
      (status) => setSyncStatus(status)
    ).then((active) => {
      if (active) setSyncStatus("synced");
    });
    // Re-pull from cloud when app returns from background (iOS kills WebSocket in background)
    const refreshFromStorage = () => { setReviews(loadKey("rp26_reviews", [])); setRevLogs(loadKey("rp26_revlogs", [])); setSessions(loadKey("rp26_sessions", [])); setExams(loadKey("rp26_exams", [])); setSubtopics(loadKey("rp26_subtopics", {})); };
    const onVisible = () => { if (document.visibilityState === "visible") { pullFromCloud().then((ok) => { if (ok) refreshFromStorage(); }); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [dataLoaded]);

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

  function runDedup() {
    // ONLY dedup sessions, revLogs, exams — NEVER touch reviews
    let rl = loadKey("rp26_revlogs", []);
    let ss = loadKey("rp26_sessions", []);
    let ex = loadKey("rp26_exams", []);

    const before = { logs: rl.length, sessions: ss.length, exams: ex.length };

    // 1) Dedup revLogs by date+area+theme
    const logSeen = new Set();
    rl = rl.filter((l) => { const sig = `${l.date}|${l.area}|${(l.theme || "").toLowerCase().trim()}`; if (logSeen.has(sig)) return false; logSeen.add(sig); return true; });

    // 2) Dedup sessions by date+area+theme
    const sesSeen = new Set();
    ss = ss.filter((s) => { const sig = `${s.createdAt || s.date}|${s.area}|${(s.theme || "").toLowerCase().trim()}`; if (sesSeen.has(sig)) return false; sesSeen.add(sig); return true; });

    // 3) Dedup exams by name
    const examSeen = new Set();
    ex = ex.filter((e) => { const sig = (e.name || "").toLowerCase().trim(); if (examSeen.has(sig)) return false; examSeen.add(sig); return true; });

    // Save (reviews NOT touched)
    saveKey("rp26_revlogs", rl); saveKey("rp26_sessions", ss); saveKey("rp26_exams", ex);
    setRevLogs(rl); setSessions(ss); setExams(ex);

    const after = { logs: rl.length, sessions: ss.length, exams: ex.length };
    console.log(`Dedup: logs ${before.logs}→${after.logs}, sessions ${before.sessions}→${after.sessions}, exams ${before.exams}→${after.exams}`);
    notify(`Limpo! Sessões: ${before.sessions}→${after.sessions}, Logs: ${before.logs}→${after.logs}`);
    pushToCloud();
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
        const uf = buildUfcspa2026Exam();
        const usp = buildUspSp2023Exam();
        const seedSt = { ...SEED_SUBTOPICS };
        setSessions([]); setReviews(revs); setRevLogs(logs); setExams([se, uf, usp]); setSubtopics(seedSt);
        const seedFc = generateFlashcardDecks([se, uf, usp], revs, []);
        setFlashcardDecks(seedFc); saveKey("rp26_flashcards", seedFc);
        saveKey("rp26_reviews", revs); saveKey("rp26_revlogs", logs); saveKey("rp26_sessions", []); saveKey("rp26_exams", [se, uf, usp]); saveKey("rp26_subtopics", seedSt); saveKey("rp26_seeded12", true);
      } else {
        let loadedSessions = Array.isArray(s) ? s : [];
        let loadedReviews = Array.isArray(r) ? r : [];
        let loadedExams = Array.isArray(e) ? e : [];
        const loadedFc = Array.isArray(fc) ? fc : [];
        let loadedLogs = Array.isArray(rl) ? rl : [];

        // Ensure built-in exams always exist
        if (!loadedExams.some((ex) => ex.name && ex.name.includes("UFCSPA"))) {
          loadedExams.push(buildUfcspa2026Exam());
          saveKey("rp26_exams", loadedExams);
        }
        if (!loadedExams.some((ex) => ex.name && ex.name.includes("UNICAMP"))) {
          loadedExams.push(buildUnicamp2024Exam());
          saveKey("rp26_exams", loadedExams);
        }
        if (!loadedExams.some((ex) => ex.name && ex.name.includes("USP-SP"))) {
          loadedExams.push(buildUspSp2023Exam());
          saveKey("rp26_exams", loadedExams);
        }

        // AUTO-BACKUP: save snapshot before anything else touches the data
        // Keeps last 3 backups rotated so user can always restore
        try {
          const snapshot = { rp26_sessions: loadedSessions, rp26_reviews: loadedReviews, rp26_revlogs: loadedLogs, rp26_exams: loadedExams, rp26_subtopics: st, rp26_flashcards: fc, _savedAt: new Date().toISOString() };
          const prev1 = localStorage.getItem("rp26_auto_backup_1");
          if (prev1) localStorage.setItem("rp26_auto_backup_2", prev1);
          localStorage.setItem("rp26_auto_backup_1", JSON.stringify(snapshot));
        } catch (e) { /* storage full — skip backup silently */ }

        // Normalize theme names via LOG_NAME_MAP — one-time migration only
        if (!localStorage.getItem("rp26_mig_v15")) {
          localStorage.setItem("rp26_mig_v15", "1");
          let logsRenamed = false, revsRenamed = false, sessRenamed = false;
          loadedSessions = loadedSessions.map((s) => {
            const mapped = LOG_NAME_MAP[s.theme];
            if (mapped && mapped !== s.theme) { sessRenamed = true; return { ...s, theme: mapped }; }
            return s;
          });
          if (sessRenamed) saveKey("rp26_sessions", loadedSessions);
          loadedLogs = loadedLogs.map((l) => {
            if (l.isSubtopic) return l;
            const mapped = LOG_NAME_MAP[l.theme];
            if (mapped && mapped !== l.theme) { logsRenamed = true; return { ...l, theme: mapped }; }
            return l;
          });
          if (logsRenamed) saveKey("rp26_revlogs", loadedLogs);
          loadedReviews = loadedReviews.map((rv) => {
            if (rv.isSubtopic) return rv;
            const mapped = LOG_NAME_MAP[rv.theme];
            if (mapped && mapped !== rv.theme) {
              revsRenamed = true;
              const newKey = `${rv.area}__${mapped.toLowerCase().trim()}`;
              return { ...rv, theme: mapped, key: newKey };
            }
            return rv;
          });
          if (revsRenamed) saveKey("rp26_reviews", loadedReviews);

          // Merge reviews that ended up with the same key after renaming
          const _rkm = new Map();
          let _hadDupeKeys = false;
          loadedReviews.forEach((rv) => {
            if (_rkm.has(rv.key)) {
              _hadDupeKeys = true;
              const ex = _rkm.get(rv.key);
              const mh = [...(ex.history || []), ...(rv.history || [])];
              const hm = new Map(); mh.forEach(h => hm.set(`${h.date}_${h.pct}`, h));
              const dh = [...hm.values()].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
              const w = (rv.lastStudied || "") > (ex.lastStudied || "") ? rv : ex;
              _rkm.set(rv.key, { ...w, history: dh });
            } else {
              _rkm.set(rv.key, rv);
            }
          });
          if (_hadDupeKeys) {
            loadedReviews = [..._rkm.values()];
            saveKey("rp26_reviews", loadedReviews);
          }
        }

        // Restore correct intervals from SEED_REVIEWS — one-time migration only
        if (!localStorage.getItem("rp26_mig_v16")) {
          localStorage.setItem("rp26_mig_v16", "1");
          const seedByKey = {};
          SEED_REVIEWS.forEach((sr) => {
            const k = `${sr.area}__${sr.theme.toLowerCase().trim()}`;
            seedByKey[k] = sr;
          });
          const seedLogsByKey = {};
          SEED_LOGS.forEach((l) => {
            if (l.isSubtopic) return;
            const mapped = LOG_NAME_MAP[l.theme] || LOG_NAME_MAP[l.theme?.trim()] || l.theme;
            const k = `${l.area}__${(mapped || "").toLowerCase().trim()}`;
            if (!seedLogsByKey[k]) seedLogsByKey[k] = [];
            seedLogsByKey[k].push(l);
          });
          Object.values(seedLogsByKey).forEach((logs) => logs.sort((a, b) => (a.date || "").localeCompare(b.date || "")));
          let seedRestored = false;
          loadedReviews = loadedReviews.map((rv) => {
            if (rv.isSubtopic) return rv;
            const seed = seedByKey[rv.key];
            if (!seed) return rv;
            const logs = seedLogsByKey[rv.key] || [];
            const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
            const correctLastStudied = lastLog ? lastLog.date : seed.lastStudied;
            const correctLastPerf = lastLog ? (lastLog.pct != null ? lastLog.pct : seed.lastPerf) : seed.lastPerf;
            const seedHistory = logs.map((l) => ({ date: l.date, pct: l.pct }));
            let updatedHistory = rv.history || [];
            if (seedHistory.length > 0 && updatedHistory.length < seedHistory.length) {
              const lastSeedDate = logs[logs.length - 1].date;
              const appEntries = updatedHistory.filter((h) => h.date > lastSeedDate);
              updatedHistory = [...seedHistory, ...appEntries];
            }
            if (!rv.lastStudied || rv.lastStudied <= correctLastStudied) {
              if (rv.intervalIndex !== seed.intervalIndex || rv.nextDue !== seed.nextDue || rv.lastStudied !== correctLastStudied || updatedHistory.length !== (rv.history || []).length) {
                seedRestored = true;
                return { ...rv, intervalIndex: seed.intervalIndex, nextDue: seed.nextDue, lastStudied: correctLastStudied, lastPerf: correctLastPerf, history: updatedHistory };
              }
            }
            if (updatedHistory.length !== (rv.history || []).length) {
              seedRestored = true;
              return { ...rv, history: updatedHistory };
            }
            return rv;
          });
          if (seedRestored) saveKey("rp26_reviews", loadedReviews);
        }

        // Ensure SEED_LOGS subtopicScores are present in revLogs (fills missing data, never overwrites)
        const seedLogsWithSt = SEED_LOGS.filter((sl) => sl.subtopicScores);
        if (seedLogsWithSt.length > 0) {
          let logsPatched = false;
          loadedLogs = loadedLogs.map((l) => {
            if (l.subtopicScores) return l; // already has scores, skip
            const match = seedLogsWithSt.find((sl) => sl.date === l.date && sl.area === l.area && sl.pct === l.pct && sl.total === l.total);
            if (match) { logsPatched = true; return { ...l, subtopicScores: match.subtopicScores }; }
            return l;
          });
          if (logsPatched) saveKey("rp26_revlogs", loadedLogs);
        }

        // Ensure SEED_SUBTOPICS are always present (merge, never overwrite user additions)
        let loadedSt = st && typeof st === "object" && !Array.isArray(st) ? st : {};
        let stChanged = false;
        Object.entries(SEED_SUBTOPICS).forEach(([k, items]) => {
          if (!loadedSt[k] || loadedSt[k].length === 0) {
            loadedSt[k] = items;
            stChanged = true;
          }
        });
        // Also recover from review cards if available
        loadedReviews.forEach((rv) => {
          if (rv.subtopicNames && rv.subtopicNames.length > 0 && !rv.isSubtopic) {
            const k = `${rv.area}__${rv.theme}`;
            if (!loadedSt[k] || rv.subtopicNames.length > loadedSt[k].length) {
              loadedSt[k] = rv.subtopicNames;
              stChanged = true;
            }
          }
        });
        if (stChanged) saveKey("rp26_subtopics", loadedSt);

        // Dedup reviews by key (keeps the one with more history or more recent lastStudied)
        const dedupKey = "rp26_mig_dedup_v5";
        if (!localStorage.getItem(dedupKey)) {
          localStorage.setItem(dedupKey, "1");
          const seen = new Map();
          loadedReviews.forEach((rv) => {
            const k = rv.key || `${rv.area}__${(rv.theme || "").toLowerCase().trim()}`;
            const existing = seen.get(k);
            if (!existing) { seen.set(k, rv); return; }
            const existH = (existing.history || []).length;
            const rvH = (rv.history || []).length;
            if (rvH > existH || (rvH === existH && (rv.lastStudied || "") > (existing.lastStudied || ""))) {
              seen.set(k, rv);
            }
          });
          const deduped = Array.from(seen.values());
          if (deduped.length < loadedReviews.length) {
            console.log(`Dedup: removed ${loadedReviews.length - deduped.length} duplicate reviews`);
            loadedReviews = deduped;
            saveKey("rp26_reviews", loadedReviews);
          }
        }

        // Migration v17: Create subtopic review cards from historical revLogs
        // This ensures ALL subtopics that were ever scored have persistent review cards
        if (!localStorage.getItem("rp26_mig_v17")) {
          localStorage.setItem("rp26_mig_v17", "1");
          // Process logs chronologically (oldest first) to simulate natural review progression
          const sortedLogs = [...loadedLogs].filter(l => !l.isSubtopic && l.subtopicScores && l.subtopicScores.length > 0).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
          let subCreated = 0;
          sortedLogs.forEach((log) => {
            // Find parent review card for this log
            const parentKey = `${log.area}__${(log.theme || "").toLowerCase().trim()}`;
            const parentRev = loadedReviews.find(r => r.key === parentKey && !r.isSubtopic);
            if (!parentRev) return;
            // Find parent's intervalIndex at time of this log
            // Each parent review before this log = one interval advancement
            // (subtopics were reviewed together with parent before individual tracking)
            let parentIdxAtLog = 0;
            if (parentRev.history) {
              const hEntry = parentRev.history.find(h => h.date === log.date);
              if (hEntry?._prev?.intervalIndex != null) {
                parentIdxAtLog = hEntry._prev.intervalIndex;
              } else {
                // Count parent reviews before this date as proxy for intervalIndex
                const reviewsBefore = parentRev.history.filter(h => h.date && h.date < log.date).length;
                parentIdxAtLog = Math.min(reviewsBefore, INTERVALS.length - 1);
              }
            }
            log.subtopicScores.forEach((s) => {
              const sKey = `${log.area}__${(log.theme || "").toLowerCase().trim()}::${s.name.toLowerCase().trim()}`;
              const existing = loadedReviews.find(r => r.key === sKey);
              // Calculate interval: use existing subtopic's intervalIndex if it exists, otherwise derive from parent's at log time
              const prevIdx = existing ? existing.intervalIndex : parentIdxAtLog;
              const sni = nxtIdx(prevIdx, s.pct);
              const sNextDue = addDays(log.date, INTERVALS[sni]);
              if (existing) {
                // Only update if this log is more recent than what the card has
                if (!existing.lastStudied || log.date >= existing.lastStudied) {
                  Object.assign(existing, {
                    intervalIndex: sni, nextDue: sNextDue,
                    lastPerf: s.pct, lastStudied: log.date,
                    history: [...(existing.history || []), { date: log.date, pct: s.pct }]
                  });
                }
              } else {
                // Create new subtopic review card
                loadedReviews.push({
                  id: uid(), key: sKey, area: log.area, theme: s.name, parentTheme: log.theme,
                  isSubtopic: true, intervalIndex: sni, nextDue: sNextDue,
                  lastPerf: s.pct, lastStudied: log.date,
                  history: [{ date: log.date, pct: s.pct }]
                });
                subCreated++;
              }
            });
          });
          // After creating all subtopic cards, align overdue ones with parent if parent was reviewed more recently
          const t17 = today();
          loadedReviews.forEach((sr) => {
            if (!sr.isSubtopic || !sr.parentTheme) return;
            if (sr.nextDue > t17) return; // not overdue, leave as-is
            const pKey = `${sr.area}__${sr.parentTheme.toLowerCase().trim()}`;
            const parent = loadedReviews.find(r => r.key === pKey && !r.isSubtopic);
            if (!parent) return;
            // If parent was reviewed AFTER the subtopic's last study date, the subtopic was covered
            if (parent.lastStudied && sr.lastStudied && parent.lastStudied > sr.lastStudied) {
              sr.nextDue = parent.nextDue;
              sr.lastStudied = parent.lastStudied;
              subCreated++; // flag to save
            }
          });
          if (subCreated > 0) {
            console.log(`Migration v17: created/updated ${subCreated} subtopic review cards from revLogs`);
            saveKey("rp26_reviews", loadedReviews);
          }
        }

        // Migration v18: Fix overdue subtopic cards where parent was reviewed more recently
        // This fixes cards created by v17 that have stale nextDue dates
        if (!localStorage.getItem("rp26_mig_v18")) {
          localStorage.setItem("rp26_mig_v18", "1");
          const t18 = today();
          let v18Fixed = 0;
          loadedReviews.forEach((sr) => {
            if (!sr.isSubtopic || !sr.parentTheme) return;
            if (sr.nextDue > t18) return;
            const pKey = `${sr.area}__${sr.parentTheme.toLowerCase().trim()}`;
            const parent = loadedReviews.find(r => r.key === pKey && !r.isSubtopic);
            if (!parent) return;
            if (parent.lastStudied && sr.lastStudied && parent.lastStudied > sr.lastStudied) {
              sr.nextDue = parent.nextDue;
              sr.lastStudied = parent.lastStudied;
              v18Fixed++;
            }
          });
          if (v18Fixed > 0) {
            console.log(`Migration v18: fixed ${v18Fixed} overdue subtopic cards`);
            saveKey("rp26_reviews", loadedReviews);
          }
        }

        // Migration v19: Merge duplicate subtopic review cards
        // When user types "Context | SubtopicName", merge with existing "SubtopicName" card
        if (!localStorage.getItem("rp26_mig_v19")) {
          localStorage.setItem("rp26_mig_v19", "1");
          const subCards = loadedReviews.filter(r => r.isSubtopic && r.parentTheme);
          // Group by parent theme
          const byParent = {};
          subCards.forEach(r => {
            const pk = `${r.area}__${r.parentTheme.toLowerCase().trim()}`;
            if (!byParent[pk]) byParent[pk] = [];
            byParent[pk].push(r);
          });
          const keysToRemove = new Set();
          const renames = []; // { oldKey, card, newName }
          Object.values(byParent).forEach(group => {
            // Find cards with " | " in name — these are potential duplicates
            group.forEach(card => {
              if (!card.theme.includes(" | ")) return;
              const parts = card.theme.split(" | ").map(p => p.trim());
              // Check if any part matches another card in the same group
              for (const part of parts) {
                const match = group.find(other =>
                  other.key !== card.key && other.theme.toLowerCase().trim() === part.toLowerCase()
                );
                if (match) {
                  // Merge: keep the more recent one, delete the other
                  const winner = (card.lastStudied || "") >= (match.lastStudied || "") ? card : match;
                  const loser = winner === card ? match : card;
                  // Keep winner's scheduling data if more recent, but use canonical name
                  const canonicalName = match.theme; // the one WITHOUT "|" is canonical
                  if (winner === card) {
                    // The "|" card is more recent — rename it and remove the other
                    renames.push({ card: winner, newName: canonicalName, newKey: match.key });
                    keysToRemove.add(loser.key);
                  } else {
                    // The canonical card is more recent — just remove the "|" card
                    keysToRemove.add(loser.key);
                  }
                  break;
                }
              }
            });
          });
          if (keysToRemove.size > 0 || renames.length > 0) {
            // Apply renames
            renames.forEach(({ card, newName, newKey }) => {
              card.theme = newName;
              card.key = newKey;
            });
            // Remove duplicates
            loadedReviews = loadedReviews.filter(r => !keysToRemove.has(r.key));
            // Also clean up subtopics dictionary
            Object.keys(loadedSt).forEach(dk => {
              const items = loadedSt[dk];
              if (!items) return;
              const cleaned = [];
              const seen = new Set();
              items.forEach(name => {
                // If name has "|", try to extract the canonical part
                let canonical = name;
                if (name.includes(" | ")) {
                  const parts = name.split(" | ").map(p => p.trim());
                  // Use the part that matches an existing item (without |)
                  const matchPart = parts.find(p => items.some(other => !other.includes(" | ") && other.toLowerCase() === p.toLowerCase()));
                  if (matchPart) canonical = matchPart; // skip this duplicate
                  else canonical = parts[parts.length - 1]; // use last part as canonical
                }
                if (!seen.has(canonical.toLowerCase())) {
                  seen.add(canonical.toLowerCase());
                  cleaned.push(canonical);
                }
              });
              if (cleaned.length !== items.length) loadedSt[dk] = cleaned;
            });
            console.log(`Migration v19: merged ${keysToRemove.size} duplicate subtopic cards`);
            saveKey("rp26_reviews", loadedReviews);
            saveKey("rp26_subtopics", loadedSt);
          }
        }

        // Migration v20: Recalculate subtopic intervalIndex using parent review count
        // Fixes subtopics that were created starting from 0 instead of inheriting parent's progression
        if (!localStorage.getItem("rp26_mig_v20")) {
          localStorage.setItem("rp26_mig_v20", "1");
          let v20Fixed = 0;
          // Index logs with subtopicScores by parent key + date
          const logsWithSt = loadedLogs.filter(l => !l.isSubtopic && l.subtopicScores && l.subtopicScores.length > 0);
          loadedReviews.forEach((sr) => {
            if (!sr.isSubtopic || !sr.parentTheme) return;
            // Find parent review card
            const pKey = `${sr.area}__${sr.parentTheme.toLowerCase().trim()}`;
            const parent = loadedReviews.find(r => r.key === pKey && !r.isSubtopic);
            if (!parent || !parent.history) return;
            // Find the first log that scored this subtopic
            const firstLog = logsWithSt
              .filter(l => l.area === sr.area && (l.theme || "").toLowerCase().trim() === sr.parentTheme.toLowerCase().trim())
              .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
              .find(l => l.subtopicScores.some(s => s.name.toLowerCase().trim() === sr.theme.toLowerCase().trim()));
            if (!firstLog) return;
            // Count parent reviews before the first subtopic score date
            const reviewsBefore = parent.history.filter(h => h.date && h.date < firstLog.date).length;
            const startIdx = Math.min(reviewsBefore, INTERVALS.length - 1);
            // Find the subtopic's score in that first log
            const firstScore = firstLog.subtopicScores.find(s => s.name.toLowerCase().trim() === sr.theme.toLowerCase().trim());
            if (!firstScore) return;
            const correctIdx = nxtIdx(startIdx, firstScore.pct);
            const correctDue = addDays(firstLog.date, INTERVALS[correctIdx]);
            // Only fix if currently wrong (subtopic only has 1 history entry = first-time creation)
            if (sr.history && sr.history.length === 1 && sr.intervalIndex !== correctIdx) {
              sr.intervalIndex = correctIdx;
              sr.nextDue = correctDue;
              v20Fixed++;
            }
          });
          // Also align overdue subtopics with parent if parent was reviewed more recently
          const t20 = today();
          loadedReviews.forEach((sr) => {
            if (!sr.isSubtopic || !sr.parentTheme) return;
            if (sr.nextDue > t20) return;
            const pKey = `${sr.area}__${sr.parentTheme.toLowerCase().trim()}`;
            const parent = loadedReviews.find(r => r.key === pKey && !r.isSubtopic);
            if (!parent) return;
            if (parent.lastStudied && sr.lastStudied && parent.lastStudied > sr.lastStudied) {
              sr.nextDue = parent.nextDue;
              sr.lastStudied = parent.lastStudied;
              v20Fixed++;
            }
          });
          if (v20Fixed > 0) {
            console.log(`Migration v20: fixed ${v20Fixed} subtopic cards with correct intervalIndex`);
            saveKey("rp26_reviews", loadedReviews);
          }
        }

        // Migration v23: Merge duplicate subtopics with overlapping pipe-separated names
        // e.g. "Financiamento da saúde | Leis e emendas do SUS" + "Leis e emendas do SUS"
        // Safe to re-run: only merges if duplicates exist. NOT in import "mark done" list.
        if (!localStorage.getItem("rp26_mig_v23")) {
          localStorage.setItem("rp26_mig_v23", "1");
          let v21Merged = 0;
          const subs21 = loadedReviews.filter(r => r.isSubtopic && r.parentTheme);
          const byParent21 = {};
          subs21.forEach(s => {
            const pk = `${s.area}__${(s.parentTheme || "").toLowerCase().trim()}`;
            if (!byParent21[pk]) byParent21[pk] = [];
            byParent21[pk].push(s);
          });
          const toRemove21 = new Set();
          Object.values(byParent21).forEach(group => {
            if (group.length < 2) return;
            for (let i = 0; i < group.length; i++) {
              if (toRemove21.has(group[i].id)) continue;
              const nameI = (group[i].theme || "").toLowerCase().trim();
              for (let j = i + 1; j < group.length; j++) {
                if (toRemove21.has(group[j].id)) continue;
                const nameJ = (group[j].theme || "").toLowerCase().trim();
                // Only merge if one is a pipe-separated version of the other
                const iParts = nameI.split("|").map(p => p.trim());
                const jParts = nameJ.split("|").map(p => p.trim());
                // Require pipe separator in at least one name (avoid merging exact dupes or unrelated)
                if (iParts.length === 1 && jParts.length === 1) {
                  // Both have no pipe — only merge if exact same name
                  if (nameI !== nameJ) continue;
                }
                const iContainsJ = iParts.some(p => p === nameJ);
                const jContainsI = jParts.some(p => p === nameI);
                const exactMatch = nameI === nameJ;
                if (!iContainsJ && !jContainsI && !exactMatch) continue;
                // Target = the card with the CLEAN name (without |); if both clean, keep the one with more history
                let target, source;
                const iHasPipe = nameI.includes("|");
                const jHasPipe = nameJ.includes("|");
                if (iHasPipe && !jHasPipe) { target = group[j]; source = group[i]; }
                else if (jHasPipe && !iHasPipe) { target = group[i]; source = group[j]; }
                else { // both clean or both pipe — keep more history
                  const iHist = (group[i].history || []).length;
                  const jHist = (group[j].history || []).length;
                  if (iHist >= jHist) { target = group[i]; source = group[j]; }
                  else { target = group[j]; source = group[i]; }
                }
                // Merge history: add source entries that don't clash with target dates
                const existingDates = new Set((target.history || []).map(h => h.date));
                let addedEntries = 0;
                (source.history || []).forEach(h => {
                  if (!existingDates.has(h.date)) {
                    target.history = target.history || [];
                    target.history.push(h);
                    addedEntries++;
                  }
                });
                if (target.history) target.history.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
                // PRESERVE target's intervalIndex and nextDue — don't recalculate from zero
                // Only update lastStudied/lastPerf if source had a more recent review
                if (addedEntries > 0 && source.lastStudied && target.lastStudied && source.lastStudied > target.lastStudied) {
                  target.lastStudied = source.lastStudied;
                  target.lastPerf = source.lastPerf;
                  target.nextDue = addDays(source.lastStudied, INTERVALS[target.intervalIndex]);
                }
                toRemove21.add(source.id);
                v21Merged++;
                console.log(`Migration v21: merging "${source.theme}" into "${target.theme}" (added ${addedEntries} history entries)`);
                // Transfer source's subtopic revLogs to target's name
                loadedLogs.forEach(l => {
                  if (l.isSubtopic && l.area === source.area && l.subtema &&
                      l.subtema.toLowerCase().trim() === (source.theme || "").toLowerCase().trim() &&
                      (l.parentTheme || "").toLowerCase().trim() === (source.parentTheme || "").toLowerCase().trim()) {
                    l.subtema = target.theme;
                    l.theme = `${target.parentTheme} › ${target.theme}`;
                  }
                });
              }
            }
          });
          if (toRemove21.size > 0) {
            loadedReviews = loadedReviews.filter(r => !toRemove21.has(r.id));
            console.log(`Migration v21: merged ${v21Merged} pairs, removed ${toRemove21.size} duplicates`);
            saveKey("rp26_reviews", loadedReviews);
            saveKey("rp26_revlogs", loadedLogs);
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
      setDataLoaded(true);
      setReady(true);
    }).catch((err) => {
      console.error("App init error:", err);
      setDataLoaded(true);
      setReady(true);
    });
  }, []);
  const undoTimerRef = React.useRef(null);
  const notify = (msg) => { setFlash(msg); setTimeout(() => setFlash(""), 2500); };
  const persistSessions = (v) => { if (typeof v === "function") { setSessions((prev) => { const next = v(prev); saveKey("rp26_sessions", next); return next; }); } else { setSessions(v); saveKey("rp26_sessions", v); } triggerSync(); };
  const persistReviews = (v) => { if (typeof v === "function") { setReviews((prev) => { const next = v(prev); saveKey("rp26_reviews", next); return next; }); } else { setReviews(v); saveKey("rp26_reviews", v); } triggerSync(); };
  const persistLogs = (v) => { if (typeof v === "function") { setRevLogs((prev) => { const next = v(prev); saveKey("rp26_revlogs", next); return next; }); } else { setRevLogs(v); saveKey("rp26_revlogs", v); } triggerSync(); };
  const persistExams = (v) => { if (typeof v === "function") { setExams((prev) => { const next = v(prev); saveKey("rp26_exams", next); return next; }); } else { setExams(v); saveKey("rp26_exams", v); } triggerSync(); };
  const persistSubtopics = (v) => { if (typeof v === "function") { setSubtopics((prev) => { const next = v(prev); saveKey("rp26_subtopics", next); return next; }); } else { setSubtopics(v); saveKey("rp26_subtopics", v); } triggerSync(); };
  const persistFlashcards = (v) => { if (typeof v === "function") { setFlashcardDecks((prev) => { const next = v(prev); saveKey("rp26_flashcards", next); return next; }); } else { setFlashcardDecks(v); saveKey("rp26_flashcards", v); } triggerSync(); };
  function saveSubtopics(area, topic, items) {
    const key = `${area}__${topic}`;
    persistSubtopics((prev) => ({ ...prev, [key]: items }));
    // Persist subtopic names on matching review cards for reliable lookup
    if (items.length > 0) {
      const tWords = topic.toLowerCase().replace(/[—–\-]/g, " ").split(/\s+/).filter((w) => w.length >= 3);
      persistReviews((prevReviews) => {
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
    persistReviews((prevReviews) => {
      const ex = prevReviews.find((r) => r.key === key);
      // If no existing card, inherit parent's intervalIndex as starting point
      const parentKey = `${area}__${parentTheme.toLowerCase().trim()}`;
      const parent = !ex ? prevReviews.find((r) => r.key === parentKey && !r.isSubtopic) : null;
      const startIdx = ex ? ex.intervalIndex : (parent ? parent.intervalIndex : 0);
      const ni = nxtIdx(startIdx, pct);
      const rev = {
        id: ex?.id || uid(), key, area, theme: subtema, parentTheme,
        isSubtopic: true,
        intervalIndex: ni, nextDue: addDays(today(), INTERVALS[ni]),
        lastPerf: pct, lastStudied: today(),
        history: [...(ex?.history || []), { date: today(), pct }]
      };
      return ex ? prevReviews.map((r) => r.key === key ? rev : r) : [rev, ...prevReviews];
    });
    persistLogs((prevLogs) => [{ id: uid(), date: today(), area, theme: `${parentTheme} › ${subtema}`, parentTheme, subtema, pct, isSubtopic: true }, ...prevLogs]);
  }
  function addSession(session) {
    if (!session.theme || !session.area) return;
    const s = { ...session, id: uid(), createdAt: today() }; persistSessions((prev) => [s, ...prev]);
    const key = `${session.area}__${session.theme.toLowerCase().trim()}`;
    const pct = perc(session.acertos, session.total);
    // D0 revLog entry — makes session appear in "revisões passadas"
    const logEntry = { id: uid(), date: session.date || today(), area: session.area, theme: session.theme, total: session.total, acertos: session.acertos, pct };
    if (session.subtopicScores && session.subtopicScores.length > 0) logEntry.subtopicScores = session.subtopicScores;
    persistLogs((prevLogs) => [logEntry, ...prevLogs]);
    persistReviews((prevReviews) => {
      let ex = prevReviews.find((r) => r.key === key && !r.isSubtopic);
      // Fuzzy fallback: match ignoring "(Sem. XX)" suffix differences
      if (!ex) {
        const stripSem = (s) => s.replace(/\s*\(sem\.\s*\d+\)\s*/gi, "").trim();
        const baseNorm = stripSem(session.theme.toLowerCase().trim());
        ex = prevReviews.find((r) => !r.isSubtopic && r.area === session.area && stripSem((r.theme || "").toLowerCase().trim()) === baseNorm);
      }
      // D0: >85% → 14d, otherwise → 7d
      const ni = pct > 85 ? 1 : 0;
      const useKey = ex?.key || key;
      const rev = { id: ex?.id || uid(), key: useKey, area: session.area, theme: ex?.theme || session.theme, intervalIndex: ni, nextDue: addDays(today(), INTERVALS[ni]), lastPerf: pct, lastStudied: today(), history: [...(ex?.history || []), { date: today(), pct }] };
      let newReviews = ex ? prevReviews.map((r) => r.key === useKey ? rev : r) : [rev, ...prevReviews];
      // Create subtopic review cards if subtopics provided
      if (session.subtopicScores && session.subtopicScores.length > 0) {
        const subNames = session.subtopicScores.map((st) => st.name);
        // Store subtopicNames on parent review card so Revisoes can find them
        newReviews = newReviews.map((r) => r.key === useKey ? { ...r, subtopicNames: subNames } : r);
        // Use parent's intervalIndex to determine subtopic starting interval
        const parentCard = newReviews.find(r => r.key === useKey && !r.isSubtopic);
        const parentIdx = parentCard ? parentCard.intervalIndex : 0;
        const parentThemeNorm = (parentCard?.theme || session.theme).toLowerCase().trim();
        const sessionKeyPrefix = `${session.area}__${parentThemeNorm}::`;
        session.subtopicScores.forEach((st) => {
          const sKey = `${session.area}__${parentThemeNorm}::${st.name.toLowerCase().trim()}`;
          const stNameNorm = st.name.toLowerCase().trim();
          const exSub = newReviews.find((r) => {
            if (!r.isSubtopic || r.area !== session.area) return false;
            if (r.key === sKey) return true;
            if (r.theme && r.theme.toLowerCase().trim() === stNameNorm) {
              if (r.parentTheme && r.parentTheme.toLowerCase().trim() === parentThemeNorm) return true;
              if (r.key && r.key.startsWith(sessionKeyPrefix)) return true;
            }
            return false;
          });
          // If subtopic has no card yet, inherit parent's current intervalIndex
          const startIdx = exSub ? exSub.intervalIndex : parentIdx;
          const sni = nxtIdx(startIdx, st.pct);
          const stUseKey = exSub?.key || sKey;
          const sRev = {
            id: exSub?.id || uid(), key: stUseKey, area: session.area, theme: st.name, parentTheme: parentCard?.theme || session.theme,
            isSubtopic: true, intervalIndex: sni, nextDue: addDays(today(), INTERVALS[sni]),
            lastPerf: st.pct, lastStudied: today(),
            history: [...(exSub?.history || []), { date: today(), pct: st.pct }]
          };
          newReviews = exSub ? newReviews.map((r) => r.key === stUseKey ? sRev : r) : [sRev, ...newReviews];
        });
      }
      return newReviews;
    });
    // Also save subtopic names to the subtopics dictionary
    if (session.subtopicScores && session.subtopicScores.length > 0) {
      saveSubtopics(session.area, session.theme, session.subtopicScores.map((st) => st.name));
    }
  }
  function addRevLog(areaId, theme, total, acertos) {
    if (!theme || !areaId) return;
    const pct = perc(acertos, total);
    persistLogs((prevLogs) => [{ id: uid(), date: today(), area: areaId, theme, total, acertos, pct }, ...prevLogs]);
    const key = `${areaId}__${theme.toLowerCase().trim()}`;
    persistReviews((prevReviews) => {
      const ex = prevReviews.find((r) => r.key === key);
      let newReviews;
      if (ex) { const ni = nxtIdx(ex.intervalIndex, pct); newReviews = prevReviews.map((r) => r.key === key ? { ...r, intervalIndex: ni, nextDue: addDays(today(), INTERVALS[ni]), lastPerf: pct, lastStudied: today(), history: [...(r.history || []), { date: today(), pct }] } : r); }
      else { const ni0 = pct > 85 ? 1 : 0; newReviews = [{ id: uid(), key, area: areaId, theme, intervalIndex: ni0, nextDue: addDays(today(), INTERVALS[ni0]), lastPerf: pct, lastStudied: today(), history: [{ date: today(), pct }] }, ...prevReviews]; }
      // Advance overdue subtopic cards for this parent theme
      const t = today();
      const updatedParent = newReviews.find((r) => r.key === key && !r.isSubtopic);
      const parentNextDue = updatedParent?.nextDue || addDays(t, INTERVALS[0]);
      const keyPrefix = key + "::";
      newReviews = newReviews.map((r) => {
        if (!r.isSubtopic) return r;
        if (r.area !== areaId) return r;
        const matchesParent = r.parentTheme && r.parentTheme.toLowerCase().trim() === theme.toLowerCase().trim();
        const matchesKey = r.key && r.key.startsWith(keyPrefix);
        if (!matchesParent && !matchesKey) return r;
        if (r.nextDue > t) return r;
        // Only advance nextDue — don't change lastStudied since subtopic wasn't individually reviewed
        return { ...r, nextDue: parentNextDue };
      });
      return newReviews;
    });
    notify("✓ Revisão registrada");
  }
  function markReview(revId, acertos, total, subtopicScores) {
    const pct = perc(acertos, total);
    // Read rev from current state for log entry (before pR runs)
    const rev = reviews.find((r) => r.id === revId); if (!rev) return;
    const ni = nxtIdx(rev.intervalIndex, pct);
    // Update main card + subtopic cards in one batch
    persistReviews((prevReviews) => {
      const prevRev = prevReviews.find((r) => r.id === revId); if (!prevRev) return prevReviews;
      const niInner = nxtIdx(prevRev.intervalIndex, pct);
      // Capture subtopic state before changes for undo
      const keyPrefix = `${prevRev.area}__${prevRev.theme.toLowerCase().trim()}::`;
      const prevSubStates = prevReviews.filter((r) => {
        if (!r.isSubtopic || r.area !== prevRev.area) return false;
        if (r.key && r.key.startsWith(keyPrefix)) return true;
        if (r.parentTheme && r.parentTheme.toLowerCase().trim() === prevRev.theme.toLowerCase().trim()) return true;
        return false;
      }).map((r) => ({ ...r }));
      const entry = { date: today(), pct, _prev: { intervalIndex: prevRev.intervalIndex, nextDue: prevRev.nextDue, lastPerf: prevRev.lastPerf, lastStudied: prevRev.lastStudied, _subStates: prevSubStates } };
      let newReviews = prevReviews.map((r) => r.id !== revId ? r : { ...r, intervalIndex: niInner, nextDue: addDays(today(), INTERVALS[niInner]), lastPerf: pct, lastStudied: today(), history: [...(r.history || []), entry] });
      // Update subtopic cards that were explicitly scored
      const scoredSubKeys = new Set();
      // Use parent's intervalIndex to determine subtopic starting interval
      const updatedParent = newReviews.find(r => r.id === revId);
      const parentIdx = updatedParent ? updatedParent.intervalIndex : 0;
      if (subtopicScores && subtopicScores.length > 0) {
        const parentKeyPrefix = `${prevRev.area}__${prevRev.theme.toLowerCase().trim()}::`;
        subtopicScores.forEach((s) => {
          const sKey = `${prevRev.area}__${prevRev.theme.toLowerCase().trim()}::${s.name.toLowerCase().trim()}`;
          const sNameNorm = s.name.toLowerCase().trim();
          // Find existing card by key match OR by name+parentTheme match
          const ex = newReviews.find((r) => {
            if (!r.isSubtopic || r.area !== prevRev.area) return false;
            if (r.key === sKey) return true;
            // Match by name within same parent (catches key mismatches from renames)
            if (r.theme && r.theme.toLowerCase().trim() === sNameNorm) {
              const matchesParent = r.parentTheme && r.parentTheme.toLowerCase().trim() === prevRev.theme.toLowerCase().trim();
              const matchesKeyPrefix = r.key && r.key.startsWith(parentKeyPrefix);
              if (matchesParent || matchesKeyPrefix) return true;
            }
            return false;
          });
          scoredSubKeys.add(ex?.key || sKey);
          // If subtopic has no card yet, inherit parent's current intervalIndex
          const startIdx = ex ? ex.intervalIndex : parentIdx;
          const sni = nxtIdx(startIdx, s.pct);
          const useKey = ex?.key || sKey;
          const sRev = {
            id: ex?.id || uid(), key: useKey, area: prevRev.area, theme: s.name, parentTheme: prevRev.theme,
            isSubtopic: true, intervalIndex: sni, nextDue: addDays(today(), INTERVALS[sni]),
            lastPerf: s.pct, lastStudied: today(),
            history: [...(ex?.history || []), { date: today(), pct: s.pct }]
          };
          newReviews = ex ? newReviews.map((r) => r.key === useKey ? sRev : r) : [sRev, ...newReviews];
        });
      }
      // Advance overdue subtopic cards that were NOT scored in this review
      // They follow the parent's new schedule (reviewed together)
      // Match by parentTheme OR key prefix to catch all creation paths
      const t = today();
      const parentNextDue = addDays(t, INTERVALS[niInner]);
      newReviews = newReviews.map((r) => {
        if (!r.isSubtopic || scoredSubKeys.has(r.key)) return r;
        if (r.area !== prevRev.area) return r;
        const matchesParent = r.parentTheme && r.parentTheme.toLowerCase().trim() === prevRev.theme.toLowerCase().trim();
        const matchesKey = r.key && r.key.startsWith(keyPrefix);
        if (!matchesParent && !matchesKey) return r;
        // Only advance if this subtopic is currently overdue
        if (r.nextDue > t) return r;
        // Move to parent's next due date — don't change lastStudied since subtopic wasn't individually reviewed
        return { ...r, nextDue: parentNextDue };
      });
      return newReviews;
    });
    // Single log entry with inline subtopic scores
    const logId = uid();
    const logEntry = { id: logId, date: today(), area: rev.area, theme: rev.theme, total, acertos, pct };
    if (subtopicScores && subtopicScores.length > 0) logEntry.subtopicScores = subtopicScores;
    persistLogs((prevLogs) => [logEntry, ...prevLogs]);
    // Store logId on the review's latest history entry so undo can find the exact log
    persistReviews((prevReviews) => prevReviews.map((r) => {
      if (r.id !== revId) return r;
      const hist = r.history || [];
      if (hist.length === 0) return r;
      const last = { ...hist[hist.length - 1], _logId: logId };
      return { ...r, history: [...hist.slice(0, -1), last] };
    }));
    notify("✓ Concluída — próximo: " + INT_LABELS[ni] + " (" + INT_DAYS[ni] + ")");
  }
  function undoMarkReview(revId) {
    const targetRev = reviews.find((r) => r.id === revId);
    const hist = targetRev?.history || [];
    const lastEntry = hist.length > 0 ? hist[hist.length - 1] : null;
    const logId = lastEntry?._logId;
    persistReviews((prevReviews) => {
      const rev = prevReviews.find((r) => r.id === revId); if (!rev) return prevReviews;
      const h = rev.history || [];
      if (h.length === 0) return prevReviews;
      const last = h[h.length - 1];
      const prev = last._prev;
      let result;
      if (prev) {
        result = prevReviews.map((r) => r.id !== revId ? r : { ...r, intervalIndex: prev.intervalIndex, nextDue: prev.nextDue, lastPerf: prev.lastPerf, lastStudied: prev.lastStudied, history: h.slice(0, -1) });
      } else {
        const prevEntry = h.length >= 2 ? h[h.length - 2] : null;
        result = prevReviews.map((r) => r.id !== revId ? r : { ...r, nextDue: today(), lastPerf: prevEntry?.pct ?? rev.lastPerf, lastStudied: prevEntry?.date ?? rev.lastStudied, history: h.slice(0, -1) });
      }
      // Restore subtopic cards to their previous state
      if (prev?._subStates) {
        const subMap = new Map(prev._subStates.map((s) => [s.id, s]));
        // Restore existing subtopics, remove newly created ones
        result = result.map((r) => {
          if (!r.isSubtopic) return r;
          const saved = subMap.get(r.id);
          if (saved) { subMap.delete(r.id); return saved; }
          return r;
        });
        // Remove subtopic cards that didn't exist before (created during this markReview)
        const keyPrefix = `${rev.area}__${rev.theme.toLowerCase().trim()}::`;
        const existedBefore = new Set(prev._subStates.map((s) => s.id));
        result = result.filter((r) => {
          if (!r.isSubtopic) return true;
          if (existedBefore.has(r.id)) return true;
          // Only remove subtopics belonging to this parent
          if (r.key && r.key.startsWith(keyPrefix)) return false;
          if (r.parentTheme && r.parentTheme.toLowerCase().trim() === rev.theme.toLowerCase().trim() && r.area === rev.area) return false;
          return true;
        });
      }
      return result;
    });
    persistLogs((prevLogs) => {
      if (logId) return prevLogs.filter((l) => l.id !== logId);
      // Fallback for old data without _logId
      const logIdx = prevLogs.findIndex((l) => l.date === today() && targetRev && l.area === targetRev.area && l.theme === targetRev.theme);
      return logIdx >= 0 ? prevLogs.filter((_, i) => i !== logIdx) : prevLogs;
    });
    notify("↩ Revisão desfeita — voltou para hoje");
  }
  function editReview(revId, ni, nd) { persistReviews((prev) => prev.map((r) => r.id !== revId ? r : { ...r, intervalIndex: ni, nextDue: nd || addDays(r.lastStudied || today(), INTERVALS[ni]) })); notify("✓ Corrigido"); }
  function recalcSubtopicIntervals() {
    // Backup current reviews before recalculating
    try { localStorage.setItem("rp26_reviews_backup", JSON.stringify(reviews)); } catch (e) { console.warn("Backup failed", e); }
    let fixed = 0, dupsRemoved = 0;
    persistReviews((prev) => {
      let result = [...prev];
      // 1) Remove duplicate subtopic cards (same name+parent, keep most recent)
      const seen = new Map();
      const toRemove = new Set();
      result.forEach((r) => {
        if (!r.isSubtopic) return;
        const dk = `${r.area}__${(r.parentTheme || "").toLowerCase().trim()}::${r.theme.toLowerCase().trim()}`;
        const existing = seen.get(dk);
        if (existing) {
          const keepR = (r.lastStudied || "") >= (existing.lastStudied || "") ? r : existing;
          const removeR = keepR === r ? existing : r;
          toRemove.add(removeR.id);
          seen.set(dk, keepR);
          dupsRemoved++;
        } else { seen.set(dk, r); }
      });
      if (toRemove.size > 0) result = result.filter((r) => !toRemove.has(r.id));
      // 1b) Remove duplicate parent cards (same theme ignoring "(Sem. XX)" suffix, keep most complete)
      const stripSem = (s) => s.replace(/\s*\(sem\.\s*\d+\)\s*/gi, "").trim();
      const parentSeen = new Map();
      const parentRemove = new Set();
      result.forEach((r) => {
        if (r.isSubtopic) return;
        const dk = `${r.area}__${stripSem((r.theme || "").toLowerCase().trim())}`;
        const existing = parentSeen.get(dk);
        if (existing) {
          // Keep the one with more history, or more recent activity
          const keepR = (r.history?.length || 0) > (existing.history?.length || 0) ? r :
                        (r.history?.length || 0) < (existing.history?.length || 0) ? existing :
                        (r.lastStudied || "") >= (existing.lastStudied || "") ? r : existing;
          const removeR = keepR === r ? existing : r;
          // Merge histories
          const mergedHist = [...(keepR.history || []), ...(removeR.history || [])];
          mergedHist.sort((a, b) => a.date.localeCompare(b.date));
          // Deduplicate history entries with same date
          const uniqueHist = [];
          const histSeen = new Set();
          mergedHist.forEach((h) => { const hk = `${h.date}_${h.pct}`; if (!histSeen.has(hk)) { histSeen.add(hk); uniqueHist.push(h); } });
          keepR.history = uniqueHist;
          // Merge subtopicNames
          if (removeR.subtopicNames || keepR.subtopicNames) {
            keepR.subtopicNames = [...new Set([...(keepR.subtopicNames || []), ...(removeR.subtopicNames || [])])];
          }
          // Re-point orphaned subtopics from removed parent to kept parent
          result.forEach((sr) => {
            if (sr.isSubtopic && sr.area === removeR.area && sr.parentTheme &&
                sr.parentTheme.toLowerCase().trim() === (removeR.theme || "").toLowerCase().trim()) {
              sr.parentTheme = keepR.theme;
              // Fix key prefix to match kept parent
              const stName = sr.key.split("::")[1];
              if (stName) sr.key = `${keepR.area}__${keepR.theme.toLowerCase().trim()}::${stName}`;
            }
          });
          parentRemove.add(removeR.id);
          parentSeen.set(dk, keepR);
          dupsRemoved++;
        } else { parentSeen.set(dk, r); }
      });
      if (parentRemove.size > 0) result = result.filter((r) => !parentRemove.has(r.id));
      // 2) Recalculate intervalIndex from history for each subtopic
      result = result.map((r) => {
        if (!r.isSubtopic) return r;
        // Build subtopic's own history: prefer card history, fallback to revLog scores
        let subHist = r.history && r.history.length > 0 ? r.history : [];
        if (subHist.length === 0) {
          // Reconstruct from revLogs — must match both subtopic name AND parent theme
          const stNameNorm = r.theme.toLowerCase().trim();
          const parentNorm = r.parentTheme ? r.parentTheme.toLowerCase().trim() : null;
          revLogs.forEach((l) => {
            if (l.area !== r.area) return;
            // Verify this log belongs to the correct parent theme
            if (parentNorm && l.theme && l.theme.toLowerCase().trim() !== parentNorm) return;
            if (l.subtopicScores) {
              const m = l.subtopicScores.find((s) => s.name.toLowerCase().trim() === stNameNorm);
              if (m) subHist.push({ date: l.date, pct: m.pct });
            }
          });
          subHist.sort((a, b) => a.date.localeCompare(b.date));
        }
        // Find parent
        const parent = result.find((p) => !p.isSubtopic && p.area === r.area &&
          p.theme && r.parentTheme && p.theme.toLowerCase().trim() === r.parentTheme.toLowerCase().trim());
        const parentHist = parent?.history || [];
        const firstSubDate = subHist.length > 0 ? subHist[0].date : null;
        // Replay parent reviews before subtopic existed (using parent's pct)
        let idx = 0;
        if (firstSubDate) {
          parentHist.filter((h) => h.date < firstSubDate).forEach((h) => { idx = nxtIdx(idx, h.pct); });
        }
        // Then replay subtopic's own reviews
        subHist.forEach((h) => { idx = nxtIdx(idx, h.pct); });
        if (subHist.length === 0 && parentHist.length > 0) return r; // no data to recalc
        if (idx !== r.intervalIndex) {
          fixed++;
          // Use the last history entry date (more reliable than lastStudied which can be changed by advance-overdue)
          const lastHistDate = subHist.length > 0 ? subHist[subHist.length - 1].date : (r.lastStudied || today());
          const nd = addDays(lastHistDate, INTERVALS[idx]);
          return { ...r, intervalIndex: idx, nextDue: nd };
        }
        return r;
      });
      return result;
    });
    notify(`✓ Recalculado: ${fixed} intervalos corrigidos, ${dupsRemoved} duplicatas removidas`);
  }
  function undoRecalc() {
    try {
      const backup = localStorage.getItem("rp26_reviews_backup");
      if (!backup) { notify("⚠ Nenhum backup encontrado"); return false; }
      const restored = JSON.parse(backup);
      persistReviews(() => restored);
      localStorage.removeItem("rp26_reviews_backup");
      notify("↩ Recálculo desfeito — revisões restauradas");
      return true;
    } catch (e) { notify("⚠ Erro ao restaurar backup"); return false; }
  }
  function hasRecalcBackup() { return !!localStorage.getItem("rp26_reviews_backup"); }
  function addExam(exam) { const newExams = [{ ...exam, id: uid() }, ...exams]; persistExams(newExams); notify("✓ Prova registrada"); setTimeout(() => { const newDecks = generateFlashcardDecks(newExams, reviews, sessions); const merged = mergeDecks(flashcardDecks, newDecks); persistFlashcards(merged); }, 100); }
  function delSession(id) { persistSessions((prev) => prev.filter((s) => s.id !== id)); }
  function delExam(id) { persistExams((prev) => prev.filter((e) => e.id !== id)); }
  function updateExam(id, updates) { persistExams((prev) => prev.map((e) => e.id !== id ? e : { ...e, ...updates })); notify("✓ Prova atualizada"); regenerateFlashcards(); }
  function regenerateFlashcards() {
    setTimeout(() => {
      const newDecks = generateFlashcardDecks(exams, reviews, sessions);
      const merged = mergeDecks(flashcardDecks, newDecks);
      persistFlashcards(merged);
    }, 100);
  }
  function handleFlashcardReview(deckId, cardId, qualityKey) {
    const updated = reviewCard(flashcardDecks, deckId, cardId, qualityKey);
    persistFlashcards(updated);
  }
  function editRevLog(logId, updates) { persistLogs((prev) => prev.map((l) => l.id !== logId ? l : { ...l, ...updates, pct: updates.acertos != null && updates.total != null ? perc(updates.acertos, updates.total) : l.pct })); notify("✓ Revisão atualizada"); }
  function delRevLog(logId) {
    const deleted = revLogs.find((l) => l.id === logId);
    if (!deleted) return;
    persistLogs((prev) => prev.filter((l) => l.id !== logId));
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
    persistReviews(existing); notify(`✓ ${newRevs.length} revisões importadas do Notion`);
  }

  const { dueR, upR } = useMemo(() => {
    const parentRevs = reviews.filter((r) => !r.isSubtopic);
    const t = today();
    const getEffDue = (r) => {
      if (!r.theme) return r.nextDue;
      const rNorm = r.theme.toLowerCase().trim();
      const keyPrefix = r.key ? r.key + "::" : `${r.area}__${rNorm}::`;
      const subs = reviews.filter((s) => {
        if (!s.isSubtopic || s.area !== r.area) return false;
        if (s.key && s.key.startsWith(keyPrefix)) return true;
        if (s.parentTheme && s.parentTheme.toLowerCase().trim() === rNorm) return true;
        return false;
      });
      if (subs.length === 0) return r.nextDue;
      // When subtopics exist, they define when to review (not the parent date)
      return subs.map((s) => s.nextDue).sort()[0];
    };
    const due = parentRevs.filter((r) => getEffDue(r) <= t).map((r) => ({ ...r, _effDue: getEffDue(r) })).sort((a, b) => (a._effDue || a.nextDue).localeCompare(b._effDue || b.nextDue));
    const up = parentRevs.filter((r) => getEffDue(r) > t).map((r) => ({ ...r, _effDue: getEffDue(r) })).sort((a, b) => (a._effDue || a.nextDue).localeCompare(b._effDue || b.nextDue));
    return { dueR: due, upR: up };
  }, [reviews]);

  if (!ready) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F, padding: S.xl }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: S.lg, paddingTop: 80 }}>
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    </div>
  );
  const alertThemes = [];
  const TAB_ICONS = {
    agenda: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
    revisoes: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6"/><path d="M2.5 22v-6h6"/><path d="M2.5 11.5a10 10 0 0 1 18.2-4.5"/><path d="M21.5 12.5a10 10 0 0 1-18.2 4.5"/></svg>,
    provas: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    temas: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  };
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
            <img className="logo-img" src={import.meta.env.BASE_URL + "logo-cropped.png"} alt="MedTracker" style={{ width: 42, height: 42 }} />
            <span className="logo-text" style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.6, fontFamily: F }}><span style={{ color: C.purple }}>Med</span><span style={{ color: C.text, fontWeight: 700 }}>Tracker</span></span>
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
                <button onClick={() => { setShowBackupMenu(false); setShowAutoBackupMenu(true); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", color: C.green, fontSize: 13, fontFamily: F, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = C.surface} onMouseLeave={e => e.currentTarget.style.background = "none"}>{"⏪"} Restaurar backup automático</button>
                <button onClick={() => { setShowBackupMenu(false); runDedup(); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", color: C.yellow, fontSize: 13, fontFamily: F, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = C.surface} onMouseLeave={e => e.currentTarget.style.background = "none"}>{"🧹"} Limpar duplicatas</button>
                <button onClick={() => { setShowBackupMenu(false); caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k)))).then(() => { navigator.serviceWorker?.getRegistrations().then(rs => rs.forEach(r => r.unregister())); setTimeout(() => window.location.reload(true), 300); }).catch(() => window.location.reload(true)); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: C.yellow, fontSize: 13, fontFamily: F, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = C.surface} onMouseLeave={e => e.currentTarget.style.background = "none"}>{"🔄"} Forçar atualização</button>
              </div>}
            </div>
            <button onClick={toggleTheme} style={{ background: "none", border: "none", width: 28, height: 28, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.text3, opacity: 0.45, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.8"} onMouseLeave={e => e.currentTarget.style.opacity = "0.45"} title={darkMode ? "Modo claro" : "Modo escuro"}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{darkMode ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></> : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}</svg></button>
          </div>
        </div>
      </div>
      {showSyncModal && (
        <div style={{ position: "fixed", inset: 0, background: modalBg(), zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) setShowSyncModal(false); }}>
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
                <button onClick={() => { runDedup(); setShowSyncModal(false); }} style={btn(C.yellow, { width: "100%", fontSize: 13, marginTop: 6 })}>Limpar duplicatas</button>
                <button onClick={() => { disconnectSync(); setSyncId(null); setSyncStatus("off"); setShowSyncModal(false); notify("Sync desconectado"); }} style={btn(C.card2, { width: "100%", fontSize: 13, color: C.red })}>Desconectar sync</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: C.surface, borderRadius: R.md, padding: 12, border: `1px solid ${C.border}`, fontSize: 12, color: C.text3, lineHeight: 1.5 }}>
                  Sincronize seus dados entre iPhone, iPad e computador automaticamente via nuvem.
                </div>
                <button onClick={async () => { try { const id = await createSync(); setSyncId(id); setSyncStatus("synced"); notify("Sync criado!"); } catch (e) { notify("Erro ao criar sync"); } }} style={btn(C.purple, { width: "100%", fontSize: 13 })}>Criar código de sync (1o dispositivo)</button>
                <div style={{ fontSize: 12, color: C.text3, textAlign: "center" }}>ou</div>
                <div style={{ fontSize: 12, color: C.text3 }}>Já tem um código? Digite abaixo:</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={syncInput} onChange={(e) => setSyncInput(e.target.value.toUpperCase())} placeholder="Ex: ABC123" maxLength={6} style={{ ...inp(), flex: 1, fontSize: 18, textAlign: "center", fontFamily: FM, fontWeight: 700, letterSpacing: 3 }} />
                  <button disabled={syncInput.length < 6} onClick={async () => { try { const id = await joinSync(syncInput, () => { setReviews(loadKey("rp26_reviews", [])); setRevLogs(loadKey("rp26_revlogs", [])); setSessions(loadKey("rp26_sessions", [])); setExams(loadKey("rp26_exams", [])); setSubtopics(loadKey("rp26_subtopics", {})); }); setSyncId(id); setSyncStatus("synced"); setShowSyncModal(false); notify("Conectado! Recarregando..."); setTimeout(() => window.location.reload(), 1500); } catch (e) { alert("Código não encontrado."); } }} style={btn(C.blue, { padding: "10px 20px", fontSize: 13, opacity: syncInput.length < 6 ? 0.4 : 1 })}>Entrar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showAutoBackupMenu && (
        <div style={{ position: "fixed", inset: 0, background: modalBg(), zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) setShowAutoBackupMenu(false); }}>
          <div className="fade-in" style={{ background: C.card, borderRadius: 20, padding: 24, maxWidth: 400, width: "100%", border: `1px solid ${C.border2}`, boxShadow: SH.lg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Backups automáticos</div>
              <button onClick={() => setShowAutoBackupMenu(false)} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: C.text3, marginBottom: 12 }}>O app salva automaticamente uma cópia dos dados toda vez que carrega. Escolha qual restaurar:</div>
            {[1, 2].map((slot) => {
              const raw = localStorage.getItem(`rp26_auto_backup_${slot}`);
              let info = "Vazio";
              if (raw) { try { const d = JSON.parse(raw); info = d._savedAt ? new Date(d._savedAt).toLocaleString("pt-BR") : "Data desconhecida"; } catch { info = "Corrompido"; } }
              return <button key={slot} disabled={!raw} onClick={() => { setShowAutoBackupMenu(false); restoreAutoBackup(slot); }} style={{ ...btn(raw ? C.blue : C.card2, { width: "100%", fontSize: 13, marginBottom: 8, opacity: raw ? 1 : 0.4 }) }}>Backup {slot} — {info}</button>;
            })}
          </div>
        </div>
      )}
      {showSessionModal && <SessionModal onSave={(s) => { addSession(s); setShowSessionModal(false); }} onClose={() => setShowSessionModal(false)} subtopics={subtopics} revLogs={revLogs} reviews={reviews} />}
      {subtopicModal && <SubtopicModal area={subtopicModal.area} topic={subtopicModal.topic} semana={subtopicModal.semana} existing={getSubtopics(subtopicModal.area, subtopicModal.topic)} onSave={(items) => { saveSubtopics(subtopicModal.area, subtopicModal.topic, items); setSubtopicModal(null); notify(items.length > 0 ? `✓ ${items.length} subtema${items.length > 1 ? "s" : ""} salvo${items.length > 1 ? "s" : ""}` : "✓ Aula marcada"); }} onClose={() => setSubtopicModal(null)} />}
      {/* CONTENT */}
      <div style={{ padding: `${S.xl}px`, maxWidth: 1200, margin: "0 auto", paddingBottom: "calc(100px + env(safe-area-inset-bottom, 0px))" }}>
        <div key={tabKey} className="fade-in">
          <Suspense fallback={<div style={{ display: "flex", flexDirection: "column", gap: S.lg, paddingTop: 20 }}><SkeletonCard /><SkeletonCard /></div>}>
            {tab === "agenda" && <Agenda reviews={reviews} revLogs={revLogs} alertThemes={alertThemes} subtopics={subtopics} onAulaChecked={(area, topic, semana) => setSubtopicModal({ area, topic, semana })} />}
            {tab === "dashboard" && <Dashboard revLogs={revLogs} sessions={sessions} exams={exams} reviews={reviews} dueCount={dueR.length} onNotionSync={handleNotionSync} onNewSession={() => setShowSessionModal(true)} onAlerts={() => switchTab("alertas")} flashcardDecks={flashcardDecks} onNavigateFlashcards={() => switchTab("flashcards")} onNavigateProvas={() => switchTab("provas")} onNavigateRevisoes={() => switchTab("revisoes")} />}
            {tab === "alertas" && <Dashboard revLogs={revLogs} sessions={sessions} exams={exams} reviews={reviews} dueCount={dueR.length} onNotionSync={handleNotionSync} onNewSession={() => setShowSessionModal(true)} onAlerts={() => switchTab("alertas")} forceTab="alerts" flashcardDecks={flashcardDecks} onNavigateFlashcards={() => switchTab("flashcards")} onNavigateProvas={() => switchTab("provas")} onNavigateRevisoes={() => switchTab("revisoes")} />}
            {tab === "sessoes" && <Sessoes sessions={sessions} onAdd={addSession} onDel={delSession} />}
            {tab === "revisoes" && <Revisoes due={dueR} upcoming={upR} revLogs={revLogs} reviews={reviews} sessions={sessions} subtopics={subtopics} onMark={markReview} onQuick={addRevLog} onEditLog={editRevLog} onDelLog={delRevLog} onSubtopicReview={addSubtopicReview} onSaveSubtopics={saveSubtopics} onUndoMark={undoMarkReview} />}
            {tab === "provas" && <Provas exams={exams} revLogs={revLogs} sessions={sessions} subtopics={subtopics} onAdd={addExam} onDel={delExam} onUpdate={updateExam} />}
            {tab === "temas" && <Temas reviews={reviews} revLogs={revLogs} subtopics={subtopics} onEditInterval={editReview} onSaveSubtopics={saveSubtopics} onDeleteReviews={persistReviews} onRecalcIntervals={recalcSubtopicIntervals} onUndoRecalc={undoRecalc} hasRecalcBackup={hasRecalcBackup} />}
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
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", transform: active ? "scale(1.15)" : "scale(1)", transition: "transform .2s cubic-bezier(.4,0,.2,1)" }}>{TAB_ICONS[t.id]}</span>
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
