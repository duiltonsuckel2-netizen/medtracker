import { uid, perc } from "./utils.js";
// ── DATA CONSTANTS ─────────────────────────────────────────────────────────

export const AREAS = [
  { id: "clinica", label: "Clínica Médica", short: "CM", color: "#FACC15" },
  { id: "cirurgia", label: "Cirurgia", short: "CIR", color: "#FB923C" },
  { id: "preventiva", label: "Preventiva", short: "PREV", color: "#2DD4BF" },
  { id: "go", label: "G.O.", short: "GO", color: "#F472B6" },
  { id: "ped", label: "Pediatria", short: "PED", color: "#60A5FA" },
];
export const INTERVALS = [1, 7, 14, 30, 60, 90, 120, 180];
export const INT_LABELS = ["1d", "7d", "14d", "1m", "2m", "3m", "4m", "6m"];
export const BENCHMARKS = { clinica: 85, cirurgia: 85, preventiva: 85, go: 85, ped: 85 };
export const areaMap = Object.fromEntries(AREAS.map((a) => [a.id, a]));
export const AREA_SHORT_MAP = { CM: "clinica", CIR: "cirurgia", GO: "go", PED: "ped", PREV: "preventiva" };

// ── SEED DATA — gerado do export Notion fresco (24/03/2026) ──────────────
export const SEED_REVIEWS = [
  // ── Dados do Notion MED database — AULA PRINCIPAL confirmada via API 24/03/2026 ──
  { area: "clinica",    theme: "Sd. Metabólica I — HAS e Dislipidemia (Sem. 08)",                    lastPerf: 78, intervalIndex: 1, nextDue: "2026-03-24", lastStudied: "2026-03-10" },
  { area: "cirurgia",   theme: "Hemorragia Digestiva II — Proctologia (Sem. 08)",                    lastPerf: 85, intervalIndex: 2, nextDue: "2026-04-09", lastStudied: "2026-03-24" },
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

export const SEED_LOGS = [
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
  {date:"2026-03-24", area:"cirurgia",   theme:"Hemorragia digestiva II",          total:20, acertos:17, pct:85},
];

export const UNICAMP_THEMES = { 1: "Pneumonia/Sepse (Anemia Falciforme)", 2: "HAS e Sd. Metabólica", 3: "Profilaxia Antirrábica", 4: "Profilaxia Antirrábica", 5: "Artrite Psoriásica", 6: "IC/HTP", 7: "Insuf. Respiratória/IOT", 8: "Neuropatia/Anemia Megaloblástica", 9: "Anafilaxia", 10: "Pericardite", 11: "Rabdomiólise", 12: "Micobacteriose não tuberculosa", 13: "Hematoma Extradural/TCE", 14: "Hematoma Extradural", 15: "Tumor de parótida", 16: "Doença de Hirschsprung", 17: "Diabetes Insipidus Central", 18: "Nódulo Sister Mary Joseph/Ca gástrico", 19: "Dissecção de Aorta", 20: "Hemorragia classe III/ATLS", 21: "Empiema pleural", 22: "Estenose traqueia pós-intubação", 23: "Coledocolitíase/Colangite", 24: "HPB", 25: "Sd. Nefrótica", 26: "Anafilaxia pediátrica", 27: "Intox. por escorpião", 28: "RCP Pediátrica", 29: "Leucemia Aguda (Down)", 30: "Intussuscepção", 31: "Reanimação neonatal", 32: "Válvula de uretra posterior", 33: "Constipação/Encoprese", 34: "Sífilis congênita", 35: "Hipotireoidismo pediátrico", 36: "Pitiríase Rósea", 37: "TH na menopausa", 38: "RCIU/DG", 39: "Sífilis gestação/PCDT", 40: "Obstrução tubária/HSG", 41: "Acretismo placentário", 42: "HELLP", 43: "NIV/HPV", 44: "RCIU/Doppler", 45: "ACO - amenorreia de privação", 46: "IUE", 47: "Derrame pleural/Ca mama", 48: "Cisto ovariano", 49: "Estudo ecológico", 50: "Estudo transversal", 51: "Bradford Hill", 52: "Dec. óbito - linha A", 53: "Prevenção quaternária", 54: "Regionalização SUS", 55: "Freq. epidemiológica", 56: "Indicador epidemiológico", 57: "Prev. quaternária/sobrediagnóstico", 58: "PTS", 59: "Tx mortalidade bruta", 60: "Tx mortalidade padronizada", 61: "Artrite séptica", 62: "CAD", 63: "Wernicke/tiamina", 64: "Opioides/naloxona", 65: "Pleurite tuberculosa", 66: "Miastenia gravis", 67: "Hipersensibilidade alopurinol", 68: "Sífilis reinfecção", 69: "Meningite/dexametasona", 70: "Pré-diabetes", 71: "Intolerância lactose/SII", 72: "Feocromocitoma", 73: "Mixoma atrial", 74: "Hidrocele comunicante", 75: "Ác. tranexâmico/trauma", 76: "Ruptura de aorta", 77: "Lesão vascular poplítea", 78: "Choque neurogênico", 79: "Dose máxima lidocaína", 80: "Válvula biológica/gestação", 81: "Drenagem pleural incorreta", 82: "Abdome agudo perfurativo", 83: "Ca tireoide/sobrediagnóstico", 84: "Hemangioma hepático", 85: "ITU lactente", 86: "Febre maculosa", 87: "Hiperplasia adrenal congênita", 88: "RCP neonatal", 89: "Hepatite A", 90: "Puberdade precoce", 91: "Corpo estranho brônquio", 92: "Hepatite B/profilaxia vertical", 93: "Varicela materna/RN", 94: "Epifisiólise/SCFE", 95: "Baixa estatura familiar", 96: "Coqueluche", 97: "Vacinação gestação/dTpa", 98: "Vaginose bacteriana", 99: "DG/insulina puerpério", 100: "Mamografia BI-RADS", 101: "Partograma", 102: "Fórceps", 103: "RPMO pré-termo", 104: "ACO/migrânea", 105: "DPP", 106: "Células glandulares atípicas", 107: "Insuf. ovariana prematura", 108: "Sangramento pós-menopausa", 109: "Prev. lombalgia", 110: "Organofosforado", 111: "Eixos Saúde Trabalhador", 112: "Modelo atenção SUS", 113: "Coorte", 114: "Diarreia aguda", 115: "Bioética deliberativa", 116: "Atropina/organofosforado", 117: "SINAN", 118: "Colinesterase eritrocitária", 119: "Catarata/radiação", 120: "Silicose/Caplan" };


export function areaOf(n) {
  if ((n >= 1 && n <= 12) || (n >= 61 && n <= 72)) return "clinica";
  if ((n >= 13 && n <= 24) || (n >= 73 && n <= 84)) return "cirurgia";
  if ((n >= 25 && n <= 36) || (n >= 85 && n <= 96)) return "ped";
  if ((n >= 37 && n <= 48) || (n >= 97 && n <= 108)) return "go";
  if ((n >= 49 && n <= 60) || (n >= 109 && n <= 120)) return "preventiva";
}

export function buildUnicamp2024Exam() {
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

export const SEMANAS = [
  // ── Semanas 01–06 (já estudadas) ──
  { semana: "Sem. 01", aulas: [{ area: "CM", topic: "Sd. Ictérica — Hepatites" }, { area: "PED", topic: "Doenças Exantemáticas" }] },
  { semana: "Sem. 02", aulas: [{ area: "CM", topic: "Sd. Ictérica — Vias Biliares" }, { area: "CIR", topic: "Hipertensão Porta" }] },
  { semana: "Sem. 03", aulas: [{ area: "CIR", topic: "Insuficiência Hepática" }, { area: "GO", topic: "IST — Úlceras Genitais" }] },
  { semana: "Sem. 04", aulas: [{ area: "CIR", topic: "Sd. Disfágica — Esôfago" }, { area: "PED", topic: "Sd. Respiratórias I" }] },
  { semana: "Sem. 05", aulas: [{ area: "CIR", topic: "Sd. Dispéptica" }, { area: "PED", topic: "Sd. Respiratórias II" }] },
  { semana: "Sem. 06", aulas: [{ area: "CM", topic: "Sd. Diarreica" }, { area: "CIR", topic: "Hemorragia Digestiva I" }] },
  // ── Semanas 08–10 (recentes) ──
  { semana: "Sem. 08", aulas: [{ area: "CM", topic: "HAS e Sd. Metabólica" }, { area: "CIR", topic: "Hemorragia Digestiva II" }] },
  { semana: "Sem. 09", aulas: [{ area: "PREV", topic: "SUS — APS e Financiamento" }, { area: "GO", topic: "Sangramentos 1º Trimestre" }] },
  { semana: "Sem. 10", aulas: [{ area: "CIR", topic: "Dor Abdominal / Abdome Agudo" }, { area: "GO", topic: "Sangramentos 2ª Metade" }] },
  // ── Semanas 11–16 (próximas) ──
  { semana: "Sem. 11", aulas: [{ area: "CM", topic: "Sd. Metabólica II — Diabetes" }, { area: "PED", topic: "ITU / Imunização" }] },
  { semana: "Sem. 12", aulas: [{ area: "CM", topic: "Sd. Endócrinas — Tireoide" }, { area: "CIR", topic: "Hérnias" }] },
  { semana: "Sem. 13", aulas: [{ area: "CM", topic: "Sd. Endócrinas — Suprarrenal" }, { area: "GO", topic: "Oncologia Ginecológica" }] },
  { semana: "Sem. 14", aulas: [{ area: "CM", topic: "Terapia Intensiva" }, { area: "PREV", topic: "Sistemas de Informação" }] },
  { semana: "Sem. 15", aulas: [{ area: "CM", topic: "Sd. Bacterianas — Pneumonia / Influenza" }, { area: "GO", topic: "Oncologia — Colo e Vulva" }] },
  { semana: "Sem. 16", aulas: [{ area: "PREV", topic: "Estudos Epidemiológicos" }, { area: "GO", topic: "Doenças Clínicas na Gravidez" }] },
  // ── Semanas 17–26 ──
  { semana: "Sem. 17", aulas: [{ area: "CM", topic: "Infecções Hepáticas e Cateter" }, { area: "CM", topic: "HIV e Imunologia" }] },
  { semana: "Sem. 18", aulas: [{ area: "CM", topic: "Doenças Infecciosas Emergentes" }, { area: "PREV", topic: "Bioestatística — Medidas" }] },
  { semana: "Sem. 19", aulas: [{ area: "CM", topic: "Micoses Sistêmicas" }, { area: "PED", topic: "Neonatologia — Triagem e Exame" }] },
  { semana: "Sem. 20", aulas: [{ area: "PED", topic: "Neonatologia — Enterocolite" }, { area: "CIR", topic: "Tumores Intestinais e Apêndice" }] },
  { semana: "Sem. 21", aulas: [{ area: "CIR", topic: "Urologia Oncológica" }, { area: "PED", topic: "Tumores Abdominais Pediátricos" }] },
  { semana: "Sem. 22", aulas: [{ area: "PED", topic: "Desenvolvimento Neuropsicomotor" }, { area: "CM", topic: "Pneumopatias Intersticiais" }] },
  { semana: "Sem. 23", aulas: [{ area: "GO", topic: "TEV e Transtornos do Humor" }, { area: "CM", topic: "Cuidados Paliativos" }] },
  { semana: "Sem. 24", aulas: [{ area: "CM", topic: "Tópicos Especiais" }, { area: "PREV", topic: "Doenças Infecciosas — Glossário" }] },
  { semana: "Sem. 25", aulas: [{ area: "CM", topic: "Neurologia Vascular — AVC / AIT" }, { area: "PREV", topic: "Saúde do Trabalhador" }] },
  { semana: "Sem. 26", aulas: [{ area: "CM", topic: "Doenças Neuromusculares" }, { area: "GO", topic: "Ginecologia Geral" }] },
  // ── Semanas 27–36 ──
  { semana: "Sem. 27", aulas: [{ area: "CM", topic: "Neuro-oncologia e Infecções SNC" }, { area: "GO", topic: "Anatomia Pélvica / SPM" }] },
  { semana: "Sem. 28", aulas: [{ area: "CM", topic: "Nefrologia I — Glomerulopatias" }, { area: "CIR", topic: "Urologia — Disfunção e Hérnia Disco" }] },
  { semana: "Sem. 29", aulas: [{ area: "CM", topic: "Nefrologia II — Tubulointersticial" }, { area: "CIR", topic: "Trauma I — Cervical e Face" }] },
  { semana: "Sem. 30", aulas: [{ area: "CM", topic: "Distúrbios Ácido-Base" }, { area: "CIR", topic: "Trauma II — Abdome e Coluna" }] },
  { semana: "Sem. 31", aulas: [{ area: "CM", topic: "Hematologia I — Anemias Raras" }, { area: "CM", topic: "Hematologia II" }] },
  { semana: "Sem. 32", aulas: [{ area: "CM", topic: "Hematologia III — Mieloproliferativas" }, { area: "GO", topic: "Climatério e Infertilidade" }] },
  { semana: "Sem. 33", aulas: [{ area: "CM", topic: "Infectologia — Toxoplasmose / CMV" }, { area: "GO", topic: "Gênero e Dismenorreia" }] },
  { semana: "Sem. 34", aulas: [{ area: "CM", topic: "Hemostasia — Trombofilias" }, { area: "CM", topic: "Especial I" }] },
  { semana: "Sem. 35", aulas: [{ area: "CM", topic: "Reumatologia I — Artrites" }, { area: "CM", topic: "Especial II" }] },
  { semana: "Sem. 36", aulas: [{ area: "CM", topic: "Reumatologia II" }, { area: "CM", topic: "Reumatologia III — Sjögren / Fibromialgia" }] },
  // ── Semanas 37–46 ──
  { semana: "Sem. 37", aulas: [{ area: "CM", topic: "Hipertensão Pulmonar" }, { area: "GO", topic: "Mecanismo de Parto / Cesárea" }] },
  { semana: "Sem. 38", aulas: [{ area: "CM", topic: "Cardiologia I — Pós-IAM / Pericardite" }, { area: "CM", topic: "Cardiologia II" }] },
  { semana: "Sem. 39", aulas: [{ area: "CM", topic: "Arritmias e Marca-Passo" }, { area: "CM", topic: "Cardiologia III" }] },
  { semana: "Sem. 40", aulas: [{ area: "CM", topic: "Cardiomiopatias" }, { area: "PED", topic: "Pediatria Geral" }] },
  { semana: "Sem. 41", aulas: [{ area: "PED", topic: "Nutrição Infantil" }, { area: "CIR", topic: "Suporte Nutricional / ERAS" }] },
  { semana: "Sem. 42", aulas: [{ area: "CIR", topic: "Cirurgia Geral" }, { area: "PREV", topic: "Acidentes — Animais Peçonhentos" }] },
  { semana: "Sem. 43", aulas: [{ area: "CIR", topic: "Cirurgia Plástica / Cicatrização" }, { area: "CM", topic: "Intoxicações e Suicídio" }] },
  { semana: "Sem. 44", aulas: [{ area: "CIR", topic: "Cirurgia Cabeça e Pescoço" }, { area: "CIR", topic: "Proctologia — Cisto Pilonidal" }] },
  { semana: "Sem. 45", aulas: [{ area: "CM", topic: "Dermatologia — Anafilaxia / Piodermites" }, { area: "CM", topic: "Dermatologia II" }] },
  { semana: "Sem. 46", aulas: [{ area: "CIR", topic: "Cirurgia Vascular I" }, { area: "CIR", topic: "Cirurgia Vascular II" }] },
];

export const SEM_SAT = {
  // Semanas passadas (Jan–Mar 2026)
  "Sem. 01": "2026-01-24", "Sem. 02": "2026-01-31", "Sem. 03": "2026-02-07",
  "Sem. 04": "2026-02-14", "Sem. 05": "2026-02-21", "Sem. 06": "2026-02-28",
  "Sem. 08": "2026-03-07", "Sem. 09": "2026-03-14", "Sem. 10": "2026-03-21",
  // Semanas futuras (Mar–Nov 2026)
  "Sem. 11": "2026-03-28", "Sem. 12": "2026-04-04", "Sem. 13": "2026-04-11",
  "Sem. 14": "2026-04-18", "Sem. 15": "2026-04-25", "Sem. 16": "2026-05-02",
  "Sem. 17": "2026-05-09", "Sem. 18": "2026-05-16", "Sem. 19": "2026-05-23",
  "Sem. 20": "2026-05-30", "Sem. 21": "2026-06-06", "Sem. 22": "2026-06-13",
  "Sem. 23": "2026-06-20", "Sem. 24": "2026-06-27", "Sem. 25": "2026-07-04",
  "Sem. 26": "2026-07-11", "Sem. 27": "2026-07-18", "Sem. 28": "2026-07-25",
  "Sem. 29": "2026-08-01", "Sem. 30": "2026-08-08", "Sem. 31": "2026-08-15",
  "Sem. 32": "2026-08-22", "Sem. 33": "2026-08-29", "Sem. 34": "2026-09-05",
  "Sem. 35": "2026-09-12", "Sem. 36": "2026-09-19", "Sem. 37": "2026-09-26",
  "Sem. 38": "2026-10-03", "Sem. 39": "2026-10-10", "Sem. 40": "2026-10-17",
  "Sem. 41": "2026-10-24", "Sem. 42": "2026-10-31", "Sem. 43": "2026-11-07",
  "Sem. 44": "2026-11-14", "Sem. 45": "2026-11-21", "Sem. 46": "2026-11-28",
};

// Categorias
export const CATS = [
  { id: "soube", label: "Soube", short: "S", color: "#22C55E", desc: "Acertei pq sabia" },
  { id: "chutou", label: "Chutei/acertei", short: "C", color: "#F59E0B", desc: "Acertei pq chutei" },
  { id: "errou_viu", label: "Errei (já vi)", short: "EV", color: "#EF4444", desc: "Errei e deveria saber" },
  { id: "errou_nao", label: "Errei (nunca vi)", short: "EN", color: "#F97316", desc: "Errei pq nunca vi" },
];
export const CAT_CYCLE = ["soube", "chutou", "errou_viu", "errou_nao", null];

export const MED_SCHEDULE = [
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

let _examThemesCache = null;
export function getExamThemesDB() {
  if (_examThemesCache) return Promise.resolve(_examThemesCache);
  return import("./examThemesDB.js").then(m => { _examThemesCache = m.default; return _examThemesCache; });
}
export const EXAM_THEMES_DB = null;


export const KNOWN_PDFS = [
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
