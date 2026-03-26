import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock data.js since it doesn't exist yet
vi.mock("./data.js", () => ({
  INTERVALS: [1, 3, 7, 14, 30, 60, 120],
  AREAS: [
    { id: "clinica", name: "Clínica Médica" },
    { id: "cirurgia", name: "Cirurgia" },
    { id: "ped", name: "Pediatria" },
    { id: "go", name: "Ginecologia e Obstetrícia" },
    { id: "preventiva", name: "Preventiva" },
  ],
  areaMap: {
    clinica: { short: "CM" },
    cirurgia: { short: "CIR" },
    ped: { short: "PED" },
    go: { short: "GO" },
    preventiva: { short: "PREV" },
  },
  SEMANAS: [{ semana: "S1", aulas: [{ topic: "Cardio", area: "CM" }] }],
  SEM_SAT: { S1: "2025-01-04" },
  UNICAMP_THEMES: [],
  MED_SCHEDULE: [
    { week: 1, topics: ["cardiologia básica", "hipertensão arterial"] },
    { week: 2, topics: ["pneumologia", "asma brônquica"] },
  ],
  KNOWN_PDFS: [
    { key: "cardiologia", url: "https://example.com/cardio.pdf" },
    { key: "pneumologia", url: "https://example.com/pneumo.pdf" },
    { key: "nefrologia", url: "https://example.com/nefro.pdf" },
  ],
  CATS: [
    { id: "urgente", color: "#EF4444" },
    { id: "importante", color: "#EAB308" },
  ],
}));

// Mock theme.js
vi.mock("./theme.js", () => ({
  C: { border2: "#38383E" },
}));

import {
  today,
  addDays,
  diffDays,
  perc,
  uid,
  fmtDate,
  perfColor,
  perfLabel,
  nxtIdx,
  weekDates,
  extractJSON,
  defaultAreaForQuestion,
  buildDefaultQDetails,
  mapThemeToSchedule,
  searchKnownPdf,
  catColor,
  callClaude,
  syncWithNotion,
} from "./utils.js";

// ── today() ──────────────────────────────────────────────────────────────────
describe("today()", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("matches the current date", () => {
    const now = new Date().toISOString().slice(0, 10);
    expect(today()).toBe(now);
  });
});

// ── addDays() ────────────────────────────────────────────────────────────────
describe("addDays()", () => {
  it("adds positive days", () => {
    expect(addDays("2025-01-01", 5)).toBe("2025-01-06");
  });
  it("adds negative days", () => {
    expect(addDays("2025-01-10", -3)).toBe("2025-01-07");
  });
  it("handles month rollover", () => {
    expect(addDays("2025-01-30", 3)).toBe("2025-02-02");
  });
  it("handles year rollover", () => {
    expect(addDays("2025-12-30", 5)).toBe("2026-01-04");
  });
  it("adds zero days", () => {
    expect(addDays("2025-06-15", 0)).toBe("2025-06-15");
  });
});

// ── diffDays() ───────────────────────────────────────────────────────────────
describe("diffDays()", () => {
  it("returns positive diff when a > b", () => {
    expect(diffDays("2025-01-10", "2025-01-05")).toBe(5);
  });
  it("returns negative diff when a < b", () => {
    expect(diffDays("2025-01-05", "2025-01-10")).toBe(-5);
  });
  it("returns zero for same date", () => {
    expect(diffDays("2025-03-15", "2025-03-15")).toBe(0);
  });
  it("handles cross-month diff", () => {
    expect(diffDays("2025-02-01", "2025-01-30")).toBe(2);
  });
});

// ── perc() ───────────────────────────────────────────────────────────────────
describe("perc()", () => {
  it("calculates percentage correctly", () => {
    expect(perc(8, 10)).toBe(80);
  });
  it("returns 0 for zero total", () => {
    expect(perc(5, 0)).toBe(0);
  });
  it("rounds to nearest integer", () => {
    expect(perc(1, 3)).toBe(33);
  });
  it("handles 100%", () => {
    expect(perc(10, 10)).toBe(100);
  });
  it("handles 0 correct out of total", () => {
    expect(perc(0, 10)).toBe(0);
  });
});

// ── uid() ────────────────────────────────────────────────────────────────────
describe("uid()", () => {
  it("returns a string of 8 chars", () => {
    const id = uid();
    expect(typeof id).toBe("string");
    expect(id.length).toBe(8);
  });
  it("generates unique ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBe(100);
  });
});

