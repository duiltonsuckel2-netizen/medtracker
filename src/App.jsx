import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

const AREAS = [
  { id: "clinica", label: "Clínica Médica", short: "CM", color: "#60A5FA" },
  { id: "cirurgia", label: "Cirurgia", short: "CIR", color: "#F87171" },
  { id: "preventiva", label: "Preventiva", short: "PREV", color: "#22C55E" },
  { id: "go", label: "G.O.", short: "GO", color: "#FBBF24" },
  { id: "ped", label: "Pediatria", short: "PED", color: "#A78BFA" },
];
const INTERVALS = [1, 7, 14, 30, 60, 90, 120, 180];
const INT_LABELS = ["1d", "7d", "14d", "1m", "2m", "3m", "4m", "6m"];
const BENCHMARKS = { clinica: 85, cirurgia: 85, preventiva: 85, go: 85, ped: 85 };
const areaMap = Object.fromEntries(AREAS.map((a) => [a.id, a]));
const AREA_SHORT_MAP = { CM: "clinica", CIR: "cirurgia", GO: "go", PED: "ped", PREV: "preventiva" };

// ── SEED DATA — gerado do export Notion fresco (24/03/2026) ──────────────
const SEED_REVIEWS = [
  // ── Dados do Notion MED database — AULA PRINCIPAL confirmada via API 24/03/2026 ──
  { area: "clinica",    theme: "Sd. Metabólica I — HAS e Dislipidemia (Sem. 08)",                    lastPerf: 78, intervalIndex: 1, nextDue: "2026-03-24", lastStudied: "2026-03-10" },
  { area: "cirurgia",   theme: "Hemorragia Digestiva II — Proctologia (Sem. 08)",                    lastPerf: 87, intervalIndex: 1, nextDue: "2026-03-24", lastStudied: "2026-03-09" },
  { area: "cirurgia",   theme: "Sd. Dispéptica e Doenças do TGI Superior (Sem. 05)",                 lastPerf: 88, intervalIndex: 2, nextDue: "2026-03-25", lastStudied: "2026-02-23" },
  { area: "ped",        theme: "Sd. Respiratórias II (Sem. 05)",                                     lastPerf: 92, intervalIndex: 2, nextDue: "2026-03-26", lastStudied: "2026-02-24" },
  { area: "clinica",    theme: "Sd. Ictérica I (Sem. 01)",                                           lastPerf: 65, intervalIndex: 3, nextDue: "2026-03-27", lastStudied: "2026-01-26" },
  { area: "clinica",    theme: "Sd. Ictérica II (Sem. 02)",                                          lastPerf: 78, intervalIndex: 3, nextDue: "2026-03-28", lastStudied: "2026-01-27" },
  { area: "cirurgia",   theme: "Sd. Álgica I — Dor Abdominal (Sem. 10)",                             lastPerf: 80, intervalIndex: 0, nextDue: "2026-03-29", lastStudied: "2026-03-22" },
  { area: "go",         theme: "Sangramento da 2ª Metade da Gravidez (Sem. 10)",                      lastPerf: 85, intervalIndex: 0, nextDue: "2026-03-29", lastStudied: "2026-03-22" },
  { area: "go",         theme: "Sangramentos da 1ª Metade da Gravidez (Sem. 09)",                     lastPerf: 77, intervalIndex: 1, nextDue: "2026-03-30", lastStudied: "2026-03-16" },
  { area: "preventiva", theme: "SUS — Evolução Histórica e Financiamento (Sem. 09)",                  lastPerf: 80, intervalIndex: 2, nextDue: "2026-03-30", lastStudied: "2026-03-16" },
  { area: "cirurgia",   theme: "Sd. Disfágica (Sem. 02)",                                            lastPerf: 83, intervalIndex: 3, nextDue: "2026-04-03", lastStudied: "2026-02-02" },
  { area: "cirurgia",   theme: "Hemorragia Digestiva I (Sem. 06)",                                   lastPerf: 83, intervalIndex: 2, nextDue: "2026-04-02", lastStudied: "2026-03-03" },
  { area: "clinica",    theme: "Sd. Diarreica (Sem. 06)",                                            lastPerf: 75, intervalIndex: 2, nextDue: "2026-04-02", lastStudied: "2026-03-03" },
  { area: "ped",        theme: "Doenças Exantemáticas (Sem. 01)",                                    lastPerf: 83, intervalIndex: 3, nextDue: "2026-04-02", lastStudied: "2026-02-01" },
  { area: "cirurgia",   theme: "Sd. Ictérica — Insuf. Hepática (Sem. 03)",                          lastPerf: 70, intervalIndex: 3, nextDue: "2026-04-07", lastStudied: "2026-02-06" },
  { area: "go",         theme: "IST — Úlceras Genitais (Sem. 03)",                                   lastPerf: 93, intervalIndex: 3, nextDue: "2026-04-11", lastStudied: "2026-02-10" },
  { area: "cirurgia",   theme: "Sd. Disfágica — Esôfago (Sem. 04)",                                 lastPerf: 88, intervalIndex: 3, nextDue: "2026-04-15", lastStudied: "2026-02-14" },
  { area: "ped",        theme: "Sd. Respiratórias I (Sem. 04)",                                      lastPerf: 88, intervalIndex: 3, nextDue: "2026-04-18", lastStudied: "2026-02-17" },
];

const SEED_LOGS = [
  // ── Dados exatos do Notion LOG Revisões (export 24/03/2026) ──
  {date:"2026-01-26", area:"ped",        theme:"Dçs. Exantemáticas",              total:60, acertos:48, pct:80},
  {date:"2026-01-26", area:"clinica",    theme:"Sd. Ictéricas (hepatites)",        total:40, acertos:26, pct:65},
  {date:"2026-01-27", area:"clinica",    theme:"Sd. Ictéricas (Vias biliares)",    total:40, acertos:31, pct:77},
  {date:"2026-01-28", area:"clinica",    theme:"Sd. Ictéricas (hepatites)",        total:20, acertos:16, pct:80},
  {date:"2026-01-28", area:"ped",        theme:"Dçs. Exantemáticas",              total:20, acertos:15, pct:75},
  {date:"2026-01-29", area:"clinica",    theme:"Sd. Ictéricas (Vias biliares)",    total:20, acertos:13, pct:65},
  {date:"2026-02-01", area:"ped",        theme:"Dçs. Exantemáticas",              total:60, acertos:50, pct:83},
  {date:"2026-02-02", area:"clinica",    theme:"Hipertensão porta",               total:30, acertos:25, pct:83},
  {date:"2026-02-04", area:"cirurgia",   theme:"Hipertensão porta",               total:20, acertos:16, pct:80},
  {date:"2026-02-06", area:"cirurgia",   theme:"Insuficiência hepática",          total:30, acertos:21, pct:70},
  {date:"2026-02-08", area:"cirurgia",   theme:"Insuficiência hepática",          total:30, acertos:21, pct:70},
  {date:"2026-02-10", area:"go",         theme:"Úlceras genitais",                total:80, acertos:75, pct:93},
  {date:"2026-02-12", area:"go",         theme:"Úlceras genitais",                total:20, acertos:19, pct:95},
  {date:"2026-02-14", area:"cirurgia",   theme:"Sd. Disfágicas",                  total:60, acertos:53, pct:88},
  {date:"2026-02-16", area:"cirurgia",   theme:"Insuficiência hepática",          total:20, acertos:16, pct:80},
  {date:"2026-02-16", area:"clinica",    theme:"Sd. Ictéricas (Vias biliares)",    total:20, acertos:15, pct:75},
  {date:"2026-02-17", area:"ped",        theme:"Sd. Respiratórias I",             total:60, acertos:53, pct:88},
  {date:"2026-02-20", area:"cirurgia",   theme:"Insuficiência hepática",          total:40, acertos:33, pct:82},
  {date:"2026-02-21", area:"cirurgia",   theme:"Sd. Disfágicas",                  total:23, acertos:18, pct:78},
  {date:"2026-02-23", area:"go",         theme:"Úlceras genitais",                total:40, acertos:31, pct:77},
  {date:"2026-02-23", area:"cirurgia",   theme:"Sd. Dispépticas",                 total:69, acertos:61, pct:88},
  {date:"2026-02-24", area:"ped",        theme:"Sd. Respiratórias II",            total:61, acertos:56, pct:91},
  {date:"2026-02-25", area:"clinica",    theme:"Sd. Ictéricas (hepatites)",        total:39, acertos:33, pct:84},
  {date:"2026-02-25", area:"clinica",    theme:"Sd. Ictéricas (Vias biliares)",    total:30, acertos:20, pct:66},
  {date:"2026-03-02", area:"cirurgia",   theme:"Hemorragia digestiva I",           total:60, acertos:50, pct:83},
  {date:"2026-03-02", area:"cirurgia",   theme:"Sd. Dispépticas",                 total:20, acertos:16, pct:80},
  {date:"2026-03-02", area:"clinica",    theme:"Sd. Diarreicas",                  total:60, acertos:45, pct:75},
  {date:"2026-03-03", area:"ped",        theme:"Dçs. Exantemáticas",              total:30, acertos:25, pct:83},
  {date:"2026-03-03", area:"ped",        theme:"Sd. Respiratórias",               total:30, acertos:25, pct:83},
  {date:"2026-03-03", area:"ped",        theme:"Sd. Respiratórias II",            total:28, acertos:20, pct:71},
  {date:"2026-03-06", area:"cirurgia",   theme:"Hipertensão Porta",               total:25, acertos:20, pct:80},
  {date:"2026-03-06", area:"cirurgia",   theme:"Sd. Disfágicas",                  total:20, acertos:16, pct:80},
  {date:"2026-03-09", area:"cirurgia",   theme:"Hemorragia digestiva II",          total:48, acertos:42, pct:87},
  {date:"2026-03-10", area:"cirurgia",   theme:"Sd. Dispépticas",                 total:20, acertos:15, pct:75},
  {date:"2026-03-10", area:"clinica",    theme:"Sd. Diarreicas",                  total:30, acertos:27, pct:90},
  {date:"2026-03-10", area:"ped",        theme:"Sd. Respiratórias II",            total:30, acertos:29, pct:96},
  {date:"2026-03-10", area:"cirurgia",   theme:"Hemorragia digestiva I",           total:20, acertos:14, pct:70},
  {date:"2026-03-10", area:"clinica",    theme:"HAS e Sd. Metabólica",            total:60, acertos:47, pct:78},
  {date:"2026-03-13", area:"go",         theme:"Úlceras genitais",                total:50, acertos:38, pct:76},
  {date:"2026-03-17", area:"preventiva", theme:"SUS (APS)",                       total:60, acertos:48, pct:80},
  {date:"2026-03-17", area:"go",         theme:"Sangramentos 1º trimestre",       total:30, acertos:23, pct:76},
  {date:"2026-03-17", area:"clinica",    theme:"Sd. Diarreicas",                  total:30, acertos:24, pct:80},
  {date:"2026-03-17", area:"clinica",    theme:"HAS e Sd. Metabólica",            total:30, acertos:25, pct:83},
  {date:"2026-03-19", area:"cirurgia",   theme:"Hemorragia digestiva II",          total:30, acertos:24, pct:80},
  {date:"2026-03-19", area:"cirurgia",   theme:"Sd. Disfágicas",                  total:20, acertos:16, pct:80},
  {date:"2026-03-19", area:"cirurgia",   theme:"Hemorragia digestiva I",           total:20, acertos:18, pct:90},
  {date:"2026-03-19", area:"ped",        theme:"Sd. Respiratórias I",             total:20, acertos:15, pct:75},
  {date:"2026-03-22", area:"cirurgia",   theme:"Dor abdominal",                   total:60, acertos:48, pct:80},
  {date:"2026-03-22", area:"go",         theme:"Sangramentos 2º semestre",        total:60, acertos:51, pct:85},
  {date:"2026-03-23", area:"go",         theme:"Sangramentos 1º trimestre",       total:35, acertos:30, pct:85},
  {date:"2026-03-23", area:"preventiva", theme:"SUS (APS)",                       total:40, acertos:29, pct:72},
];

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const diffDays = (a, b) => Math.round((new Date(a + "T12:00:00") - new Date(b + "T12:00:00")) / 86400000);
const perc = (ac, tot) => tot > 0 ? Math.round((ac / tot) * 100) : 0;
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = (s) => s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "";
const perfColor = (p) => p >= 85 ? "#22C55E" : p >= 60 ? "#EAB308" : "#EF4444";
const perfLabel = (p) => p >= 85 ? "Bom" : p >= 60 ? "Regular" : "Fraco";
function nxtIdx(cur, pct) { if (pct >= 85) return Math.min(cur + 1, INTERVALS.length - 1); if (pct >= 60) return cur; return Math.max(0, cur - 1); }

// ── STORAGE: use window.storage API (persistent across sessions) ─────────
async function loadKey(k, fb) {
  try {
    const result = await window.storage.get(k);
    return result && result.value != null ? JSON.parse(result.value) : fb;
  } catch {
    return fb;
  }
}
async function saveKey(k, v) {
  try {
    const json = JSON.stringify(v);
    const result = await window.storage.set(k, json);
    if (!result) {
      // Retry once
      await new Promise(r => setTimeout(r, 100));
      await window.storage.set(k, json);
    }
  } catch(e) { console.error("saveKey failed:", k, e); }
}

const F = "'Inter',-apple-system,sans-serif";
const FM = "'Inter Mono',ui-monospace,monospace";
const C = { bg: "#0A0A0B", surface: "#111113", card: "#17171A", card2: "#1E1E22", border: "#232327", border2: "#2E2E33", text: "#F4F4F5", text2: "#8C8C9A", text3: "#46464F", green: "#22C55E", blue: "#6366F1", teal: "#2DD4BF", yellow: "#F59E0B", red: "#F43F5E", purple: "#A78BFA" };
const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 20 };
const inp = (ex = {}) => ({ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: "10px 14px", color: C.text, fontSize: 13, fontFamily: F, width: "100%", boxSizing: "border-box", outline: "none", ...ex });
const btn = (bg = C.blue, ex = {}) => ({ background: bg, border: "none", borderRadius: 12, padding: "10px 20px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: F, flexShrink: 0, ...ex });
const tag = (col) => ({ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 999, background: col + "14", color: col, fontSize: 11, fontFamily: FM, fontWeight: 500, border: `1px solid ${col}25`, whiteSpace: "nowrap" });
function Lbl({ children }) { return <span style={{ fontSize: 10, color: C.text3, fontFamily: F, fontWeight: 600, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 0.8 }}>{children}</span>; }
function Fld({ label, children, style }) { return <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}><Lbl>{label}</Lbl>{children}</div>; }
function Empty({ msg, green }) { return <div style={{ color: green ? C.green : C.text3, fontSize: 13, padding: "20px 0" }}>{msg}</div>; }
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div style={{ background: C.card2, border: `1px solid ${C.border2}`, borderRadius: 12, padding: "10px 14px" }}><div style={{ fontSize: 10, color: C.text3, marginBottom: 6, fontFamily: FM }}>{label}</div>{payload.map((p, i) => <div key={i} style={{ fontSize: 12, color: p.color || C.text, fontFamily: FM }}>{p.name}: {p.value ?? "-"}%</div>)}</div>;
}

function areaOf(n) {
  if ((n >= 1 && n <= 12) || (n >= 61 && n <= 72)) return "clinica";
  if ((n >= 13 && n <= 24) || (n >= 73 && n <= 84)) return "cirurgia";
  if ((n >= 25 && n <= 36) || (n >= 85 && n <= 96)) return "ped";
  if ((n >= 37 && n <= 48) || (n >= 97 && n <= 108)) return "go";
  if ((n >= 49 && n <= 60) || (n >= 109 && n <= 120)) return "preventiva";
}

const UNICAMP_THEMES = { 1: "Pneumonia/Sepse (Anemia Falciforme)", 2: "HAS e Sd. Metabólica", 3: "Profilaxia Antirrábica", 4: "Profilaxia Antirrábica", 5: "Artrite Psoriásica", 6: "IC/HTP", 7: "Insuf. Respiratória/IOT", 8: "Neuropatia/Anemia Megaloblástica", 9: "Anafilaxia", 10: "Pericardite", 11: "Rabdomiólise", 12: "Micobacteriose não tuberculosa", 13: "Hematoma Extradural/TCE", 14: "Hematoma Extradural", 15: "Tumor de parótida", 16: "Doença de Hirschsprung", 17: "Diabetes Insipidus Central", 18: "Nódulo Sister Mary Joseph/Ca gástrico", 19: "Dissecção de Aorta", 20: "Hemorragia classe III/ATLS", 21: "Empiema pleural", 22: "Estenose traqueia pós-intubação", 23: "Coledocolitíase/Colangite", 24: "HPB", 25: "Sd. Nefrótica", 26: "Anafilaxia pediátrica", 27: "Intox. por escorpião", 28: "RCP Pediátrica", 29: "Leucemia Aguda (Down)", 30: "Intussuscepção", 31: "Reanimação neonatal", 32: "Válvula de uretra posterior", 33: "Constipação/Encoprese", 34: "Sífilis congênita", 35: "Hipotireoidismo pediátrico", 36: "Pitiríase Rósea", 37: "TH na menopausa", 38: "RCIU/DG", 39: "Sífilis gestação/PCDT", 40: "Obstrução tubária/HSG", 41: "Acretismo placentário", 42: "HELLP", 43: "NIV/HPV", 44: "RCIU/Doppler", 45: "ACO - amenorreia de privação", 46: "IUE", 47: "Derrame pleural/Ca mama", 48: "Cisto ovariano", 49: "Estudo ecológico", 50: "Estudo transversal", 51: "Bradford Hill", 52: "Dec. óbito - linha A", 53: "Prevenção quaternária", 54: "Regionalização SUS", 55: "Freq. epidemiológica", 56: "Indicador epidemiológico", 57: "Prev. quaternária/sobrediagnóstico", 58: "PTS", 59: "Tx mortalidade bruta", 60: "Tx mortalidade padronizada", 61: "Artrite séptica", 62: "CAD", 63: "Wernicke/tiamina", 64: "Opioides/naloxona", 65: "Pleurite tuberculosa", 66: "Miastenia gravis", 67: "Hipersensibilidade alopurinol", 68: "Sífilis reinfecção", 69: "Meningite/dexametasona", 70: "Pré-diabetes", 71: "Intolerância lactose/SII", 72: "Feocromocitoma", 73: "Mixoma atrial", 74: "Hidrocele comunicante", 75: "Ác. tranexâmico/trauma", 76: "Ruptura de aorta", 77: "Lesão vascular poplítea", 78: "Choque neurogênico", 79: "Dose máxima lidocaína", 80: "Válvula biológica/gestação", 81: "Drenagem pleural incorreta", 82: "Abdome agudo perfurativo", 83: "Ca tireoide/sobrediagnóstico", 84: "Hemangioma hepático", 85: "ITU lactente", 86: "Febre maculosa", 87: "Hiperplasia adrenal congênita", 88: "RCP neonatal", 89: "Hepatite A", 90: "Puberdade precoce", 91: "Corpo estranho brônquio", 92: "Hepatite B/profilaxia vertical", 93: "Varicela materna/RN", 94: "Epifisiólise/SCFE", 95: "Baixa estatura familiar", 96: "Coqueluche", 97: "Vacinação gestação/dTpa", 98: "Vaginose bacteriana", 99: "DG/insulina puerpério", 100: "Mamografia BI-RADS", 101: "Partograma", 102: "Fórceps", 103: "RPMO pré-termo", 104: "ACO/migrânea", 105: "DPP", 106: "Células glandulares atípicas", 107: "Insuf. ovariana prematura", 108: "Sangramento pós-menopausa", 109: "Prev. lombalgia", 110: "Organofosforado", 111: "Eixos Saúde Trabalhador", 112: "Modelo atenção SUS", 113: "Coorte", 114: "Diarreia aguda", 115: "Bioética deliberativa", 116: "Atropina/organofosforado", 117: "SINAN", 118: "Colinesterase eritrocitária", 119: "Catarata/radiação", 120: "Silicose/Caplan" };

function buildUnicamp2024Exam() {
  const soube = new Set([1, 5, 7, 8, 9, 10, 11, 13, 14, 17, 18, 19, 20, 24, 25, 26, 30, 37, 39, 42, 45, 57, 58, 63, 64, 72, 76, 77, 82, 83, 89, 93, 96, 110, 112, 116, 117]);
  const chutou = new Set([6, 22, 31, 35, 40, 43, 47, 48, 56, 61, 62, 65, 69, 70, 71, 73, 75, 86, 88, 92, 97, 99, 101, 113, 114]);
  const errouViu = new Set([2, 23, 49, 50, 53, 54, 78, 91, 104]);
  const all = new Set(Array.from({ length: 120 }, (_, i) => i + 1));
  const errouNao = new Set([...all].filter((n) => !soube.has(n) && !chutou.has(n) && !errouViu.has(n)));
  const cats = { soube: [...soube].sort((a, b) => a - b), chutou: [...chutou].sort((a, b) => a - b), errou_viu: [...errouViu].sort((a, b) => a - b), errou_nao: [...errouNao].sort((a, b) => a - b) };
  const PREV = { 3: "alta", 4: "alta", 12: "baixa", 66: "alta", 67: "média", 68: "muito alta", 15: "baixa", 16: "média", 21: "muito alta", 74: "baixa", 79: "alta", 80: "média", 81: "muito alta", 84: "média", 27: "alta", 28: "muito alta", 29: "alta", 32: "baixa", 33: "muito alta", 34: "muito alta", 36: "média", 85: "muito alta", 87: "alta", 90: "muito alta", 94: "média", 95: "média", 38: "muito alta", 41: "muito alta", 44: "muito alta", 46: "alta", 98: "muito alta", 100: "muito alta", 102: "muito alta", 103: "muito alta", 105: "muito alta", 106: "muito alta", 107: "alta", 108: "muito alta", 51: "muito alta", 52: "alta", 55: "muito alta", 59: "muito alta", 60: "muito alta", 109: "alta", 111: "muito alta", 115: "alta", 118: "média", 119: "média", 120: "alta" };
  const qDetails = {};
  for (let n = 1; n <= 120; n++) qDetails[n] = { area: areaOf(n), theme: UNICAMP_THEMES[n] || "", prev: PREV[n] || "baixa" };
  const areaResults = {};
  AREAS.forEach((a) => { areaResults[a.id] = { soube: 0, chutou: 0, errou_viu: 0, errou_nao: 0, total: 24 }; });
  for (let n = 1; n <= 120; n++) {
    const a = areaOf(n);
    if (soube.has(n)) areaResults[a].soube++;
    else if (chutou.has(n)) areaResults[a].chutou++;
    else if (errouViu.has(n)) areaResults[a].errou_viu++;
    else areaResults[a].errou_nao++;
  }
  return { id: uid(), date: "2026-03-21", name: "UNICAMP 2024 (1ª fase)", total: 120, acertos: soube.size + chutou.size, cats, qDetails, areaResults, pdfAnalyzed: true };
}

const SEMANAS = [
  { semana: "Sem. 10", aulas: [{ area: "CIR", topic: "Dor Abdominal / Abdome Agudo" }, { area: "GO", topic: "Sangramentos 2ª metade gestação" }] },
  { semana: "Sem. 11", aulas: [{ area: "CM", topic: "Sd. Metabólica II — Diabetes" }, { area: "PED", topic: "Imunização" }] },
  { semana: "Sem. 12", aulas: [{ area: "CM", topic: "Grandes Sd. Endócrinas I — Tireoide" }, { area: "CIR", topic: "Sd. Oclusão Intestinal" }] },
  { semana: "Sem. 13", aulas: [{ area: "CM", topic: "Grandes Sd. Endócrinas II — Suprarrenal" }, { area: "GO", topic: "Oncologia I — Mama e Ovário" }] },
  { semana: "Sem. 14", aulas: [{ area: "CM", topic: "Terapia Intensiva" }, { area: "PREV", topic: "Medidas de Saúde Coletiva" }] },
  { semana: "Sem. 15", aulas: [{ area: "CM", topic: "Grandes Sd. Bacterianas I — Pneumonia" }, { area: "GO", topic: "Oncologia I — Endométrio e Colo" }] },
  { semana: "Sem. 16", aulas: [{ area: "PREV", topic: "Estudos Epidemiológicos" }, { area: "GO", topic: "Doenças Clínicas na Gravidez" }] },
];
const SEM_SAT = {
  "Sem. 10": "2026-03-21", "Sem. 11": "2026-03-28", "Sem. 12": "2026-04-04",
  "Sem. 13": "2026-04-11", "Sem. 14": "2026-04-18", "Sem. 15": "2026-04-25", "Sem. 16": "2026-05-02",
};

function weekDates(satStr) {
  const sat = new Date(satStr + "T12:00:00");
  const dates = {};
  const labels = ["sab", "dom", "seg", "ter", "qua", "qui", "sex"];
  labels.forEach((id, i) => {
    const d = new Date(sat); d.setDate(sat.getDate() + i);
    dates[id] = d.toISOString().slice(0, 10);
  });
  return dates;
}

