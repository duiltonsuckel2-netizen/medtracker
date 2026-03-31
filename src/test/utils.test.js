import { describe, it, expect } from 'vitest';
import { today, addDays, diffDays, perc, uid, fmtDate, perfColor, perfLabel, nxtIdx, weekDates, extractJSON, defaultAreaForQuestion, buildDefaultQDetails } from '../utils.js';

describe('today()', () => {
  it('returns ISO date string YYYY-MM-DD', () => {
    const t = today();
    expect(t).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches current date', () => {
    const now = new Date();
    const expected = now.toISOString().slice(0, 10);
    expect(today()).toBe(expected);
  });
});

describe('addDays()', () => {
  it('adds positive days', () => {
    expect(addDays('2025-01-01', 5)).toBe('2025-01-06');
  });

  it('adds negative days', () => {
    expect(addDays('2025-01-05', -3)).toBe('2025-01-02');
  });

  it('crosses month boundary', () => {
    expect(addDays('2025-01-30', 3)).toBe('2025-02-02');
  });

  it('crosses year boundary', () => {
    expect(addDays('2025-12-30', 5)).toBe('2026-01-04');
  });

  it('handles zero days', () => {
    expect(addDays('2025-06-15', 0)).toBe('2025-06-15');
  });

  it('handles leap year', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-28', 2)).toBe('2024-03-01');
  });
});

describe('diffDays()', () => {
  it('returns positive difference', () => {
    expect(diffDays('2025-01-10', '2025-01-01')).toBe(9);
  });

  it('returns negative difference', () => {
    expect(diffDays('2025-01-01', '2025-01-10')).toBe(-9);
  });

  it('returns 0 for same date', () => {
    expect(diffDays('2025-01-01', '2025-01-01')).toBe(0);
  });

  it('crosses month boundary', () => {
    expect(diffDays('2025-02-01', '2025-01-30')).toBe(2);
  });
});

describe('perc()', () => {
  it('calculates percentage', () => {
    expect(perc(25, 100)).toBe(25);
    expect(perc(3, 4)).toBe(75);
  });

  it('rounds to nearest integer', () => {
    expect(perc(1, 3)).toBe(33);
    expect(perc(2, 3)).toBe(67);
  });

  it('returns 0 for zero total (no division by zero)', () => {
    expect(perc(5, 0)).toBe(0);
    expect(perc(0, 0)).toBe(0);
  });

  it('returns 100 for perfect score', () => {
    expect(perc(10, 10)).toBe(100);
  });

  it('handles zero acertos', () => {
    expect(perc(0, 10)).toBe(0);
  });
});

describe('uid()', () => {
  it('returns string of reasonable length', () => {
    const id = uid();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBe(100);
  });
});

describe('fmtDate()', () => {
  it('formats date as DD/MM', () => {
    const result = fmtDate('2025-01-15');
    expect(result).toBe('15/01');
  });

  it('returns empty string for falsy input', () => {
    expect(fmtDate(null)).toBe('');
    expect(fmtDate(undefined)).toBe('');
    expect(fmtDate('')).toBe('');
  });
});

describe('perfColor()', () => {
  it('returns green for >= 85', () => {
    expect(perfColor(85)).toBe('#22C55E');
    expect(perfColor(100)).toBe('#22C55E');
  });

  it('returns yellow for 60-84', () => {
    expect(perfColor(60)).toBe('#EAB308');
    expect(perfColor(84)).toBe('#EAB308');
  });

  it('returns red for < 60', () => {
    expect(perfColor(59)).toBe('#EF4444');
    expect(perfColor(0)).toBe('#EF4444');
  });
});

describe('perfLabel()', () => {
  it('returns correct Portuguese labels', () => {
    expect(perfLabel(85)).toBe('Bom');
    expect(perfLabel(60)).toBe('Regular');
    expect(perfLabel(59)).toBe('Fraco');
  });
});

describe('nxtIdx()', () => {
  it('increments for >= 80%', () => {
    expect(nxtIdx(0, 80)).toBe(1);
    expect(nxtIdx(2, 95)).toBe(3);
  });

  it('stays same for 75-79%', () => {
    expect(nxtIdx(2, 75)).toBe(2);
    expect(nxtIdx(2, 79)).toBe(2);
  });

  it('decrements for < 75%', () => {
    expect(nxtIdx(2, 74)).toBe(1);
    expect(nxtIdx(3, 50)).toBe(2);
  });

  it('does not go below 0', () => {
    expect(nxtIdx(0, 50)).toBe(0);
  });

  it('does not exceed max interval', () => {
    // INTERVALS has 5 elements, max index is 4
    expect(nxtIdx(4, 100)).toBe(4);
  });

  it('handles boundary at 80 (inclusive)', () => {
    expect(nxtIdx(1, 80)).toBe(2);
  });

  it('handles boundary at 75 (inclusive)', () => {
    expect(nxtIdx(1, 75)).toBe(1);
  });
});