// ── fmtDate() ────────────────────────────────────────────────────────────────
describe("fmtDate()", () => {
  it("formats date as DD/MM", () => {
    const result = fmtDate("2025-03-15");
    expect(result).toMatch(/15\/03/);
  });
  it("returns empty string for falsy input", () => {
    expect(fmtDate("")).toBe("");
    expect(fmtDate(null)).toBe("");
    expect(fmtDate(undefined)).toBe("");
  });
});

// ── perfColor() ──────────────────────────────────────────────────────────────
describe("perfColor()", () => {
  it("returns green for >= 85", () => {
    expect(perfColor(85)).toBe("#22C55E");
    expect(perfColor(100)).toBe("#22C55E");
  });
  it("returns yellow for >= 60 and < 85", () => {
    expect(perfColor(60)).toBe("#EAB308");
    expect(perfColor(84)).toBe("#EAB308");
  });
  it("returns red for < 60", () => {
    expect(perfColor(59)).toBe("#EF4444");
    expect(perfColor(0)).toBe("#EF4444");
  });
});

// ── perfLabel() ──────────────────────────────────────────────────────────────
describe("perfLabel()", () => {
  it("returns 'Bom' for >= 85", () => {
    expect(perfLabel(85)).toBe("Bom");
    expect(perfLabel(100)).toBe("Bom");
  });
  it("returns 'Regular' for >= 60 and < 85", () => {
    expect(perfLabel(60)).toBe("Regular");
    expect(perfLabel(84)).toBe("Regular");
  });
  it("returns 'Fraco' for < 60", () => {
    expect(perfLabel(59)).toBe("Fraco");
    expect(perfLabel(0)).toBe("Fraco");
  });
});

// ── nxtIdx() ─────────────────────────────────────────────────────────────────
describe("nxtIdx()", () => {
  it("advances index for >= 85% performance", () => {
    expect(nxtIdx(0, 85)).toBe(1);
    expect(nxtIdx(2, 90)).toBe(3);
  });
  it("keeps index for 75-84%", () => {
    expect(nxtIdx(3, 75)).toBe(3);
    expect(nxtIdx(3, 84)).toBe(3);
  });
  it("decreases index for < 75%", () => {
    expect(nxtIdx(3, 74)).toBe(2);
    expect(nxtIdx(3, 50)).toBe(2);
  });
  it("clamps at max index", () => {
    expect(nxtIdx(6, 100)).toBe(6); // INTERVALS.length - 1
  });
  it("clamps at 0", () => {
    expect(nxtIdx(0, 50)).toBe(0);
  });
});

// ── weekDates() ──────────────────────────────────────────────────────────────
describe("weekDates()", () => {
  it("returns 7 days starting from saturday", () => {
    const dates = weekDates("2025-01-04"); // a Saturday
    expect(Object.keys(dates)).toEqual(["sab", "dom", "seg", "ter", "qua", "qui", "sex"]);
    expect(dates.sab).toBe("2025-01-04");
    expect(dates.dom).toBe("2025-01-05");
    expect(dates.seg).toBe("2025-01-06");
    expect(dates.ter).toBe("2025-01-07");
    expect(dates.qua).toBe("2025-01-08");
    expect(dates.qui).toBe("2025-01-09");
    expect(dates.sex).toBe("2025-01-10");
  });
});

// ── extractJSON() ────────────────────────────────────────────────────────────
describe("extractJSON()", () => {
  it("extracts JSON from text with surrounding content", () => {
    const raw = 'Some text before {"key": "value"} some text after';
    expect(extractJSON(raw)).toEqual({ key: "value" });
  });
  it("handles nested JSON", () => {
    const raw = '```json\n{"a": {"b": 1}}\n```';
    expect(extractJSON(raw)).toEqual({ a: { b: 1 } });
  });
  it("throws for no JSON found", () => {
    expect(() => extractJSON("no json here")).toThrow("Nenhum JSON encontrado");
  });
  it("throws for invalid JSON", () => {
    expect(() => extractJSON("{invalid json}")).toThrow();
  });
});

