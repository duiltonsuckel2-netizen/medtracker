import { INTERVALS, AREAS, areaMap, SEMANAS, SEM_SAT, UNICAMP_THEMES, MED_SCHEDULE, KNOWN_PDFS, CATS } from "./data.js";
import { C } from "./theme.js";

export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (d, n) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
export const diffDays = (a, b) => Math.round((new Date(a + "T12:00:00") - new Date(b + "T12:00:00")) / 86400000);
export const perc = (ac, tot) => tot > 0 ? Math.round((ac / tot) * 100) : 0;
export const uid = () => Math.random().toString(36).slice(2, 10);
export const fmtDate = (s) => s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "";
export const perfColor = (p) => p >= 75 ? "#22C55E" : p >= 60 ? "#EAB308" : "#EF4444";
export const perfLabel = (p) => p >= 75 ? "Bom" : p >= 60 ? "Regular" : "Fraco";
export function nxtIdx(cur, pct) { if (pct >= 75) return Math.min(cur + 1, INTERVALS.length - 1); return cur; /* <75%: keep same milestone, retry logic handled in App */ }

// Evita sex/sáb/dom: sex→qui, sáb→seg, dom→seg
export function avoidWeekend(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay(); // 0=dom, 5=sex, 6=sáb
  if (dow === 5) return addDays(dateStr, -1); // sex → qui
  if (dow === 6) return addDays(dateStr, 2);  // sáb → seg
  if (dow === 0) return addDays(dateStr, 1);  // dom → seg
  return dateStr;
}

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
  const satDate = dates.sab;
  const sexDate = dates.sex;
  const overdue = [];
  const weekdayPool = ["seg", "ter", "qua", "qui"];
  const mkItem = (r, prefix) => ({ id: uid(), text: `${prefix}🔄 ${r.theme} (${areaMap[r.area]?.short || r.area})`, done: false, fixed: false, isReview: true, reviewKey: r.key || `${r.area}__${r.theme.toLowerCase().trim()}` });
  allReviews.forEach((r) => {
    if (!r.nextDue) return;
    const dayId = Object.keys(dates).find((k) => dates[k] === r.nextDue);
    if (dayId) {
      // Move sex/sab/dom reviews to weekdays (qui for sex, seg for sab/dom)
      if (dayId === "sex") { rbd.qui.push(mkItem(r, "")); }
      else if (dayId === "sab" || dayId === "dom") { rbd.seg.push(mkItem(r, "")); }
      else { rbd[dayId].push(mkItem(r, "")); }
    } else if (r.nextDue < satDate) {
      overdue.push(r);
    } else if (r.nextDue > sexDate) {
      // Falls after this week — skip
    }
  });
  // Spread overdue reviews across weekdays
  overdue.forEach((r, i) => {
    const dayId = weekdayPool[i % weekdayPool.length];
    rbd[dayId].push(mkItem(r, "⚠️ "));
  });
  (alertThemes || []).forEach((at) => {
    const best = weekdayPool.reduce((a, b) => rbd[a].length <= rbd[b].length ? a : b);
    rbd[best].push({ id: uid(), text: `🎯 Revisar: ${at.theme} (${areaMap[at.area]?.short || at.area})`, done: false, fixed: false, isReview: true });
  });
  // Balance: max 4 reviews per weekday, redistribute excess to least-loaded day
  const MAX_PER_DAY = 4;
  for (let pass = 0; pass < 3; pass++) {
    for (const day of weekdayPool) {
      const revItems = rbd[day].filter((it) => it.isReview);
      if (revItems.length > MAX_PER_DAY) {
        const excess = revItems.slice(MAX_PER_DAY);
        rbd[day] = [...rbd[day].filter((it) => !it.isReview), ...revItems.slice(0, MAX_PER_DAY)];
        excess.forEach((it) => {
          const best = weekdayPool.reduce((a, b) => rbd[a].filter((x) => x.isReview).length <= rbd[b].filter((x) => x.isReview).length ? a : b);
          rbd[best].push(it);
        });
      }
    }
  }
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

export async function callClaude() { throw new Error("API indisponível neste ambiente. Use as funções locais."); }
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

export async function syncWithNotion() { throw new Error("Sincronização com Notion indisponível neste ambiente. Use a importação manual na aba Temas."); }
