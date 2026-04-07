import { INTERVALS, AREAS, areaMap, SEMANAS, SEM_SAT, UNICAMP_THEMES, MED_SCHEDULE, KNOWN_PDFS, CATS } from "./data.js";
import { C } from "./theme.js";

export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (d, n) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
export const diffDays = (a, b) => Math.round((new Date(a + "T12:00:00") - new Date(b + "T12:00:00")) / 86400000);
export const perc = (ac, tot) => tot > 0 ? Math.max(0, Math.min(100, Math.round((ac / tot) * 100))) : 0;
export const uid = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
export const fmtDate = (s) => s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "";
export const perfColor = (p) => p >= 85 ? "#22C55E" : p >= 60 ? "#EAB308" : "#EF4444";
export const perfLabel = (p) => p >= 85 ? "Bom" : p >= 60 ? "Regular" : "Fraco";
export function nxtIdx(cur, pct) { if (pct >= 80) return Math.min(cur + 1, INTERVALS.length - 1); if (pct >= 75) return cur; return Math.max(0, cur - 1); }

export function weekDates(satStr) {
  const sat = new Date(satStr + "T12:00:00");
  const dates = {};
  const labels = ["sab", "dom", "seg", "ter", "qua", "qui", "sex"];
  labels.forEach((id, i) => {
    const d = new Date(sat); d.setDate(sat.getDate() + i);
    dates[id] = d.toISOString().slice(0, 10);
  });
  return dates;
}

export function getEffDueUtil(r, allReviews) {
  if (!r.theme) return r.nextDue;
  const rNorm = r.theme.toLowerCase().trim();
  const stripSem = (s) => s.replace(/\s*\(sem\.\s*\d+\)\s*/gi, "").trim();
  const rBase = stripSem(rNorm);
  const keyPrefix = r.key ? r.key + "::" : `${r.area}__${rNorm}::`;
  const keyPrefixBase = `${r.area}__${rBase}::`;
  const subs = allReviews.filter((s) => {
    if (!s.isSubtopic || s.area !== r.area) return false;
    if (s.key && (s.key.startsWith(keyPrefix) || s.key.startsWith(keyPrefixBase))) return true;
    if (s.parentTheme) {
      const pNorm = s.parentTheme.toLowerCase().trim();
      if (pNorm === rNorm || stripSem(pNorm) === rBase) return true;
    }
    return false;
  });
  if (subs.length === 0) return r.nextDue;
  return subs.map((s) => s.nextDue).sort()[0];
}

// Shared helper: returns a deduped list of due/overdue reviews for the given window.
// Handles parent/subtopic awareness — emits one row per due subtopic if a parent has
// subtopics, otherwise emits the parent. Subtopics with no matching parent show as orphans.
// Row shape: { key, area, parentTheme, subtopic, nextDue, isOverdue, revId }
export function getDueReviewsForWeek(allReviews, weekStart, weekEnd) {
  const stripSem = (s) => (s || "").replace(/\s*\(sem\.\s*\d+\)\s*/gi, "").trim();
  // Dedup parents by base theme, keep most recently studied
  const parentsByKey = new Map();
  allReviews.forEach((r) => {
    if (r.isSubtopic || !r.nextDue || !r.theme) return;
    const k = `${r.area}__${stripSem(r.theme.toLowerCase().trim())}`;
    const ex = parentsByKey.get(k);
    if (!ex || (r.lastStudied || "") > (ex.lastStudied || "")) parentsByKey.set(k, r);
  });
  const isChildOf = (sub, parent) => {
    if (!sub.isSubtopic || sub.area !== parent.area) return false;
    const pNorm = parent.theme.toLowerCase().trim();
    const pBase = stripSem(pNorm);
    if (sub.key) {
      if (sub.key.startsWith(`${parent.area}__${pNorm}::`)) return true;
      if (sub.key.startsWith(`${parent.area}__${pBase}::`)) return true;
    }
    if (sub.parentTheme) {
      const spn = sub.parentTheme.toLowerCase().trim();
      if (spn === pNorm || stripSem(spn) === pBase) return true;
    }
    return false;
  };
  const consumedSubIds = new Set();
  const results = [];
  parentsByKey.forEach((parent, key) => {
    const subs = allReviews.filter((s) => s.isSubtopic && s.nextDue && isChildOf(s, parent));
    if (subs.length > 0) {
      subs.forEach((s) => consumedSubIds.add(s.id));
      subs.filter((s) => s.nextDue <= weekEnd).forEach((s) => {
        results.push({
          key: `${key}::${s.theme.toLowerCase().trim()}`,
          area: s.area,
          parentTheme: parent.theme,
          subtopic: s.theme,
          nextDue: s.nextDue,
          isOverdue: s.nextDue < weekStart,
          revId: s.id
        });
      });
    } else if (parent.nextDue && parent.nextDue <= weekEnd) {
      results.push({
        key,
        area: parent.area,
        parentTheme: parent.theme,
        subtopic: null,
        nextDue: parent.nextDue,
        isOverdue: parent.nextDue < weekStart,
        revId: parent.id
      });
    }
  });
  // Orphan subtopics (no matching parent in reviews)
  allReviews.forEach((r) => {
    if (!r.isSubtopic || !r.nextDue || !r.theme) return;
    if (consumedSubIds.has(r.id)) return;
    if (r.nextDue > weekEnd) return;
    const pt = r.parentTheme || r.theme;
    results.push({
      key: `orphan__${r.area}__${stripSem((pt || "").toLowerCase().trim())}::${r.theme.toLowerCase().trim()}`,
      area: r.area,
      parentTheme: pt,
      subtopic: r.parentTheme ? r.theme : null,
      nextDue: r.nextDue,
      isOverdue: r.nextDue < weekStart,
      revId: r.id
    });
  });
  results.sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  return results;
}