// ── defaultAreaForQuestion() ─────────────────────────────────────────────────
describe("defaultAreaForQuestion()", () => {
  describe("with total=120", () => {
    it("assigns clinica for questions 1-24", () => {
      expect(defaultAreaForQuestion(1, 120)).toBe("clinica");
      expect(defaultAreaForQuestion(24, 120)).toBe("clinica");
    });
    it("assigns cirurgia for questions 25-48", () => {
      expect(defaultAreaForQuestion(25, 120)).toBe("cirurgia");
      expect(defaultAreaForQuestion(48, 120)).toBe("cirurgia");
    });
    it("assigns ped for questions 49-72", () => {
      expect(defaultAreaForQuestion(49, 120)).toBe("ped");
      expect(defaultAreaForQuestion(72, 120)).toBe("ped");
    });
    it("assigns go for questions 73-96", () => {
      expect(defaultAreaForQuestion(73, 120)).toBe("go");
      expect(defaultAreaForQuestion(96, 120)).toBe("go");
    });
    it("assigns preventiva for questions 97-120", () => {
      expect(defaultAreaForQuestion(97, 120)).toBe("preventiva");
      expect(defaultAreaForQuestion(120, 120)).toBe("preventiva");
    });
  });
  describe("with other totals (default 100-question layout)", () => {
    it("assigns clinica for 1-20", () => {
      expect(defaultAreaForQuestion(1, 100)).toBe("clinica");
      expect(defaultAreaForQuestion(20, 100)).toBe("clinica");
    });
    it("assigns cirurgia for 21-40", () => {
      expect(defaultAreaForQuestion(21, 100)).toBe("cirurgia");
      expect(defaultAreaForQuestion(40, 100)).toBe("cirurgia");
    });
    it("assigns ped for 41-60", () => {
      expect(defaultAreaForQuestion(41, 100)).toBe("ped");
    });
    it("assigns go for 61-80", () => {
      expect(defaultAreaForQuestion(61, 100)).toBe("go");
    });
    it("assigns preventiva for 81+", () => {
      expect(defaultAreaForQuestion(81, 100)).toBe("preventiva");
    });
  });
});

// ── buildDefaultQDetails() ───────────────────────────────────────────────────
describe("buildDefaultQDetails()", () => {
  it("builds details for all questions", () => {
    const details = buildDefaultQDetails(5);
    expect(Object.keys(details).length).toBe(5);
    expect(details[1]).toEqual({ area: "clinica", theme: "" });
    expect(details[5]).toEqual({ area: "clinica", theme: "" });
  });
  it("assigns correct areas for 120 questions", () => {
    const details = buildDefaultQDetails(120);
    expect(details[1].area).toBe("clinica");
    expect(details[25].area).toBe("cirurgia");
    expect(details[49].area).toBe("ped");
    expect(details[73].area).toBe("go");
    expect(details[97].area).toBe("preventiva");
  });
});

// ── mapThemeToSchedule() ─────────────────────────────────────────────────────
describe("mapThemeToSchedule()", () => {
  it("returns null for empty theme", () => {
    expect(mapThemeToSchedule("")).toBeNull();
    expect(mapThemeToSchedule(null)).toBeNull();
  });
  it("matches a theme to a schedule entry", () => {
    const result = mapThemeToSchedule("cardiologia básica");
    expect(result).not.toBeNull();
    expect(result.topics).toContain("cardiologia básica");
  });
  it("returns null for unmatched theme", () => {
    const result = mapThemeToSchedule("xyz tema desconhecido");
    expect(result).toBeNull();
  });
});

// ── searchKnownPdf() ─────────────────────────────────────────────────────────
describe("searchKnownPdf()", () => {
  it("returns all PDFs for empty query", () => {
    const result = searchKnownPdf("");
    expect(result.length).toBe(3);
  });
  it("returns all PDFs for short query", () => {
    const result = searchKnownPdf("a");
    expect(result.length).toBe(3);
  });
  it("filters PDFs by keyword", () => {
    const result = searchKnownPdf("cardio");
    expect(result.length).toBe(1);
    expect(result[0].key).toBe("cardiologia");
  });
  it("handles no matches", () => {
    const result = searchKnownPdf("dermatologia");
    expect(result.length).toBe(0);
  });
});

// ── catColor() ───────────────────────────────────────────────────────────────
describe("catColor()", () => {
  it("returns color for known category", () => {
    expect(catColor("urgente")).toBe("#EF4444");
    expect(catColor("importante")).toBe("#EAB308");
  });
  it("returns fallback for unknown category", () => {
    expect(catColor("unknown")).toBe("#38383E");
  });
});

// ── callClaude() ─────────────────────────────────────────────────────────────
describe("callClaude()", () => {
  it("throws API unavailable error", async () => {
    await expect(callClaude()).rejects.toThrow("API indisponível neste ambiente");
  });
});

// ── syncWithNotion() ─────────────────────────────────────────────────────────
describe("syncWithNotion()", () => {
  it("throws sync unavailable error", async () => {
    await expect(syncWithNotion()).rejects.toThrow("Sincronização com Notion indisponível");
  });
});
