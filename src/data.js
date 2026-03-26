// ── AREAS (5 medical specialties) ────────────────────────────────────────
export const AREAS = [
  { id: "clinica",    label: "Clinica Medica",          short: "CM",   color: "#3B82F6" },
  { id: "cirurgia",   label: "Cirurgia",                short: "CIR",  color: "#22C55E" },
  { id: "ped",        label: "Pediatria",               short: "PED",  color: "#EAB308" },
  { id: "go",         label: "Ginecologia e Obstetricia", short: "GO",  color: "#A855F7" },
  { id: "preventiva", label: "Medicina Preventiva",     short: "PREV", color: "#14B8A6" },
];

// Map area.id -> area object
export const areaMap = Object.fromEntries(AREAS.map((a) => [a.id, a]));

// Map short code -> area.id
export const AREA_SHORT_MAP = Object.fromEntries(AREAS.map((a) => [a.short, a.id]));

// ── SPACED REPETITION INTERVALS ─────────────────────────────────────────
export const INTERVALS = [1, 3, 7, 14, 30, 60, 90];

export const INT_LABELS = [
  "D+1", "D+3", "D+7", "D+14", "D+30", "D+60", "D+90",
];

// ── SEMANAS (weekly class schedule) ─────────────────────────────────────
export const SEMANAS = [
  {
    semana: "S1",
    aulas: [
      { area: "CM",  topic: "Hipertensao Arterial Sistemica" },
      { area: "CIR", topic: "Abdome Agudo" },
    ],
  },
  {
    semana: "S2",
    aulas: [
      { area: "PED",  topic: "Crescimento e Desenvolvimento" },
      { area: "GO",   topic: "Pre-natal de Baixo Risco" },
    ],
  },
  {
    semana: "S3",
    aulas: [
      { area: "PREV", topic: "Epidemiologia e Indicadores de Saude" },
      { area: "CM",   topic: "Diabetes Mellitus" },
    ],
  },
  {
    semana: "S4",
    aulas: [
      { area: "CIR",  topic: "Trauma Toracico" },
      { area: "PED",  topic: "Infeccoes de Vias Aereas Superiores" },
    ],
  },
];

// Saturday start dates for each week
export const SEM_SAT = {
  S1: "2026-03-21",
  S2: "2026-03-28",
  S3: "2026-04-04",
  S4: "2026-04-11",
};

// ── SEED DATA ───────────────────────────────────────────────────────────
export const SEED_REVIEWS = [
  { area: "clinica",    theme: "Hipertensao Arterial Sistemica", intervalIdx: 2, nextDue: "2026-03-28", lastStudied: "2026-03-21", lastPerf: 80 },
  { area: "cirurgia",   theme: "Abdome Agudo",                  intervalIdx: 1, nextDue: "2026-03-27", lastStudied: "2026-03-21", lastPerf: 72 },
  { area: "ped",        theme: "Crescimento e Desenvolvimento", intervalIdx: 0, nextDue: "2026-03-29", lastStudied: "2026-03-28", lastPerf: 90 },
  { area: "go",         theme: "Pre-natal de Baixo Risco",      intervalIdx: 0, nextDue: "2026-03-29", lastStudied: "2026-03-28", lastPerf: 65 },
  { area: "preventiva", theme: "Epidemiologia e Indicadores de Saude", intervalIdx: 0, nextDue: "2026-04-05", lastStudied: "2026-04-04", lastPerf: 88 },
];

export const SEED_LOGS = [
  { date: "2026-03-21", area: "clinica",  theme: "Hipertensao Arterial Sistemica", total: 20, acertos: 16, erros: 4 },
  { date: "2026-03-21", area: "cirurgia", theme: "Abdome Agudo",                  total: 15, acertos: 11, erros: 4 },
  { date: "2026-03-28", area: "ped",      theme: "Crescimento e Desenvolvimento", total: 18, acertos: 16, erros: 2 },
];

// ── UNICAMP 2024 EXAM BUILDER ───────────────────────────────────────────
export function buildUnicamp2024Exam() {
  const total = 120;
  const qDetails = {};
  for (let n = 1; n <= total; n++) {
    let area;
    if (n <= 24) area = "clinica";
    else if (n <= 48) area = "cirurgia";
    else if (n <= 72) area = "ped";
    else if (n <= 96) area = "go";
    else area = "preventiva";
    qDetails[n] = { area, theme: "" };
  }
  return {
    title: "Unicamp 2024 - Prova de Residencia",
    date: "2024-11-17",
    total,
    acertos: 0,
    erros: 0,
    answered: 0,
    qDetails,
  };
}

// ── UNICAMP THEMES (lookup for search) ──────────────────────────────────
export const UNICAMP_THEMES = [
  { area: "clinica",    theme: "Insuficiencia Cardiaca" },
  { area: "clinica",    theme: "Pneumonia Comunitaria" },
  { area: "cirurgia",   theme: "Colecistite Aguda" },
  { area: "ped",        theme: "Bronquiolite" },
  { area: "go",         theme: "Doenca Hipertensiva na Gestacao" },
  { area: "preventiva", theme: "Vigilancia Epidemiologica" },
];

// ── MED SCHEDULE (topic matching for mapThemeToSchedule) ────────────────
export const MED_SCHEDULE = [
  { week: "S1", topics: ["Hipertensao Arterial Sistemica", "Abdome Agudo"] },
  { week: "S2", topics: ["Crescimento e Desenvolvimento", "Pre-natal de Baixo Risco"] },
  { week: "S3", topics: ["Epidemiologia e Indicadores de Saude", "Diabetes Mellitus"] },
  { week: "S4", topics: ["Trauma Toracico", "Infeccoes de Vias Aereas Superiores"] },
];

// ── KNOWN PDFs (searchable PDF index) ───────────────────────────────────
export const KNOWN_PDFS = [
  { key: "hipertensao arterial sistemica diretrizes", label: "Diretrizes HAS 2024", url: "" },
  { key: "diabetes mellitus tratamento", label: "Consenso DM - SBD", url: "" },
  { key: "pre natal baixo risco manual", label: "Manual Pre-natal MS", url: "" },
  { key: "abdome agudo diagnostico", label: "Abdome Agudo - Revisao", url: "" },
];

// ── CATEGORIES (for catColor) ───────────────────────────────────────────
export const CATS = [
  { id: "aula",    label: "Aula",    color: "#3B82F6" },
  { id: "revisao", label: "Revisao", color: "#F59E0B" },
  { id: "simulado", label: "Simulado", color: "#8B5CF6" },
  { id: "questoes", label: "Questoes", color: "#10B981" },
];