export function buildWeekTemplate(semIdx, allReviews, alertThemes) {
  const sem = SEMANAS[semIdx] || SEMANAS[0];
  const satStr = SEM_SAT[sem.semana] || today();
  const dates = weekDates(satStr);
  const a1 = sem.aulas[0] || null;
  const a2 = sem.aulas[1] || null;
  const nextSem = SEMANAS[semIdx + 1];
  const rbd = { sab: [], dom: [], seg: [], ter: [], qua: [], qui: [], sex: [] };
  const dayIds = Object.keys(dates);
  const weekStart = dates.sab;
  const weekEnd = dates.sex;
  const stripSem = (s) => (s || "").replace(/\s*\(sem\.\s*\d+\)\s*/gi, "").trim();
  const dueReviews = getDueReviewsForWeek(allReviews, weekStart, weekEnd);
  const reviewParentKeys = new Set();
  dueReviews.forEach((d) => {
    reviewParentKeys.add(`${d.area}__${stripSem((d.parentTheme || "").toLowerCase().trim())}`);
    const label = d.subtopic ? `${d.parentTheme} → ${d.subtopic}` : d.parentTheme;
    const text = d.isOverdue
      ? `⚠️ 🔄 ${label} (${areaMap[d.area]?.short || d.area})`
      : `🔄 ${label} (${areaMap[d.area]?.short || d.area})`;
    // Stable ID based on review key — survives rebuilds
    const id = `rev_${d.key}`;
    const item = { id, text, done: false, fixed: false, isReview: true, revKey: d.key, isOverdue: d.isOverdue };
    if (d.isOverdue) {
      const targets = ["seg", "ter", "qua", "qui"];
      const best = targets.reduce((a, b) => rbd[a].length <= rbd[b].length ? a : b);
      rbd[best].push(item);
    } else {
      const dayId = dayIds.find((k) => dates[k] === d.nextDue);
      if (dayId) rbd[dayId].push(item);
    }
  });
  const targets = ["seg", "ter", "qua", "qui"];
  (alertThemes || []).forEach((at) => {
    const k = `${at.area}__${stripSem((at.theme || "").toLowerCase().trim())}`;
    if (reviewParentKeys.has(k)) return;
    reviewParentKeys.add(k);
    const best = targets.reduce((a, b) => rbd[a].length <= rbd[b].length ? a : b);
    rbd[best].push({ id: `alert_${k}`, text: `🎯 Revisar: ${at.theme} (${areaMap[at.area]?.short || at.area})`, done: false, fixed: false, isReview: true, revKey: `alert__${k}` });
  });
  const fl = (id) => ({ id, text: "📚 Flashcards", done: false, fixed: true });
  return [
    { id: "sab", label: `Sábado ${fmtDate(dates.sab)}`, items: [fl("fl_sab"), ...(a1 ? [{ id: "sa1", text: `📖 Aula: ${a1.topic} (${a1.area})`, done: false, fixed: false, isAula: true }] : []), ...(a2 ? [{ id: "sa2", text: `📖 Aula: ${a2.topic} (${a2.area})`, done: false, fixed: false, isAula: true }] : []), ...rbd.sab] },
    { id: "dom", label: `Domingo ${fmtDate(dates.dom)}`, items: [fl("fl_dom"), ...(a1 ? [{ id: "dq1", text: `✏️ Questões: ${a1.topic}`, done: false, fixed: false }] : []), ...(a2 ? [{ id: "dq2", text: `✏️ Questões: ${a2.topic}`, done: false, fixed: false }] : []), { id: "dp", text: "📝 Corrigir simulado da sexta", done: false, fixed: false }, ...rbd.dom] },
    { id: "seg", label: `Segunda ${fmtDate(dates.seg)}`, items: [fl("fl_seg"), ...rbd.seg] },
    { id: "ter", label: `Terça ${fmtDate(dates.ter)}`, items: [fl("fl_ter"), ...rbd.ter] },
    { id: "qua", label: `Quarta ${fmtDate(dates.qua)}`, items: [fl("fl_qua"), ...rbd.qua] },
    { id: "qui", label: `Quinta ${fmtDate(dates.qui)}`, items: [fl("fl_qui"), ...rbd.qui] },
    { id: "sex", label: `Sexta ${fmtDate(dates.sex)}`, items: [fl("fl_sex"), { id: "sx", text: `🏆 Simulado${nextSem ? " — " + nextSem.semana : ""}`, done: false, fixed: false }, ...rbd.sex] },
  ];
}

