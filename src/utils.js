import { INTERVALS, AREAS, areaMap, SEMANAS, SEM_SAT, UNICAMP_THEMES, MED_SCHEDULE, KNOWN_PDFS, CATS } from "./data.js";
import { C } from "./theme.js";

export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (d, n) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
export const diffDays = (a, b) => Math.round((new Date(a + "T12:00:00") - new Date(b + "T12:00:00")) / 86400000);
export const perc = (ac, tot) => tot > 0 ? Math.round((ac / tot) * 100) : 0;
export const uid = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
export const fmtDate = (s) => s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "";
export const perfColor = (p) => p >= 85 ? "#22C55E" : p >= 60 ? "#EAB308" : "#EF4444";
export const perfLabel = (p) => p >= 85 ? "Bom" : p >= 60 ? "Regular" : "Fraco";
export function nxtIdx(cur, pct) { if (pct >= 85) return Math.min(cur + 1, INTERVALS.length - 1); if (pct >= 75) return cur; return Math.max(0, cur - 1); }

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

export function buildWeekTemplate(semIdx, allReviews, alertThemes) {
  const sem = SEMANAS[semIdx] || SEMANAS[0];
  const satStr = SEM_SAT[sem.semana] || today();
  const dates = weekDates(satStr);
  const a1 = sem.aulas[0] || null;
  const a2 = sem.aulas[1] || null;
  const nextSem = SEMANAS[semIdx + 1];
  const rbd = { sab: [], dom: [], seg: [], ter: [], qua: [], qui: [], sex: [] };
  allReviews.forEach((r) => {
    if (!r.nextDue) return;
    const dayId = Object.keys(dates).find((k) => dates[k] === r.nextDue);
    if (dayId) {
      rbd[dayId].push({ id: uid(), text: `🔄 ${r.theme} (${areaMap[r.area]?.short || r.area})`, done: false, fixed: false, isReview: true });
    }
  });
  const targetDays = ["seg", "ter", "qua", "qui"];
  (alertThemes || []).forEach((at) => {
    const best = targetDays.reduce((a, b) => rbd[a].length <= rbd[b].length ? a : b);
    rbd[best].push({ id: uid(), text: `🎯 Revisar: ${at.theme} (${areaMap[at.area]?.short || at.area})`, done: false, fixed: false, isReview: true });
  });
  const fl = (id) => ({ id, text: "📚 Flashcards", done: false, fixed: true });
  return [
    { id: "sab", label: `Sábado ${fmtDate(dates.sab)}`, items: [fl("fl_sab"), ...(a1 ? [{ id: "sa1", text: `📖 Aula: ${a1.topic} (${a1.area})`, done: false, fixed: false }] : []), ...(a2 ? [{ id: "sa2", text: `📖 Aula: ${a2.topic} (${a2.area})`, done: false, fixed: false }] : []), ...rbd.sab] },
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

export function searchKnownPdf(query) {
  if (!query || query.trim().length < 2) return KNOWN_PDFS;
  const q = query.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const words = q.split(" ").filter((w) => w.length > 1);
  return KNOWN_PDFS.filter((p) => words.some((w) => p.key.includes(w)) || p.key.includes(q));
}

export function catColor(id) { return CATS.find((c) => c.id === id)?.color || C.border2; }