describe('weekDates()', () => {
  it('returns 7 consecutive dates starting from Saturday', () => {
    const dates = weekDates('2025-01-04'); // Saturday
    expect(Object.keys(dates)).toEqual(['sab', 'dom', 'seg', 'ter', 'qua', 'qui', 'sex']);
    expect(dates.sab).toBe('2025-01-04');
    expect(dates.dom).toBe('2025-01-05');
    expect(dates.seg).toBe('2025-01-06');
    expect(dates.sex).toBe('2025-01-10');
  });
});

describe('extractJSON()', () => {
  it('extracts JSON from string', () => {
    const result = extractJSON('some text {"key":"value"} more text');
    expect(result).toEqual({ key: 'value' });
  });

  it('handles nested JSON', () => {
    const result = extractJSON('prefix {"a":{"b":1}} suffix');
    expect(result).toEqual({ a: { b: 1 } });
  });

  it('throws on no JSON', () => {
    expect(() => extractJSON('no json here')).toThrow('Nenhum JSON encontrado');
  });

  it('throws on invalid JSON', () => {
    expect(() => extractJSON('{invalid}')).toThrow();
  });
});

describe('defaultAreaForQuestion()', () => {
  describe('120-question exams', () => {
    it('maps clinica (1-24)', () => {
      expect(defaultAreaForQuestion(1, 120)).toBe('clinica');
      expect(defaultAreaForQuestion(24, 120)).toBe('clinica');
    });

    it('maps cirurgia (25-48)', () => {
      expect(defaultAreaForQuestion(25, 120)).toBe('cirurgia');
      expect(defaultAreaForQuestion(48, 120)).toBe('cirurgia');
    });

    it('maps ped (49-72)', () => {
      expect(defaultAreaForQuestion(49, 120)).toBe('ped');
      expect(defaultAreaForQuestion(72, 120)).toBe('ped');
    });

    it('maps go (73-96)', () => {
      expect(defaultAreaForQuestion(73, 120)).toBe('go');
      expect(defaultAreaForQuestion(96, 120)).toBe('go');
    });

    it('maps preventiva (97-120)', () => {
      expect(defaultAreaForQuestion(97, 120)).toBe('preventiva');
      expect(defaultAreaForQuestion(120, 120)).toBe('preventiva');
    });
  });

  describe('other exam sizes', () => {
    it('maps clinica (1-20)', () => {
      expect(defaultAreaForQuestion(1, 100)).toBe('clinica');
      expect(defaultAreaForQuestion(20, 100)).toBe('clinica');
    });

    it('maps cirurgia (21-40)', () => {
      expect(defaultAreaForQuestion(21, 100)).toBe('cirurgia');
    });

    it('maps ped (41-60)', () => {
      expect(defaultAreaForQuestion(41, 100)).toBe('ped');
    });

    it('maps go (61-80)', () => {
      expect(defaultAreaForQuestion(61, 100)).toBe('go');
    });

    it('maps preventiva (81+)', () => {
      expect(defaultAreaForQuestion(81, 100)).toBe('preventiva');
    });
  });
});

describe('buildDefaultQDetails()', () => {
  it('creates correct number of entries', () => {
    const det = buildDefaultQDetails(5);
    expect(Object.keys(det).length).toBe(5);
  });

  it('each entry has area and theme', () => {
    const det = buildDefaultQDetails(3);
    expect(det[1]).toHaveProperty('area');
    expect(det[1]).toHaveProperty('theme');
    expect(det[1].theme).toBe('');
  });

  it('assigns correct areas based on total', () => {
    const det = buildDefaultQDetails(120);
    expect(det[1].area).toBe('clinica');
    expect(det[25].area).toBe('cirurgia');
    expect(det[49].area).toBe('ped');
    expect(det[73].area).toBe('go');
    expect(det[97].area).toBe('preventiva');
  });

  it('handles zero total', () => {
    const det = buildDefaultQDetails(0);
    expect(Object.keys(det).length).toBe(0);
  });
});