export function extractJSON(raw) { const i1 = raw.indexOf("{"); const i2 = raw.lastIndexOf("}"); if (i1 < 0 || i2 < 0) throw new Error("Nenhum JSON encontrado"); return JSON.parse(raw.slice(i1, i2 + 1)); }

export function defaultAreaForQuestion(n, total) {
  if (total === 120) {
    if (n <= 24) return "clinica"; if (n <= 48) return "cirurgia"; if (n <= 72) return "ped"; if (n <= 96) return "go"; return "preventiva";
  }
  if (n <= 20) return "clinica"; if (n <= 40) return "cirurgia"; if (n <= 60) return "ped"; if (n <= 80) return "go"; return "preventiva";
}

export function buildDefaultQDetails(total) { const det = {}; for (let n = 1; n <= total; n++) { det[n] = { area: defaultAreaForQuestion(n, total), theme: "" }; } return det; }

export function mapThemeToSchedule(theme) {
  if (!theme) return null;
  const t = theme.toLowerCase();
  let best = null, bestScore = 0;
  for (const sem of MED_SCHEDULE) {
    for (const topic of sem.topics) {
      const tp = topic.toLowerCase();
      const tWords = t.split(/[\s,./()-]+/).filter((w) => w.length > 3);
      const pWords = tp.split(/[\s,./()-]+/).filter((w) => w.length > 3);
      let score = 0;
      for (const tw of tWords) for (const pw of pWords) {
        if (tw === pw || pw.includes(tw) || tw.includes(pw)) score += Math.max(tw.length, pw.length);
      }
      if (score > bestScore) { bestScore = score; best = sem; }
    }
  }
  return bestScore >= 4 ? best : null;
}

// Enhanced version: also matches against user's registered subtopics for precise linking
export function mapThemeToStudy(theme, area, userSubtopics) {
  const base = mapThemeToSchedule(theme);
  if (!theme || !userSubtopics) return base ? { ...base, matchedSubtopic: null } : null;

  const t = theme.toLowerCase().replace(/[—–\-]/g, " ");
  const tWords = t.split(/[\s,./()]+/).filter((w) => w.length > 2);
  let bestKey = null, bestSubName = null, bestScore = 0, bestSemana = null;

  for (const [key, items] of Object.entries(userSubtopics)) {
    if (!items?.length) continue;
    const [kArea] = key.split("__");
    // Area must match if provided
    if (area && kArea !== area) continue;
    const parentTheme = key.slice(kArea.length + 2);

    for (const subName of items) {
      const sLow = subName.toLowerCase().replace(/[—–\-]/g, " ");
      const sWords = sLow.split(/[\s,./()]+/).filter((w) => w.length > 2);
      let score = 0;
      for (const tw of tWords) {
        for (const sw of sWords) {
          if (tw === sw) score += tw.length * 2;
          else if (sw.includes(tw) && tw.length >= 4) score += tw.length;
          else if (tw.includes(sw) && sw.length >= 4) score += sw.length;
          // Prefix match for medical terms (6+ chars shared prefix)
          else if (tw.length >= 6 && sw.length >= 6 && tw.slice(0, 6) === sw.slice(0, 6)) score += 5;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestSubName = subName;
        bestKey = key;
        // Try to find the semana from the parent theme
        bestSemana = mapThemeToSchedule(parentTheme);
      }
    }
  }

  if (bestScore >= 6 && bestSubName) {
    const result = bestSemana || base;
    return result ? { ...result, matchedSubtopic: bestSubName, subtopicKey: bestKey } : { semana: null, topics: [], matchedSubtopic: bestSubName, subtopicKey: bestKey };
  }
  return base ? { ...base, matchedSubtopic: null } : null;
}

export function searchKnownPdf(query) {
  if (!query || query.trim().length < 2) return KNOWN_PDFS;
  const q = query.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const words = q.split(" ").filter((w) => w.length > 1);
  return KNOWN_PDFS.filter((p) => words.some((w) => p.key.includes(w)) || p.key.includes(q));
}

export function catColor(id) { return CATS.find((c) => c.id === id)?.color || C.border2; }