function buildWeekTemplate(semIdx, allReviews) {
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

// ── API não disponível no ambiente de artifacts — funções locais ──────────
async function callClaude() {
  throw new Error("API indisponível neste ambiente. Use as funções locais.");
}
function extractJSON(raw) {
  const i1 = raw.indexOf("{");
  const i2 = raw.lastIndexOf("}");
  if (i1 < 0 || i2 < 0) throw new Error("Nenhum JSON encontrado");
  return JSON.parse(raw.slice(i1, i2 + 1));
}

// ── Distribuição padrão de áreas por blocos de 20 questões (padrão brasileiro) ──
// Ordem padrão: CM(1-20), CIR(21-40), PED(41-60), GO(61-80), PREV(81-100)
function defaultAreaForQuestion(n, total) {
  if (total === 120) {
    // UNICAMP: 1-24=CM, 25-48=CIR, 49-72=PED, 73-96=GO, 97-120=PREV
    if (n <= 24) return "clinica";
    if (n <= 48) return "cirurgia";
    if (n <= 72) return "ped";
    if (n <= 96) return "go";
    return "preventiva";
  }
  // Padrão 100 questões: blocos de 20
  if (n <= 20) return "clinica";
  if (n <= 40) return "cirurgia";
  if (n <= 60) return "ped";
  if (n <= 80) return "go";
  return "preventiva";
}

function buildDefaultQDetails(total) {
  const det = {};
  for (let n = 1; n <= total; n++) {
    det[n] = { area: defaultAreaForQuestion(n, total), theme: "" };
  }
  return det;
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [revLogs, setRevLogs] = useState([]);
  const [exams, setExams] = useState([]);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    Promise.all([loadKey("rp26_sessions", []), loadKey("rp26_reviews", []), loadKey("rp26_revlogs", []), loadKey("rp26_exams", []), loadKey("rp26_seeded11", false)]).then(([s, r, rl, e, seeded]) => {
      if (!seeded) {
        const revs = SEED_REVIEWS.map((r) => ({ ...r, id: uid(), key: `${r.area}__${r.theme.toLowerCase().trim()}`, history: [{ date: r.lastStudied, pct: r.lastPerf }] }));
        const logs = SEED_LOGS.map((l) => ({ ...l, id: uid() }));
        const se = buildUnicamp2024Exam();
        setSessions([]); setReviews(revs); setRevLogs(logs); setExams([se]);
        saveKey("rp26_reviews", revs); saveKey("rp26_revlogs", logs); saveKey("rp26_sessions", []); saveKey("rp26_exams", [se]); saveKey("rp26_seeded11", true);
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

  function handleNotionSync(newRevs) {
    const existing = [...reviews];
    newRevs.forEach((nr) => {
      const key = `${nr.area}__${nr.theme.toLowerCase().trim()}`;
      const idx = existing.findIndex((r) => r.key === key);
      const built = { ...nr, id: idx >= 0 ? existing[idx].id : uid(), key, history: idx >= 0 ? existing[idx].history : [{ date: nr.lastStudied, pct: nr.lastPerf }] };
      if (idx >= 0) existing[idx] = built; else existing.unshift(built);
    });
    pR(existing);
    notify(`✓ ${newRevs.length} revisões importadas do Notion`);
  }

  if (!ready) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.text3, fontFamily: F, fontSize: 18 }}>carregando…</div>;

  const dueR = reviews.filter((r) => r.nextDue <= today()).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  const upR = reviews.filter((r) => r.nextDue > today()).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  const TABS = [
    { id: "agenda", label: "Agenda" },
    { id: "dashboard", label: "Dashboard" },
    { id: "revisoes", label: `Revisões${dueR.length ? ` (${dueR.length})` : ""}` },
    { id: "sessoes", label: "Nova Sessão" },
    { id: "provas", label: "Provas" },
    { id: "temas", label: "Temas" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F, color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Inter+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#6366F1,#A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚕</div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.4 }}>MedTracker</span>
          <span style={{ fontSize: 10, color: C.text3, fontFamily: FM, background: C.card2, padding: "2px 8px", borderRadius: 999 }}>Notion 23/03</span>
        </div>
        {flash && <span style={{ fontSize: 12, color: C.green, fontFamily: FM, background: C.green + "10", padding: "4px 12px", borderRadius: 999 }}>{flash}</span>}
      </div>
      <div style={{ display: "flex", padding: "10px 20px", gap: 4, overflowX: "auto", borderBottom: `1px solid ${C.border}` }}>
        {TABS.map((t) => { const active = tab === t.id; return <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "7px 16px", background: active ? C.card2 : "none", border: active ? `1px solid ${C.border2}` : "1px solid transparent", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap", color: active ? C.text : C.text3, fontSize: 13, fontFamily: F, fontWeight: active ? 600 : 400 }}>{t.label}</button>; })}
      </div>
      <div style={{ padding: "20px", maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: tab === "agenda" ? "block" : "none" }}><Agenda reviews={reviews} revLogs={revLogs} onAddSubtemaNote={() => { }} /></div>
        {tab === "dashboard" && <Dashboard revLogs={revLogs} sessions={sessions} exams={exams} reviews={reviews} dueCount={dueR.length} onNotionSync={handleNotionSync} />}
        {tab === "sessoes" && <Sessoes sessions={sessions} onAdd={addSession} onDel={delSession} />}
        {tab === "revisoes" && <Revisoes due={dueR} upcoming={upR} revLogs={revLogs} reviews={reviews} sessions={sessions} onMark={markReview} onQuick={addRevLog} />}
        {tab === "provas" && <Provas exams={exams} revLogs={revLogs} sessions={sessions} onAdd={addExam} onDel={delExam} />}
        {tab === "temas" && <Temas reviews={reviews} onEdit={editReview} />}
      </div>
    </div>
  );
}

function Agenda({ reviews, revLogs, onAddSubtemaNote }) {
  const [week, setWeek] = useState(null);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState("current");
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [addingTo, setAddingTo] = useState(null);
  const [newItem, setNewItem] = useState("");
  const [semIdx, setSemIdx] = useState(0);

  function currentSatKey() {
    const now = new Date(); const dow = now.getDay();
    // dow: 0=dom,1=seg,2=ter,3=qua,4=qui,5=sex,6=sab
    // Dias desde o sábado anterior: sab=0, dom=1, seg=2, ter=3, qua=4, qui=5, sex=6
    const daysSinceSat = dow === 6 ? 0 : dow + 1;
    const sat = new Date(now); sat.setDate(now.getDate() - daysSinceSat); sat.setHours(12, 0, 0, 0);
    return sat.toISOString().slice(0, 10);
  }

  useEffect(() => {
    const satKey = currentSatKey();
    Promise.all([loadKey("rp_agenda_v7", null), loadKey("rp_agenda_history", [])]).then(([saved, hist]) => {
      const nh = hist || [];
      if (saved && saved._weekKey === satKey) {
        const todayDow = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"][new Date().getDay()];
        const dayOrder = ["sab", "dom", "seg", "ter", "qua", "qui", "sex"];
        const todayIdx = dayOrder.indexOf(todayDow);
        const rollovers = [];
        const updated = saved.map((day, di) => {
          if (dayOrder.indexOf(day.id) >= todayIdx) return day;
          const pendingReviews = day.items.filter((it) => !it.done && it.isReview);
          if (!pendingReviews.length) return day;
          rollovers.push(...pendingReviews.map((it) => ({ ...it, id: uid(), text: it.text.replace(/^⚠️\s*/, "") + "", done: false })));
          return { ...day, items: day.items.filter((it) => it.done || !it.isReview) };
        });
        if (rollovers.length > 0) {
          const rolled = updated.map((day) => day.id !== todayDow ? day : {
            ...day,
            items: [...day.items, ...rollovers.map((r) => ({ ...r, text: "⚠️ " + r.text.replace(/^🔄\s*/, "🔄 ") }))]
          });
          rolled._weekKey = satKey; rolled._semana = saved._semana;
          setWeek(rolled); saveKey("rp_agenda_v7", rolled);
        } else {
          setWeek(saved);
        }
        const idx = SEMANAS.findIndex((s) => SEM_SAT[s.semana] === satKey);
        if (idx >= 0) setSemIdx(idx);
      } else {
        if (saved && saved._weekKey) {
          const tot = saved.reduce((s, d) => s + d.items.length, 0);
          const don = saved.reduce((s, d) => s + d.items.filter((i) => i.done).length, 0);
          if (don > 0) { nh.unshift({ savedAt: saved._weekKey, label: `${saved._semana || "Semana"} — ${fmtDate(saved._weekKey)}`, progress: tot > 0 ? Math.round((don / tot) * 100) : 0, done: don, total: tot, days: saved }); saveKey("rp_agenda_history", nh.slice(0, 12)); }
        }
        let curIdx = SEMANAS.findIndex((s) => SEM_SAT[s.semana] === satKey);
        if (curIdx < 0) curIdx = 0;
        setSemIdx(curIdx);
        const w = buildWeekTemplate(curIdx, reviews); w._weekKey = satKey; w._semana = SEMANAS[curIdx]?.semana;
        setWeek(w); saveKey("rp_agenda_v7", w);
      }
      setHistory(nh.slice(0, 12));
    });
  }, []);

  function rebuildForSem(ni) {
    setSemIdx(ni);
    const satKey = SEM_SAT[SEMANAS[ni]?.semana] || currentSatKey();
    const w = buildWeekTemplate(ni, reviews); w._weekKey = satKey; w._semana = SEMANAS[ni]?.semana;
    setWeek(w); saveKey("rp_agenda_v7", w);
  }

  function save(w) { w._weekKey = currentSatKey(); w._semana = SEMANAS[semIdx]?.semana; setWeek(w); saveKey("rp_agenda_v7", w); }
  // Auto-save whenever week changes (backup in case direct saveKey missed)
  const weekRef = React.useRef(week);
  React.useEffect(() => { if (week && week !== weekRef.current) { weekRef.current = week; saveKey("rp_agenda_v7", week); } }, [week]);
  function toggleDone(did, iid) { save(week.map((d) => d.id !== did ? d : { ...d, items: d.items.map((it) => it.id !== iid ? it : { ...it, done: !it.done }) })); }
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

  const todayDayFallback = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"][new Date().getDay()];
  if (!week) return <Empty msg="Carregando…" />;
  const ti = week.reduce((s, d) => s + d.items.length, 0);
  const di = week.reduce((s, d) => s + d.items.filter((i) => i.done).length, 0);
  const prog = ti > 0 ? Math.round((di / ti) * 100) : 0;
  const pCol = prog >= 85 ? C.green : prog >= 60 ? C.yellow : C.blue;
  const semana = SEMANAS[semIdx];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 50, height: 50, flexShrink: 0 }}>
          <svg width="50" height="50" style={{ transform: "rotate(-90deg)" }}><circle cx="25" cy="25" r="20" fill="none" stroke={C.border2} strokeWidth="4" /><circle cx="25" cy="25" r="20" fill="none" stroke={pCol} strokeWidth="4" strokeDasharray={`${(prog / 100) * 125.6} 125.6`} strokeLinecap="round" /></svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: FM }}>{prog}%</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{semana?.semana || "Semana atual"}</div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{di}/{ti} itens · sáb {fmtDate(SEM_SAT[semana?.semana] || currentSatKey())} → sex</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: C.surface, borderRadius: 10, padding: 3, gap: 2 }}>
            {["current", "history"].map((v) => <button key={v} onClick={() => setView(v)} style={{ background: view === v ? C.card2 : "none", border: "none", borderRadius: 8, padding: "5px 12px", color: view === v ? C.text : C.text3, fontSize: 12, fontFamily: F, cursor: "pointer" }}>{v === "current" ? "Semana" : "Histórico"}</button>)}
          </div>
          <select value={semIdx} onChange={(e) => rebuildForSem(Number(e.target.value))} style={{ ...inp(), width: "auto", fontSize: 11, padding: "5px 8px" }}>
            {SEMANAS.map((s, i) => <option key={i} value={i}>{s.semana} — {s.aulas.map((a) => a.area).join(" + ")}</option>)}
          </select>
          <button onClick={() => archiveAndReset()} style={btn(C.blue, { padding: "6px 14px", fontSize: 12 })}>Próxima semana →</button>
        </div>
      </div>

      {view === "current" && semana && (() => {
        const satStr = SEM_SAT[semana.semana];
        const dates = satStr ? weekDates(satStr) : {};
        const weekDateSet = new Set(Object.values(dates));
        const revs = reviews.filter((r) => r.nextDue && weekDateSet.has(r.nextDue)).map((r) => ({ theme: r.theme, area: r.area, nextDue: r.nextDue })).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
        return (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>{semana.semana} — aulas + revisões agendadas</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {semana.aulas.map((a, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={tag(areaMap[AREA_SHORT_MAP[a.area]]?.color || C.blue)}>{a.area}</span><span style={{ fontSize: 13 }}>📖 {a.topic}</span></div>)}
              {revs.length > 0 && <div style={{ height: 1, background: C.border, margin: "4px 0" }} />}
              {revs.map((r, i) => { const ao = areaMap[r.area]; return <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={tag(ao?.color || C.text3)}>{ao?.short}</span><span style={{ fontSize: 12, color: C.text2 }}>🔄 {r.theme}</span><span style={{ fontSize: 10, color: C.text3, fontFamily: FM, marginLeft: "auto" }}>{fmtDate(r.nextDue)}</span></div>; })}
              {revs.length === 0 && <span style={{ fontSize: 11, color: C.text3, fontStyle: "italic" }}>Nenhuma revisão agendada para esta semana</span>}
            </div>
          </div>
        );
      })()}

      {view === "current" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {week.map((day) => {
            const isToday = day.id === todayDayFallback; const dd = day.items.filter((i) => i.done).length;
            return (
              <div key={day.id} style={{ background: C.card, border: `1px solid ${isToday ? C.blue : C.border}`, borderRadius: 18, overflow: "hidden" }}>
                <div style={{ padding: "13px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isToday ? C.blue : C.text }}>{day.label}</span>
                    {isToday && <span style={tag(C.blue)}>hoje</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>{dd}/{day.items.length}</span>
                    <button onClick={() => setAddingTo(addingTo === day.id ? null : day.id)} style={{ background: "none", border: `1px solid ${C.border2}`, borderRadius: 999, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.text3, fontSize: 14 }}>+</button>
                  </div>
                </div>
                <div style={{ padding: "0 18px 13px", display: "flex", flexDirection: "column", gap: 5 }}>
                  {day.items.map((item) => {
                    const isEd = editing?.did === day.id && editing?.iid === item.id;
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: item.done ? "transparent" : C.card2, borderRadius: 10, opacity: item.done ? 0.45 : 1 }}>
                        <div onClick={() => toggleDone(day.id, item.id)} style={{ width: 17, height: 17, borderRadius: 5, border: `2px solid ${item.done ? C.green : C.border2}`, background: item.done ? C.green : "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                          {item.done && <span style={{ fontSize: 10, color: "#000", fontWeight: 800 }}>✓</span>}
                        </div>
                        {isEd ? <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }} style={{ ...inp(), flex: 1, padding: "2px 6px", fontSize: 13, background: "none", border: "none", borderBottom: `1px solid ${C.border2}`, borderRadius: 0 }} />
                          : <span style={{ flex: 1, fontSize: 13, color: item.done ? C.text3 : C.text, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>}
                        {!isEd && <div style={{ display: "flex", gap: 3, opacity: 0.3 }}>
                          <button onClick={() => startEdit(day.id, item)} style={{ background: "none", border: "none", cursor: "pointer", color: C.text2, fontSize: 12, padding: "0 3px" }}>✏</button>
                          {!item.fixed && <button onClick={() => deleteItem(day.id, item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 12, padding: "0 3px" }}>✕</button>}
                        </div>}
                      </div>
                    );
                  })}
                  {addingTo === day.id && <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                    <input autoFocus value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addItem(day.id); if (e.key === "Escape") { setAddingTo(null); setNewItem(""); } }} placeholder="Novo item…" style={{ ...inp(), flex: 1, padding: "7px 11px", fontSize: 12 }} />
                    <button onClick={() => addItem(day.id)} style={btn(C.blue, { padding: "7px 13px", fontSize: 12 })}>+</button>
                  </div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {history.length === 0 && <Empty msg="Nenhuma semana arquivada ainda." />}
          {history.map((entry, i) => <HistoryEntry key={i} entry={entry} />)}
        </div>
      )}
    </div>
  );
}

// Extracted to its own component to fix the useState-inside-map issue
function HistoryEntry({ entry }) {
  const [open, setOpen] = useState(false);
  const pC = entry.progress >= 85 ? C.green : entry.progress >= 60 ? C.yellow : C.red;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => setOpen((o) => !o)}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: pC + "15", border: `2px solid ${pC}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 14, fontWeight: 700, color: pC, fontFamily: FM }}>{entry.progress}%</span></div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{entry.label}</div><div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{entry.done}/{entry.total} concluídos</div></div>
        <span style={{ color: C.text3 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ padding: "0 18px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
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

// ── NOTION API INTEGRATION ──────────────────────────────────────────────────
async function syncWithNotion() {
  throw new Error("Sincronização com Notion indisponível neste ambiente. Use a importação manual na aba Temas.");
}

function Dashboard({ revLogs, sessions, exams, reviews, dueCount, onNotionSync }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [notionToken, setNotionToken] = useState("");
  const [notionDbId, setNotionDbId] = useState("");
  const [notionStatus, setNotionStatus] = useState("idle");
  const [notionMsg, setNotionMsg] = useState("");
  const [exportStatus, setExportStatus] = useState("idle");

  const revEvo = useMemo(() => {
    if (!revLogs.length) return [];
    const byW = {};
    [...revLogs].sort((a, b) => a.date.localeCompare(b.date)).forEach((r) => {
      const d = new Date(r.date + "T12:00:00"); const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const wk = mon.toISOString().slice(0, 10);
      if (!byW[wk]) byW[wk] = {}; if (!byW[wk][r.area]) byW[wk][r.area] = { sum: 0, n: 0 }; byW[wk][r.area].sum += r.pct; byW[wk][r.area].n += 1;
    });
    return Object.entries(byW).map(([wk, areas]) => ({ name: fmtDate(wk), ...Object.fromEntries(AREAS.map((a) => [a.short, areas[a.id] ? Math.round(areas[a.id].sum / areas[a.id].n) : undefined])) }));
  }, [revLogs]);

  const revAreaAvg = useMemo(() => { const o = {}; AREAS.forEach((a) => { const v = revLogs.filter((r) => r.area === a.id).map((r) => r.pct); o[a.id] = v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null; }); return o; }, [revLogs]);
  const totalQ = revLogs.reduce((s, x) => s + (x.total || 0), 0) + sessions.reduce((s, x) => s + (x.total || 0), 0);
  const barData = AREAS.map((a) => ({ area: a.short, "% questões": revAreaAvg[a.id] ?? 0 }));

  const START_DATE = "2026-02-02";

  const allStudyDates = useMemo(() => {
    const s = new Set(
      [...revLogs.map((l) => l.date), ...sessions.map((s) => s.date || s.createdAt || "")]
        .filter((d) => d && d >= START_DATE)
    );
    return s;
  }, [revLogs, sessions]);

  const diasEstudados = allStudyDates.size;
  const totalRevisoes = revLogs.length;

  const streak = useMemo(() => {
    const sorted = [...allStudyDates].sort();
    if (!sorted.length) return 0;
    const todayStr = today();
    const yesterdayStr = addDays(todayStr, -1);
    let cur = allStudyDates.has(todayStr) ? todayStr : (allStudyDates.has(yesterdayStr) ? yesterdayStr : null);
    if (!cur) return 0;
    let count = 0;
    while (allStudyDates.has(cur)) { count++; cur = addDays(cur, -1); }
    return count;
  }, [allStudyDates]);

  const maxStreak = useMemo(() => {
    const sorted = [...allStudyDates].sort();
    let max = 0, run = 0, prev = null;
    for (const d of sorted) {
      if (prev && diffDays(d, prev) === 1) { run++; } else { run = 1; }
      if (run > max) max = run;
      prev = d;
    }
    return max;
  }, [allStudyDates]);

  const themeProgress = useMemo(() => {
    const byTheme = {};
    [...revLogs, ...sessions.map((s) => ({ ...s, pct: perc(s.acertos, s.total) }))].forEach((l) => {
      const k = `${l.area}__${l.theme}`;
      if (!byTheme[k]) byTheme[k] = { area: l.area, theme: l.theme, sessions: [] };
      byTheme[k].sessions.push({ date: l.date, pct: l.pct, total: l.total || 0 });
    });
    return Object.values(byTheme)
      .filter((t) => t.sessions.length >= 2)
      .map((t) => {
        const sorted = [...t.sessions].sort((a, b) => a.date.localeCompare(b.date));
        const first = sorted[0].pct; const last = sorted[sorted.length - 1].pct;
        const trend = last - first;
        const avg = Math.round(sorted.reduce((s, x) => s + x.pct, 0) / sorted.length);
        return { ...t, sorted, first, last, trend, avg, n: sorted.length };
      })
      .sort((a, b) => b.n - a.n);
  }, [revLogs, sessions]);

  const alerts = useMemo(() => {
    const res = [];
    themeProgress.forEach((t) => {
      const badSessions = t.sorted.filter((s) => s.pct < 70).length;
      if (badSessions >= 2 && t.last < 75) {
        res.push({ type: "danger", icon: "🔴", title: `Ponto cego: ${t.theme}`, msg: `${badSessions} sessões abaixo de 70% · última: ${t.last}%`, area: t.area });
      }
    });
    reviews.filter((r) => diffDays(today(), r.nextDue) > 7).forEach((r) => {
      res.push({ type: "warning", icon: "🟡", title: `Atrasado ${diffDays(today(), r.nextDue)}d: ${r.theme}`, msg: `Última: ${r.lastPerf}% em ${fmtDate(r.lastStudied)}`, area: r.area });
    });
    themeProgress.filter((t) => t.last < t.avg - 10 && t.n >= 3).forEach((t) => {
      res.push({ type: "info", icon: "📉", title: `Queda em: ${t.theme}`, msg: `Média ${t.avg}% → última ${t.last}%`, area: t.area });
    });
    return res;
  }, [themeProgress, reviews]);

  const heatmapData = useMemo(() => {
    const days = [];
    for (let i = 83; i >= 0; i--) {
      const d = addDays(today(), -i);
      const logsOnDay = [...revLogs, ...sessions].filter((l) => (l.date || l.createdAt || "").slice(0, 10) === d);
      const intensity = logsOnDay.length > 4 ? 3 : logsOnDay.length > 2 ? 2 : logsOnDay.length > 0 ? 1 : 0;
      days.push({ date: d, intensity, count: logsOnDay.length });
    }
    return days;
  }, [allStudyDates, revLogs, sessions]);

  function exportReport() {
    setExportStatus("loading");
    try {
      const areaRows = AREAS.map((a) => `<tr><td style="color:${a.color};font-weight:600">${a.label}</td><td>${revAreaAvg[a.id] ?? 0}%</td><td>${(revAreaAvg[a.id] ?? 0) >= 85 ? "✓ Acima" : "⚠ Abaixo"}</td></tr>`).join("");
      const alertRows = alerts.map((a) => `<tr><td>${a.icon}</td><td>${a.title}</td><td style="color:#888">${a.msg}</td></tr>`).join("") || "<tr><td colspan=3 style='color:#22C55E'>Nenhum alerta</td></tr>";
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>MedTracker - Relatório</title></head>
<body style="background:#0A0A0B;color:#F4F4F5;font-family:system-ui,sans-serif;padding:40px;max-width:700px;margin:0 auto">
<h1 style="color:#6366F1">⚕ MedTracker — Relatório de Estudo</h1>
<p style="color:#888">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:20px 0">
<div style="background:#17171A;border-radius:12px;padding:16px;text-align:center"><div style="color:#888;font-size:11px">DIAS ESTUDADOS</div><div style="font-size:28px;font-weight:800;color:#60A5FA">${diasEstudados}</div></div>
<div style="background:#17171A;border-radius:12px;padding:16px;text-align:center"><div style="color:#888;font-size:11px">STREAK</div><div style="font-size:28px;font-weight:800;color:#F59E0B">${streak}d 🔥</div></div>
<div style="background:#17171A;border-radius:12px;padding:16px;text-align:center"><div style="color:#888;font-size:11px">QUESTÕES</div><div style="font-size:28px;font-weight:800;color:#2DD4BF">${totalQ}</div></div>
</div>
<h2 style="color:#A78BFA;margin-top:30px">Desempenho por Área (meta: 85%)</h2>
<table style="width:100%;border-collapse:collapse"><tr style="color:#888;font-size:12px"><th style="text-align:left;padding:8px">Área</th><th>Média</th><th>Status</th></tr>${areaRows}</table>
<h2 style="color:#F59E0B;margin-top:30px">Alertas</h2>
<table style="width:100%;border-collapse:collapse;font-size:13px">${alertRows}</table>
<h2 style="color:#22C55E;margin-top:30px">Resumo</h2>
<ul style="color:#888;line-height:2"><li>Total revisões: ${totalRevisoes}</li><li>Provas realizadas: ${exams.length}</li><li>Temas em queda: ${themeProgress.filter((t) => t.trend < -10).map((t) => t.theme).join(", ") || "nenhum"}</li></ul>
</body></html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "relatorio-medtracker.html"; a.click();
      URL.revokeObjectURL(url);
      setExportStatus("done");
      setTimeout(() => setExportStatus("idle"), 3000);
    } catch (e) { setExportStatus("error"); }
  }

  async function doNotionSync() {
    if (!notionToken.trim() || !notionDbId.trim()) return alert("Preencha token e database ID.");
    setNotionStatus("loading"); setNotionMsg("Conectando ao Notion via IA…");
    try {
      const result = await syncWithNotion(notionToken, notionDbId);
      if (result.reviews?.length > 0) {
        onNotionSync(result.reviews);
        setNotionStatus("done");
        setNotionMsg(`✓ ${result.reviews.length} revisões sincronizadas do Notion!`);
      } else {
        setNotionStatus("error"); setNotionMsg("Nenhuma revisão encontrada. Verifique o token e database ID.");
      }
    } catch (e) { setNotionStatus("error"); setNotionMsg("Erro: " + e.message); }
  }

  const DASH_TABS = [
    { id: "overview", label: "Visão geral" },
    { id: "themes", label: "Temas" },
    { id: "alerts", label: `Alertas${alerts.length ? ` (${alerts.length})` : ""}` },
    { id: "heatmap", label: "Heatmap" },
    { id: "notion", label: "🔗 Notion" },
  ];

  const heatColors = ["#1A1A1E", "#1E3A5F", "#2563EB", "#3B82F6", "#60A5FA"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
        <div style={{ background: C.card, border: `1px solid ${streak >= 7 ? C.yellow : C.border}`, borderRadius: 18, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
          <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>Streak 🔥</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: streak >= 7 ? C.yellow : streak >= 3 ? C.green : C.text, fontFamily: FM, lineHeight: 1 }}>{streak}d</div>
          <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>máx {maxStreak}d</div>
        </div>
        {[
          { label: "Dias estudados", value: diasEstudados, color: "#60A5FA", sub: "desde 02/02" },
          { label: "Revisões", value: totalRevisoes, color: C.purple },
          { label: "Questões", value: totalQ.toLocaleString("pt-BR"), color: C.teal },
          { label: "Provas", value: exams.length, color: C.yellow },
          { label: "Vencidas", value: dueCount, color: dueCount > 0 ? C.red : C.green },
        ].map((s) => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color, fontFamily: FM, lineHeight: 1 }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}`, paddingBottom: 0, overflowX: "auto" }}>
        {DASH_TABS.map((t) => { const active = activeTab === t.id; return (<button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "8px 16px", background: "none", border: "none", borderBottom: active ? `2px solid ${C.blue}` : "2px solid transparent", cursor: "pointer", color: active ? C.text : C.text3, fontSize: 13, fontFamily: F, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>{t.label}</button>); })}
      </div>

      {activeTab === "overview" && <>
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Desempenho por área</div>
          <div style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>Média das sessões vs. meta 85%</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barCategoryGap="32%">
              <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366F1" stopOpacity={1} /><stop offset="100%" stopColor="#6366F1" stopOpacity={0.5} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="1 4" stroke={C.border} vertical={false} />
              <XAxis dataKey="area" tick={{ fill: C.text3, fontSize: 12, fontFamily: FM }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: C.text3, fontSize: 11, fontFamily: FM }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={36} />
              <Tooltip content={<ChartTip />} cursor={{ fill: C.border + "80" }} />
              <ReferenceLine y={85} stroke={C.green} strokeDasharray="4 4" strokeWidth={1.5} />
              <Bar dataKey="% questões" fill="url(#bg)" radius={[8, 8, 4, 4]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Evolução semanal</div>
          <div style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>% médio por semana por área</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revEvo}>
              <CartesianGrid strokeDasharray="1 4" stroke={C.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: C.text3, fontSize: 11, fontFamily: FM }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fill: C.text3, fontSize: 11, fontFamily: FM }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={36} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: FM, paddingTop: 8 }} />
              <ReferenceLine y={85} stroke={C.green} strokeDasharray="4 4" strokeWidth={1.5} />
              {AREAS.map((a) => <Line key={a.id} type="monotone" dataKey={a.short} stroke={a.color} strokeWidth={2} dot={false} connectNulls />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Por área</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10 }}>
            {AREAS.map((a) => {
              const avg = revAreaAvg[a.id] ?? 0; const logs = revLogs.filter((r) => r.area === a.id);
              const tQ = logs.reduce((s, r) => s + (r.total || 0), 0); const th = [...new Set(logs.map((r) => r.theme))].length; const diff = avg - BENCHMARKS[a.id];
              return (
                <div key={a.id} style={{ background: C.bg, borderRadius: 12, padding: 14, border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><span style={{ fontSize: 12, fontWeight: 600, color: a.color }}>{a.label}</span><span style={{ fontSize: 20, fontWeight: 700, color: perfColor(avg), fontFamily: FM }}>{avg}%</span></div>
                  <div style={{ height: 3, background: C.card, borderRadius: 999, overflow: "hidden", marginBottom: 8 }}><div style={{ height: "100%", width: `${avg}%`, background: perfColor(avg), borderRadius: 999 }} /></div>
                  <div style={{ fontSize: 11, color: C.text3 }}>meta 85% <span style={{ color: diff >= 0 ? C.green : C.red, fontWeight: 500 }}>{diff >= 0 ? `+${diff}pp` : `${diff}pp`}</span></div>
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>{tQ.toLocaleString("pt-BR")}q · {th} temas</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ ...card, background: C.surface, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>📄 Relatório de estudo</div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>A IA gera um relatório HTML completo com análise e recomendações</div>
          </div>
          <button onClick={exportReport} disabled={exportStatus === "loading"} style={btn(exportStatus === "done" ? C.green : C.blue, { padding: "9px 20px" })}>
            {exportStatus === "loading" ? "⏳ Gerando…" : exportStatus === "done" ? "✓ Baixado!" : "Exportar relatório"}
          </button>
        </div>
      </>}

      {activeTab === "themes" && <>
        <div style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>Evolução de cada tema ao longo das revisões. Verde = melhorando, vermelho = caindo.</div>
        {themeProgress.length === 0 && <Empty msg="Faça ao menos 2 sessões do mesmo tema para ver a evolução." />}
        {themeProgress.map((t, i) => {
          const a = areaMap[t.area];
          const trendColor = t.trend >= 10 ? C.green : t.trend >= -5 ? C.yellow : C.red;
          const chartData = t.sorted.map((s, i) => ({ n: i + 1, pct: s.pct, date: fmtDate(s.date) }));
          return (
            <div key={i} style={{ ...card, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t.theme}</div>
                  <div style={{ fontSize: 11, color: a?.color, marginTop: 2 }}>{a?.label} · {t.n} sessões</div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>início</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: perfColor(t.first), fontFamily: FM }}>{t.first}%</div>
                  </div>
                  <div style={{ fontSize: 18, color: trendColor }}>→</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>atual</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: perfColor(t.last), fontFamily: FM }}>{t.last}%</div>
                  </div>
                  <div style={{ background: trendColor + "22", border: `1px solid ${trendColor}44`, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: trendColor, fontWeight: 700, fontFamily: FM }}>
                    {t.trend >= 0 ? "+" : ""}{t.trend}pp
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <Line type="monotone" dataKey="pct" stroke={a?.color || C.blue} strokeWidth={2} dot={{ fill: a?.color || C.blue, r: 3, strokeWidth: 0 }} />
                  <ReferenceLine y={85} stroke={C.green} strokeDasharray="3 3" strokeWidth={1} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? <div style={{ background: C.card2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "6px 10px", fontSize: 11, fontFamily: FM }}>{payload[0].payload.date}: {payload[0].value}%</div> : null} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </>}

      {activeTab === "alerts" && <>
        <div style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>Pontos de atenção detectados automaticamente com base no seu desempenho.</div>
        {alerts.length === 0 && <div style={{ ...card, background: C.green + "10", border: `1px solid ${C.green}33` }}><div style={{ fontSize: 14, fontWeight: 600, color: C.green }}>✓ Nenhum alerta</div><div style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>Seu desempenho está consistente. Continue assim!</div></div>}
        {alerts.map((a, i) => {
          const area = areaMap[a.area];
          const borderColor = a.type === "danger" ? C.red : a.type === "warning" ? C.yellow : C.blue;
          return (
            <div key={i} style={{ ...card, borderLeft: `4px solid ${borderColor}`, padding: "14px 18px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: C.text3, marginTop: 3 }}>{a.msg}</div>
                  {area && <span style={{ ...tag(area.color), marginTop: 6, display: "inline-flex" }}>{area.label}</span>}
                </div>
              </div>
            </div>
          );
        })}
        {alerts.length > 0 && (
          <div style={{ ...card, background: C.surface, border: `1px solid ${C.border2}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>💡 O que fazer</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {alerts.filter((a) => a.type === "danger").length > 0 && <div style={{ fontSize: 12, color: C.text2 }}>🔴 <b>Pontos cegos:</b> refaça questões desses temas e identifique os subtópicos mais cobrados. Considere revisão manual.</div>}
              {alerts.filter((a) => a.type === "warning").length > 0 && <div style={{ fontSize: 12, color: C.text2 }}>🟡 <b>Revisões atrasadas:</b> priorize-as hoje antes de adicionar sessões novas.</div>}
              {alerts.filter((a) => a.type === "info").length > 0 && <div style={{ fontSize: 12, color: C.text2 }}>📉 <b>Em queda:</b> revise a teoria desses temas — pode ser que o desempenho alto inicial tenha sido sorte.</div>}
            </div>
          </div>
        )}
      </>}

      {activeTab === "heatmap" && <>
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Heatmap de estudo</div>
          <div style={{ fontSize: 12, color: C.text3, marginBottom: 16 }}>Últimas 12 semanas — intensidade por número de sessões no dia</div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {heatmapData.map((d, i) => (
              <div key={i} title={`${fmtDate(d.date)}: ${d.count} sessão(ões)`} style={{
                width: 18, height: 18, borderRadius: 4,
                background: heatColors[Math.min(d.intensity, 4)],
                cursor: "default", transition: "transform 0.1s",
                border: `1px solid ${C.border}`,
              }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <span style={{ fontSize: 10, color: C.text3 }}>menos</span>
            {heatColors.map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: c, border: `1px solid ${C.border}` }} />)}
            <span style={{ fontSize: 10, color: C.text3 }}>mais</span>
          </div>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
            {[
              { label: "Dias estudados", value: diasEstudados, sub: "total" },
              { label: "Streak atual", value: `${streak}d 🔥`, sub: "consecutivos" },
              { label: "Melhor streak", value: `${maxStreak}d`, sub: "recorde" },
              { label: "Dias sem estudo", value: diffDays(today(), START_DATE) + 1 - diasEstudados, sub: "desde 02/02" },
            ].map((s) => (
              <div key={s.label} style={{ background: C.bg, borderRadius: 10, padding: 12, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: FM }}>{s.value}</div>
                <div style={{ fontSize: 10, color: C.text3 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </>}

      {activeTab === "notion" && <>
        <div style={{ ...card, border: `1px solid ${C.blue}44` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.blue, marginBottom: 4 }}>🔗 Sincronizar com Notion</div>
          <div style={{ fontSize: 12, color: C.text3, marginBottom: 16, lineHeight: 1.6 }}>
            A IA conecta ao seu Notion e importa as revisões automaticamente. Você precisa de:<br />
            <b style={{ color: C.text }}>1.</b> Token de integração (Settings → Connections → Create integration)<br />
            <b style={{ color: C.text }}>2.</b> Database ID (da URL da sua página MED, ex: notion.so/<b style={{ color: C.yellow }}>3098883c3e738...</b>)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <Fld label="Notion Integration Token">
              <input type="password" value={notionToken} onChange={(e) => setNotionToken(e.target.value)} placeholder="secret_xxx..." style={inp({ borderColor: C.blue + "44" })} />
            </Fld>
            <Fld label="Database ID">
              <input type="text" value={notionDbId} onChange={(e) => setNotionDbId(e.target.value)} placeholder="3098883c3e73819d85c4..." style={inp({ borderColor: C.blue + "44" })} />
            </Fld>
          </div>
          <button onClick={doNotionSync} disabled={notionStatus === "loading"} style={btn(C.blue, { width: "100%" })}>
            {notionStatus === "loading" ? "⏳ Sincronizando…" : "🔗 Sincronizar revisões"}
          </button>
          {notionMsg && (
            <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: notionStatus === "error" ? C.red + "18" : C.green + "18", border: `1px solid ${notionStatus === "error" ? C.red : C.green}44`, fontSize: 12, color: notionStatus === "error" ? C.red : C.green, fontFamily: FM }}>
              {notionMsg}
            </div>
          )}
          <div style={{ marginTop: 14, padding: 12, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Como funciona</div>
            <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
              A integração usa a IA do Claude como intermediária — ela recebe seu token temporariamente, consulta a API do Notion, e retorna os dados das revisões formatados. O token não é armazenado em nenhum lugar.<br />
              <span style={{ color: C.yellow }}>⚠ Para funcionar, você deve compartilhar o database MED com sua integração no Notion.</span>
            </div>
          </div>
        </div>
      </>}
    </div>
  );
}

function Sessoes({ sessions, onAdd, onDel }) {
  const empty = { date: today(), area: "clinica", theme: "", total: "", acertos: "" };
  const [form, setForm] = useState(empty); const [show, setShow] = useState(false); const [fil, setFil] = useState("all");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  function submit() { const tot = Number(form.total), ac = Number(form.acertos); if (!form.theme.trim()) return alert("Informe o tema."); if (!tot) return alert("Informe o total."); if (ac > tot) return alert("Acertos > total."); onAdd({ ...form, total: tot, acertos: ac, erros: tot - ac }); setForm(empty); setShow(false); }
  const filtered = sessions.filter((s) => fil === "all" || s.area === fil);
  const pct = Number(form.total) > 0 ? perc(Number(form.acertos), Number(form.total)) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>Registre aqui as sessões de questões após assistir uma aula nova. Cada tema entra automaticamente no sistema de revisões espaçadas.</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setShow((v) => !v)} style={btn(show ? C.card2 : C.blue)}>{show ? "— Fechar" : "+ Nova sessão"}</button>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button onClick={() => setFil("all")} style={btn(fil === "all" ? C.card2 : C.card, { padding: "7px 11px", fontSize: 11 })}>Todas</button>{AREAS.map((a) => <button key={a.id} onClick={() => setFil(a.id)} style={btn(fil === a.id ? a.color : C.card, { padding: "7px 11px", fontSize: 11 })}>{a.short}</button>)}</div>
      </div>
      {show && <div style={{ ...card, border: "1px solid #3B82F655" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.blue, marginBottom: 16 }}>Nova sessão de aula</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12, marginBottom: 12 }}>
          <Fld label="Data"><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={inp()} /></Fld>
          <Fld label="Área"><select value={form.area} onChange={(e) => set("area", e.target.value)} style={inp()}>{AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></Fld>
          <Fld label="Tema"><input type="text" value={form.theme} onChange={(e) => set("theme", e.target.value)} placeholder="Ex: Hipertensão, Sepse…" style={inp()} /></Fld>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
          <Fld label="Total"><input type="number" min="0" value={form.total} onChange={(e) => set("total", e.target.value)} style={inp()} /></Fld>
          <Fld label="✓ Acertos"><input type="number" min="0" value={form.acertos} onChange={(e) => set("acertos", e.target.value)} style={inp({ borderColor: "#34D39944" })} /></Fld>
          <div>{pct !== null && <div style={{ background: perfColor(pct) + "22", border: `1px solid ${perfColor(pct)}44`, borderRadius: 10, padding: "10px 16px", textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 700, color: perfColor(pct), fontFamily: FM }}>{pct}%</div><div style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>{perfLabel(pct)}</div></div>}</div>
        </div>
        <button onClick={submit} style={btn("#34D399")}>Registrar sessão</button>
      </div>}
      {filtered.length === 0 ? <Empty msg="Nenhuma sessão registrada ainda." /> : filtered.map((s) => { const a = areaMap[s.area]; const p = perc(s.acertos, s.total); return (
        <div key={s.id} style={{ ...card, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 52, height: 52, borderRadius: 10, background: perfColor(p) + "18", border: `2px solid ${perfColor(p)}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 16, fontWeight: 700, color: perfColor(p), fontFamily: FM }}>{p}%</span></div>
          <div style={{ flex: 1 }}><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}><span style={{ fontSize: 15, fontWeight: 600 }}>{s.theme}</span><span style={tag(a?.color || "#6B7280")}>{a?.label}</span></div><div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>{fmtDate(s.date)} · {s.total}q · <span style={{ color: C.green }}>✓{s.acertos}</span> <span style={{ color: "#F87171" }}>✗{s.erros}</span></div></div>
          <button onClick={() => onDel(s.id)} style={{ background: "none", border: "none", color: C.border2, cursor: "pointer", fontSize: 16, padding: 4 }}>✕</button>
        </div>
      ); })}
    </div>
  );
}

function Revisoes({ due, upcoming, revLogs, reviews, sessions, onMark, onQuick }) {
  const themesByArea = useMemo(() => { const o = {}; AREAS.forEach((a) => { o[a.id] = [...new Set([...reviews.filter((r) => r.area === a.id).map((r) => r.theme), ...revLogs.filter((r) => r.area === a.id).map((r) => r.theme)])].sort(); }); return o; }, [reviews, revLogs]);
  const emptyQ = { area: "clinica", theme: "", freeTheme: false, total: "", acertos: "" };
  const [qForm, setQForm] = useState(emptyQ); const [showQ, setShowQ] = useState(false); const [marking, setMarking] = useState(null);
  const [subtemaModal, setSubtemaModal] = useState(null);
  const [subtemaImg, setSubtemaImg] = useState(null);
  const [subtemaStatus, setSubtemaStatus] = useState("idle");
  const [subtemaResult, setSubtemaResult] = useState(null);
  const setQ = (k, v) => setQForm((f) => ({ ...f, [k]: v }));
  function submitQ() { const tot = Number(qForm.total), ac = Number(qForm.acertos); const th = qForm.freeTheme ? qForm.theme : (qForm.theme || ""); if (!th.trim()) return alert("Informe o tema."); if (!tot) return alert("Informe o total."); if (ac > tot) return alert("Acertos > total."); onQuick(qForm.area, th, tot, ac); setQForm(emptyQ); setShowQ(false); }
  function submitMark() { const tot = Number(marking.total), ac = Number(marking.acertos); if (!tot) return alert("Informe o total."); if (ac > tot) return alert("Acertos > total."); onMark(marking.id, ac, tot); setMarking(null); }
  const qPct = Number(qForm.total) > 0 ? perc(Number(qForm.acertos), Number(qForm.total)) : null;
  const mPct = marking && Number(marking.total) > 0 ? perc(Number(marking.acertos), Number(marking.total)) : null;

  const [subtemaEntries, setSubtemaEntries] = useState([{ nome: "", pct: "" }]);
  function addSubtemaEntry() { setSubtemaEntries([...subtemaEntries, { nome: "", pct: "" }]); }
  function updateSubtemaEntry(i, field, val) { setSubtemaEntries(subtemaEntries.map((e, j) => j === i ? { ...e, [field]: val } : e)); }
  function removeSubtemaEntry(i) { setSubtemaEntries(subtemaEntries.filter((_, j) => j !== i)); }
  function analyzeSubtemas() {
    const valid = subtemaEntries.filter(e => e.nome.trim() && e.pct !== "");
    if (valid.length < 2) return alert("Preencha pelo menos 2 subtemas com nome e %.");
    const sorted = valid.map(e => ({ nome: e.nome.trim(), pct: Number(e.pct) })).sort((a, b) => a.pct - b.pct);
    const pior = sorted[0];
    const melhor = sorted[sorted.length - 1];
    const media = Math.round(sorted.reduce((s, e) => s + e.pct, 0) / sorted.length);
    const fracos = sorted.filter(e => e.pct < 70);
    let analise = `Média geral: ${media}%. `;
    if (fracos.length > 0) analise += `${fracos.length} subtema(s) abaixo de 70%: ${fracos.map(f => f.nome + " (" + f.pct + "%)").join(", ")}. Foque nesses na próxima revisão.`;
    else analise += "Todos os subtemas estão acima de 70%. Continue mantendo!";
    setSubtemaResult({ melhor: { nome: melhor.nome, pct: melhor.pct }, pior: { nome: pior.nome, pct: pior.pct }, analise });
    setSubtemaStatus("done");
  }
  async function analyzeSubtemaImg(file) {
    // Imagem recebida - mostra o formulário de subtemas pra preencher manualmente
    setSubtemaStatus("manual");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {subtemaModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
          <div style={{ background: C.card, borderRadius: 20, padding: 24, maxWidth: 480, width: "100%", border: `1px solid ${C.border2}`, marginTop: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>📊 Análise de subtemas</div>
                <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>{subtemaModal.theme}</div>
              </div>
              <button onClick={() => { setSubtemaModal(null); setSubtemaResult(null); setSubtemaStatus("idle"); }} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>

            <div style={{ background: C.bg, borderRadius: 12, padding: 14, marginBottom: 16, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.text3, marginBottom: 8 }}>Insira os subtemas e o % de acerto de cada um (da sua plataforma de questões):</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {subtemaEntries.map((entry, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input value={entry.nome} onChange={(e) => updateSubtemaEntry(i, "nome", e.target.value)} placeholder="Subtema" style={{ ...inp(), flex: 1, padding: "7px 10px", fontSize: 12 }} />
                    <input value={entry.pct} onChange={(e) => updateSubtemaEntry(i, "pct", e.target.value.replace(/[^0-9]/g, ""))} placeholder="%" type="number" style={{ ...inp(), width: 55, padding: "7px 8px", fontSize: 12, textAlign: "center" }} />
                    {subtemaEntries.length > 1 && <button onClick={() => removeSubtemaEntry(i)} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 14, padding: 2 }}>✕</button>}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={addSubtemaEntry} style={{ ...btn(C.card2, { padding: "6px 12px", fontSize: 11 }), color: C.text2 }}>+ Subtema</button>
                <button onClick={analyzeSubtemas} style={btn(C.blue, { padding: "6px 14px", fontSize: 11 })}>Analisar</button>
              </div>
            </div>

            {subtemaImg && <img src={subtemaImg} alt="print" style={{ width: "100%", borderRadius: 10, marginBottom: 12, maxHeight: 150, objectFit: "contain", background: C.bg }} />}
            {subtemaStatus === "manual" && (
              <div style={{ padding: "10px 14px", background: C.yellow + "18", borderRadius: 10, fontSize: 12, color: C.yellow, marginBottom: 10 }}>📷 Print recebido. Preencha os subtemas e % acima baseado no print e clique "Analisar".</div>
            )}

            {subtemaStatus === "analyzing" && <div style={{ padding: "12px 14px", background: C.blue + "18", borderRadius: 10, fontSize: 12, color: C.blue, fontFamily: FM }}>⏳ IA analisando…</div>}

            {subtemaResult && (subtemaStatus === "done" || subtemaStatus === "error") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: C.green + "14", border: `1px solid ${C.green}33`, borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 10, color: C.green, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>🏆 Melhor</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{subtemaResult.melhor?.nome || "—"}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.green, fontFamily: FM }}>{subtemaResult.melhor?.pct ?? "-"}%</div>
                  </div>
                  <div style={{ background: "#EF444414", border: "1px solid #EF444433", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 10, color: "#EF4444", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>⚠️ Pior</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{subtemaResult.pior?.nome || "—"}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#EF4444", fontFamily: FM }}>{subtemaResult.pior?.pct ?? "-"}%</div>
                  </div>
                </div>
                {subtemaResult.subtemas?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[...subtemaResult.subtemas].sort((a, b) => b.pct - a.pct).map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, flex: 1, color: C.text2 }}>{s.nome}</span>
                        <div style={{ width: 100, height: 6, background: C.border, borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${s.pct}%`, background: perfColor(s.pct), borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 11, color: perfColor(s.pct), fontFamily: FM, minWidth: 34, textAlign: "right" }}>{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {subtemaResult.analise && (
                  <div style={{ background: C.blue + "18", border: `1px solid ${C.blue}33`, borderRadius: 10, padding: 12, fontSize: 12, color: C.text2, lineHeight: 1.5 }}>
                    💡 {subtemaResult.analise}
                  </div>
                )}
              </div>
            )}

            {subtemaStatus === "error" && <div style={{ padding: 12, background: C.red + "18", borderRadius: 10, fontSize: 12, color: C.red }}>{subtemaResult?.analise}</div>}
          </div>
        </div>
      )}

      <div style={{ ...card }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showQ ? 16 : 0 }}>
          <div><div style={{ fontSize: 15, fontWeight: 600 }}>Registrar revisão</div><div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>Área + tema + acertos</div></div>
          <button onClick={() => setShowQ((v) => !v)} style={btn(showQ ? C.card2 : C.blue, { padding: "8px 14px" })}>{showQ ? "— Fechar" : "+ Registrar"}</button>
        </div>
        {showQ && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fld label="Grande área"><select value={qForm.area} onChange={(e) => setQ("area", e.target.value)} style={inp()}>{AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></Fld>
            <Fld label={`Tema ${qForm.freeTheme ? "(livre)" : "(lista)"}`}><div style={{ display: "flex", gap: 6 }}>{!qForm.freeTheme ? <select value={qForm.theme} onChange={(e) => setQ("theme", e.target.value)} style={{ ...inp(), flex: 1 }}><option value="">Selecione…</option>{(themesByArea[qForm.area] || []).map((t) => <option key={t} value={t}>{t}</option>)}</select> : <input type="text" value={qForm.theme} onChange={(e) => setQ("theme", e.target.value)} placeholder="Digite o tema…" style={{ ...inp(), flex: 1 }} />}<button onClick={() => setQ("freeTheme", !qForm.freeTheme)} style={btn(C.card2, { padding: "8px 10px", fontSize: 12 })}>{qForm.freeTheme ? "📋" : "✏️"}</button></div></Fld>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
            <Fld label="Total"><input type="number" min="0" value={qForm.total} onChange={(e) => setQ("total", e.target.value)} style={inp()} /></Fld>
            <Fld label="✓ Acertos"><input type="number" min="0" value={qForm.acertos} onChange={(e) => setQ("acertos", e.target.value)} style={inp({ borderColor: "#34D39944" })} /></Fld>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{qPct !== null && <div style={{ textAlign: "center", fontSize: 16, fontWeight: 700, color: perfColor(qPct), fontFamily: FM }}>{qPct}%</div>}<button onClick={submitQ} style={btn("#34D399", { padding: "9px 14px" })}>Salvar</button></div>
          </div>
        </div>}
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><div style={{ fontSize: 15, fontWeight: 700, color: "#F87171" }}>Revisões vencidas</div>{due.length > 0 && <span style={tag("#F87171")}>{due.length}</span>}</div>
        {due.length === 0 ? <Empty msg="Nenhuma revisão vencida. Ótimo!" green /> : due.map((r) => {
          const a = areaMap[r.area]; const days = diffDays(r.nextDue, today()); const isM = marking?.id === r.id;
          return (
            <div key={r.id} style={{ ...card, borderLeft: `3px solid ${C.red}`, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{r.theme}</span>
                    <span style={tag(a?.color || "#6B7280")}>{a?.label}</span>
                    <span style={tag("#F87171")}>{days === 0 ? "hoje" : `${Math.abs(days)}d atraso`}</span>
                    <span style={tag(C.card2)}>{INT_LABELS[r.intervalIndex]}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>Último: <span style={{ color: perfColor(r.lastPerf) }}>{r.lastPerf}%</span> em {fmtDate(r.lastStudied)} · {r.history?.length || 0}× revisado</div>
                  {r.subtemaNote && (
                    <div style={{ marginTop: 6, padding: "5px 10px", background: C.bg, borderRadius: 8, fontSize: 11, color: C.text3, border: `1px solid ${C.border}` }}>
                      ⚠️ Pior subtema anterior: <span style={{ color: "#EF4444", fontWeight: 600 }}>{r.subtemaNote.pior?.nome}</span> ({r.subtemaNote.pior?.pct}%)
                    </div>
                  )}
                  {isM && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, alignItems: "flex-end", marginTop: 10 }}>
                    <Fld label="Total"><input type="number" min="0" value={marking.total} onChange={(e) => setMarking((m) => ({ ...m, total: e.target.value }))} style={inp()} autoFocus /></Fld>
                    <Fld label="✓ Acertos"><input type="number" min="0" value={marking.acertos} onChange={(e) => setMarking((m) => ({ ...m, acertos: e.target.value }))} style={inp({ borderColor: "#34D39944" })} /></Fld>
                    {mPct !== null && <div style={{ textAlign: "center", paddingBottom: 2, fontSize: 16, fontWeight: 700, color: perfColor(mPct), fontFamily: FM }}>{mPct}%</div>}
                    <div style={{ display: "flex", gap: 6, paddingBottom: 2 }}><button onClick={submitMark} style={btn("#34D399", { padding: "9px 12px" })}>✓</button><button onClick={() => setMarking(null)} style={btn(C.card2, { padding: "9px 10px" })}>✕</button></div>
                  </div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {!isM && <button onClick={() => setMarking({ id: r.id, total: "", acertos: "" })} style={btn("#3B82F6", { padding: "8px 14px" })}>Registrar</button>}
                  <button onClick={() => { setSubtemaModal({ revId: r.id, theme: r.theme, area: r.area }); setSubtemaResult(null); setSubtemaStatus("idle"); setSubtemaImg(null); }} style={btn(C.card2, { padding: "6px 10px", fontSize: 11 })}>📊 Subtemas</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Próximas revisões</div>
        {upcoming.length === 0 ? <Empty msg="Nenhuma revisão futura." /> : upcoming.slice(0, 25).map((r) => { const a = areaMap[r.area]; const days = diffDays(r.nextDue, today()); return (
          <div key={r.id} style={{ ...card, marginBottom: 6, padding: "12px 16px", borderRadius: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 13 }}>{r.theme}</span><span style={tag(a?.color || "#6B7280")}>{a?.short}</span><span style={tag(C.card2)}>{INT_LABELS[r.intervalIndex]}</span>
              </div>
              <button onClick={() => { setSubtemaModal({ revId: r.id, theme: r.theme, area: r.area }); setSubtemaResult(null); setSubtemaStatus("idle"); setSubtemaImg(null); }} style={btn(C.card2, { padding: "4px 8px", fontSize: 10 })}>📊</button>
            </div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: FM, marginTop: 3 }}>em <b style={{ color: C.text }}>{days}d</b> ({fmtDate(r.nextDue)}) · último <span style={{ color: perfColor(r.lastPerf) }}>{r.lastPerf}%</span></div>
          </div>
        ); })}
      </div>
      <div style={{ ...card, background: C.surface, border: "1px solid #1E3A5F" }}><div style={{ fontSize: 13, fontWeight: 600, color: "#93C5FD", marginBottom: 8 }}>Intervalos</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>{INTERVALS.map((iv, i) => <div key={i} style={{ background: C.card2, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#94A3B8", fontFamily: FM }}>{INT_LABELS[i]}</div>)}</div><div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>≥85% → avança · 60–84% → mantém · &lt;60% → volta um</div></div>
      {revLogs.length > 0 && <div style={card}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Histórico recente</div>{revLogs.slice(0, 20).map((l) => { const a = areaMap[l.area]; return (<div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}><span style={{ fontSize: 13, fontWeight: 700, color: perfColor(l.pct), fontFamily: FM, minWidth: 38 }}>{l.pct}%</span><span style={tag(a?.color || "#6B7280")}>{a?.short}</span><span style={{ fontSize: 12, color: C.text2, flex: 1 }}>{l.theme || "—"}</span><span style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>{fmtDate(l.date)} · {l.total}q</span></div>); })}</div>}
    </div>
  );
}

function Temas({ reviews, onEdit }) {
  const [editing, setEditing] = useState(null); const [editForm, setEditForm] = useState({ intervalIndex: 0, nextDue: "" });
  const [fil, setFil] = useState("all"); const [search, setSearch] = useState("");
  const startEdit = (r) => { setEditing(r.id); setEditForm({ intervalIndex: r.intervalIndex, nextDue: r.nextDue }); };
  const confirm = () => { onEdit(editing, editForm.intervalIndex, editForm.nextDue); setEditing(null); };
  const filtered = reviews.filter((r) => fil === "all" || r.area === fil).filter((r) => !search || r.theme.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ ...card, background: C.surface, border: "1px solid #1E3A5F" }}><div style={{ fontSize: 13, fontWeight: 600, color: "#93C5FD", marginBottom: 6 }}>Corrigir intervalo manualmente</div><div style={{ fontSize: 12, color: C.text3 }}>Use ✏ Corrigir para ajustar etapa e data.</div></div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tema…" style={{ ...inp(), width: 200 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button onClick={() => setFil("all")} style={btn(fil === "all" ? C.card2 : C.card, { padding: "7px 11px", fontSize: 11 })}>Todas</button>{AREAS.map((a) => <button key={a.id} onClick={() => setFil(a.id)} style={btn(fil === a.id ? a.color : C.card, { padding: "7px 11px", fontSize: 11 })}>{a.short}</button>)}</div>
      </div>
      {filtered.map((r) => { const a = areaMap[r.area]; const days = diffDays(r.nextDue, today()); const isDue = r.nextDue <= today(); const isE = editing === r.id; return (
        <div key={r.id} style={{ ...card, borderLeft: `3px solid ${isDue ? C.red : a?.color + "88"}` }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{r.theme}</span><span style={tag(a?.color || "#6B7280")}>{a?.label}</span><span style={tag(isDue ? "#F87171" : C.border2)}>{INT_LABELS[r.intervalIndex]}</span>{isDue ? <span style={tag("#F87171")}>{days === 0 ? "hoje" : `${Math.abs(days)}d atraso`}</span> : <span style={tag("#6B7280")}>em {days}d</span>}</div>
              <div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>Último: <span style={{ color: perfColor(r.lastPerf) }}>{r.lastPerf}%</span> em {fmtDate(r.lastStudied)} · próxima: {fmtDate(r.nextDue)} · {r.history?.length || 0}× revisado</div>
              {isE && <div style={{ marginTop: 14, padding: 14, background: C.bg, borderRadius: 10, border: `1px solid ${C.border2}` }}>
                <div style={{ fontSize: 12, color: "#93C5FD", fontWeight: 600, marginBottom: 12 }}>Editar: "{r.theme}"</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <Fld label="Etapa concluída"><select value={editForm.intervalIndex} onChange={(e) => setEditForm((f) => ({ ...f, intervalIndex: Number(e.target.value) }))} style={inp()}>{INTERVALS.map((iv, i) => <option key={i} value={i}>{INT_LABELS[i]} — {iv} dia{iv > 1 ? "s" : ""}</option>)}</select></Fld>
                  <Fld label="Próxima revisão"><input type="date" value={editForm.nextDue} onChange={(e) => setEditForm((f) => ({ ...f, nextDue: e.target.value }))} style={inp()} /></Fld>
                </div>
                <div style={{ display: "flex", gap: 8 }}><button onClick={confirm} style={btn("#34D399")}>✓ Salvar</button><button onClick={() => setEditing(null)} style={btn(C.card2)}>Cancelar</button></div>
              </div>}
            </div>
            {!isE && <button onClick={() => startEdit(r)} style={btn(C.card2, { padding: "7px 14px", fontSize: 12 })}>✏ Corrigir</button>}
          </div>
        </div>
      ); })}
    </div>
  );
}

// Categorias
const CATS = [
  { id: "soube", label: "Soube", short: "S", color: "#22C55E", desc: "Acertei pq sabia" },
  { id: "chutou", label: "Chutei/acertei", short: "C", color: "#F59E0B", desc: "Acertei pq chutei" },
  { id: "errou_viu", label: "Errei (já vi)", short: "EV", color: "#EF4444", desc: "Errei e deveria saber" },
  { id: "errou_nao", label: "Errei (nunca vi)", short: "EN", color: "#F97316", desc: "Errei pq nunca vi" },
];
const CAT_CYCLE = ["soube", "chutou", "errou_viu", "errou_nao", null];
function catColor(id) { return CATS.find((c) => c.id === id)?.color || C.border2; }

const MED_SCHEDULE = [
  { semana: "Sem. 01", area: "cirurgia", topics: ["Sd. Ictérica", "Hepatite", "Icterícia", "Cirrose", "Fígado", "Hipertensão Porta", "Insuficiência Hepática", "Encefalopatia Hepática", "Hepatite Medicamentosa", "Vias Biliares", "Coledocolitíase", "Colangite", "Câncer de Pâncreas", "Pâncreas"] },
  { semana: "Sem. 02", area: "cirurgia", topics: ["Disfagia", "Sd. Disfágica", "Esôfago", "DRGE", "Hérnia de Hiato", "Acalasia", "Boerhaave", "Perfuração Esofágica", "Câncer de Esôfago"] },
  { semana: "Sem. 03", area: "go", topics: ["IST", "DST", "Úlcera genital", "Sífilis", "Gonorreia", "Herpes genital", "Cancro mole", "Verrugas genitais", "HPV", "Donovanose", "Linfogranuloma"] },
  { semana: "Sem. 04", area: "ped", topics: ["Sd. Respiratória", "Pneumonia", "Bronquiolite", "Asma", "Crupe", "Laringite", "OMA", "Otite", "Faringite", "Mononucleose", "Coqueluche"] },
  { semana: "Sem. 05", area: "cirurgia", topics: ["Sd. Dispéptica", "Úlcera péptica", "Gastrite", "H. pylori", "Zollinger-Ellison", "Corpo estranho", "Ingestão corpo estranho", "Hérnia de hiato"] },
  { semana: "Sem. 06", area: "cirurgia", topics: ["Hemorragia digestiva", "HDA", "HDB", "Varizes esofágicas", "Angiodisplasia", "Divertículo", "Diverticulose", "Diverticulite", "Hemorragia digestiva obscura"] },
  { semana: "Sem. 07", area: "ped", topics: ["Doenças exantemáticas", "Sarampo", "Rubéola", "Varicela", "Escarlatina", "Roséola", "Eritema infeccioso", "Sd. luva e meia", "Exantema súbito"] },
  { semana: "Sem. 08", area: "clinica", topics: ["HAS", "Hipertensão", "Sd. Metabólica", "Dislipidemia", "Hiperaldosteronismo", "Feocromocitoma", "Hipertensão secundária", "Crise hipertensiva"] },
  { semana: "Sem. 09", area: "preventiva", topics: ["SUS", "APS", "Atenção primária", "NASF", "ESF", "Saúde da família", "Receita médica", "Financiamento SUS", "Regionalização", "Hierarquização"] },
  { semana: "Sem. 10", area: "cirurgia", topics: ["Dor abdominal", "Abdome agudo", "Apendicite", "Peritonite", "Obstrução intestinal", "Íleo", "Vólvulo", "Febre tifoide", "Porfiria"] },
  { semana: "Sem. 11", area: "clinica", topics: ["Diabetes", "DM2", "DM1", "Hipoglicemia", "Cetoacidose", "HNKC", "Sd. Metabólica", "Obesidade", "Insulina"] },
  { semana: "Sem. 11", area: "ped", topics: ["Vacinação", "Imunização", "Calendário vacinal", "Vacinas", "PNI"] },
  { semana: "Sem. 12", area: "clinica", topics: ["Tireoide", "Hipotireoidismo", "Hipertireoidismo", "Tireoidite", "Nódulo tireoidiano", "Câncer de tireoide", "Bócio"] },
  { semana: "Sem. 12", area: "cirurgia", topics: ["Obstrução intestinal", "Íleo paralítico", "Vólvulo", "Hérnia encarcerada", "Neoplasia colorretal"] },
  { semana: "Sem. 13", area: "clinica", topics: ["Suprarrenal", "Adrenal", "Doença de Addison", "Cushing", "Hiperaldosteronismo", "Feocromocitoma", "Hipófise", "Acromegalia", "Prolactinoma"] },
  { semana: "Sem. 13", area: "go", topics: ["Câncer de mama", "Câncer de ovário", "Oncologia ginecológica", "Rastreamento mama", "Mamografia", "BI-RADS"] },
  { semana: "Sem. 14", area: "clinica", topics: ["UTI", "Terapia intensiva", "Sepse", "Choque", "Ventilação mecânica", "IOT", "PCR", "Ressuscitação", "SIRS"] },
  { semana: "Sem. 14", area: "preventiva", topics: ["Medidas de saúde", "Prevenção", "Rastreamento", "Vigilância epidemiológica", "Cobertura vacinal", "Saúde do trabalhador"] },
  { semana: "Sem. 15", area: "clinica", topics: ["Pneumonia", "PAC", "PAH", "Pneumocistose", "Tuberculose", "Derrame pleural", "Pleurite", "DPOC", "Asma"] },
  { semana: "Sem. 15", area: "go", topics: ["Câncer de endométrio", "Câncer de colo", "Oncologia ginecológica", "Colposcopia", "Papanicolau", "Células glandulares"] },
  { semana: "Sem. 16", area: "preventiva", topics: ["Epidemiologia", "Estudos epidemiológicos", "Coorte", "Caso-controle", "Transversal", "RR", "OR", "Bradford Hill", "Viés"] },
  { semana: "Sem. 16", area: "go", topics: ["Doenças clínicas na gravidez", "Pré-eclâmpsia", "HELLP", "Diabetes gestacional", "Cardiopatia", "Anemia", "Epilepsia na gestação"] },
];

function mapThemeToSchedule(theme) {
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

// ── BANCO DE TEMAS — extraído de 22 provas reais (2160 questões) ──────────
const EXAM_THEMES_RAW = {"ufcspa 2022":{1:{a:"ped",t:"Reanimação neonatal"},2:{a:"ped",t:"Icterícia neonatal"},3:{a:"ped",t:"Reanimação neonatal"},4:{a:"ped",t:"Aleitamento materno"},5:{a:"ped",t:"Infecções congênitas (TORCH)"},6:{a:"ped",t:"Crescimento infantil"},7:{a:"ped",t:"Pressão arterial pediátrica"},8:{a:"ped",t:"Estado de mal epiléptico"},9:{a:"ped",t:"TDAH"},10:{a:"ped",t:"Redes de Atenção à Saúde"},11:{a:"ped",t:"Desenvolvimento neuropsicomotor"},12:{a:"ped",t:"Otite média aguda"},13:{a:"ped",t:"Rastreamento Ca colo uterino"},14:{a:"ped",t:"Vacinação / Imunização"},15:{a:"ped",t:"Redes de Atenção à Saúde"},16:{a:"ped",t:"Otite média aguda"},17:{a:"ped",t:"ITU na infância"},18:{a:"ped",t:"Transtorno do espectro autista"},19:{a:"ped",t:"PAC na infância"},20:{a:"ped",t:"Dispositivos inalatórios"},21:{a:"preventiva",t:"Redes de Atenção à Saúde"},22:{a:"preventiva",t:"Prevenção quaternária"},23:{a:"preventiva",t:"ITU na infância"},24:{a:"preventiva",t:"Atributos da APS"},25:{a:"preventiva",t:"Fibrilação atrial / Flutter"},26:{a:"preventiva",t:"Redes de Atenção à Saúde"},27:{a:"preventiva",t:"Otite média aguda"},28:{a:"preventiva",t:"Contracepção"},29:{a:"preventiva",t:"Controle social / Conselhos"},30:{a:"preventiva",t:"Atributos da APS"},31:{a:"preventiva",t:"ITU / Piúria"},32:{a:"preventiva",t:"ESF / Saúde da Família"},33:{a:"preventiva",t:"Rastreamento Ca colo uterino"},34:{a:"preventiva",t:"Princípios do SUS"},35:{a:"preventiva",t:"Princípios do SUS"},36:{a:"preventiva",t:"Rastreamento / Sobrediagnóstico"},37:{a:"preventiva",t:"Viés / Confundimento"},38:{a:"preventiva",t:"Fibrilação atrial / Flutter"},39:{a:"preventiva",t:"Vacinação / Imunização"},40:{a:"preventiva",t:"ESF / Saúde da Família"},41:{a:"cirurgia",t:"Redes de Atenção à Saúde"},42:{a:"cirurgia",t:"Otite média aguda"},43:{a:"cirurgia",t:"PAC na infância"},44:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},45:{a:"cirurgia",t:"Fibrilação atrial / Flutter"},46:{a:"cirurgia",t:"Hemorragia digestiva"},47:{a:"cirurgia",t:"Delirium"},48:{a:"cirurgia",t:"Princípios do SUS"},49:{a:"cirurgia",t:"Otite média aguda"},50:{a:"cirurgia",t:"Otite média aguda"},51:{a:"cirurgia",t:"Otite média aguda"},52:{a:"cirurgia",t:"Crescimento infantil"},53:{a:"cirurgia",t:"Otite média aguda"},54:{a:"cirurgia",t:"Otite média aguda"},55:{a:"cirurgia",t:"Intussuscepção intestinal"},56:{a:"cirurgia",t:"Colelitíase / Colecistectomia"},57:{a:"cirurgia",t:"DRGE / Refluxo gastroesofágico"},58:{a:"cirurgia",t:"Doença inflamatória intestinal"},59:{a:"cirurgia",t:"TEV / TVP / TEP"},60:{a:"cirurgia",t:"Hérnia inguinal / femoral"},61:{a:"go",t:"Contracepção"},62:{a:"go",t:"Desenvolvimento neuropsicomotor"},63:{a:"go",t:"Otite média aguda"},64:{a:"go",t:"Rastreamento / Sobrediagnóstico"},65:{a:"go",t:"Redes de Atenção à Saúde"},66:{a:"go",t:"Rastreamento Ca colo uterino"},67:{a:"go",t:"SUA / Adenomiose"},68:{a:"go",t:"Sensibilidade / Especificidade / VPP-VPN"},69:{a:"go",t:"Redes de Atenção à Saúde"},70:{a:"go",t:"Redes de Atenção à Saúde"},71:{a:"go",t:"Diagnóstico de gestação"},72:{a:"go",t:"Crescimento infantil"},73:{a:"go",t:"Reanimação neonatal"},74:{a:"go",t:"Aleitamento materno"},75:{a:"go",t:"Fibrilação atrial / Flutter"},76:{a:"go",t:"Crescimento infantil"},77:{a:"go",t:"Pré-natal"},78:{a:"go",t:"Redes de Atenção à Saúde"},79:{a:"go",t:"Reanimação neonatal"},80:{a:"go",t:"Reanimação neonatal"},81:{a:"clinica",t:"Dispositivos inalatórios"},82:{a:"clinica",t:"Sensibilidade / Especificidade / VPP-VPN"},83:{a:"clinica",t:"Fibrilação atrial / Flutter"},84:{a:"clinica",t:"Ensaio clínico randomizado"},85:{a:"clinica",t:"Princípios do SUS"},86:{a:"clinica",t:"Incidência / Prevalência"},87:{a:"clinica",t:"Rastreamento Ca colo uterino"},88:{a:"clinica",t:"Rastreamento Ca colo uterino"},89:{a:"clinica",t:"Otite média aguda"},90:{a:"clinica",t:"Rastreamento Ca colo uterino"},91:{a:"clinica",t:"Otite média aguda"},92:{a:"clinica",t:"Contracepção"},93:{a:"clinica",t:"Alcoolismo / Rastreamento"},94:{a:"clinica",t:"Redes de Atenção à Saúde"},95:{a:"clinica",t:"Redes de Atenção à Saúde"},96:{a:"clinica",t:"PAC / Pneumonia comunitária"},97:{a:"clinica",t:"Ensaio clínico randomizado"},98:{a:"clinica",t:"Otite média aguda"},99:{a:"clinica",t:"Sensibilidade / Especificidade / VPP-VPN"},100:{a:"clinica",t:"Ensaio clínico randomizado"}},
"ufcspa 2023":{1:{a:"ped",t:"APLV / Fórmula infantil"},2:{a:"ped",t:"Intussuscepção intestinal"},3:{a:"ped",t:"ITU na infância"},4:{a:"ped",t:"Miocardite na infância"},5:{a:"ped",t:"Crescimento infantil"},6:{a:"ped",t:"HIC / Tríade de Cushing"},7:{a:"ped",t:"Doenças exantemáticas"},8:{a:"ped",t:"Vacinação / Imunização"},9:{a:"ped",t:"Bronquiolite viral aguda"},10:{a:"ped",t:"COVID-19 pediátrico"},11:{a:"ped",t:"PAC na infância"},12:{a:"ped",t:"Desenvolvimento neuropsicomotor"},13:{a:"ped",t:"Violência infantil / Maus-tratos"},14:{a:"ped",t:"Aleitamento materno"},15:{a:"ped",t:"Bullying"},16:{a:"ped",t:"Prematuridade / RN pré-termo"},17:{a:"ped",t:"Reanimação neonatal"},18:{a:"ped",t:"Hipoglicemia neonatal"},19:{a:"ped",t:"TDAH"},20:{a:"ped",t:"Transtorno do espectro autista"},21:{a:"preventiva",t:"Vacinação / Imunização"},22:{a:"preventiva",t:"Ensaio clínico randomizado"},23:{a:"preventiva",t:"Atributos da APS"},24:{a:"preventiva",t:"Princípios do SUS"},25:{a:"preventiva",t:"Vacinação / Imunização"},26:{a:"preventiva",t:"Incidência / Prevalência"},27:{a:"preventiva",t:"Estudo transversal / Prevalência"},28:{a:"preventiva",t:"Estudo de coorte"},29:{a:"preventiva",t:"Considerandose Tabela Seguir Analisar"},30:{a:"preventiva",t:"Viés / Confundimento"},31:{a:"preventiva",t:"Estudo transversal / Prevalência"},32:{a:"preventiva",t:"Rastreamento / Sobrediagnóstico"},33:{a:"preventiva",t:"Revisão sistemática / Meta-análise"},34:{a:"preventiva",t:"Redes de Atenção à Saúde"},35:{a:"preventiva",t:"Estudo caso-controle / OR"},36:{a:"preventiva",t:"SUA / Adenomiose"},37:{a:"preventiva",t:"Atributos da APS"},38:{a:"preventiva",t:"ESF / Saúde da Família"},39:{a:"preventiva",t:"Hipoglicemia por sulfonilureia"},40:{a:"preventiva",t:"Insulinoterapia / Ajuste de dose"},41:{a:"cirurgia",t:"Otite média aguda"},42:{a:"cirurgia",t:"Redes de Atenção à Saúde"},43:{a:"cirurgia",t:"ATB profilaxia cirúrgica"},44:{a:"cirurgia",t:"Otite média aguda"},45:{a:"cirurgia",t:"Redes de Atenção à Saúde"},46:{a:"cirurgia",t:"Avaliação pré-operatória / ASA"},47:{a:"cirurgia",t:"Doença inflamatória intestinal"},48:{a:"cirurgia",t:"Otite média aguda"},49:{a:"cirurgia",t:"Tumores de pâncreas"},50:{a:"cirurgia",t:"Otite média aguda"},51:{a:"cirurgia",t:"Otite média aguda"},52:{a:"cirurgia",t:"Otite média aguda"},53:{a:"cirurgia",t:"Apendicite / Dor abdominal"},54:{a:"cirurgia",t:"Otite média aguda"},55:{a:"cirurgia",t:"Redes de Atenção à Saúde"},56:{a:"cirurgia",t:"Rastreamento / Sobrediagnóstico"},57:{a:"cirurgia",t:"Otite média aguda"},58:{a:"cirurgia",t:"ESF / Saúde da Família"},59:{a:"cirurgia",t:"Otite média aguda"},60:{a:"cirurgia",t:"Redes de Atenção à Saúde"},61:{a:"go",t:"Pré-eclâmpsia / DHEG"},62:{a:"go",t:"Prematuridade / RN pré-termo"},63:{a:"go",t:"HIV vertical / Aleitamento"},64:{a:"go",t:"Princípios do SUS"},65:{a:"go",t:"Pré-natal"},66:{a:"go",t:"Otite média aguda"},67:{a:"go",t:"Prematuridade / RN pré-termo"},68:{a:"go",t:"Doença trofoblástica gestacional"},69:{a:"go",t:"Prematuridade / RN pré-termo"},70:{a:"go",t:"Vacinação / Imunização"},71:{a:"go",t:"Redes de Atenção à Saúde"},72:{a:"go",t:"Rastreamento Ca colo uterino"},73:{a:"go",t:"Reanimação neonatal"},74:{a:"go",t:"Otite média aguda"},75:{a:"go",t:"Redes de Atenção à Saúde"},76:{a:"go",t:"Infertilidade / Reprodução assistida"},77:{a:"go",t:"Atributos da APS"},78:{a:"go",t:"Aleitamento materno"},79:{a:"go",t:"TDPM"},80:{a:"go",t:"Reanimação neonatal"},81:{a:"clinica",t:"PTI / Púrpura trombocitopênica"},82:{a:"clinica",t:"Princípios do SUS"},83:{a:"clinica",t:"PAC / Pneumonia comunitária"},84:{a:"clinica",t:"PAC / Pneumonia comunitária"},85:{a:"clinica",t:"Otite média aguda"},86:{a:"clinica",t:"PTI / Púrpura trombocitopênica"},87:{a:"clinica",t:"Rastreamento Ca colo uterino"},88:{a:"clinica",t:"Otite média aguda"},89:{a:"clinica",t:"ESF / Saúde da Família"},90:{a:"clinica",t:"Otite média aguda"},91:{a:"clinica",t:"Otite média aguda"},92:{a:"clinica",t:"Rastreamento Ca colo uterino"},93:{a:"clinica",t:"Rastreamento Ca colo uterino"},94:{a:"clinica",t:"PAC / Pneumonia comunitária"},95:{a:"clinica",t:"PAC / Pneumonia comunitária"},96:{a:"clinica",t:"HIV vertical / Aleitamento"},97:{a:"clinica",t:"Otite média aguda"},98:{a:"clinica",t:"PAC / Pneumonia comunitária"},99:{a:"clinica",t:"Otite média aguda"},100:{a:"clinica",t:"Rastreamento Ca colo uterino"}},
"ufcspa 2024":{1:{a:"ped",t:"PTI / Púrpura trombocitopênica"},2:{a:"ped",t:"Rastreamento / Sobrediagnóstico"},3:{a:"ped",t:"Sensibilidade / Especificidade / VPP-VPN"},4:{a:"ped",t:"Testes em série e paralelo"},5:{a:"ped",t:"Ensaio clínico randomizado"},6:{a:"ped",t:"Desenvolvimento neuropsicomotor"},7:{a:"ped",t:"Redes de Atenção à Saúde"},8:{a:"ped",t:"Incidência / Prevalência"},9:{a:"ped",t:"PAC / Pneumonia comunitária"},10:{a:"ped",t:"Atributos da APS"},11:{a:"ped",t:"ESF / Saúde da Família"},12:{a:"ped",t:"Rastreamento Ca colo uterino"},13:{a:"ped",t:"Atributos da APS"},14:{a:"ped",t:"Incidência / Prevalência"},15:{a:"ped",t:"Princípios do SUS"},16:{a:"ped",t:"Princípios do SUS"},17:{a:"ped",t:"Atributos da APS"},18:{a:"ped",t:"Atributos da APS"},19:{a:"ped",t:"Atributos da APS"},20:{a:"ped",t:"Suicídio / Fatores de risco"},21:{a:"cirurgia",t:"Otite média aguda"},22:{a:"preventiva",t:"Ensaio clínico randomizado"},23:{a:"preventiva",t:"Úlcera péptica"},24:{a:"preventiva",t:"Doença inflamatória intestinal"},25:{a:"preventiva",t:"Ensaio clínico randomizado"},26:{a:"preventiva",t:"Redes de Atenção à Saúde"},27:{a:"preventiva",t:"Prematuridade / RN pré-termo"},28:{a:"preventiva",t:"Redes de Atenção à Saúde"},29:{a:"preventiva",t:"Diante Lesão Pele Melanocitica"},30:{a:"preventiva",t:"Trauma torácico / Pneumotórax"},31:{a:"preventiva",t:"Hérnia inguinal / femoral"},32:{a:"preventiva",t:"Contracepção"},33:{a:"preventiva",t:"Otite média aguda"},34:{a:"preventiva",t:"Otite média aguda"},35:{a:"preventiva",t:"Otite média aguda"},36:{a:"preventiva",t:"Rastreamento / Sobrediagnóstico"},37:{a:"preventiva",t:"Tumores de pâncreas"},38:{a:"preventiva",t:"Colelitíase / Colecistectomia"},39:{a:"preventiva",t:"Rastreamento Ca colorretal"},40:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},41:{a:"cirurgia",t:"Reanimação neonatal"},42:{a:"cirurgia",t:"Prematuridade / RN pré-termo"},43:{a:"cirurgia",t:"Prematuridade / RN pré-termo"},44:{a:"cirurgia",t:"Infecções congênitas (TORCH)"},45:{a:"cirurgia",t:"Diarreia aguda / Gastroenterite"},46:{a:"cirurgia",t:"Nutrição infantil"},47:{a:"cirurgia",t:"Dispositivos inalatórios"},48:{a:"cirurgia",t:"Corpo estranho / Ingestão"},49:{a:"cirurgia",t:"Bronquiolite viral aguda"},50:{a:"cirurgia",t:"Fibrose cística"},51:{a:"cirurgia",t:"Otite média aguda"},52:{a:"cirurgia",t:"ITU na infância"},53:{a:"cirurgia",t:"Neoplasias de laringe/faringe"},54:{a:"cirurgia",t:"Cefaleia na infância"},55:{a:"cirurgia",t:"ITU na infância"},56:{a:"cirurgia",t:"Prematuridade / RN pré-termo"},57:{a:"cirurgia",t:"RCP / Suporte de vida pediátrico"},58:{a:"cirurgia",t:"Vacinação / Imunização"},59:{a:"cirurgia",t:"Fibrilação atrial / Flutter"},60:{a:"cirurgia",t:"Aleitamento materno"},61:{a:"go",t:"Ensaio clínico randomizado"},62:{a:"go",t:"Otite média aguda"},63:{a:"go",t:"Obesidade / Regulação do peso"},64:{a:"go",t:"PTI / Púrpura trombocitopênica"},65:{a:"go",t:"SUA / Adenomiose"},66:{a:"go",t:"Princípios do SUS"},67:{a:"go",t:"Infecções congênitas (TORCH)"},68:{a:"go",t:"Anestesia / Sedação"},69:{a:"go",t:"Rastreamento Ca colo uterino"},70:{a:"go",t:"Rastreamento Ca colo uterino"},71:{a:"go",t:"ESF / Saúde da Família"},72:{a:"go",t:"Otite média aguda"},73:{a:"go",t:"Otite média aguda"},74:{a:"go",t:"PAC / Pneumonia comunitária"},75:{a:"go",t:"PAC na infância"},76:{a:"go",t:"Hemorragia digestiva"},77:{a:"go",t:"PAC / Pneumonia comunitária"},78:{a:"go",t:"Otite média aguda"},79:{a:"go",t:"Contracepção"},80:{a:"go",t:"ESF / Saúde da Família"},81:{a:"clinica",t:"Rastreamento Ca colo uterino"},82:{a:"clinica",t:"PTI / Púrpura trombocitopênica"},83:{a:"clinica",t:"Ensaio clínico randomizado"},84:{a:"clinica",t:"PTI / Púrpura trombocitopênica"},85:{a:"clinica",t:"Contracepção"},86:{a:"clinica",t:"Rastreamento / Sobrediagnóstico"},87:{a:"clinica",t:"Pré-natal"},88:{a:"clinica",t:"Aleitamento materno"},89:{a:"clinica",t:"SUA / Adenomiose"},90:{a:"clinica",t:"Desenvolvimento neuropsicomotor"},91:{a:"clinica",t:"Reanimação neonatal"},92:{a:"clinica",t:"SUA / Adenomiose"},93:{a:"clinica",t:"Redes de Atenção à Saúde"},94:{a:"clinica",t:"Crescimento infantil"},95:{a:"clinica",t:"Incidência / Prevalência"},96:{a:"clinica",t:"Desenvolvimento neuropsicomotor"},97:{a:"clinica",t:"Otite média aguda"},98:{a:"clinica",t:"Otite média aguda"},99:{a:"clinica",t:"Infertilidade / Reprodução assistida"},100:{a:"clinica",t:"Transtorno bipolar / Lítio"}},
"ufcspa 2025":{1:{a:"ped",t:"Contracepção"},2:{a:"ped",t:"ESF / Saúde da Família"},3:{a:"ped",t:"Rastreamento Ca colo uterino"},4:{a:"ped",t:"Otite média aguda"},5:{a:"ped",t:"Tabagismo / Cessação"},6:{a:"ped",t:"Asma / Broncoespasmo infantil"},7:{a:"ped",t:"PAC na infância"},8:{a:"ped",t:"Rastreamento Ca colo uterino"},9:{a:"ped",t:"SUA / Adenomiose"},10:{a:"ped",t:"Incidência / Prevalência"},11:{a:"ped",t:"Otite média aguda"},12:{a:"ped",t:"Ensaio clínico randomizado"},13:{a:"ped",t:"SUA / Adenomiose"},14:{a:"ped",t:"Redes de Atenção à Saúde"},15:{a:"ped",t:"Contracepção"},16:{a:"ped",t:"ESF / Saúde da Família"},17:{a:"ped",t:"Insônia / Ansiedade"},18:{a:"ped",t:"Anemia hemolítica"},19:{a:"ped",t:"Transtorno do espectro autista"},20:{a:"ped",t:"Atributos da APS"},21:{a:"preventiva",t:"Doença inflamatória intestinal"},22:{a:"preventiva",t:"PTI / Púrpura trombocitopênica"},23:{a:"preventiva",t:"Reanimação neonatal"},24:{a:"preventiva",t:"Fibrilação atrial / Flutter"},25:{a:"preventiva",t:"Desenvolvimento neuropsicomotor"},26:{a:"preventiva",t:"Reanimação neonatal"},27:{a:"preventiva",t:"Prematuridade / RN pré-termo"},28:{a:"preventiva",t:"Desenvolvimento neuropsicomotor"},29:{a:"preventiva",t:"Rastreamento Ca colo uterino"},30:{a:"preventiva",t:"Redes de Atenção à Saúde"},31:{a:"preventiva",t:"Presença Pais Durante Toda"},32:{a:"preventiva",t:"Rastreamento Ca colo uterino"},33:{a:"preventiva",t:"Estado de mal epiléptico"},34:{a:"preventiva",t:"Bronquiolite viral aguda"},35:{a:"preventiva",t:"PAC na infância"},36:{a:"preventiva",t:"PAC / Pneumonia comunitária"},37:{a:"preventiva",t:"Asma"},38:{a:"preventiva",t:"Indicações Para Colocação Acesso"},39:{a:"preventiva",t:"Crescimento infantil"},40:{a:"preventiva",t:"Desenvolvimento neuropsicomotor"},41:{a:"cirurgia",t:"Ensaio clínico randomizado"},42:{a:"cirurgia",t:"Fibrilação atrial / Flutter"},43:{a:"cirurgia",t:"Estudo de coorte"},44:{a:"cirurgia",t:"Revisão sistemática / Meta-análise"},45:{a:"cirurgia",t:"Incidência / Prevalência"},46:{a:"cirurgia",t:"Lesão renal aguda"},47:{a:"cirurgia",t:"Eficácia Efetividade Eficácia Refere"},48:{a:"cirurgia",t:"Sensibilidade / Especificidade / VPP-VPN"},49:{a:"cirurgia",t:"Estudo de coorte"},50:{a:"preventiva",t:"Vacinação / Imunização"},51:{a:"cirurgia",t:"Ensaio clínico randomizado"},52:{a:"cirurgia",t:"Princípios do SUS"},53:{a:"cirurgia",t:"Desenvolvimento neuropsicomotor"},54:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},55:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},56:{a:"cirurgia",t:"Otite média aguda"},57:{a:"cirurgia",t:"Otite média aguda"},58:{a:"cirurgia",t:"Atributos da APS"},59:{a:"cirurgia",t:"Pressão arterial pediátrica"},60:{a:"cirurgia",t:"Redes de Atenção à Saúde"},61:{a:"go",t:"Redes de Atenção à Saúde"},62:{a:"go",t:"Líquido amniótico"},63:{a:"go",t:"Trabalho de parto / Partograma"},64:{a:"go",t:"Alterações Fisiológicas Gestação Marcha"},65:{a:"go",t:"Rastreamento Ca colo uterino"},66:{a:"go",t:"Redes de Atenção à Saúde"},67:{a:"go",t:"Prematuridade / RN pré-termo"},68:{a:"go",t:"Lombalgia"},69:{a:"go",t:"Prematuridade / RN pré-termo"},70:{a:"go",t:"Violência Mulher Importante Questão"},71:{a:"go",t:"Otite média aguda"},72:{a:"go",t:"Desenvolvimento neuropsicomotor"},73:{a:"go",t:"Tabagismo / Cessação"},74:{a:"go",t:"Rastreamento / Sobrediagnóstico"},75:{a:"go",t:"Otite média aguda"},76:{a:"go",t:"Rastreamento Ca colo uterino"},77:{a:"go",t:"Fibrilação atrial / Flutter"},78:{a:"go",t:"Ensaio clínico randomizado"},79:{a:"go",t:"Redes de Atenção à Saúde"},80:{a:"go",t:"Otite média aguda"},81:{a:"clinica",t:"Apendicite / Dor abdominal"},82:{a:"clinica",t:"Otite média aguda"},83:{a:"clinica",t:"Otite média aguda"},84:{a:"clinica",t:"Otite média aguda"},85:{a:"clinica",t:"Otite média aguda"},86:{a:"clinica",t:"Contracepção"},87:{a:"clinica",t:"Otite média aguda"},88:{a:"clinica",t:"Incidência / Prevalência"},89:{a:"clinica",t:"Incidência / Prevalência"},90:{a:"clinica",t:"Redes de Atenção à Saúde"},91:{a:"clinica",t:"Avaliação pré-operatória / ASA"},92:{a:"clinica",t:"Hemorragia digestiva"},93:{a:"clinica",t:"Otite média aguda"},94:{a:"clinica",t:"Redes de Atenção à Saúde"},95:{a:"clinica",t:"Redes de Atenção à Saúde"},96:{a:"clinica",t:"Prematuridade / RN pré-termo"},97:{a:"clinica",t:"Redes de Atenção à Saúde"},98:{a:"clinica",t:"Colelitíase / Colecistectomia"},99:{a:"clinica",t:"Rastreamento Ca colo uterino"},100:{a:"clinica",t:"Otite média aguda"}},
"ufcspa 2026":{1:{a:"ped",t:"PTI / Púrpura trombocitopênica"},2:{a:"ped",t:"SUA / Adenomiose"},3:{a:"ped",t:"Rastreamento Ca colorretal"},4:{a:"ped",t:"Doenças reumatológicas"},5:{a:"ped",t:"Contracepção"},6:{a:"ped",t:"Rastreamento Ca colo uterino"},7:{a:"ped",t:"Doença inflamatória intestinal"},8:{a:"ped",t:"PTI / Púrpura trombocitopênica"},9:{a:"ped",t:"Rastreamento Ca colo uterino"},10:{a:"ped",t:"Rastreamento Ca colo uterino"},11:{a:"ped",t:"Vacinação / Imunização"},12:{a:"ped",t:"Contracepção"},13:{a:"ped",t:"Rastreamento Ca colo uterino"},14:{a:"ped",t:"Encefalite / ADEM"},15:{a:"ped",t:"Redes de Atenção à Saúde"},16:{a:"ped",t:"Doença inflamatória intestinal"},17:{a:"ped",t:"Prematuridade / RN pré-termo"},18:{a:"ped",t:"Insônia / Ansiedade"},19:{a:"ped",t:"PTI / Púrpura trombocitopênica"},20:{a:"ped",t:"HAS / Hipertensão arterial"},21:{a:"preventiva",t:"Rastreamento / Sobrediagnóstico"},22:{a:"preventiva",t:"Otite média aguda"},23:{a:"preventiva",t:"Desenvolvimento neuropsicomotor"},24:{a:"preventiva",t:"Otite média aguda"},25:{a:"preventiva",t:"PTI / Púrpura trombocitopênica"},26:{a:"preventiva",t:"Sensibilidade / Especificidade / VPP-VPN"},27:{a:"preventiva",t:"Ensaio clínico randomizado"},28:{a:"preventiva",t:"Redes de Atenção à Saúde"},29:{a:"preventiva",t:"Otite média aguda"},30:{a:"preventiva",t:"Otite média aguda"},31:{a:"preventiva",t:"Otite média aguda"},32:{a:"preventiva",t:"SUA / Adenomiose"},33:{a:"preventiva",t:"Estado de mal epiléptico"},34:{a:"preventiva",t:"Pré-natal"},35:{a:"preventiva",t:"Prematuridade / RN pré-termo"},36:{a:"preventiva",t:"Reanimação neonatal"},37:{a:"preventiva",t:"Cesariana"},38:{a:"preventiva",t:"Otite média aguda"},39:{a:"preventiva",t:"ESF / Saúde da Família"},40:{a:"preventiva",t:"Redes de Atenção à Saúde"},41:{a:"cirurgia",t:"Otite média aguda"},42:{a:"cirurgia",t:"Redes de Atenção à Saúde"},43:{a:"cirurgia",t:"Sensibilidade / Especificidade / VPP-VPN"},44:{a:"cirurgia",t:"Pressão arterial pediátrica"},45:{a:"cirurgia",t:"Otite média aguda"},46:{a:"cirurgia",t:"Vacinação / Imunização"},47:{a:"cirurgia",t:"Aleitamento materno"},48:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},49:{a:"cirurgia",t:"Princípios do SUS"},50:{a:"cirurgia",t:"Criança Anos Previamente Hígida"},51:{a:"cirurgia",t:"PAC na infância"},52:{a:"cirurgia",t:"CIV / Cardiopatia congênita"},53:{a:"cirurgia",t:"Pressão arterial pediátrica"},54:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},55:{a:"cirurgia",t:"Fibrilação atrial / Flutter"},56:{a:"cirurgia",t:"Vacinação / Imunização"},57:{a:"cirurgia",t:"Reanimação Cardiopulmonar Criança Adolescente"},58:{a:"cirurgia",t:"Queimaduras"},59:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},60:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},61:{a:"go",t:"Rastreamento Ca colo uterino"},62:{a:"go",t:"ESF / Saúde da Família"},63:{a:"go",t:"Pesquisa Action Health Diabetes"},64:{a:"go",t:"Sensibilidade / Especificidade / VPP-VPN"},65:{a:"go",t:"Desenvolvimento neuropsicomotor"},66:{a:"go",t:"Rastreamento / Sobrediagnóstico"},67:{a:"go",t:"ESF / Saúde da Família"},68:{a:"go",t:"Estudo de coorte"},69:{a:"go",t:"PTI / Púrpura trombocitopênica"},70:{a:"go",t:"Otite média aguda"},71:{a:"go",t:"Ensaio clínico randomizado"},72:{a:"go",t:"ESF / Saúde da Família"},73:{a:"go",t:"Princípios do SUS"},74:{a:"go",t:"Atributos da APS"},75:{a:"go",t:"Redes de Atenção à Saúde"},76:{a:"go",t:"Princípios do SUS"},77:{a:"go",t:"Tabagismo / Cessação"},78:{a:"go",t:"Incidência / Prevalência"},79:{a:"go",t:"Atributos da APS"},80:{a:"go",t:"Redes de Atenção à Saúde"},81:{a:"clinica",t:"Ensaio clínico randomizado"},82:{a:"clinica",t:"Ensaio clínico randomizado"},83:{a:"clinica",t:"Sensibilidade / Especificidade / VPP-VPN"},84:{a:"clinica",t:"Redes de Atenção à Saúde"},85:{a:"clinica",t:"Otite média aguda"},86:{a:"clinica",t:"Otite média aguda"},87:{a:"clinica",t:"Doença inflamatória intestinal"},88:{a:"clinica",t:"PAC / Pneumonia comunitária"},89:{a:"clinica",t:"Otite média aguda"},90:{a:"clinica",t:"Otite média aguda"},91:{a:"clinica",t:"Aleitamento materno"},92:{a:"clinica",t:"Otite média aguda"},93:{a:"clinica",t:"Hérnia de hiato / Herniorrafia"},94:{a:"clinica",t:"PAC / Pneumonia comunitária"},95:{a:"clinica",t:"Princípios do SUS"},96:{a:"clinica",t:"Choque hemorrágico / Reposição volêmica"},97:{a:"clinica",t:"Redes de Atenção à Saúde"},98:{a:"clinica",t:"PAC / Pneumonia comunitária"},99:{a:"clinica",t:"Ensaio clínico randomizado"},100:{a:"clinica",t:"Redes de Atenção à Saúde"}},
"hcpa 2021":{1:{a:"ped",t:"HIV vertical / Aleitamento"},2:{a:"ped",t:"Infecções congênitas (TORCH)"},3:{a:"ped",t:"Redes de Atenção à Saúde"},4:{a:"ped",t:"Redes de Atenção à Saúde"},5:{a:"ped",t:"Aleitamento materno"},6:{a:"ped",t:"Reanimação neonatal"},7:{a:"ped",t:"Bronquiolite viral aguda"},8:{a:"ped",t:"Rastreamento Ca colo uterino"},9:{a:"ped",t:"Pré-natal"},10:{a:"ped",t:"Asma"},11:{a:"ped",t:"Pressão arterial pediátrica"},12:{a:"ped",t:"Menino Anos Trazido Consulta"},13:{a:"ped",t:"SOP / Ovários policísticos"},14:{a:"ped",t:"Redes de Atenção à Saúde"},15:{a:"ped",t:"Otite média aguda"},16:{a:"ped",t:"Redes de Atenção à Saúde"},17:{a:"ped",t:"Vacinação / Imunização"},18:{a:"ped",t:"Rastreamento Ca colo uterino"},19:{a:"ped",t:"Princípios do SUS"},20:{a:"ped",t:"Otite média aguda"},21:{a:"preventiva",t:"Rastreamento Ca colo uterino"},22:{a:"preventiva",t:"Trabalho de parto / Partograma"},23:{a:"preventiva",t:"PAC / Pneumonia comunitária"},24:{a:"preventiva",t:"Ensaio clínico randomizado"},25:{a:"preventiva",t:"Vacinação / Imunização"},26:{a:"preventiva",t:"Rastreamento Ca colo uterino"},27:{a:"preventiva",t:"ESF / Saúde da Família"},28:{a:"preventiva",t:"Otite média aguda"},29:{a:"preventiva",t:"Redes de Atenção à Saúde"},30:{a:"preventiva",t:"Otite média aguda"},31:{a:"preventiva",t:"PAC / Pneumonia comunitária"},32:{a:"preventiva",t:"Infecções congênitas (TORCH)"},33:{a:"preventiva",t:"Apresentações fetais"},34:{a:"preventiva",t:"Prematuridade / RN pré-termo"},35:{a:"preventiva",t:"Pré-natal"},36:{a:"preventiva",t:"Prematuridade / RN pré-termo"},37:{a:"preventiva",t:"HIV vertical / Aleitamento"},38:{a:"preventiva",t:"Vacinação / Imunização"},39:{a:"preventiva",t:"Redes de Atenção à Saúde"},40:{a:"preventiva",t:"Redes de Atenção à Saúde"},41:{a:"cirurgia",t:"SUA / Adenomiose"},42:{a:"cirurgia",t:"Avaliação pré-operatória / ASA"},43:{a:"cirurgia",t:"Redes de Atenção à Saúde"},44:{a:"cirurgia",t:"Redes de Atenção à Saúde"},45:{a:"cirurgia",t:"Redes de Atenção à Saúde"},46:{a:"cirurgia",t:"Redes de Atenção à Saúde"},47:{a:"cirurgia",t:"Colelitíase / Colecistectomia"},48:{a:"cirurgia",t:"Redes de Atenção à Saúde"},49:{a:"cirurgia",t:"Otite média aguda"},50:{a:"cirurgia",t:"Otite média aguda"},51:{a:"cirurgia",t:"Pressão arterial pediátrica"},52:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},53:{a:"cirurgia",t:"Feridas crônicas"},54:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},55:{a:"cirurgia",t:"Redes de Atenção à Saúde"},56:{a:"cirurgia",t:"SOP / Ovários policísticos"},57:{a:"cirurgia",t:"Otite média aguda"},58:{a:"cirurgia",t:"Otite média aguda"},59:{a:"cirurgia",t:"Redes de Atenção à Saúde"},60:{a:"cirurgia",t:"Otite média aguda"},61:{a:"go",t:"Estado de mal epiléptico"},62:{a:"go",t:"PAC / Pneumonia comunitária"},63:{a:"go",t:"Redes de Atenção à Saúde"},64:{a:"go",t:"Redes de Atenção à Saúde"},65:{a:"go",t:"Rastreamento Ca colo uterino"},66:{a:"go",t:"Otite média aguda"},67:{a:"go",t:"Otite média aguda"},68:{a:"go",t:"PAC / Pneumonia comunitária"},69:{a:"go",t:"Crescimento infantil"},70:{a:"go",t:"Dispositivos inalatórios"},71:{a:"go",t:"PTI / Púrpura trombocitopênica"},72:{a:"go",t:"Assertiva Ocorrência Coagulopatia Pósoperatório"},73:{a:"go",t:"SUA / Adenomiose"},74:{a:"go",t:"Ensaio clínico randomizado"},75:{a:"go",t:"Ensaio clínico randomizado"},76:{a:"go",t:"Otite média aguda"},77:{a:"go",t:"SOP / Ovários policísticos"},78:{a:"go",t:"PAC / Pneumonia comunitária"},79:{a:"go",t:"Redes de Atenção à Saúde"},80:{a:"go",t:"PAC / Pneumonia comunitária"},81:{a:"clinica",t:"Grande Pandemia Covid Teve"},82:{a:"clinica",t:"Razão de prevalência"},83:{a:"clinica",t:"Estudo de coorte"},84:{a:"clinica",t:"Sensibilidade / Especificidade / VPP-VPN"},85:{a:"clinica",t:"Estudo caso-controle / OR"},86:{a:"clinica",t:"Ensaio clínico randomizado"},87:{a:"clinica",t:"Princípios do SUS"},88:{a:"clinica",t:"Princípios do SUS"},89:{a:"clinica",t:"Ensaio clínico randomizado"},90:{a:"clinica",t:"Princípios do SUS"},91:{a:"clinica",t:"Financiamento do SUS"},92:{a:"clinica",t:"Princípios do SUS"},93:{a:"clinica",t:"Princípios do SUS"},94:{a:"clinica",t:"Otite média aguda"},95:{a:"clinica",t:"Redes de Atenção à Saúde"},96:{a:"clinica",t:"Redes de Atenção à Saúde"},97:{a:"clinica",t:"Otite média aguda"},98:{a:"clinica",t:"Otite média aguda"},99:{a:"clinica",t:"Vacinação / Imunização"},100:{a:"clinica",t:"PAC na infância"}},
"hcpa 2022":{1:{a:"ped",t:"Transtorno do espectro autista"},2:{a:"ped",t:"Pressão arterial pediátrica"},3:{a:"ped",t:"Reanimação neonatal"},4:{a:"ped",t:"Recémnascido Semanas Idade Gestacional"},5:{a:"ped",t:"ITU na infância"},6:{a:"ped",t:"HIV vertical / Aleitamento"},7:{a:"ped",t:"PAC na infância"},8:{a:"ped",t:"Pressão arterial pediátrica"},9:{a:"ped",t:"Pressão arterial pediátrica"},10:{a:"ped",t:"Bronquiolite viral aguda"},11:{a:"ped",t:"Transtorno do espectro autista"},12:{a:"ped",t:"Contracepção"},13:{a:"ped",t:"Rastreamento Ca colo uterino"},14:{a:"ped",t:"Contracepção"},15:{a:"ped",t:"PTI / Púrpura trombocitopênica"},16:{a:"ped",t:"Vacinação / Imunização"},17:{a:"ped",t:"Otite média aguda"},18:{a:"ped",t:"Assertiva Febre Criança Modo"},19:{a:"ped",t:"Choque hemorrágico / Reposição volêmica"},20:{a:"ped",t:"RCP / Suporte de vida pediátrico"},21:{a:"preventiva",t:"Contracepção"},22:{a:"preventiva",t:"PTI / Púrpura trombocitopênica"},23:{a:"preventiva",t:"Otite média aguda"},24:{a:"preventiva",t:"Otite média aguda"},25:{a:"preventiva",t:"PTI / Púrpura trombocitopênica"},26:{a:"preventiva",t:"Otite média aguda"},27:{a:"preventiva",t:"Alcoolismo / Rastreamento"},28:{a:"preventiva",t:"Otite média aguda"},29:{a:"preventiva",t:"Otite média aguda"},30:{a:"preventiva",t:"Otite média aguda"},31:{a:"preventiva",t:"Redes de Atenção à Saúde"},32:{a:"preventiva",t:"Reanimação neonatal"},33:{a:"preventiva",t:"Prematuridade / RN pré-termo"},34:{a:"preventiva",t:"Prematuridade / RN pré-termo"},35:{a:"preventiva",t:"Redes de Atenção à Saúde"},36:{a:"preventiva",t:"Estado de mal epiléptico"},37:{a:"preventiva",t:"Estado de mal epiléptico"},38:{a:"preventiva",t:"Pré-natal"},39:{a:"preventiva",t:"Toxoplasmose na gestação"},40:{a:"preventiva",t:"Pré-natal"},41:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},42:{a:"cirurgia",t:"Otite média aguda"},43:{a:"cirurgia",t:"Anestesia / Sedação"},44:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},45:{a:"cirurgia",t:"Contracepção"},46:{a:"cirurgia",t:"Redes de Atenção à Saúde"},47:{a:"cirurgia",t:"Choque hemorrágico / Reposição volêmica"},48:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},49:{a:"cirurgia",t:"Otite média aguda"},50:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},51:{a:"cirurgia",t:"Otite média aguda"},52:{a:"cirurgia",t:"Assertiva Tratamento Cirúrgico Câncer"},53:{a:"cirurgia",t:"Cirurgia bariátrica / Obesidade"},54:{a:"cirurgia",t:"Princípios do SUS"},55:{a:"cirurgia",t:"Redes de Atenção à Saúde"},56:{a:"cirurgia",t:"Retalhos / Cirurgia plástica"},57:{a:"cirurgia",t:"Otite média aguda"},58:{a:"cirurgia",t:"Trauma torácico / Pneumotórax"},59:{a:"cirurgia",t:"ESF / Saúde da Família"},60:{a:"cirurgia",t:"Otite média aguda"},61:{a:"go",t:"PAC / Pneumonia comunitária"},62:{a:"go",t:"Redes de Atenção à Saúde"},63:{a:"go",t:"Atributos da APS"},64:{a:"go",t:"Princípios do SUS"},65:{a:"go",t:"Otite média aguda"},66:{a:"go",t:"Rastreamento Ca colo uterino"},67:{a:"go",t:"Fibrilação atrial / Flutter"},68:{a:"go",t:"Redes de Atenção à Saúde"},69:{a:"go",t:"PAC / Pneumonia comunitária"},70:{a:"go",t:"Rastreamento Ca colo uterino"},71:{a:"go",t:"Rastreamento Ca colo uterino"},72:{a:"go",t:"Otite média aguda"},73:{a:"go",t:"Rastreamento Ca colo uterino"},74:{a:"go",t:"Metformina / DRC"},75:{a:"go",t:"Redes de Atenção à Saúde"},76:{a:"go",t:"Otite média aguda"},77:{a:"go",t:"Dispositivos inalatórios"},78:{a:"go",t:"Otite média aguda"},79:{a:"go",t:"Redes de Atenção à Saúde"},80:{a:"go",t:"Rastreamento Ca colo uterino"},81:{a:"clinica",t:"PAC / Pneumonia comunitária"},82:{a:"clinica",t:"Redes de Atenção à Saúde"},83:{a:"clinica",t:"Estudo transversal / Prevalência"},84:{a:"clinica",t:"Reanimação neonatal"},85:{a:"clinica",t:"COVID-19 pediátrico"},86:{a:"clinica",t:"Princípios do SUS"},87:{a:"clinica",t:"Princípios do SUS"},88:{a:"clinica",t:"Reanimação neonatal"},89:{a:"clinica",t:"Princípios do SUS"},90:{a:"clinica",t:"Princípios do SUS"},91:{a:"clinica",t:"ESF / Saúde da Família"},92:{a:"clinica",t:"Otite média aguda"},93:{a:"clinica",t:"HIV vertical / Aleitamento"},94:{a:"clinica",t:"Sensibilidade / Especificidade / VPP-VPN"},95:{a:"clinica",t:"Atributos da APS"},96:{a:"clinica",t:"Vacinação / Imunização"},97:{a:"clinica",t:"Atributos da APS"},98:{a:"clinica",t:"Saúde do trabalhador"},99:{a:"clinica",t:"Alcoolismo / Rastreamento"},100:{a:"clinica",t:"Ética médica"}},
"hcpa 2023":{1:{a:"ped",t:"Prematuridade / RN pré-termo"},2:{a:"ped",t:"Prematuridade / RN pré-termo"},3:{a:"ped",t:"Toxoplasmose na gestação"},4:{a:"ped",t:"Pré-natal"},5:{a:"ped",t:"Pré-natal"},6:{a:"ped",t:"Pressão arterial pediátrica"},7:{a:"ped",t:"PAC na infância"},8:{a:"ped",t:"Vacinação / Imunização"},9:{a:"ped",t:"Prematuridade / RN pré-termo"},10:{a:"ped",t:"Aleitamento materno"},11:{a:"ped",t:"Bronquiolite viral aguda"},12:{a:"ped",t:"Desenvolvimento neuropsicomotor"},13:{a:"ped",t:"Otite média aguda"},14:{a:"ped",t:"Pressão arterial pediátrica"},15:{a:"ped",t:"Pressão arterial pediátrica"},16:{a:"ped",t:"PAC na infância"},17:{a:"ped",t:"Otite média aguda"},18:{a:"ped",t:"Vacinação / Imunização"},19:{a:"ped",t:"Otite média aguda"},20:{a:"ped",t:"Redes de Atenção à Saúde"},21:{a:"preventiva",t:"Otite média aguda"},22:{a:"preventiva",t:"ESF / Saúde da Família"},23:{a:"preventiva",t:"Câncer de mama"},24:{a:"preventiva",t:"Estado de mal epiléptico"},25:{a:"preventiva",t:"Redes de Atenção à Saúde"},26:{a:"preventiva",t:"Hiperprolactinemia"},27:{a:"preventiva",t:"Rastreamento / Sobrediagnóstico"},28:{a:"preventiva",t:"Redes de Atenção à Saúde"},29:{a:"preventiva",t:"Vacinação / Imunização"},30:{a:"preventiva",t:"Rastreamento Ca colo uterino"},31:{a:"preventiva",t:"Regra Ngele Pode Utilizada"},32:{a:"preventiva",t:"Vacinação / Imunização"},33:{a:"preventiva",t:"Contracepção"},34:{a:"preventiva",t:"Redes de Atenção à Saúde"},35:{a:"preventiva",t:"Pré-natal"},36:{a:"preventiva",t:"Estado de mal epiléptico"},37:{a:"preventiva",t:"Pré-natal"},38:{a:"preventiva",t:"Redes de Atenção à Saúde"},39:{a:"preventiva",t:"ESF / Saúde da Família"},40:{a:"preventiva",t:"Feridas crônicas"},41:{a:"cirurgia",t:"Anestesia / Sedação"},42:{a:"cirurgia",t:"Avaliação pré-operatória / ASA"},43:{a:"cirurgia",t:"Princípios do SUS"},44:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},45:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},46:{a:"cirurgia",t:"Otite média aguda"},47:{a:"cirurgia",t:"PTI / Púrpura trombocitopênica"},48:{a:"cirurgia",t:"Redes de Atenção à Saúde"},49:{a:"cirurgia",t:"Redes de Atenção à Saúde"},50:{a:"cirurgia",t:"Redes de Atenção à Saúde"},51:{a:"cirurgia",t:"Atributos da APS"},52:{a:"cirurgia",t:"Ensaio clínico randomizado"},53:{a:"cirurgia",t:"Redes de Atenção à Saúde"},54:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},55:{a:"cirurgia",t:"Otite média aguda"},56:{a:"cirurgia",t:"Redes de Atenção à Saúde"},57:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},58:{a:"cirurgia",t:"Redes de Atenção à Saúde"},59:{a:"cirurgia",t:"ATB profilaxia cirúrgica"},60:{a:"cirurgia",t:"Otite média aguda"},61:{a:"go",t:"PAC / Pneumonia comunitária"},62:{a:"go",t:"Redes de Atenção à Saúde"},63:{a:"go",t:"Rastreamento Ca colo uterino"},64:{a:"go",t:"Crescimento infantil"},65:{a:"go",t:"Redes de Atenção à Saúde"},66:{a:"go",t:"Ensaio clínico randomizado"},67:{a:"go",t:"Incidência / Prevalência"},68:{a:"go",t:"Fibrilação atrial / Flutter"},69:{a:"go",t:"PAC / Pneumonia comunitária"},70:{a:"go",t:"PAC / Pneumonia comunitária"},71:{a:"go",t:"Rastreamento Ca colo uterino"},72:{a:"go",t:"ESF / Saúde da Família"},73:{a:"go",t:"Assertiva Manejo Preventivo Litíase"},74:{a:"go",t:"Redes de Atenção à Saúde"},75:{a:"go",t:"Princípios do SUS"},76:{a:"go",t:"Otite média aguda"},77:{a:"go",t:"Lombalgia"},78:{a:"go",t:"Otite média aguda"},79:{a:"go",t:"Contracepção"},80:{a:"go",t:"Lombalgia"},81:{a:"clinica",t:"ESF / Saúde da Família"},82:{a:"clinica",t:"Estudo caso-controle / OR"},83:{a:"clinica",t:"Estudo transversal / Prevalência"},84:{a:"clinica",t:"Níveis de evidência"},85:{a:"clinica",t:"PAC / Pneumonia comunitária"},86:{a:"clinica",t:"Crescimento infantil"},87:{a:"clinica",t:"Desenvolvimento neuropsicomotor"},88:{a:"clinica",t:"Rastreamento Ca colo uterino"},89:{a:"clinica",t:"Vacinação / Imunização"},90:{a:"clinica",t:"Rastreamento Ca colo uterino"},91:{a:"clinica",t:"Otite média aguda"},92:{a:"clinica",t:"Tabagismo / Cessação"},93:{a:"clinica",t:"Diarreia aguda / Gastroenterite"},94:{a:"clinica",t:"Estado de mal epiléptico"},95:{a:"clinica",t:"PAC / Pneumonia comunitária"},96:{a:"clinica",t:"Transtorno bipolar / Lítio"},97:{a:"clinica",t:"Rastreamento Ca colo uterino"},98:{a:"clinica",t:"Escroto agudo / Torção testicular"},99:{a:"clinica",t:"Otite média aguda"},100:{a:"clinica",t:"Vacinação / Imunização"}},
"amp 2024":{1:{a:"ped",t:"Escroto agudo / Torção testicular"},2:{a:"ped",t:"Otite média aguda"},3:{a:"ped",t:"Pressão arterial pediátrica"},4:{a:"ped",t:"Redes de Atenção à Saúde"},5:{a:"ped",t:"PAC / Pneumonia comunitária"},6:{a:"ped",t:"Otite média aguda"},7:{a:"ped",t:"Estado de mal epiléptico"},8:{a:"ped",t:"PAC na infância"},9:{a:"ped",t:"Transtorno do espectro autista"},10:{a:"ped",t:"Anafilaxia pediátrica"},11:{a:"ped",t:"Otite média aguda"},12:{a:"ped",t:"Estado de mal epiléptico"},13:{a:"ped",t:"PTI / Púrpura trombocitopênica"},14:{a:"ped",t:"Queimaduras na infância"},15:{a:"ped",t:"Asma / Broncoespasmo infantil"},16:{a:"ped",t:"SUA / Adenomiose"},17:{a:"ped",t:"Otite média aguda"},18:{a:"ped",t:"CIV / Cardiopatia congênita"},19:{a:"ped",t:"Redes de Atenção à Saúde"},20:{a:"ped",t:"Distúrbios do sono infantil"},21:{a:"go",t:"Aleitamento materno"},22:{a:"go",t:"Hipotireoidismo"},23:{a:"go",t:"Redes de Atenção à Saúde"},24:{a:"go",t:"Desenvolvimento neuropsicomotor"},25:{a:"go",t:"ITU / Piúria"},26:{a:"go",t:"Crescimento infantil"},27:{a:"go",t:"Redes de Atenção à Saúde"},28:{a:"go",t:"Redes de Atenção à Saúde"},29:{a:"go",t:"Rastreamento / Sobrediagnóstico"},30:{a:"go",t:"Otite média aguda"},31:{a:"go",t:"Fórcipe / Parto instrumentado"},32:{a:"go",t:"Reanimação neonatal"},33:{a:"go",t:"Transtorno do espectro autista"},34:{a:"go",t:"Desenvolvimento neuropsicomotor"},35:{a:"go",t:"Hiperprolactinemia"},36:{a:"go",t:"Atributos da APS"},37:{a:"go",t:"Redes de Atenção à Saúde"},38:{a:"go",t:"Redes de Atenção à Saúde"},39:{a:"go",t:"Redes de Atenção à Saúde"},40:{a:"cirurgia",t:"Reanimação neonatal"},41:{a:"cirurgia",t:"ESF / Saúde da Família"},42:{a:"cirurgia",t:"Anestesia / Sedação"},43:{a:"cirurgia",t:"Redes de Atenção à Saúde"},44:{a:"cirurgia",t:"Ensaio clínico randomizado"},45:{a:"cirurgia",t:"Ética médica"},46:{a:"cirurgia",t:"Redes de Atenção à Saúde"},47:{a:"cirurgia",t:"Ensaio clínico randomizado"},48:{a:"cirurgia",t:"Alcoolismo / Rastreamento"},49:{a:"cirurgia",t:"Redes de Atenção à Saúde"},50:{a:"cirurgia",t:"Redes de Atenção à Saúde"},51:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},52:{a:"cirurgia",t:"Otite média aguda"},53:{a:"cirurgia",t:"Otite média aguda"},54:{a:"cirurgia",t:"Cisto biliar / Caroli"},55:{a:"cirurgia",t:"Colelitíase / Colecistectomia"},56:{a:"cirurgia",t:"Cirurgia bariátrica / Obesidade"},57:{a:"cirurgia",t:"Otite média aguda"},58:{a:"cirurgia",t:"Otite média aguda"},59:{a:"cirurgia",t:"Tabagismo / Cessação"},60:{a:"cirurgia",t:"PTI / Púrpura trombocitopênica"},61:{a:"clinica",t:"Contracepção"},62:{a:"clinica",t:"Alcoolismo / Rastreamento"},63:{a:"clinica",t:"Redes de Atenção à Saúde"},64:{a:"clinica",t:"PAC / Pneumonia comunitária"},65:{a:"clinica",t:"HIV vertical / Aleitamento"},66:{a:"clinica",t:"Redes de Atenção à Saúde"},67:{a:"clinica",t:"Otite média aguda"},68:{a:"clinica",t:"Rastreamento Ca colo uterino"},69:{a:"clinica",t:"Contracepção"},70:{a:"clinica",t:"Redes de Atenção à Saúde"},71:{a:"clinica",t:"Hemorragia digestiva"},72:{a:"clinica",t:"Disfagia / Acalasia"},73:{a:"clinica",t:"Rastreamento Ca colo uterino"},74:{a:"clinica",t:"Otite média aguda"},75:{a:"clinica",t:"Rastreamento Ca colo uterino"},76:{a:"clinica",t:"Rastreamento Ca colo uterino"},77:{a:"clinica",t:"Pericardite"},78:{a:"clinica",t:"Contracepção"},79:{a:"clinica",t:"Otite média aguda"},80:{a:"clinica",t:"PAC / Pneumonia comunitária"},81:{a:"preventiva",t:"PAC / Pneumonia comunitária"},82:{a:"preventiva",t:"Rastreamento / Sobrediagnóstico"},83:{a:"preventiva",t:"Sensibilidade / Especificidade / VPP-VPN"},84:{a:"preventiva",t:"Atributos da APS"},85:{a:"preventiva",t:"Registro clínico / SOAP"},86:{a:"preventiva",t:"Atributos da APS"},87:{a:"preventiva",t:"Otite média aguda"},88:{a:"preventiva",t:"Rastreamento Ca colo uterino"},89:{a:"preventiva",t:"Otite média aguda"},90:{a:"preventiva",t:"SUA / Adenomiose"},91:{a:"preventiva",t:"ESF / Saúde da Família"},92:{a:"preventiva",t:"PTI / Púrpura trombocitopênica"},93:{a:"preventiva",t:"PTI / Púrpura trombocitopênica"},94:{a:"preventiva",t:"Redes de Atenção à Saúde"},95:{a:"preventiva",t:"Reanimação neonatal"},96:{a:"preventiva",t:"Crescimento infantil"},97:{a:"preventiva",t:"Vacinação / Imunização"},98:{a:"preventiva",t:"Princípios do SUS"},99:{a:"preventiva",t:"Redes de Atenção à Saúde"},100:{a:"preventiva",t:"História natural da doença"}},
"amp 2025":{1:{a:"ped",t:"Bronquiolite viral aguda"},2:{a:"ped",t:"ITU na infância"},3:{a:"ped",t:"Ingestão de cáusticos"},4:{a:"ped",t:"Otite média aguda"},5:{a:"ped",t:"Fibrose cística"},6:{a:"ped",t:"Asma / Broncoespasmo infantil"},7:{a:"ped",t:"Vacinação / Imunização"},8:{a:"ped",t:"PAC na infância"},9:{a:"ped",t:"Otite média aguda"},10:{a:"ped",t:"Apendicite na infância"},11:{a:"ped",t:"Epifisiólise / SCFE"},12:{a:"ped",t:"Diarreia aguda / Gastroenterite"},13:{a:"ped",t:"Otite média aguda"},14:{a:"ped",t:"Otite média aguda"},15:{a:"ped",t:"Aleitamento materno"},16:{a:"ped",t:"Ética médica"},17:{a:"ped",t:"Vacinação / Imunização"},18:{a:"ped",t:"Estado de mal epiléptico"},19:{a:"ped",t:"Pressão arterial pediátrica"},20:{a:"ped",t:"Otite média aguda"},21:{a:"go",t:"Pressão arterial pediátrica"},22:{a:"go",t:"Vacinação / Imunização"},23:{a:"go",t:"Reanimação neonatal"},24:{a:"go",t:"Otite média aguda"},25:{a:"go",t:"Redes de Atenção à Saúde"},26:{a:"go",t:"Otite média aguda"},27:{a:"go",t:"Otite média aguda"},28:{a:"go",t:"Otite média aguda"},29:{a:"go",t:"PTI / Púrpura trombocitopênica"},30:{a:"go",t:"Redes de Atenção à Saúde"},31:{a:"go",t:"Redes de Atenção à Saúde"},32:{a:"go",t:"Otite média aguda"},33:{a:"go",t:"Gestação ectópica"},34:{a:"go",t:"Otite média aguda"},35:{a:"go",t:"Crescimento infantil"},36:{a:"go",t:"Redes de Atenção à Saúde"},37:{a:"go",t:"Princípios do SUS"},38:{a:"go",t:"Reanimação neonatal"},39:{a:"go",t:"Redes de Atenção à Saúde"},40:{a:"go",t:"Vulvovaginites"},41:{a:"cirurgia",t:"ITU / Piúria"},42:{a:"cirurgia",t:"Otite média aguda"},43:{a:"cirurgia",t:"Otite média aguda"},44:{a:"cirurgia",t:"Contracepção"},45:{a:"cirurgia",t:"ESF / Saúde da Família"},46:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},47:{a:"cirurgia",t:"Redes de Atenção à Saúde"},48:{a:"cirurgia",t:"Otite média aguda"},49:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},50:{a:"cirurgia",t:"Ensaio clínico randomizado"},51:{a:"cirurgia",t:"Prevenção quaternária"},52:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},53:{a:"cirurgia",t:"Fibrilação atrial / Flutter"},54:{a:"preventiva",t:"Medidas Saúde Coletiva Servem"},55:{a:"cirurgia",t:"Estudo caso-controle / OR"},56:{a:"cirurgia",t:"Estudo de coorte"},57:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},58:{a:"cirurgia",t:"Princípios do SUS"},59:{a:"cirurgia",t:"Princípios do SUS"},60:{a:"cirurgia",t:"Redes de Atenção à Saúde"},61:{a:"clinica",t:"Princípios do SUS"},62:{a:"clinica",t:"Contracepção"},63:{a:"clinica",t:"PAC / Pneumonia comunitária"},64:{a:"clinica",t:"SUA / Adenomiose"},65:{a:"clinica",t:"Otite média aguda"},66:{a:"clinica",t:"ESF / Saúde da Família"},67:{a:"clinica",t:"Leptospirose"},68:{a:"clinica",t:"Dispositivos inalatórios"},69:{a:"clinica",t:"Redes de Atenção à Saúde"},70:{a:"clinica",t:"Alcoolismo / Rastreamento"},71:{a:"clinica",t:"Fibrilação atrial / Flutter"},72:{a:"clinica",t:"Incidência / Prevalência"},73:{a:"clinica",t:"Fibrilação atrial / Flutter"},74:{a:"clinica",t:"PTI / Púrpura trombocitopênica"},75:{a:"clinica",t:"CIV / Cardiopatia congênita"},76:{a:"clinica",t:"Climatério / Menopausa"},77:{a:"clinica",t:"Rastreamento Ca colo uterino"},78:{a:"clinica",t:"PAC / Pneumonia comunitária"},79:{a:"clinica",t:"Fibrilação atrial / Flutter"},80:{a:"clinica",t:"Otite média aguda"},81:{a:"preventiva",t:"Rastreamento Ca colo uterino"},82:{a:"preventiva",t:"TEV / TVP / TEP"},83:{a:"preventiva",t:"Rastreamento Ca colo uterino"},84:{a:"cirurgia",t:"Desenvolvimento neuropsicomotor"},85:{a:"preventiva",t:"Redes de Atenção à Saúde"},86:{a:"preventiva",t:"Redes de Atenção à Saúde"},87:{a:"preventiva",t:"Redes de Atenção à Saúde"},88:{a:"preventiva",t:"Redes de Atenção à Saúde"},89:{a:"preventiva",t:"Redes de Atenção à Saúde"},90:{a:"preventiva",t:"Redes de Atenção à Saúde"},91:{a:"preventiva",t:"Ética médica"},92:{a:"preventiva",t:"Ca pele não melanoma / CEC"},93:{a:"preventiva",t:"CIV / Cardiopatia congênita"},94:{a:"preventiva",t:"Incidência / Prevalência"},95:{a:"preventiva",t:"Otite média aguda"},96:{a:"preventiva",t:"Otite média aguda"},97:{a:"preventiva",t:"PAC / Pneumonia comunitária"},98:{a:"preventiva",t:"Otite média aguda"},99:{a:"preventiva",t:"Hipotireoidismo"},100:{a:"preventiva",t:"Redes de Atenção à Saúde"}},
"amp 2026":{1:{a:"ped",t:"Otite média aguda"},2:{a:"ped",t:"Otite média aguda"},3:{a:"ped",t:"PAC / Pneumonia comunitária"},4:{a:"ped",t:"Intussuscepção intestinal"},5:{a:"ped",t:"Princípios do SUS"},6:{a:"ped",t:"Crescimento infantil"},7:{a:"ped",t:"Otite média aguda"},8:{a:"ped",t:"Rastreamento Ca colo uterino"},9:{a:"ped",t:"Apendicite na infância"},10:{a:"ped",t:"Bronquiolite viral aguda"},11:{a:"ped",t:"Redes de Atenção à Saúde"},12:{a:"ped",t:"Rastreamento Ca colo uterino"},13:{a:"ped",t:"Desenvolvimento neuropsicomotor"},14:{a:"ped",t:"Princípios do SUS"},15:{a:"ped",t:"Redes de Atenção à Saúde"},16:{a:"ped",t:"Aleitamento materno"},17:{a:"ped",t:"Síndrome coronariana aguda"},18:{a:"ped",t:"Conjuntivite / Sd. Parinaud"},19:{a:"ped",t:"ITU na infância"},20:{a:"ped",t:"Desenvolvimento neuropsicomotor"},21:{a:"go",t:"Crescimento infantil"},22:{a:"go",t:"Hipoglicemia neonatal"},23:{a:"go",t:"Reanimação neonatal"},24:{a:"go",t:"Doença inflamatória intestinal"},25:{a:"go",t:"Vacinação / Imunização"},26:{a:"go",t:"Reanimação neonatal"},27:{a:"go",t:"Redes de Atenção à Saúde"},28:{a:"go",t:"Feridas crônicas"},29:{a:"go",t:"Reanimação neonatal"},30:{a:"go",t:"Aleitamento materno"},31:{a:"go",t:"Redes de Atenção à Saúde"},32:{a:"go",t:"Otite média aguda"},33:{a:"go",t:"Otite média aguda"},34:{a:"go",t:"Rastreamento Ca colo uterino"},35:{a:"go",t:"Otite média aguda"},36:{a:"go",t:"Otite média aguda"},37:{a:"go",t:"Redes de Atenção à Saúde"},38:{a:"go",t:"Otite média aguda"},39:{a:"go",t:"Rastreamento Ca colo uterino"},40:{a:"go",t:"Redes de Atenção à Saúde"},41:{a:"cirurgia",t:"Fibrilação atrial / Flutter"},42:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},43:{a:"cirurgia",t:"Contracepção"},44:{a:"cirurgia",t:"Pneumonia associada a VM"},45:{a:"cirurgia",t:"Redes de Atenção à Saúde"},46:{a:"cirurgia",t:"Redes de Atenção à Saúde"},47:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},48:{a:"cirurgia",t:"Otite média aguda"},49:{a:"cirurgia",t:"ESF / Saúde da Família"},50:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},51:{a:"cirurgia",t:"Otite média aguda"},52:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},53:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},54:{a:"cirurgia",t:"Redes de Atenção à Saúde"},55:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},56:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},57:{a:"cirurgia",t:"Otite média aguda"},58:{a:"cirurgia",t:"Otite média aguda"},59:{a:"cirurgia",t:"Redes de Atenção à Saúde"},60:{a:"cirurgia",t:"Otite média aguda"},61:{a:"clinica",t:"Redes de Atenção à Saúde"},62:{a:"clinica",t:"PAC / Pneumonia comunitária"},63:{a:"clinica",t:"Otite média aguda"},64:{a:"cirurgia",t:"Hipoglicemia neonatal"},65:{a:"clinica",t:"Redes de Atenção à Saúde"},66:{a:"clinica",t:"PTI / Púrpura trombocitopênica"},67:{a:"clinica",t:"Redes de Atenção à Saúde"},68:{a:"clinica",t:"Otite média aguda"},69:{a:"clinica",t:"Redes de Atenção à Saúde"},70:{a:"clinica",t:"Rastreamento Ca colo uterino"},71:{a:"clinica",t:"Colelitíase / Colecistectomia"},72:{a:"clinica",t:"Ca pele não melanoma / CEC"},73:{a:"clinica",t:"Redes de Atenção à Saúde"},74:{a:"clinica",t:"Tabagismo / Cessação"},75:{a:"clinica",t:"Rastreamento Ca colo uterino"},76:{a:"clinica",t:"Rastreamento Ca colo uterino"},77:{a:"clinica",t:"Redes de Atenção à Saúde"},78:{a:"clinica",t:"Anestesia / Sedação"},79:{a:"clinica",t:"ATLS / Politrauma"},80:{a:"clinica",t:"Rastreamento Ca colo uterino"},81:{a:"preventiva",t:"Respeito Modelos Proteção Social"},82:{a:"preventiva",t:"Crescimento infantil"},83:{a:"preventiva",t:"Princípios do SUS"},84:{a:"preventiva",t:"CIV / Cardiopatia congênita"},85:{a:"preventiva",t:"Princípios do SUS"},86:{a:"preventiva",t:"Otite média aguda"},87:{a:"preventiva",t:"Otite média aguda"},88:{a:"preventiva",t:"Tabagismo / Cessação"},89:{a:"preventiva",t:"Asma"},90:{a:"preventiva",t:"ESF / Saúde da Família"},91:{a:"preventiva",t:"Otite média aguda"},92:{a:"preventiva",t:"Rastreamento / Sobrediagnóstico"},93:{a:"preventiva",t:"Rastreamento / Sobrediagnóstico"},94:{a:"preventiva",t:"Otite média aguda"},95:{a:"preventiva",t:"PAC / Pneumonia comunitária"},96:{a:"preventiva",t:"PAC / Pneumonia comunitária"},97:{a:"preventiva",t:"Registro clínico / SOAP"},98:{a:"preventiva",t:"Redes de Atenção à Saúde"},99:{a:"preventiva",t:"CIV / Cardiopatia congênita"},100:{a:"preventiva",t:"Fibrilação atrial / Flutter"}},
"iamspe 2023":{1:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},2:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},3:{a:"cirurgia",t:"Transtorno do espectro autista"},4:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},5:{a:"cirurgia",t:"Redes de Atenção à Saúde"},6:{a:"cirurgia",t:"Otite média aguda"},7:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},8:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},9:{a:"cirurgia",t:"Hipotireoidismo"},10:{a:"cirurgia",t:"SOP / Ovários policísticos"},11:{a:"cirurgia",t:"ITU / Piúria"},12:{a:"cirurgia",t:"Fibrilação atrial / Flutter"},13:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},14:{a:"cirurgia",t:"PTI / Púrpura trombocitopênica"},15:{a:"cirurgia",t:"Lesão renal aguda"},16:{a:"cirurgia",t:"Hepatites virais"},17:{a:"cirurgia",t:"Apendicite / Dor abdominal"},18:{a:"cirurgia",t:"Fratura Enforcado Consiste Fratura"},19:{a:"cirurgia",t:"Redes de Atenção à Saúde"},20:{a:"cirurgia",t:"Otite média aguda"},21:{a:"cirurgia",t:"Hérnia de hiato / Herniorrafia"},22:{a:"clinica",t:"Redes de Atenção à Saúde"},23:{a:"clinica",t:"Fibrilação atrial / Flutter"},24:{a:"clinica",t:"Asma"},25:{a:"cirurgia",t:"Apendicite / Dor abdominal"},26:{a:"clinica",t:"Rastreamento Ca colo uterino"},27:{a:"clinica",t:"Rastreamento Ca colo uterino"},28:{a:"clinica",t:"Contracepção"},29:{a:"clinica",t:"Otite média aguda"},30:{a:"clinica",t:"PAC / Pneumonia comunitária"},31:{a:"clinica",t:"Otite média aguda"},32:{a:"clinica",t:"Otite média aguda"},33:{a:"clinica",t:"Desenvolvimento neuropsicomotor"},34:{a:"clinica",t:"Ensaio clínico randomizado"},35:{a:"clinica",t:"Crescimento infantil"},36:{a:"clinica",t:"Reanimação neonatal"},37:{a:"clinica",t:"Reanimação neonatal"},38:{a:"clinica",t:"Icterícia neonatal"},39:{a:"clinica",t:"Vacinação / Imunização"},40:{a:"clinica",t:"Contracepção"},41:{a:"go",t:"Redes de Atenção à Saúde"},42:{a:"go",t:"Taquicardia ventricular / ECG"},43:{a:"go",t:"Asma"},44:{a:"go",t:"Redes de Atenção à Saúde"},45:{a:"go",t:"Rastreamento Ca colo uterino"},46:{a:"go",t:"Redes de Atenção à Saúde"},47:{a:"go",t:"Triagem neonatal"},48:{a:"go",t:"Contracepção"},49:{a:"go",t:"Reanimação neonatal"},50:{a:"go",t:"Redes de Atenção à Saúde"},51:{a:"go",t:"Contracepção"},52:{a:"go",t:"Otite média aguda"},53:{a:"go",t:"Otite média aguda"},54:{a:"go",t:"Rastreamento Ca colo uterino"},55:{a:"go",t:"Otite média aguda"},56:{a:"go",t:"Otite média aguda"},57:{a:"go",t:"Otite média aguda"},58:{a:"go",t:"Doença inflamatória intestinal"},59:{a:"go",t:"Rastreamento Ca colo uterino"},60:{a:"go",t:"Prematuridade / RN pré-termo"},61:{a:"ped",t:"SUA / Adenomiose"},62:{a:"ped",t:"Cesariana"},63:{a:"ped",t:"Redes de Atenção à Saúde"},64:{a:"ped",t:"Pré-eclâmpsia / DHEG"},65:{a:"ped",t:"Declaração de óbito"},66:{a:"ped",t:"Ensaio clínico randomizado"},67:{a:"ped",t:"ITU na infância"},68:{a:"ped",t:"Rastreamento Ca colo uterino"},69:{a:"ped",t:"Neoplasia pulmonar"},70:{a:"ped",t:"Vacinação / Imunização"},71:{a:"ped",t:"Rastreamento / Sobrediagnóstico"},72:{a:"ped",t:"Otite média aguda"},73:{a:"ped",t:"Sensibilidade / Especificidade / VPP-VPN"},74:{a:"ped",t:"Prevenção quaternária"},75:{a:"ped",t:"Sensibilidade / Especificidade / VPP-VPN"},76:{a:"ped",t:"Otite média aguda"},77:{a:"ped",t:"Incidência / Prevalência"},78:{a:"ped",t:"Fibrilação atrial / Flutter"},79:{a:"ped",t:"Saúde do trabalhador"},80:{a:"ped",t:"Redes de Atenção à Saúde"}},
"iamspe 2024":{1:{a:"cirurgia",t:"Avaliação pré-operatória / ASA"},2:{a:"cirurgia",t:"Otite média aguda"},3:{a:"cirurgia",t:"Incidência / Prevalência"},4:{a:"cirurgia",t:"Cirurgia bariátrica / Obesidade"},5:{a:"cirurgia",t:"Obstrução intestinal"},6:{a:"cirurgia",t:"Delirium"},7:{a:"cirurgia",t:"PTI / Púrpura trombocitopênica"},8:{a:"cirurgia",t:"Redes de Atenção à Saúde"},9:{a:"cirurgia",t:"Otite média aguda"},10:{a:"cirurgia",t:"Ca pele não melanoma / CEC"},11:{a:"cirurgia",t:"Otite média aguda"},12:{a:"cirurgia",t:"ESF / Saúde da Família"},13:{a:"cirurgia",t:"Redes de Atenção à Saúde"},14:{a:"cirurgia",t:"Sensibilidade / Especificidade / VPP-VPN"},15:{a:"cirurgia",t:"Otite média aguda"},16:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},17:{a:"cirurgia",t:"Taquicardia ventricular / ECG"},18:{a:"cirurgia",t:"HIV vertical / Aleitamento"},19:{a:"cirurgia",t:"Otite média aguda"},20:{a:"cirurgia",t:"Hipercalemia"},21:{a:"clinica",t:"Insônia / Ansiedade"},22:{a:"clinica",t:"Otite média aguda"},23:{a:"clinica",t:"PAC na infância"},24:{a:"clinica",t:"Úlcera péptica"},25:{a:"clinica",t:"ITU / Piúria"},26:{a:"clinica",t:"Desenvolvimento neuropsicomotor"},27:{a:"clinica",t:"SUA / Adenomiose"},28:{a:"clinica",t:"Otite média aguda"},29:{a:"clinica",t:"Otite média aguda"},30:{a:"clinica",t:"Otite média aguda"},31:{a:"clinica",t:"Dispositivos inalatórios"},32:{a:"clinica",t:"PAC / Pneumonia comunitária"},33:{a:"clinica",t:"Redes de Atenção à Saúde"},34:{a:"clinica",t:"Rastreamento Ca colo uterino"},35:{a:"clinica",t:"SUA / Adenomiose"},36:{a:"clinica",t:"Redes de Atenção à Saúde"},37:{a:"clinica",t:"Ensaio clínico randomizado"},38:{a:"clinica",t:"SOP / Ovários policísticos"},39:{a:"clinica",t:"SUA / Adenomiose"},40:{a:"go",t:"Otite média aguda"},41:{a:"go",t:"Otite média aguda"},42:{a:"go",t:"Otite média aguda"},43:{a:"go",t:"Redes de Atenção à Saúde"},44:{a:"go",t:"Redes de Atenção à Saúde"},45:{a:"go",t:"PAC / Pneumonia comunitária"},46:{a:"go",t:"PTI / Púrpura trombocitopênica"},47:{a:"go",t:"Desenvolvimento neuropsicomotor"},48:{a:"go",t:"Redes de Atenção à Saúde"},49:{a:"go",t:"Asma"},50:{a:"go",t:"ITU / Piúria"},51:{a:"go",t:"Rastreamento Ca colo uterino"},52:{a:"go",t:"Sensibilidade / Especificidade / VPP-VPN"},53:{a:"go",t:"Reanimação neonatal"},54:{a:"go",t:"Prematuridade / RN pré-termo"},55:{a:"go",t:"Rastreamento Ca colo uterino"},56:{a:"go",t:"Redes de Atenção à Saúde"},57:{a:"go",t:"Redes de Atenção à Saúde"},58:{a:"go",t:"Considerando Informações Hemorragia Pósparto"},59:{a:"go",t:"ESF / Saúde da Família"},60:{a:"go",t:"Infecções congênitas (TORCH)"},61:{a:"ped",t:"Vulvovaginites"},62:{a:"ped",t:"Redes de Atenção à Saúde"},63:{a:"ped",t:"Trabalho de parto / Partograma"},64:{a:"ped",t:"Apresentações fetais"},65:{a:"ped",t:"Redes de Atenção à Saúde"},66:{a:"ped",t:"Otite média aguda"},67:{a:"ped",t:"Aleitamento materno"},68:{a:"ped",t:"ESF / Saúde da Família"},69:{a:"ped",t:"Hipotireoidismo"},70:{a:"ped",t:"Conjuntivite / Sd. Parinaud"},71:{a:"ped",t:"Crescimento infantil"},72:{a:"ped",t:"Redes de Atenção à Saúde"},73:{a:"ped",t:"PAC na infância"},74:{a:"ped",t:"Redes de Atenção à Saúde"},75:{a:"ped",t:"Rastreamento Ca colo uterino"},76:{a:"ped",t:"Rastreamento Ca colo uterino"},77:{a:"ped",t:"Redes de Atenção à Saúde"},78:{a:"ped",t:"Pré-eclâmpsia / DHEG"},79:{a:"ped",t:"PAC na infância"},80:{a:"ped",t:"Otite média aguda"}},
"iamspe 2026":{1:{a:"cirurgia",t:"Redes de Atenção à Saúde"},2:{a:"cirurgia",t:"Redes de Atenção à Saúde"},3:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},4:{a:"cirurgia",t:"Redes de Atenção à Saúde"},5:{a:"cirurgia",t:"Doença inflamatória intestinal"},6:{a:"cirurgia",t:"Doença inflamatória intestinal"},7:{a:"cirurgia",t:"Redes de Atenção à Saúde"},8:{a:"cirurgia",t:"PAC na infância"},9:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},10:{a:"cirurgia",t:"Redes de Atenção à Saúde"},11:{a:"cirurgia",t:"Contracepção"},12:{a:"cirurgia",t:"Desenvolvimento neuropsicomotor"},13:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},14:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},15:{a:"cirurgia",t:"Redes de Atenção à Saúde"},16:{a:"cirurgia",t:"Otite média aguda"},17:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},18:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},19:{a:"cirurgia",t:"Princípios do SUS"},20:{a:"cirurgia",t:"Otite média aguda"},21:{a:"clinica",t:"SUA / Adenomiose"},22:{a:"clinica",t:"Feridas crônicas"},23:{a:"clinica",t:"Princípios do SUS"},24:{a:"clinica",t:"Otite média aguda"},25:{a:"clinica",t:"Hemorragia digestiva"},26:{a:"clinica",t:"Dislipidemia / Estatinas"},27:{a:"clinica",t:"Rastreamento / Sobrediagnóstico"},28:{a:"clinica",t:"TEV / TVP / TEP"},29:{a:"clinica",t:"Ensaio clínico randomizado"},30:{a:"clinica",t:"Trauma torácico / Pneumotórax"},31:{a:"clinica",t:"Rastreamento Ca colo uterino"},32:{a:"clinica",t:"Redes de Atenção à Saúde"},33:{a:"clinica",t:"Redes de Atenção à Saúde"},34:{a:"clinica",t:"DRGE / Refluxo gastroesofágico"},35:{a:"clinica",t:"Hemorragia digestiva"},36:{a:"clinica",t:"Redes de Atenção à Saúde"},37:{a:"clinica",t:"Otite média aguda"},38:{a:"clinica",t:"Otite média aguda"},39:{a:"clinica",t:"Otite média aguda"},40:{a:"clinica",t:"Divertículo de Meckel"},41:{a:"go",t:"Rastreamento Ca colo uterino"},42:{a:"go",t:"Rastreamento / Sobrediagnóstico"},43:{a:"go",t:"Otite média aguda"},44:{a:"go",t:"Vulvovaginites"},45:{a:"go",t:"Vacinação / Imunização"},46:{a:"go",t:"Rastreamento / Sobrediagnóstico"},47:{a:"go",t:"Endometriose"},48:{a:"go",t:"Contracepção"},49:{a:"go",t:"Drenagem Venosa Infundíbulo Pélvico"},50:{a:"go",t:"Otite média aguda"},51:{a:"cirurgia",t:"Contracepção"},52:{a:"go",t:"Redes de Atenção à Saúde"},53:{a:"go",t:"PTI / Púrpura trombocitopênica"},54:{a:"go",t:"Reanimação neonatal"},55:{a:"go",t:"Rastreamento Ca colo uterino"},56:{a:"go",t:"Otite média aguda"},57:{a:"go",t:"Apresentações fetais"},58:{a:"go",t:"Vacinação / Imunização"},59:{a:"go",t:"Reanimação neonatal"},60:{a:"go",t:"Desenvolvimento neuropsicomotor"},61:{a:"ped",t:"Redes de Atenção à Saúde"},62:{a:"ped",t:"Redes de Atenção à Saúde"},63:{a:"ped",t:"Prematuridade / RN pré-termo"},64:{a:"ped",t:"Redes de Atenção à Saúde"},65:{a:"ped",t:"Aleitamento materno"},66:{a:"ped",t:"Vacinação / Imunização"},67:{a:"ped",t:"Otite média aguda"},68:{a:"ped",t:"Ensaio clínico randomizado"},69:{a:"ped",t:"Rastreamento Ca colo uterino"},70:{a:"ped",t:"Redes de Atenção à Saúde"},71:{a:"ped",t:"Diarreia aguda / Gastroenterite"},72:{a:"ped",t:"ESF / Saúde da Família"},73:{a:"ped",t:"Diarreia aguda / Gastroenterite"},74:{a:"ped",t:"Vacinação / Imunização"},75:{a:"ped",t:"Vacinação / Imunização"},76:{a:"ped",t:"Vacinação / Imunização"},77:{a:"ped",t:"Rastreamento Ca colo uterino"},78:{a:"ped",t:"Crescimento infantil"},79:{a:"ped",t:"Prematuridade / RN pré-termo"},80:{a:"ped",t:"ITU / Piúria"},81:{a:"preventiva",t:"ESF / Saúde da Família"},82:{a:"preventiva",t:"ESF / Saúde da Família"},83:{a:"preventiva",t:"Rastreamento Ca colo uterino"},84:{a:"preventiva",t:"ESF / Saúde da Família"},85:{a:"preventiva",t:"Princípios do SUS"},86:{a:"preventiva",t:"Rastreamento Ca colo uterino"},87:{a:"preventiva",t:"Insônia / Ansiedade"},88:{a:"preventiva",t:"Rastreamento / Sobrediagnóstico"},89:{a:"preventiva",t:"Vacinação / Imunização"},90:{a:"preventiva",t:"Princípios do SUS"},91:{a:"preventiva",t:"Redes de Atenção à Saúde"},92:{a:"preventiva",t:"SUA / Adenomiose"},93:{a:"preventiva",t:"Redes de Atenção à Saúde"},94:{a:"preventiva",t:"Transtorno personalidade borderline"},95:{a:"preventiva",t:"Otite média aguda"},96:{a:"preventiva",t:"Redes de Atenção à Saúde"},97:{a:"preventiva",t:"Rastreamento Ca colo uterino"},98:{a:"preventiva",t:"Redes de Atenção à Saúde"},99:{a:"preventiva",t:"Redes de Atenção à Saúde"},100:{a:"preventiva",t:"PAC / Pneumonia comunitária"}},
"sus sp 2022":{1:{a:"clinica",t:"Princípios do SUS"},2:{a:"clinica",t:"Princípios do SUS"},3:{a:"clinica",t:"Princípios do SUS"},4:{a:"clinica",t:"Otite média aguda"},5:{a:"clinica",t:"Princípios do SUS"},6:{a:"clinica",t:"Princípios do SUS"},7:{a:"clinica",t:"Otite média aguda"},8:{a:"clinica",t:"Miocardite na infância"},9:{a:"clinica",t:"Princípios do SUS"},10:{a:"clinica",t:"Princípios do SUS"},11:{a:"clinica",t:"Princípios do SUS"},12:{a:"clinica",t:"Otite média aguda"},13:{a:"clinica",t:"Princípios do SUS"},14:{a:"clinica",t:"Princípios do SUS"},15:{a:"clinica",t:"Princípios do SUS"},16:{a:"clinica",t:"Princípios do SUS"},17:{a:"clinica",t:"Princípios do SUS"},18:{a:"clinica",t:"Princípios do SUS"},19:{a:"clinica",t:"Princípios do SUS"},20:{a:"clinica",t:"Princípios do SUS"},21:{a:"cirurgia",t:"Divertículo de Meckel"},22:{a:"cirurgia",t:"Princípios do SUS"},23:{a:"cirurgia",t:"Princípios do SUS"},24:{a:"cirurgia",t:"Princípios do SUS"},25:{a:"cirurgia",t:"Princípios do SUS"},26:{a:"cirurgia",t:"Princípios do SUS"},27:{a:"cirurgia",t:"Princípios do SUS"},28:{a:"cirurgia",t:"Princípios do SUS"},29:{a:"cirurgia",t:"Otite média aguda"},30:{a:"cirurgia",t:"Princípios do SUS"},31:{a:"cirurgia",t:"Princípios do SUS"},32:{a:"cirurgia",t:"Princípios do SUS"},33:{a:"cirurgia",t:"Princípios do SUS"},34:{a:"cirurgia",t:"Transtorno do espectro autista"},35:{a:"cirurgia",t:"Princípios do SUS"},36:{a:"cirurgia",t:"Princípios do SUS"},37:{a:"cirurgia",t:"Princípios do SUS"},38:{a:"cirurgia",t:"Princípios do SUS"},39:{a:"cirurgia",t:"Princípios do SUS"},40:{a:"cirurgia",t:"Princípios do SUS"},41:{a:"go",t:"Aleitamento materno"},42:{a:"go",t:"Aleitamento materno"},43:{a:"go",t:"Princípios do SUS"},44:{a:"go",t:"Princípios do SUS"},45:{a:"go",t:"Crescimento infantil"},46:{a:"go",t:"PTI / Púrpura trombocitopênica"},47:{a:"go",t:"Bullying"},48:{a:"go",t:"Ensaio clínico randomizado"},49:{a:"go",t:"Princípios do SUS"},50:{a:"go",t:"Princípios do SUS"},51:{a:"go",t:"Vacinação / Imunização"},52:{a:"go",t:"Princípios do SUS"},53:{a:"go",t:"Aleitamento materno"},54:{a:"go",t:"Princípios do SUS"},55:{a:"go",t:"Vacinação / Imunização"},56:{a:"go",t:"Desenvolvimento neuropsicomotor"},57:{a:"go",t:"Princípios do SUS"},58:{a:"go",t:"Hipoglicemia neonatal"},59:{a:"go",t:"Princípios do SUS"},60:{a:"go",t:"Princípios do SUS"},61:{a:"ped",t:"Princípios do SUS"},62:{a:"ped",t:"Princípios do SUS"},63:{a:"ped",t:"Princípios do SUS"},64:{a:"ped",t:"Princípios do SUS"},65:{a:"ped",t:"PTI / Púrpura trombocitopênica"},66:{a:"ped",t:"Princípios do SUS"},67:{a:"ped",t:"Princípios do SUS"},68:{a:"ped",t:"Princípios do SUS"},69:{a:"ped",t:"Princípios do SUS"},70:{a:"ped",t:"Otite média aguda"},71:{a:"ped",t:"Princípios do SUS"},72:{a:"ped",t:"Reanimação neonatal"},73:{a:"ped",t:"Reanimação neonatal"},74:{a:"ped",t:"Reanimação neonatal"},75:{a:"ped",t:"Prematuridade / RN pré-termo"},76:{a:"ped",t:"Princípios do SUS"},77:{a:"ped",t:"Otite média aguda"},78:{a:"ped",t:"Princípios do SUS"},79:{a:"ped",t:"Princípios do SUS"},80:{a:"ped",t:"Reanimação neonatal"},81:{a:"preventiva",t:"Princípios do SUS"},82:{a:"preventiva",t:"Princípios do SUS"},83:{a:"preventiva",t:"Aleitamento materno"},84:{a:"preventiva",t:"Princípios do SUS"},85:{a:"preventiva",t:"Princípios do SUS"},86:{a:"preventiva",t:"Ensaio clínico randomizado"},87:{a:"preventiva",t:"Bronquiolite viral aguda"},88:{a:"preventiva",t:"Otite média aguda"},89:{a:"preventiva",t:"Princípios do SUS"},90:{a:"preventiva",t:"Otite média aguda"},91:{a:"preventiva",t:"Princípios do SUS"},92:{a:"preventiva",t:"Princípios do SUS"},93:{a:"preventiva",t:"Princípios do SUS"},94:{a:"preventiva",t:"Princípios do SUS"},95:{a:"preventiva",t:"Sensibilidade / Especificidade / VPP-VPN"},96:{a:"preventiva",t:"Desenvolvimento neuropsicomotor"},97:{a:"preventiva",t:"Revisão sistemática / Meta-análise"},98:{a:"preventiva",t:"Ensaio clínico randomizado"},99:{a:"preventiva",t:"Vacinação / Imunização"},100:{a:"preventiva",t:"Otite média aguda"}},
"sus sp 2023":{1:{a:"clinica",t:"Otite média aguda"},2:{a:"clinica",t:"Otite média aguda"},3:{a:"clinica",t:"Princípios do SUS"},4:{a:"clinica",t:"Princípios do SUS"},5:{a:"clinica",t:"Princípios do SUS"},6:{a:"cirurgia",t:"Princípios do SUS"},7:{a:"clinica",t:"Princípios do SUS"},8:{a:"clinica",t:"Princípios do SUS"},9:{a:"clinica",t:"Princípios do SUS"},10:{a:"clinica",t:"Princípios do SUS"},11:{a:"clinica",t:"Princípios do SUS"},12:{a:"clinica",t:"Otite média aguda"},13:{a:"clinica",t:"Princípios do SUS"},14:{a:"clinica",t:"PTI / Púrpura trombocitopênica"},15:{a:"clinica",t:"Princípios do SUS"},16:{a:"clinica",t:"Princípios do SUS"},17:{a:"clinica",t:"Princípios do SUS"},18:{a:"clinica",t:"Otite média aguda"},19:{a:"clinica",t:"Princípios do SUS"},20:{a:"clinica",t:"Princípios do SUS"},21:{a:"cirurgia",t:"Aleitamento materno"},22:{a:"cirurgia",t:"Pressão arterial pediátrica"},23:{a:"cirurgia",t:"Pressão arterial pediátrica"},24:{a:"cirurgia",t:"Princípios do SUS"},25:{a:"cirurgia",t:"Vacinação / Imunização"},26:{a:"cirurgia",t:"Desenvolvimento neuropsicomotor"},27:{a:"cirurgia",t:"Aleitamento materno"},28:{a:"cirurgia",t:"Vacinação / Imunização"},29:{a:"cirurgia",t:"Otite média aguda"},30:{a:"cirurgia",t:"Estado de mal epiléptico"},31:{a:"cirurgia",t:"Princípios do SUS"},32:{a:"cirurgia",t:"Princípios do SUS"},33:{a:"cirurgia",t:"Corpo estranho / Ingestão"},34:{a:"cirurgia",t:"Princípios do SUS"},35:{a:"cirurgia",t:"RCP / Suporte de vida pediátrico"},36:{a:"cirurgia",t:"Princípios do SUS"},37:{a:"ped",t:"Princípios do SUS"},38:{a:"cirurgia",t:"Princípios do SUS"},39:{a:"cirurgia",t:"Princípios do SUS"},40:{a:"cirurgia",t:"Crescimento infantil"},41:{a:"go",t:"Rastreamento / Sobrediagnóstico"},42:{a:"go",t:"PTI / Púrpura trombocitopênica"},43:{a:"go",t:"Princípios do SUS"},44:{a:"go",t:"Princípios do SUS"},45:{a:"go",t:"Otite média aguda"},46:{a:"go",t:"Princípios do SUS"},47:{a:"go",t:"Princípios do SUS"},48:{a:"go",t:"Princípios do SUS"},49:{a:"go",t:"Otite média aguda"},50:{a:"go",t:"Rastreamento / Sobrediagnóstico"},51:{a:"go",t:"Princípios do SUS"},52:{a:"go",t:"Reanimação neonatal"},53:{a:"go",t:"Princípios do SUS"},54:{a:"go",t:"Princípios do SUS"},55:{a:"go",t:"Princípios do SUS"},56:{a:"go",t:"Otite média aguda"},57:{a:"go",t:"Incidência / Prevalência"},58:{a:"go",t:"Princípios do SUS"},59:{a:"go",t:"Aleitamento materno"},60:{a:"go",t:"Reanimação neonatal"},61:{a:"ped",t:"Princípios do SUS"},62:{a:"ped",t:"Princípios do SUS"},63:{a:"ped",t:"Princípios do SUS"},64:{a:"ped",t:"Princípios do SUS"},65:{a:"ped",t:"Princípios do SUS"},66:{a:"ped",t:"Pressão arterial pediátrica"},67:{a:"ped",t:"PAC na infância"},68:{a:"ped",t:"Princípios do SUS"},69:{a:"ped",t:"Ensaio clínico randomizado"},70:{a:"ped",t:"Princípios do SUS"},71:{a:"ped",t:"Princípios do SUS"},72:{a:"ped",t:"TDAH"},73:{a:"ped",t:"Princípios do SUS"},74:{a:"ped",t:"Princípios do SUS"},75:{a:"ped",t:"Princípios do SUS"},76:{a:"ped",t:"Estado de mal epiléptico"},77:{a:"ped",t:"Princípios do SUS"},78:{a:"ped",t:"Princípios do SUS"},79:{a:"ped",t:"Otite média aguda"},80:{a:"ped",t:"Desenvolvimento neuropsicomotor"},81:{a:"preventiva",t:"Princípios do SUS"},82:{a:"preventiva",t:"Princípios do SUS"},83:{a:"preventiva",t:"Princípios do SUS"},84:{a:"preventiva",t:"COVID-19 pediátrico"},85:{a:"preventiva",t:"Princípios do SUS"},86:{a:"preventiva",t:"Ensaio clínico randomizado"},87:{a:"preventiva",t:"Rastreamento / Sobrediagnóstico"},88:{a:"preventiva",t:"Princípios do SUS"},89:{a:"preventiva",t:"Princípios do SUS"},90:{a:"preventiva",t:"Princípios do SUS"},91:{a:"preventiva",t:"Princípios do SUS"},92:{a:"preventiva",t:"Princípios do SUS"},93:{a:"preventiva",t:"Princípios do SUS"},94:{a:"preventiva",t:"Princípios do SUS"},95:{a:"preventiva",t:"Princípios do SUS"},96:{a:"preventiva",t:"Princípios do SUS"},97:{a:"cirurgia",t:"Princípios do SUS"},98:{a:"preventiva",t:"Princípios do SUS"},99:{a:"preventiva",t:"Princípios do SUS"},100:{a:"preventiva",t:"Princípios do SUS"}},
"sus sp 2024":{1:{a:"clinica",t:"Princípios do SUS"},2:{a:"clinica",t:"Otite média aguda"},3:{a:"clinica",t:"Princípios do SUS"},4:{a:"clinica",t:"Princípios do SUS"},5:{a:"clinica",t:"Princípios do SUS"},6:{a:"clinica",t:"Princípios do SUS"},7:{a:"clinica",t:"Princípios do SUS"},8:{a:"clinica",t:"Princípios do SUS"},9:{a:"clinica",t:"Ensaio clínico randomizado"},10:{a:"clinica",t:"Princípios do SUS"},11:{a:"clinica",t:"Princípios do SUS"},12:{a:"clinica",t:"Princípios do SUS"},13:{a:"clinica",t:"Princípios do SUS"},14:{a:"clinica",t:"Princípios do SUS"},15:{a:"clinica",t:"Princípios do SUS"},16:{a:"clinica",t:"Princípios do SUS"},17:{a:"clinica",t:"Princípios do SUS"},18:{a:"clinica",t:"Princípios do SUS"},19:{a:"clinica",t:"Transtorno do espectro autista"},20:{a:"clinica",t:"Princípios do SUS"},21:{a:"cirurgia",t:"Princípios do SUS"},22:{a:"cirurgia",t:"Princípios do SUS"},23:{a:"cirurgia",t:"Princípios do SUS"},24:{a:"cirurgia",t:"Princípios do SUS"},25:{a:"cirurgia",t:"Reanimação neonatal"},26:{a:"cirurgia",t:"Princípios do SUS"},27:{a:"cirurgia",t:"Princípios do SUS"},28:{a:"cirurgia",t:"Princípios do SUS"},29:{a:"cirurgia",t:"Princípios do SUS"},30:{a:"cirurgia",t:"Princípios do SUS"},31:{a:"cirurgia",t:"Princípios do SUS"},32:{a:"cirurgia",t:"Princípios do SUS"},33:{a:"cirurgia",t:"Incidência / Prevalência"},34:{a:"cirurgia",t:"Princípios do SUS"},35:{a:"cirurgia",t:"Princípios do SUS"},36:{a:"cirurgia",t:"Princípios do SUS"},37:{a:"cirurgia",t:"Princípios do SUS"},38:{a:"cirurgia",t:"Otite média aguda"},39:{a:"cirurgia",t:"PAC na infância"},40:{a:"cirurgia",t:"Princípios do SUS"},41:{a:"ped",t:"Diarreia aguda / Gastroenterite"},42:{a:"go",t:"Violência infantil / Maus-tratos"},43:{a:"go",t:"Princípios do SUS"},44:{a:"go",t:"Otite média aguda"},45:{a:"go",t:"Vacinação / Imunização"},46:{a:"go",t:"Princípios do SUS"},47:{a:"ped",t:"Princípios do SUS"},48:{a:"go",t:"Pressão arterial pediátrica"},49:{a:"ped",t:"Princípios do SUS"},50:{a:"ped",t:"Otite média aguda"},51:{a:"ped",t:"Princípios do SUS"},52:{a:"go",t:"Princípios do SUS"},53:{a:"go",t:"Vacinação / Imunização"},54:{a:"go",t:"Estado de mal epiléptico"},55:{a:"go",t:"Transtorno do espectro autista"},56:{a:"go",t:"Aleitamento materno"},57:{a:"go",t:"Princípios do SUS"},58:{a:"go",t:"Fibrose cística"},59:{a:"ped",t:"Princípios do SUS"},60:{a:"go",t:"Fibrose cística"},61:{a:"ped",t:"Princípios do SUS"},62:{a:"ped",t:"Princípios do SUS"},63:{a:"ped",t:"Otite média aguda"},64:{a:"ped",t:"Princípios do SUS"},65:{a:"ped",t:"Princípios do SUS"},66:{a:"ped",t:"Vacinação / Imunização"},67:{a:"ped",t:"Otite média aguda"},68:{a:"ped",t:"Otite média aguda"},69:{a:"ped",t:"Princípios do SUS"},70:{a:"ped",t:"Princípios do SUS"},71:{a:"ped",t:"Princípios do SUS"},72:{a:"ped",t:"Princípios do SUS"},73:{a:"ped",t:"Princípios do SUS"},74:{a:"ped",t:"Princípios do SUS"},75:{a:"ped",t:"Princípios do SUS"},76:{a:"ped",t:"Prematuridade / RN pré-termo"},77:{a:"ped",t:"Reanimação neonatal"},78:{a:"ped",t:"Rastreamento / Sobrediagnóstico"},79:{a:"ped",t:"Otite média aguda"},80:{a:"ped",t:"Princípios do SUS"},81:{a:"preventiva",t:"Princípios do SUS"},82:{a:"preventiva",t:"Sensibilidade / Especificidade / VPP-VPN"},83:{a:"preventiva",t:"Princípios do SUS"},84:{a:"preventiva",t:"Princípios do SUS"},85:{a:"preventiva",t:"Princípios do SUS"},86:{a:"preventiva",t:"Princípios do SUS"},87:{a:"preventiva",t:"Transtorno do espectro autista"},88:{a:"preventiva",t:"Otite média aguda"},89:{a:"preventiva",t:"Otite média aguda"},90:{a:"preventiva",t:"Estudo transversal / Prevalência"},91:{a:"preventiva",t:"Ensaio clínico randomizado"},92:{a:"preventiva",t:"Princípios do SUS"},93:{a:"preventiva",t:"Princípios do SUS"},94:{a:"preventiva",t:"Otite média aguda"},95:{a:"preventiva",t:"CIV / Cardiopatia congênita"},96:{a:"preventiva",t:"Princípios do SUS"},97:{a:"preventiva",t:"Princípios do SUS"},98:{a:"preventiva",t:"Princípios do SUS"},99:{a:"preventiva",t:"Princípios do SUS"},100:{a:"preventiva",t:"Princípios do SUS"}},
"sus sp 2025":{1:{a:"clinica",t:"Princípios do SUS"},2:{a:"clinica",t:"Otite média aguda"},3:{a:"clinica",t:"Otite média aguda"},4:{a:"clinica",t:"Otite média aguda"},5:{a:"clinica",t:"Otite média aguda"},6:{a:"clinica",t:"Princípios do SUS"},7:{a:"clinica",t:"Princípios do SUS"},8:{a:"clinica",t:"Princípios do SUS"},9:{a:"clinica",t:"Princípios do SUS"},10:{a:"clinica",t:"Princípios do SUS"},11:{a:"clinica",t:"Princípios do SUS"},12:{a:"clinica",t:"Princípios do SUS"},13:{a:"clinica",t:"Princípios do SUS"},14:{a:"clinica",t:"Princípios do SUS"},15:{a:"clinica",t:"Princípios do SUS"},16:{a:"clinica",t:"Otite média aguda"},17:{a:"clinica",t:"Otite média aguda"},18:{a:"clinica",t:"Princípios do SUS"},19:{a:"clinica",t:"Princípios do SUS"},20:{a:"clinica",t:"Princípios do SUS"},21:{a:"cirurgia",t:"Princípios do SUS"},22:{a:"cirurgia",t:"PTI / Púrpura trombocitopênica"},23:{a:"cirurgia",t:"Otite média aguda"},24:{a:"cirurgia",t:"Princípios do SUS"},25:{a:"cirurgia",t:"Otite média aguda"},26:{a:"cirurgia",t:"Princípios do SUS"},27:{a:"cirurgia",t:"Princípios do SUS"},28:{a:"cirurgia",t:"Princípios do SUS"},29:{a:"cirurgia",t:"Princípios do SUS"},30:{a:"cirurgia",t:"Princípios do SUS"},31:{a:"cirurgia",t:"Otite média aguda"},32:{a:"cirurgia",t:"Otite média aguda"},33:{a:"cirurgia",t:"Otite média aguda"},34:{a:"cirurgia",t:"Princípios do SUS"},35:{a:"cirurgia",t:"Princípios do SUS"},36:{a:"cirurgia",t:"Rastreamento / Sobrediagnóstico"},37:{a:"cirurgia",t:"Transtorno do espectro autista"},38:{a:"cirurgia",t:"Princípios do SUS"},39:{a:"cirurgia",t:"Princípios do SUS"},40:{a:"cirurgia",t:"Princípios do SUS"},41:{a:"go",t:"Otite média aguda"},42:{a:"go",t:"Princípios do SUS"},43:{a:"go",t:"Princípios do SUS"},44:{a:"go",t:"Vacinação / Imunização"},45:{a:"go",t:"Pressão arterial pediátrica"},46:{a:"go",t:"Pressão arterial pediátrica"},47:{a:"go",t:"Hipoglicemia neonatal"},48:{a:"go",t:"Reanimação neonatal"},49:{a:"go",t:"Fibrose cística"},50:{a:"go",t:"Desenvolvimento neuropsicomotor"},51:{a:"go",t:"Crescimento infantil"},52:{a:"go",t:"ITU na infância"},53:{a:"go",t:"Princípios do SUS"},54:{a:"go",t:"Crescimento infantil"},55:{a:"go",t:"ITU na infância"},56:{a:"go",t:"Aleitamento materno"},57:{a:"go",t:"ITU na infância"},58:{a:"go",t:"PAC na infância"},59:{a:"go",t:"Princípios do SUS"},60:{a:"go",t:"Asma / Broncoespasmo infantil"},61:{a:"ped",t:"Otite média aguda"},62:{a:"ped",t:"Princípios do SUS"},63:{a:"ped",t:"Otite média aguda"},64:{a:"ped",t:"Princípios do SUS"},65:{a:"ped",t:"Otite média aguda"},66:{a:"ped",t:"Princípios do SUS"},67:{a:"ped",t:"Desenvolvimento neuropsicomotor"},68:{a:"ped",t:"Princípios do SUS"},69:{a:"ped",t:"Otite média aguda"},70:{a:"ped",t:"Vacinação / Imunização"},71:{a:"ped",t:"Princípios do SUS"},72:{a:"ped",t:"Princípios do SUS"},73:{a:"ped",t:"Princípios do SUS"},74:{a:"ped",t:"Princípios do SUS"},75:{a:"ped",t:"Princípios do SUS"},76:{a:"ped",t:"Princípios do SUS"},77:{a:"ped",t:"Princípios do SUS"},78:{a:"ped",t:"Princípios do SUS"},79:{a:"ped",t:"Princípios do SUS"},80:{a:"ped",t:"Princípios do SUS"},81:{a:"preventiva",t:"Vacinação / Imunização"},82:{a:"preventiva",t:"Princípios do SUS"},83:{a:"preventiva",t:"Princípios do SUS"},84:{a:"preventiva",t:"Princípios do SUS"},85:{a:"preventiva",t:"Vacinação / Imunização"},86:{a:"preventiva",t:"Princípios do SUS"},87:{a:"preventiva",t:"Otite média aguda"},88:{a:"preventiva",t:"Ensaio clínico randomizado"},89:{a:"preventiva",t:"Vacinação / Imunização"},90:{a:"preventiva",t:"Princípios do SUS"},91:{a:"preventiva",t:"Otite média aguda"},92:{a:"preventiva",t:"Vacinação / Imunização"},93:{a:"preventiva",t:"Ensaio clínico randomizado"},94:{a:"preventiva",t:"Princípios do SUS"},95:{a:"preventiva",t:"Princípios do SUS"},96:{a:"preventiva",t:"Princípios do SUS"},97:{a:"preventiva",t:"Pressão arterial pediátrica"},98:{a:"preventiva",t:"Revisão sistemática / Meta-análise"},99:{a:"preventiva",t:"Ensaio clínico randomizado"},100:{a:"preventiva",t:"Incidência / Prevalência"}},
"sus sp 2026":{1:{a:"clinica",t:"Princípios do SUS"},2:{a:"clinica",t:"Princípios do SUS"},3:{a:"clinica",t:"Princípios do SUS"},4:{a:"clinica",t:"Princípios do SUS"},5:{a:"clinica",t:"Otite média aguda"},6:{a:"clinica",t:"Princípios do SUS"},7:{a:"clinica",t:"Ensaio clínico randomizado"},8:{a:"clinica",t:"Princípios do SUS"},9:{a:"clinica",t:"Princípios do SUS"},10:{a:"clinica",t:"Princípios do SUS"},11:{a:"clinica",t:"Princípios do SUS"},12:{a:"clinica",t:"Princípios do SUS"},13:{a:"clinica",t:"Princípios do SUS"},14:{a:"clinica",t:"Síndrome de Guillain-Barré"},15:{a:"clinica",t:"Princípios do SUS"},16:{a:"clinica",t:"Princípios do SUS"},17:{a:"clinica",t:"Princípios do SUS"},18:{a:"clinica",t:"Otite média aguda"},19:{a:"clinica",t:"Princípios do SUS"},20:{a:"clinica",t:"Miocardite na infância"},21:{a:"cirurgia",t:"Princípios do SUS"},22:{a:"cirurgia",t:"Princípios do SUS"},23:{a:"cirurgia",t:"Princípios do SUS"},24:{a:"cirurgia",t:"Otite média aguda"},25:{a:"cirurgia",t:"Princípios do SUS"},26:{a:"cirurgia",t:"Princípios do SUS"},27:{a:"cirurgia",t:"Princípios do SUS"},28:{a:"cirurgia",t:"Otite média aguda"},29:{a:"cirurgia",t:"PTI / Púrpura trombocitopênica"},30:{a:"cirurgia",t:"Princípios do SUS"},31:{a:"cirurgia",t:"Princípios do SUS"},32:{a:"cirurgia",t:"Transtorno do espectro autista"},33:{a:"cirurgia",t:"Otite média aguda"},34:{a:"cirurgia",t:"Princípios do SUS"},35:{a:"cirurgia",t:"Princípios do SUS"},36:{a:"cirurgia",t:"Princípios do SUS"},37:{a:"cirurgia",t:"Otite média aguda"},38:{a:"cirurgia",t:"Princípios do SUS"},39:{a:"cirurgia",t:"Princípios do SUS"},40:{a:"cirurgia",t:"Princípios do SUS"},41:{a:"go",t:"Crescimento infantil"},42:{a:"go",t:"Princípios do SUS"},43:{a:"go",t:"Princípios do SUS"},44:{a:"go",t:"Princípios do SUS"},45:{a:"go",t:"Ensaio clínico randomizado"},46:{a:"go",t:"CIV / Cardiopatia congênita"},47:{a:"go",t:"Princípios do SUS"},48:{a:"go",t:"Vacinação / Imunização"},49:{a:"go",t:"Vacinação / Imunização"},50:{a:"go",t:"Princípios do SUS"},51:{a:"go",t:"Transtorno do espectro autista"},52:{a:"go",t:"Princípios do SUS"},53:{a:"go",t:"Vacinação / Imunização"},54:{a:"go",t:"Otite média aguda"},55:{a:"go",t:"Princípios do SUS"},56:{a:"go",t:"Aleitamento materno"},57:{a:"go",t:"Princípios do SUS"},58:{a:"go",t:"Princípios do SUS"},59:{a:"go",t:"Princípios do SUS"},60:{a:"go",t:"Princípios do SUS"},61:{a:"ped",t:"Princípios do SUS"},62:{a:"ped",t:"Vacinação / Imunização"},63:{a:"ped",t:"Otite média aguda"},64:{a:"ped",t:"Prematuridade / RN pré-termo"},65:{a:"ped",t:"Reanimação neonatal"},66:{a:"ped",t:"Princípios do SUS"},67:{a:"ped",t:"Princípios do SUS"},68:{a:"ped",t:"Princípios do SUS"},69:{a:"ped",t:"Desenvolvimento neuropsicomotor"},70:{a:"ped",t:"Desenvolvimento neuropsicomotor"},71:{a:"ped",t:"Prematuridade / RN pré-termo"},72:{a:"ped",t:"Desenvolvimento neuropsicomotor"},73:{a:"ped",t:"Otite média aguda"},74:{a:"ped",t:"Rastreamento / Sobrediagnóstico"},75:{a:"ped",t:"Vacinação / Imunização"},76:{a:"ped",t:"Princípios do SUS"},77:{a:"ped",t:"Aleitamento materno"},78:{a:"ped",t:"Princípios do SUS"},79:{a:"ped",t:"Princípios do SUS"},80:{a:"ped",t:"Princípios do SUS"},81:{a:"preventiva",t:"Princípios do SUS"},82:{a:"preventiva",t:"Vacinação / Imunização"},83:{a:"preventiva",t:"Diarreia aguda / Gastroenterite"},84:{a:"preventiva",t:"Vacinação / Imunização"},85:{a:"preventiva",t:"Estudo caso-controle / OR"},86:{a:"preventiva",t:"Princípios do SUS"},87:{a:"preventiva",t:"Princípios do SUS"},88:{a:"preventiva",t:"Nutrição infantil"},89:{a:"preventiva",t:"Princípios do SUS"},90:{a:"preventiva",t:"Princípios do SUS"},91:{a:"preventiva",t:"Prematuridade / RN pré-termo"},92:{a:"preventiva",t:"Princípios do SUS"},93:{a:"preventiva",t:"Princípios do SUS"},94:{a:"preventiva",t:"Princípios do SUS"},95:{a:"preventiva",t:"Princípios do SUS"},96:{a:"preventiva",t:"Princípios do SUS"},97:{a:"preventiva",t:"Princípios do SUS"},98:{a:"preventiva",t:"Princípios do SUS"},99:{a:"preventiva",t:"Otite média aguda"},100:{a:"preventiva",t:"Princípios do SUS"}},
"unifesp 2024":{1:{a:"clinica",t:"Redes de Atenção à Saúde"},2:{a:"clinica",t:"Colelitíase / Colecistectomia"},3:{a:"clinica",t:"Anestesia / Sedação"},4:{a:"clinica",t:"Otite média aguda"},5:{a:"clinica",t:"Otite média aguda"},6:{a:"cirurgia",t:"Contracepção"},7:{a:"clinica",t:"Contracepção"},8:{a:"clinica",t:"Otite média aguda"},9:{a:"clinica",t:"ESF / Saúde da Família"},10:{a:"clinica",t:"Redes de Atenção à Saúde"},11:{a:"clinica",t:"TEV / TVP / TEP"},12:{a:"clinica",t:"Rastreamento Ca colo uterino"},13:{a:"clinica",t:"Otite média aguda"},14:{a:"clinica",t:"HIC / Tríade de Cushing"},15:{a:"clinica",t:"Redes de Atenção à Saúde"},16:{a:"clinica",t:"Redes de Atenção à Saúde"},17:{a:"clinica",t:"Redes de Atenção à Saúde"},18:{a:"clinica",t:"Fibrilação atrial / Flutter"},19:{a:"clinica",t:"Ensaio clínico randomizado"},20:{a:"clinica",t:"PAC / Pneumonia comunitária"},21:{a:"cirurgia",t:"Princípios do SUS"},22:{a:"cirurgia",t:"Transtorno do espectro autista"},23:{a:"cirurgia",t:"Ensaio clínico randomizado"},24:{a:"cirurgia",t:"Colelitíase / Colecistectomia"},25:{a:"cirurgia",t:"Redes de Atenção à Saúde"},26:{a:"cirurgia",t:"Alcoolismo / Rastreamento"},27:{a:"cirurgia",t:"Fibrilação atrial / Flutter"},28:{a:"cirurgia",t:"Encefalite / ADEM"},29:{a:"cirurgia",t:"Redes de Atenção à Saúde"},30:{a:"cirurgia",t:"ESF / Saúde da Família"},31:{a:"cirurgia",t:"Redes de Atenção à Saúde"},32:{a:"cirurgia",t:"Estado de mal epiléptico"},33:{a:"cirurgia",t:"Homem Anos Idade Encontrase"},34:{a:"cirurgia",t:"Redes de Atenção à Saúde"},35:{a:"cirurgia",t:"Redes de Atenção à Saúde"},36:{a:"cirurgia",t:"Redes de Atenção à Saúde"},37:{a:"cirurgia",t:"Transtorno do espectro autista"},38:{a:"cirurgia",t:"Insulinoterapia / Ajuste de dose"},39:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},40:{a:"cirurgia",t:"Homem Anos Idade Edema"},41:{a:"ped",t:"Vacinação / Imunização"},42:{a:"ped",t:"Otite média aguda"},43:{a:"ped",t:"Sepse / Choque séptico"},44:{a:"ped",t:"Redes de Atenção à Saúde"},45:{a:"ped",t:"Otite média aguda"},46:{a:"ped",t:"Asma"},47:{a:"ped",t:"Rastreamento / Sobrediagnóstico"},48:{a:"ped",t:"Rastreamento / Sobrediagnóstico"},49:{a:"ped",t:"Asma"},50:{a:"ped",t:"Rastreamento Ca colo uterino"},51:{a:"ped",t:"Redes de Atenção à Saúde"},52:{a:"ped",t:"Vacinação / Imunização"},53:{a:"ped",t:"Asma"},54:{a:"ped",t:"Redes de Atenção à Saúde"},55:{a:"ped",t:"Asma"},56:{a:"ped",t:"Registro clínico / SOAP"},57:{a:"ped",t:"Reanimação neonatal"},58:{a:"ped",t:"Reanimação neonatal"},59:{a:"ped",t:"ITU / Piúria"},60:{a:"ped",t:"Pré-natal"},61:{a:"go",t:"Rastreamento Ca colo uterino"},62:{a:"go",t:"Síndrome de Guillain-Barré"},63:{a:"go",t:"Síndrome coronariana aguda"},64:{a:"go",t:"Princípios do SUS"},65:{a:"go",t:"Atributos da APS"},66:{a:"go",t:"Ética médica"},67:{a:"go",t:"Insulinoterapia / Ajuste de dose"},68:{a:"go",t:"Vigilância epidemiológica"},69:{a:"go",t:"Estudo transversal / Prevalência"},70:{a:"go",t:"Incidência / Prevalência"},71:{a:"go",t:"Rastreamento / Sobrediagnóstico"},72:{a:"go",t:"Redes de Atenção à Saúde"},73:{a:"go",t:"Redes de Atenção à Saúde"},74:{a:"go",t:"Revisão sistemática / Meta-análise"},75:{a:"go",t:"Rastreamento Ca colo uterino"},76:{a:"go",t:"Sensibilidade / Especificidade / VPP-VPN"},77:{a:"go",t:"Fibrilação atrial / Flutter"},78:{a:"go",t:"Vigilância epidemiológica"},79:{a:"go",t:"PAC / Pneumonia comunitária"},80:{a:"go",t:"PTI / Púrpura trombocitopênica"},81:{a:"preventiva",t:"Otite média aguda"},82:{a:"preventiva",t:"Colelitíase / Colecistectomia"},83:{a:"preventiva",t:"Reanimação neonatal"},84:{a:"preventiva",t:"Intussuscepção intestinal"},85:{a:"preventiva",t:"Fibrilação atrial / Flutter"},86:{a:"preventiva",t:"HAS / Hipertensão arterial"},87:{a:"preventiva",t:"Contracepção"},88:{a:"preventiva",t:"Aleitamento materno"},89:{a:"preventiva",t:"Aleitamento materno"},90:{a:"preventiva",t:"Rastreamento Ca colo uterino"},91:{a:"preventiva",t:"Reanimação neonatal"},92:{a:"preventiva",t:"Aleitamento materno"},93:{a:"preventiva",t:"Pressão arterial pediátrica"},94:{a:"preventiva",t:"Vacinação / Imunização"},95:{a:"preventiva",t:"Rastreamento Ca colo uterino"},96:{a:"preventiva",t:"Redes de Atenção à Saúde"},97:{a:"preventiva",t:"Pressão arterial pediátrica"},98:{a:"preventiva",t:"Desenvolvimento neuropsicomotor"},99:{a:"preventiva",t:"Atributos da APS"},100:{a:"preventiva",t:"Dispositivos inalatórios"}},
"unifesp 2025":{1:{a:"clinica",t:"Anestesia / Sedação"},2:{a:"clinica",t:"Redes de Atenção à Saúde"},3:{a:"clinica",t:"Redes de Atenção à Saúde"},4:{a:"clinica",t:"Redes de Atenção à Saúde"},5:{a:"clinica",t:"Redes de Atenção à Saúde"},6:{a:"clinica",t:"Redes de Atenção à Saúde"},7:{a:"clinica",t:"Redes de Atenção à Saúde"},8:{a:"clinica",t:"Redes de Atenção à Saúde"},9:{a:"clinica",t:"Redes de Atenção à Saúde"},10:{a:"clinica",t:"Ensaio clínico randomizado"},11:{a:"clinica",t:"Diverticulite"},12:{a:"clinica",t:"Rastreamento Ca colo uterino"},13:{a:"clinica",t:"Otite média aguda"},14:{a:"clinica",t:"Mulher Anos Ambulatório Tubo"},15:{a:"clinica",t:"Redes de Atenção à Saúde"},16:{a:"clinica",t:"Redes de Atenção à Saúde"},17:{a:"clinica",t:"Redes de Atenção à Saúde"},18:{a:"clinica",t:"Redes de Atenção à Saúde"},19:{a:"clinica",t:"Otite média aguda"},20:{a:"clinica",t:"Otite média aguda"},21:{a:"cirurgia",t:"Redes de Atenção à Saúde"},22:{a:"cirurgia",t:"Contracepção"},23:{a:"cirurgia",t:"Princípios do SUS"},24:{a:"cirurgia",t:"Hiperprolactinemia"},25:{a:"cirurgia",t:"SOP / Ovários policísticos"},26:{a:"cirurgia",t:"PAC / Pneumonia comunitária"},27:{a:"cirurgia",t:"Crescimento infantil"},28:{a:"cirurgia",t:"Homem Anos Idade Previamente"},29:{a:"cirurgia",t:"SUA / Adenomiose"},30:{a:"cirurgia",t:"PTI / Púrpura trombocitopênica"},31:{a:"cirurgia",t:"HAS / Hipertensão arterial"},32:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},33:{a:"cirurgia",t:"Lombalgia"},34:{a:"cirurgia",t:"Sensibilidade / Especificidade / VPP-VPN"},35:{a:"cirurgia",t:"Princípios do SUS"},36:{a:"cirurgia",t:"Retalhos / Cirurgia plástica"},37:{a:"cirurgia",t:"Contracepção"},38:{a:"cirurgia",t:"Contracepção"},39:{a:"cirurgia",t:"Redes de Atenção à Saúde"},40:{a:"cirurgia",t:"Ensaio clínico randomizado"},41:{a:"ped",t:"Otite média aguda"},42:{a:"ped",t:"Colelitíase / Colecistectomia"},43:{a:"ped",t:"Ensaio clínico randomizado"},44:{a:"ped",t:"Vacinação / Imunização"},45:{a:"ped",t:"Princípios do SUS"},46:{a:"ped",t:"Rastreamento Ca colo uterino"},47:{a:"ped",t:"Rastreamento Ca colo uterino"},48:{a:"ped",t:"Reanimação neonatal"},49:{a:"ped",t:"Princípios do SUS"},50:{a:"ped",t:"Otite média aguda"},51:{a:"ped",t:"Princípios do SUS"},52:{a:"ped",t:"Rastreamento / Sobrediagnóstico"},53:{a:"ped",t:"Otite média aguda"},54:{a:"ped",t:"Incidência / Prevalência"},55:{a:"ped",t:"Rastreamento Ca colo uterino"},56:{a:"ped",t:"Rastreamento Ca colo uterino"},57:{a:"ped",t:"Rastreamento / Sobrediagnóstico"},58:{a:"ped",t:"Vigilância epidemiológica"},59:{a:"ped",t:"Redes de Atenção à Saúde"},60:{a:"ped",t:"Rastreamento / Sobrediagnóstico"},61:{a:"go",t:"Infecções congênitas (TORCH)"},62:{a:"go",t:"Redes de Atenção à Saúde"},63:{a:"go",t:"Crescimento infantil"},64:{a:"go",t:"Otite média aguda"},65:{a:"go",t:"Otite média aguda"},66:{a:"go",t:"ESF / Saúde da Família"},67:{a:"go",t:"Otite média aguda"},68:{a:"go",t:"Incidência / Prevalência"},69:{a:"go",t:"Otite média aguda"},70:{a:"go",t:"PTI / Púrpura trombocitopênica"},71:{a:"go",t:"PTI / Púrpura trombocitopênica"},72:{a:"go",t:"Pré-natal"},73:{a:"go",t:"Infertilidade / Reprodução assistida"},74:{a:"go",t:"Rastreamento Ca colo uterino"},75:{a:"go",t:"Doença trofoblástica gestacional"},76:{a:"go",t:"Pré-natal"},77:{a:"go",t:"Redes de Atenção à Saúde"},78:{a:"go",t:"Redes de Atenção à Saúde"},79:{a:"go",t:"Redes de Atenção à Saúde"},80:{a:"go",t:"Redes de Atenção à Saúde"},81:{a:"cirurgia",t:"Otite média aguda"},82:{a:"preventiva",t:"Pressão arterial pediátrica"},83:{a:"preventiva",t:"Vacinação / Imunização"},84:{a:"preventiva",t:"Otite média aguda"},85:{a:"preventiva",t:"APLV / Fórmula infantil"},86:{a:"preventiva",t:"Pressão arterial pediátrica"},87:{a:"preventiva",t:"ESF / Saúde da Família"},88:{a:"preventiva",t:"Nutrição infantil"},89:{a:"preventiva",t:"Rastreamento Ca colo uterino"},90:{a:"preventiva",t:"Triagem neonatal"},91:{a:"preventiva",t:"Desenvolvimento neuropsicomotor"},92:{a:"preventiva",t:"Redes de Atenção à Saúde"},93:{a:"preventiva",t:"Rastreamento Ca colo uterino"},94:{a:"preventiva",t:"Aleitamento materno"},95:{a:"preventiva",t:"Rastreamento Ca colo uterino"},96:{a:"preventiva",t:"Crescimento infantil"},97:{a:"preventiva",t:"Pressão arterial pediátrica"},98:{a:"preventiva",t:"Crescimento infantil"},99:{a:"preventiva",t:"Toxoplasmose na gestação"},100:{a:"preventiva",t:"PTI / Púrpura trombocitopênica"}},
"unifesp 2026":{1:{a:"clinica",t:"Dispositivos inalatórios"},2:{a:"clinica",t:"Otite média aguda"},3:{a:"clinica",t:"Redes de Atenção à Saúde"},4:{a:"clinica",t:"Crescimento infantil"},5:{a:"clinica",t:"Trauma torácico / Pneumotórax"},6:{a:"clinica",t:"Otite média aguda"},7:{a:"clinica",t:"Adolescente Anos Idade Sofreu"},8:{a:"clinica",t:"Fibrilação atrial / Flutter"},9:{a:"clinica",t:"Ensaio clínico randomizado"},10:{a:"clinica",t:"Redes de Atenção à Saúde"},11:{a:"clinica",t:"Apendicite / Dor abdominal"},12:{a:"clinica",t:"Otite média aguda"},13:{a:"clinica",t:"Otite média aguda"},14:{a:"clinica",t:"Contracepção"},15:{a:"clinica",t:"Redes de Atenção à Saúde"},16:{a:"clinica",t:"Redes de Atenção à Saúde"},17:{a:"clinica",t:"Otite média aguda"},18:{a:"clinica",t:"Redes de Atenção à Saúde"},19:{a:"clinica",t:"Redes de Atenção à Saúde"},20:{a:"clinica",t:"PAC / Pneumonia comunitária"},21:{a:"cirurgia",t:"Síndrome coronariana aguda"},22:{a:"cirurgia",t:"Homem Anos Idade Morador"},23:{a:"cirurgia",t:"ESF / Saúde da Família"},24:{a:"cirurgia",t:"ECG / Eletrocardiograma"},25:{a:"cirurgia",t:"Otite média aguda"},26:{a:"cirurgia",t:"Cirurgia bariátrica / Obesidade"},27:{a:"cirurgia",t:"Otite média aguda"},28:{a:"cirurgia",t:"Redes de Atenção à Saúde"},29:{a:"cirurgia",t:"Redes de Atenção à Saúde"},30:{a:"cirurgia",t:"Mulher Anos Idade Queixase"},31:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},32:{a:"cirurgia",t:"Rastreamento Ca colo uterino"},33:{a:"cirurgia",t:"Ensaio clínico randomizado"},34:{a:"cirurgia",t:"Redes de Atenção à Saúde"},35:{a:"cirurgia",t:"Contracepção"},36:{a:"cirurgia",t:"Otite média aguda"},37:{a:"cirurgia",t:"Fibrilação atrial / Flutter"},38:{a:"cirurgia",t:"Estado de mal epiléptico"},39:{a:"cirurgia",t:"Fibrilação atrial / Flutter"},40:{a:"cirurgia",t:"ESF / Saúde da Família"},41:{a:"ped",t:"Rastreamento Ca colo uterino"},42:{a:"ped",t:"SUA / Adenomiose"},43:{a:"ped",t:"PTI / Púrpura trombocitopênica"},44:{a:"ped",t:"Rastreamento Ca colo uterino"},45:{a:"ped",t:"Otite média aguda"},46:{a:"ped",t:"PTI / Púrpura trombocitopênica"},47:{a:"ped",t:"Redes de Atenção à Saúde"},48:{a:"ped",t:"Cesariana"},49:{a:"ped",t:"Redes de Atenção à Saúde"},50:{a:"ped",t:"Feridas crônicas"},51:{a:"ped",t:"PTI / Púrpura trombocitopênica"},52:{a:"ped",t:"TEV / TVP / TEP"},53:{a:"ped",t:"Rastreamento / Sobrediagnóstico"},54:{a:"ped",t:"Trabalho de parto / Partograma"},55:{a:"ped",t:"Otite média aguda"},56:{a:"ped",t:"Redes de Atenção à Saúde"},57:{a:"ped",t:"Redes de Atenção à Saúde"},58:{a:"ped",t:"Pré-natal"},59:{a:"ped",t:"Redes de Atenção à Saúde"},60:{a:"ped",t:"Redes de Atenção à Saúde"},61:{a:"go",t:"Lombalgia"},62:{a:"go",t:"Rastreamento Ca colorretal"},63:{a:"go",t:"Sensibilidade / Especificidade / VPP-VPN"},64:{a:"go",t:"Redes de Atenção à Saúde"},65:{a:"go",t:"Insônia / Ansiedade"},66:{a:"go",t:"Ensaio clínico randomizado"},67:{a:"go",t:"Atributos da APS"},68:{a:"go",t:"Redes de Atenção à Saúde"},69:{a:"go",t:"Obesidade / Regulação do peso"},70:{a:"go",t:"Princípios do SUS"},71:{a:"go",t:"Violência infantil / Maus-tratos"},72:{a:"go",t:"PTI / Púrpura trombocitopênica"},73:{a:"go",t:"ESF / Saúde da Família"},74:{a:"go",t:"Viés / Confundimento"},75:{a:"go",t:"Lesão renal aguda"},76:{a:"go",t:"Estudo de coorte"},77:{a:"go",t:"Redes de Atenção à Saúde"},78:{a:"go",t:"Vacinação / Imunização"},79:{a:"go",t:"Estudo caso-controle / OR"},80:{a:"go",t:"Rastreamento Ca colo uterino"},81:{a:"preventiva",t:"Rastreamento / Sobrediagnóstico"},82:{a:"preventiva",t:"Vacinação / Imunização"},83:{a:"preventiva",t:"Fibrose cística"},84:{a:"preventiva",t:"HIV vertical / Aleitamento"},85:{a:"preventiva",t:"Redes de Atenção à Saúde"},86:{a:"preventiva",t:"Fibrilação atrial / Flutter"},87:{a:"preventiva",t:"Aleitamento materno"},88:{a:"preventiva",t:"ITU / Piúria"},89:{a:"preventiva",t:"Redes de Atenção à Saúde"},90:{a:"preventiva",t:"Reanimação neonatal"},91:{a:"preventiva",t:"Otite média aguda"},92:{a:"preventiva",t:"Desenvolvimento neuropsicomotor"},93:{a:"preventiva",t:"Fibrilação atrial / Flutter"},94:{a:"preventiva",t:"Pressão arterial pediátrica"},95:{a:"preventiva",t:"Redes de Atenção à Saúde"},96:{a:"preventiva",t:"Vacinação / Imunização"},97:{a:"preventiva",t:"Otite média aguda"},98:{a:"preventiva",t:"Redes de Atenção à Saúde"},99:{a:"preventiva",t:"Otite média aguda"},100:{a:"preventiva",t:"Redes de Atenção à Saúde"}}};

const EXAM_THEMES_DB = EXAM_THEMES_RAW;

const KNOWN_PDFS = [
  // ── RS — FundMed (fundmed.org.br) ──────────────────────────────────────
  { key: "ufcspa 2026", name: "UFCSPA 2026 Acesso Direto", total: 100 },
  { key: "ufcspa 2025", name: "UFCSPA 2025 Acesso Direto", total: 100 },
  { key: "ufcspa 2024", name: "UFCSPA 2024 Acesso Direto", total: 100 },
  { key: "ufcspa 2023", name: "UFCSPA 2023 Acesso Direto", total: 100 },
  { key: "ufcspa 2022", name: "UFCSPA 2022 Acesso Direto", total: 100 },
  { key: "hcpa 2025", name: "HCPA 2025 Acesso Direto", total: 100 },
  { key: "hcpa 2024", name: "HCPA 2024 Acesso Direto", total: 100 },
  { key: "hcpa 2023", name: "HCPA 2023 Acesso Direto", total: 100 },
  { key: "hcpa 2022", name: "HCPA 2022 Acesso Direto", total: 100 },
  { key: "hcpa 2021", name: "HCPA 2021 Acesso Direto", total: 100 },
  { key: "amrigs 2026", name: "AMRIGS 2026 (PSU-RS)", total: 100 },
  { key: "amrigs 2025", name: "AMRIGS 2025 (PSU-RS)", total: 100 },
  { key: "amrigs 2024", name: "AMRIGS 2024 (PSU-RS)", total: 100 },
  { key: "amrigs 2023", name: "AMRIGS 2023 (PSU-RS)", total: 100 },
  { key: "amrigs 2022", name: "AMRIGS 2022 (PSU-RS)", total: 100 },
  // ── SP — VUNESP / SES-SP ──────────────────────────────────────────────
  { key: "sus sp 2026", name: "SUS-SP 2026", total: 100 },
  { key: "sus sp 2025", name: "SUS-SP 2025", total: 100 },
  { key: "sus sp 2024", name: "SUS-SP 2024", total: 100 },
  { key: "sus sp 2023", name: "SUS-SP 2023", total: 100 },
  { key: "sus sp 2022", name: "SUS-SP 2022", total: 100 },
  { key: "usp sp 2026", name: "USP-SP (FMUSP) 2026", total: 100 },
  { key: "usp sp 2025", name: "USP-SP (FMUSP) 2025", total: 100 },
  { key: "usp sp 2024", name: "USP-SP (FMUSP) 2024", total: 100 },
  { key: "usp sp 2023", name: "USP-SP (FMUSP) 2023", total: 100 },
  { key: "usp rp 2026", name: "USP-RP (FMRP) 2026", total: 100 },
  { key: "usp rp 2025", name: "USP-RP (FMRP) 2025", total: 100 },
  { key: "usp rp 2024", name: "USP-RP (FMRP) 2024", total: 100 },
  { key: "unifesp 2026", name: "UNIFESP 2026", total: 100 },
  { key: "unifesp 2025", name: "UNIFESP 2025", total: 100 },
  { key: "unifesp 2024", name: "UNIFESP 2024", total: 100 },
  { key: "unifesp 2023", name: "UNIFESP 2023", total: 100 },
  { key: "unicamp 2026", name: "UNICAMP 2026 (Respostas Curtas)", total: 100 },
  { key: "unicamp 2025", name: "UNICAMP 2025 (Respostas Curtas)", total: 100 },
  { key: "unicamp 2024", name: "UNICAMP 2024 (Respostas Curtas)", total: 120 },
  { key: "unicamp 2023", name: "UNICAMP 2023 (Múltipla Escolha)", total: 120 },
  { key: "unesp 2026", name: "UNESP 2026", total: 100 },
  { key: "unesp 2025", name: "UNESP 2025", total: 100 },
  { key: "unesp 2024", name: "UNESP 2024", total: 100 },
  { key: "unesp 2023", name: "UNESP 2023", total: 100 },
  { key: "iamspe 2026", name: "IAMSPE 2026", total: 100 },
  { key: "iamspe 2025", name: "IAMSPE 2025", total: 100 },
  { key: "iamspe 2024", name: "IAMSPE 2024", total: 100 },
  { key: "iamspe 2023", name: "IAMSPE 2023", total: 100 },
  { key: "iscmsp 2026", name: "Santa Casa SP 2026", total: 100 },
  { key: "iscmsp 2025", name: "Santa Casa SP 2025", total: 100 },
  { key: "iscmsp 2024", name: "Santa Casa SP 2024", total: 100 },
  { key: "iscmsp 2023", name: "Santa Casa SP 2023", total: 100 },
  { key: "abc 2025", name: "ABC (FMABC) 2025", total: 100 },
  { key: "abc 2024", name: "ABC (FMABC) 2024", total: 100 },
  { key: "enare 2026", name: "ENARE 2026", total: 100 },
  { key: "enare 2025", name: "ENARE 2025", total: 100 },
  { key: "enare 2024", name: "ENARE 2024", total: 100 },
];

function searchKnownPdf(query) {
  if (!query || query.trim().length < 2) return KNOWN_PDFS;
  const q = query.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const words = q.split(" ").filter((w) => w.length > 1);
  return KNOWN_PDFS.filter((p) => words.some((w) => p.key.includes(w)) || p.key.includes(q));
}

function Provas({ exams, revLogs, sessions, onAdd, onDel }) {
  const [step, setStep] = useState(0);
  const [detail, setDetail] = useState(null);
  const [examMeta, setExamMeta] = useState({ date: today(), name: "", total: 120 });
  const [qMap, setQMap] = useState({});
  const [qDetails, setQDetails] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pdfStatus, setPdfStatus] = useState("idle");
  const [pdfMsg, setPdfMsg] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const allLogs = useMemo(() => [...revLogs, ...sessions.map((s) => ({ ...s, pct: perc(s.acertos, s.total) }))], [revLogs, sessions]);
  const knownThemes = useMemo(() => { const o = {}; AREAS.forEach((a) => { o[a.id] = [...new Set(allLogs.filter((l) => l.area === a.id).map((l) => l.theme))].sort(); }); return o; }, [allLogs]);

  const reset = () => { setStep(0); setExamMeta({ date: today(), name: "", total: 120 }); setQMap({}); setQDetails({}); setSearchQuery(""); setSearchResults([]); setPdfStatus("idle"); setPdfMsg(""); setAiAnalysis(null); };

  const total = Number(examMeta.total) || 0;
  const questions = Array.from({ length: total }, (_, i) => i + 1);
  const classified = Object.keys(qMap).length;
  const acertos = Object.values(qMap).filter((v) => v === "soube" || v === "chutou").length;
  const pctGeral = classified > 0 ? perc(acertos, classified) : null;

  function cycleQ(n) {
    setQMap((m) => {
      const cur = m[n] || null;
      const idx = CAT_CYCLE.indexOf(cur);
      const next = CAT_CYCLE[(idx + 1) % CAT_CYCLE.length];
      if (next === null) { const { [n]: _, ...rest } = m; return rest; }
      return { ...m, [n]: next };
    });
  }

  const needArea = questions.filter((n) => qMap[n] === "errou_viu" || qMap[n] === "errou_nao");
  const allAreasFilled = needArea.every((n) => qDetails[n]?.area);

  function handleSearch(q) { setSearchQuery(q); setSearchResults(searchKnownPdf(q)); }

  function selectKnownPdf(r) {
    setExamMeta((m) => ({ ...m, name: r.name, total: r.total }));
    setSearchQuery(r.name);
    setPdfStatus("idle");
    setPdfMsg("");
  }

  // ── Análise local — usa banco de temas embutido (2160 questões de 22 provas) ──
  function analyzeByName() {
    const nome = examMeta.name.trim();
    const qtotal = Number(examMeta.total) || 100;
    if (!nome) return alert("Selecione ou preencha o nome da prova.");
    
    // Tentar encontrar no banco de temas
    const searchKey = nome.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
    let dbKey = Object.keys(EXAM_THEMES_DB).find((k) => {
      const kn = k.toLowerCase();
      // Match flexible: "ufcspa 2023" matches "UFCSPA 2023 Acesso Direto"
      return searchKey.includes(kn) || kn.includes(searchKey) || 
             searchKey.split(" ").every((w) => kn.includes(w));
    });
    
    if (dbKey && EXAM_THEMES_DB[dbKey]) {
      const dbThemes = EXAM_THEMES_DB[dbKey];
      const det = {};
      const enriched = [];
      Object.entries(dbThemes).forEach(([n, d]) => {
        const num = Number(n);
        det[num] = { area: d.a, theme: d.t, schedule: mapThemeToSchedule(d.t) };
        enriched.push({ n: num, theme: d.t, area: d.a, schedule: det[num].schedule });
      });
      setQDetails(det);
      setAiAnalysis(enriched);
      setPdfStatus("done");
      setPdfMsg("✓ " + Object.keys(dbThemes).length + " temas carregados do banco");
      setStep(2);
    } else {
      // Fallback: mapeamento por bloco padrão
      const det = buildDefaultQDetails(qtotal);
      setQDetails(det);
      setAiAnalysis(null);
      setPdfStatus("done");
      setPdfMsg("⚠ Prova não encontrada no banco. Áreas pré-mapeadas por bloco. Temas em branco.");
      setStep(2);
    }
  }

  // ── Upload PDF — busca no banco pelo nome, senão vai pro gabarito ──────────
  function handleUpload() {
    const nome = examMeta.name.trim();
    if (!nome) return alert("Selecione ou preencha o nome da prova primeiro.");
    analyzeByName(); // Usa o mesmo fluxo
  }

  function buildExam() {
    const cats = { soube: [], chutou: [], errou_viu: [], errou_nao: [] };
    Object.entries(qMap).forEach(([n, cat]) => cats[cat]?.push(Number(n)));
    const total2 = Object.keys(qMap).length;
    const acertos2 = cats.soube.length + cats.chutou.length;
    const ar = {}; AREAS.forEach((a) => { ar[a.id] = { soube: 0, chutou: 0, errou_viu: 0, errou_nao: 0, total: 0 }; });
    [...cats.errou_viu, ...cats.errou_nao].forEach((n) => { const d = qDetails[n]; if (!d?.area) return; const c = cats.errou_viu.includes(n) ? "errou_viu" : "errou_nao"; ar[d.area][c]++; ar[d.area].total++; });
    cats.soube.forEach((n) => { const d = qDetails[n]; if (d?.area) { ar[d.area].soube++; ar[d.area].total++; } });
    cats.chutou.forEach((n) => { const d = qDetails[n]; if (d?.area) { ar[d.area].chutou++; ar[d.area].total++; } });
    onAdd({ date: examMeta.date, name: examMeta.name, total: total2, acertos: acertos2, cats, qDetails, areaResults: ar, aiAnalysis });
    reset();
  }

  const isLoading = pdfStatus === "loading" || pdfStatus === "analyzing";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {step === 0 && <>
        <button onClick={() => setStep(1)} style={btn("#3B82F6")}>+ Registrar prova</button>
        {exams.length === 0 ? <Empty msg="Nenhuma prova registrada ainda." /> : exams.map((exam) => <ExamCard key={exam.id} exam={exam} allLogs={allLogs} isOpen={detail === exam.id} onToggle={() => setDetail(detail === exam.id ? null : exam.id)} onDel={onDel} knownThemes={knownThemes} />)}
      </>}

      {step === 1 && <div style={{ ...card, border: "1px solid #3B82F655", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>Nova prova</div>
          <button onClick={reset} style={btn(C.card2, { padding: "6px 12px", fontSize: 12 })}>✕ Cancelar</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 12 }}>
          <Fld label="Data"><input type="date" value={examMeta.date} onChange={(e) => setExamMeta((m) => ({ ...m, date: e.target.value }))} style={inp()} /></Fld>
          <Fld label="Nome da prova"><input type="text" value={examMeta.name} onChange={(e) => setExamMeta((m) => ({ ...m, name: e.target.value }))} placeholder="Ex: UFCSPA 2023, IAMSPE 2024…" style={inp()} /></Fld>
          <Fld label="Nº questões"><input type="number" min="1" max="200" value={examMeta.total} onChange={(e) => setExamMeta((m) => ({ ...m, total: e.target.value }))} style={inp()} /></Fld>
        </div>
        <div style={{ background: C.bg, borderRadius: 12, padding: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Banco de provas</div>
          <input value={searchQuery} onChange={(e) => handleSearch(e.target.value)} onFocus={() => setSearchResults(KNOWN_PDFS)} placeholder="Filtrar… (UFCSPA, UNICAMP, IAMSPE…)" style={inp({ fontSize: 12, padding: "8px 12px" })} disabled={isLoading} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8, maxHeight: 200, overflowY: "auto" }}>
            {(searchResults.length > 0 ? searchResults : KNOWN_PDFS).map((r, i) => (
              <button key={i} onClick={() => selectKnownPdf(r)} disabled={isLoading} style={{ background: examMeta.name === r.name ? C.blue + "22" : C.card2, border: `1px solid ${examMeta.name === r.name ? C.blue : C.border}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                <span style={{ fontSize: 11 }}>📄</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: examMeta.name === r.name ? C.blue : C.text }}>{r.name}</div><div style={{ fontSize: 10, color: C.text3 }}>{r.total} questões</div></div>
                {examMeta.name === r.name && <span style={{ fontSize: 10, color: C.blue, fontWeight: 700 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
        {pdfStatus !== "idle" && <div style={{ padding: "10px 14px", borderRadius: 10, background: pdfStatus === "error" ? C.red + "18" : pdfStatus === "done" ? C.green + "18" : C.blue + "18", border: `1px solid ${pdfStatus === "error" ? C.red : pdfStatus === "done" ? C.green : C.blue}44`, fontSize: 12, color: pdfStatus === "error" ? C.red : pdfStatus === "done" ? C.green : C.blue, fontFamily: FM }}>{isLoading && "⏳ "}{pdfMsg}</div>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ background: C.purple, border: "none", borderRadius: 12, padding: "10px 18px", color: "#fff", cursor: isLoading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500, fontFamily: F, opacity: isLoading ? 0.6 : 1, display: "inline-block" }}>
            📎 Upload PDF
            <input type="file" accept="application/pdf,.pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} disabled={isLoading} />
          </label>
          <button onClick={() => { if (!examMeta.name.trim()) return alert("Preencha o nome."); analyzeByName(); }} style={btn(C.blue, { padding: "10px 18px" })} disabled={isLoading}>🧠 Analisar pelo nome</button>
          <button onClick={() => { if (!examMeta.name.trim()) return alert("Preencha o nome."); if (!Number(examMeta.total)) return alert("Preencha o nº."); setPdfStatus("idle"); setPdfMsg(""); setStep(2); }} style={btn(C.card2)} disabled={isLoading}>Sem análise →</button>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {CATS.map((cat) => <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color }} /><span style={{ fontSize: 11, color: C.text2 }}>{cat.label}</span></div>)}
        </div>
      </div>}

      {step === 2 && <div style={{ ...card, border: "1px solid #3B82F655", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>{examMeta.name}</div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: FM, marginTop: 2 }}>
              Clique para classificar · clique novamente para mudar
              {aiAnalysis && <span style={{ color: C.green, marginLeft: 8 }}>✓ IA identificou {aiAnalysis.length} temas</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {pctGeral !== null && <div style={{ fontSize: 20, fontWeight: 700, color: perfColor(pctGeral), fontFamily: FM }}>{pctGeral}%</div>}
            <span style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>{classified}/{total} classificadas</span>
            <button onClick={() => setStep(1)} style={btn(C.card2, { padding: "6px 12px", fontSize: 12 })}>← Voltar</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATS.map((cat) => (
            <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: cat.color + "18", border: `1px solid ${cat.color}33` }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: cat.color, fontWeight: 600 }}>{cat.label}</span>
              <span style={{ fontSize: 12, color: cat.color, fontWeight: 700, fontFamily: FM }}>
                {Object.values(qMap).filter((v) => v === cat.id).length}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 500, overflowY: "auto" }}>
          {questions.map((n) => {
            const cat = qMap[n] || null;
            const aiQ = aiAnalysis?.find((q) => q.n === n);
            const themeTxt = aiQ?.theme || qDetails[n]?.theme || "";
            return (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: cat ? catColor(cat) + "0C" : C.surface, borderRadius: 10, border: `1px solid ${cat ? catColor(cat) + "33" : C.border}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: cat ? catColor(cat) : C.text3, fontFamily: FM, minWidth: 28, textAlign: "center" }}>{n}</span>
                <div style={{ display: "flex", gap: 5 }}>
                  {CATS.map((c) => {
                    const isActive = cat === c.id;
                    return (
                      <button key={c.id} onClick={() => setQMap((m) => {
                        if (isActive) { const { [n]: _, ...rest } = m; return rest; }
                        return { ...m, [n]: c.id };
                      })} title={c.label} style={{
                        width: 22, height: 22, borderRadius: "50%", border: `2px solid ${isActive ? c.color : c.color + "44"}`,
                        background: isActive ? c.color : "transparent", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0,
                        transition: "all 0.1s",
                      }}>
                        {isActive && <span style={{ color: "#000", fontSize: 10, fontWeight: 800 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                {themeTxt && <span style={{ fontSize: 10, color: C.text3, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{themeTxt}</span>}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => { const m = {}; questions.forEach((n) => { if (!qMap[n]) m[n] = "soube"; }); setQMap((q) => ({ ...q, ...m })); }} style={btn(C.card2, { padding: "7px 14px", fontSize: 12 })}>✓ Marcar restantes como Soube</button>
          <button onClick={() => setQMap({})} style={{ ...btn(C.card2, { padding: "7px 14px", fontSize: 12 }), color: C.red }}>Limpar tudo</button>
        </div>

        {aiAnalysis && aiAnalysis.length > 0 && (
          <div style={{ background: C.bg, borderRadius: 12, padding: 12, border: `1px solid ${C.border}`, maxHeight: 180, overflowY: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Temas identificados pela IA — passe o mouse sobre cada questão</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {aiAnalysis.slice(0, 30).map((q) => {
                const a = areaMap[q.area];
                return (
                  <div key={q.n} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, background: a?.color + "14", border: `1px solid ${a?.color || C.border}22`, fontSize: 10, fontFamily: FM }}>
                    <span style={{ color: a?.color, fontWeight: 700 }}>{q.n}</span>
                    <span style={{ color: C.text2 }}>{q.theme}</span>
                    {q.schedule && <span style={{ color: C.text3 }}>· {q.schedule.semana}</span>}
                  </div>
                );
              })}
              {aiAnalysis.length > 30 && <span style={{ fontSize: 10, color: C.text3, padding: "2px 8px" }}>+{aiAnalysis.length - 30} mais…</span>}
            </div>
          </div>
        )}

        {classified > 0 && (
          <button onClick={() => needArea.length > 0 ? setStep(3) : buildExam()} style={btn("#34D399")}>
            {needArea.length > 0 ? `Próximo → indicar áreas (${needArea.length} erradas)` : "✓ Salvar prova"}
          </button>
        )}
      </div>}

      {step === 3 && <div style={{ ...card, border: "1px solid #3B82F655", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>Áreas das questões erradas</div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>{needArea.length} questões · {aiAnalysis ? "IA já preencheu área e tema — confira" : "preencha manualmente"}</div>
          </div>
          <button onClick={() => setStep(2)} style={btn(C.card2, { padding: "6px 12px", fontSize: 12 })}>← Voltar</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 500, overflowY: "auto" }}>
          {needArea.map((n) => {
            const cat = CATS.find((c) => c.id === qMap[n]);
            const d = qDetails[n] || {};
            return (
              <div key={n} style={{ background: C.bg, borderRadius: 12, padding: 12, border: `1px solid ${cat?.color || C.border}44` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat?.color, flexShrink: 0 }} />
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: cat?.color + "22", border: `2px solid ${cat?.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cat?.color, fontFamily: FM }}>{n}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: cat?.color }}>{cat?.label}</span>
                  {d.schedule && <span style={{ fontSize: 10, color: C.blue, fontFamily: FM, background: C.blue + "14", padding: "1px 6px", borderRadius: 4 }}>📅 {d.schedule.semana}</span>}
                  {!d.area && <span style={{ fontSize: 10, color: "#F87171", fontFamily: FM, marginLeft: "auto" }}>⚠ obrigatório</span>}
                  {d.area && <span style={{ fontSize: 10, color: C.green, fontFamily: FM, marginLeft: "auto" }}>✓ preenchido</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Fld label="Área">
                    <select value={d.area || ""} onChange={(e) => { const sel = e.target.value; setQDetails((dd) => ({ ...dd, [n]: { ...(dd[n] || {}), area: sel, schedule: mapThemeToSchedule(dd[n]?.theme || "") } })); }} style={inp({ borderColor: !d.area ? "#F87171" : C.green + "66" })}>
                      <option value="">Selecione…</option>
                      {AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                  </Fld>
                  <Fld label="Tema">
                    <input type="text" value={d.theme || ""} onChange={(e) => { const t = e.target.value; setQDetails((dd) => ({ ...dd, [n]: { ...(dd[n] || {}), theme: t, schedule: mapThemeToSchedule(t) } })); }} placeholder="tema…" style={inp({ borderColor: d.theme ? C.green + "44" : C.border2 })} />
                  </Fld>
                </div>
                {d.schedule && (
                  <div style={{ marginTop: 8, padding: "6px 10px", background: C.blue + "10", borderRadius: 8, border: `1px solid ${C.blue}22`, fontSize: 11, color: C.blue, fontFamily: FM }}>
                    📅 Cronograma MED: <b>{d.schedule.semana}</b> — {d.schedule.topics[0]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={() => { if (!allAreasFilled) return alert("Preencha a área de todas as questões erradas."); buildExam(); }} style={btn("#34D399")}>✓ Salvar prova</button>
      </div>}
    </div>
  );
}

function ExamCard({ exam, allLogs, isOpen, onToggle, onDel, knownThemes }) {
  const cats = exam.cats || {};
  const s = cats.soube?.length || 0; const c = cats.chutou?.length || 0; const ev = cats.errou_viu?.length || 0; const en = cats.errou_nao?.length || 0;
  const total = exam.total || (s + c + ev + en); const acertos = exam.acertos || (s + c); const geral = perc(acertos, total);
  const areaStats = useMemo(() => { const o = {}; AREAS.forEach((a) => { o[a.id] = { soube: 0, chutou: 0, errou_viu: 0, errou_nao: 0, total: 0 }; }); if (exam.areaResults) { Object.entries(exam.areaResults).forEach(([aId, r]) => { if (o[aId]) o[aId] = { ...r }; }); } else if (exam.qDetails) { Object.entries(exam.qDetails).forEach(([n, d]) => { if (!d?.area) return; const nn = Number(n); const bk = cats.soube?.includes(nn) ? "soube" : cats.chutou?.includes(nn) ? "chutou" : cats.errou_viu?.includes(nn) ? "errou_viu" : "errou_nao"; o[d.area][bk]++; o[d.area].total++; }); } return o; }, [exam, cats]);

  const evByArea = useMemo(() => { const o = {}; AREAS.forEach((a) => { o[a.id] = []; }); (cats.errou_viu || []).forEach((n) => { const d = exam.qDetails?.[n]; if (!d?.area) return; o[d.area].push({ n, theme: d.theme || "—", schedule: d.schedule || mapThemeToSchedule(d.theme) }); }); return o; }, [exam, cats]);
  const enByArea = useMemo(() => { const o = {}; AREAS.forEach((a) => { o[a.id] = []; }); (cats.errou_nao || []).forEach((n) => { const d = exam.qDetails?.[n]; if (!d?.area) return; o[d.area].push({ n, theme: d.theme || "—", schedule: d.schedule || mapThemeToSchedule(d.theme) }); }); return o; }, [exam, cats]);

  const PMAP = { "muito alta": [21, 28, 33, 34, 38, 41, 44, 51, 55, 59, 60, 68, 81, 85, 90, 98, 100, 102, 103, 105, 106, 108, 111], "alta": [3, 4, 16, 27, 29, 46, 52, 66, 79, 87, 107, 109, 115, 120], "média": [12, 36, 67, 74, 80, 84, 94, 95, 118, 119], "baixa": [15, 32] };
  const NMAP = {}; Object.entries(PMAP).forEach(([cat, nums]) => nums.forEach((n) => { NMAP[n] = cat; }));
  const PSTYLE = { "muito alta": { color: C.green, label: "Muito alta" }, "alta": { color: "#60A5FA", label: "Alta" }, "média": { color: "#FBBF24", label: "Média" }, "baixa": { color: C.text3, label: "Baixa" } };
  const PORD = { "muito alta": 0, "alta": 1, "média": 2, "baixa": 3 };

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={onToggle}>
        <div style={{ width: 68, height: 68, borderRadius: 10, background: perfColor(geral) + "18", border: `2px solid ${perfColor(geral)}55`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 20, fontWeight: 700, color: perfColor(geral), fontFamily: FM, lineHeight: 1 }}>{geral}%</span><span style={{ fontSize: 9, color: C.text3, fontFamily: FM }}>{acertos}/{total}</span></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{exam.name}</div>
          <div style={{ fontSize: 11, color: C.text3, fontFamily: FM, marginBottom: 6 }}>{fmtDate(exam.date)}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {CATS.map((cat) => { const cnt = cats[cat.id]?.length || 0; if (!cnt) return null; return (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: cat.color, fontWeight: 600 }}>{cnt}</span>
              </div>
            ); })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ color: C.text3 }}>{isOpen ? "▲" : "▼"}</span><button onClick={(e) => { e.stopPropagation(); onDel(exam.id); }} style={{ background: "none", border: "none", color: C.border2, cursor: "pointer", fontSize: 16 }}>✕</button></div>
      </div>

      {isOpen && <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 16 }}>

        {(() => {
          const allQ = new Map();
          (cats.soube || []).forEach((n) => allQ.set(n, "soube"));
          (cats.chutou || []).forEach((n) => allQ.set(n, "chutou"));
          (cats.errou_viu || []).forEach((n) => allQ.set(n, "errou_viu"));
          (cats.errou_nao || []).forEach((n) => allQ.set(n, "errou_nao"));
          if (allQ.size === 0) return null;
          const sorted = [...allQ.keys()].sort((a, b) => a - b);
          return (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Gabarito</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {sorted.map((n) => {
                  const catId = allQ.get(n); const col = catColor(catId);
                  const d = exam.qDetails?.[n];
                  return (
                    <div key={n} title={d?.theme || ""} style={{ width: 34, height: 34, borderRadius: 8, background: col + "18", border: `2px solid ${col}44`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: col, fontFamily: FM, lineHeight: 1 }}>{n}</span>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: col }} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {CATS.map((cat) => { const cnt = cats[cat.id]?.length || 0; const p = total > 0 ? perc(cnt, total) : 0; return (
            <div key={cat.id} style={{ background: C.bg, borderRadius: 10, padding: 10, border: `1px solid ${cat.color}33`, textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                <span style={{ fontSize: 20, fontWeight: 700, color: cat.color, fontFamily: FM }}>{cnt}</span>
              </div>
              <div style={{ fontSize: 10, color: cat.color, fontFamily: FM, marginBottom: 2 }}>{p}%</div>
              <div style={{ fontSize: 10, color: C.text3, lineHeight: 1.3 }}>{cat.label}</div>
            </div>
          ); })}
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Por área</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: 10 }}>
            {AREAS.map((a) => { const st = areaStats[a.id]; const t2 = st.total || 24; const ac2 = st.soube + st.chutou; const p2 = perc(ac2, t2); const diff = p2 - BENCHMARKS[a.id]; return (
              <div key={a.id} style={{ background: C.bg, borderRadius: 10, padding: 12, border: `1px solid ${a.color}33` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: a.color, marginBottom: 6 }}>{a.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: perfColor(p2), fontFamily: FM }}>{p2}%</div>
                <div style={{ height: 3, background: C.card, borderRadius: 999, overflow: "hidden", margin: "6px 0" }}><div style={{ height: "100%", width: `${p2}%`, background: perfColor(p2), borderRadius: 999 }} /></div>
                <div style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>meta 85% <span style={{ color: diff >= 0 ? "#34D399" : "#F87171" }}>{diff >= 0 ? `+${diff}pp` : `${diff}pp`}</span></div>
                <div style={{ fontSize: 10, color: C.text3, fontFamily: FM, marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {CATS.map((cat) => <span key={cat.id} style={{ color: cat.color }}>{cat.short}:{st[cat.id] || 0}</span>)}
                </div>
              </div>
            ); })}
          </div>
        </div>

        {ev > 0 && (
          <div style={{ background: "#1A0A06", border: `1px solid ${CATS[2].color}33`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: CATS[2].color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: CATS[2].color }}>Errei mas já estudei — revisar com urgência ({ev})</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {AREAS.map((a) => { const qs = evByArea[a.id]; if (!qs.length) return null; return (
                <div key={a.id}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: a.color, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{a.label}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {qs.map((q) => (
                      <div key={q.n} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", background: CATS[2].color + "0D", borderRadius: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: CATS[2].color, fontFamily: FM, minWidth: 24 }}>Q{q.n}</span>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: CATS[2].color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, flex: 1 }}>{q.theme}</span>
                        {q.schedule && <span style={{ fontSize: 10, color: C.blue, fontFamily: FM, background: C.blue + "14", padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>📅 {q.schedule.semana}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ); })}
            </div>
          </div>
        )}

        {en > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${CATS[3].color}33`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: CATS[3].color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: CATS[3].color }}>Nunca estudei — {en} gaps a cobrir</span>
            </div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: FM, marginBottom: 12 }}>Prevalência: Unicamp · USP-SP · UNIFESP · SUS-SP · IAMSPE · ISCMSP</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {AREAS.map((a) => {
                const qs = enByArea[a.id]; if (!qs.length) return null;
                const sorted = [...qs.map((q) => ({ ...q, p: NMAP[q.n] || "baixa" }))].sort((x, y) => (PORD[x.p] ?? 3) - (PORD[y.p] ?? 3));
                return (
                  <div key={a.id}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: a.color, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{a.label}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {sorted.map((q) => { const st2 = PSTYLE[q.p] || PSTYLE["baixa"]; return (
                        <div key={q.n} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 10px", background: st2.color + "10", borderRadius: 8 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: CATS[3].color, flexShrink: 0 }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: st2.color, fontFamily: FM, minWidth: 64, flexShrink: 0 }}>{st2.label}</span>
                          <span style={{ fontSize: 12, flex: 1 }}>{q.theme}</span>
                          {q.schedule && <span style={{ fontSize: 10, color: C.blue, fontFamily: FM, background: C.blue + "14", padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>📅 {q.schedule.semana}</span>}
                        </div>
                      ); })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>}
    </div>
  );
}
