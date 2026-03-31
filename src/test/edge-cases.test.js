import { describe, it, expect, beforeEach } from 'vitest';
import { perc, nxtIdx, addDays, today, uid, diffDays } from '../utils.js';
import { sm2 } from '../flashcards.js';
import { loadKey, saveKey } from '../storage.js';

beforeEach(() => {
  localStorage.clear();
});

describe('Edge Cases — Empty & Boundary Values', () => {
  describe('perc() boundary values', () => {
    it('acertos > total caps at 100', () => {
      expect(perc(15, 10)).toBe(100);
    });

    it('negative values return 0 (capped)', () => {
      expect(perc(-5, 10)).toBe(0);
    });

    it('very large values', () => {
      expect(perc(999999, 1000000)).toBe(100);
    });
  });

  describe('nxtIdx() edge cases', () => {
    it('handles very high pct', () => {
      expect(nxtIdx(0, 200)).toBe(1); // pct > 80
    });

    it('handles negative pct', () => {
      expect(nxtIdx(2, -10)).toBe(1); // pct < 75
    });

    it('rapid progression from 0 to max', () => {
      let idx = 0;
      for (let i = 0; i < 10; i++) {
        idx = nxtIdx(idx, 100);
      }
      expect(idx).toBe(4); // should cap at INTERVALS.length - 1
    });

    it('rapid regression from max to 0', () => {
      let idx = 4;
      for (let i = 0; i < 10; i++) {
        idx = nxtIdx(idx, 0);
      }
      expect(idx).toBe(0); // should cap at 0
    });
  });

  describe('addDays() edge cases', () => {
    it('very large number of days', () => {
      const result = addDays('2025-01-01', 365);
      expect(result).toBe('2026-01-01');
    });

    it('very large negative', () => {
      const result = addDays('2025-01-01', -365);
      expect(result).toBe('2024-01-02'); // non-leap year
    });
  });

  describe('diffDays() precision', () => {
    it('handles dates far apart', () => {
      expect(diffDays('2030-01-01', '2020-01-01')).toBe(3653);
    });
  });
});

describe('Edge Cases — SM-2 Algorithm Boundaries', () => {
  it('multiple consecutive failures keep interval at 1', () => {
    let card = { easeFactor: 2.5, interval: 30, repetitions: 10 };
    for (let i = 0; i < 5; i++) {
      card = sm2(card, 0); // "again"
    }
    expect(card.interval).toBe(1);
    expect(card.repetitions).toBe(0);
    expect(card.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('ease factor recovers after failures', () => {
    let card = { easeFactor: 2.5, interval: 0, repetitions: 0 };
    // Fail 3 times
    for (let i = 0; i < 3; i++) card = sm2(card, 0);
    const lowEF = card.easeFactor;
    // Then succeed 5 times
    for (let i = 0; i < 5; i++) card = sm2(card, 5);
    expect(card.easeFactor).toBeGreaterThan(lowEF);
  });

  it('long-term progression reaches high intervals', () => {
    let card = { easeFactor: 2.5, interval: 0, repetitions: 0 };
    for (let i = 0; i < 10; i++) {
      card = sm2(card, 5); // easy
    }
    expect(card.interval).toBeGreaterThan(100);
    expect(card.repetitions).toBe(10);
  });
});

describe('Edge Cases — Storage', () => {
  it('loadKey handles corrupted JSON gracefully', () => {
    localStorage.setItem('corrupted', '{bad');
    expect(loadKey('corrupted', 'fallback')).toBe('fallback');
  });

  it('loadKey validates type: default array, stored object', () => {
    localStorage.setItem('obj', JSON.stringify({ a: 1 }));
    expect(loadKey('obj', [])).toEqual([]);
  });

  it('loadKey validates type: default array, stored number', () => {
    localStorage.setItem('num', JSON.stringify(42));
    expect(loadKey('num', [])).toEqual([]);
  });

  it('saveKey + loadKey roundtrip preserves nested objects', () => {
    const data = {
      reviews: [
        {
          id: 'r1',
          key: 'clinica__diabetes',
          history: [{ date: '2025-01-01', pct: 80 }],
          subtopicNames: ['Tipo 1', 'Tipo 2'],
        },
      ],
    };
    saveKey('nested', data);
    expect(loadKey('nested', {})).toEqual(data);
  });

  it('handles empty string key', () => {
    saveKey('', 'value');
    expect(loadKey('', null)).toBe('value');
  });
});

describe('Edge Cases — Concurrent State', () => {
  it('uid generates unique IDs under rapid generation', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(uid());
    }
    expect(ids.size).toBe(1000);
  });
});

describe('Edge Cases — Review Undo Logic', () => {
  it('simulates markReview + undoMarkReview pattern', () => {
    // This tests the data pattern used in App.jsx
    const reviews = [
      {
        id: 'r1',
        key: 'clinica__diabetes',
        area: 'clinica',
        theme: 'Diabetes',
        intervalIndex: 2,
        nextDue: '2025-02-01',
        lastPerf: 70,
        lastStudied: '2025-01-15',
        history: [
          { date: '2025-01-01', pct: 60 },
          { date: '2025-01-15', pct: 70 },
        ],
      },
    ];

    // Simulate markReview
    const pct = perc(8, 10); // 80%
    const ni = nxtIdx(reviews[0].intervalIndex, pct); // 2 -> 3
    const entry = {
      date: today(),
      pct,
      _prev: {
        intervalIndex: reviews[0].intervalIndex,
        nextDue: reviews[0].nextDue,
        lastPerf: reviews[0].lastPerf,
        lastStudied: reviews[0].lastStudied,
      },
    };
    const marked = {
      ...reviews[0],
      intervalIndex: ni,
      nextDue: addDays(today(), 60), // INTERVALS[3]
      lastPerf: pct,
      lastStudied: today(),
      history: [...reviews[0].history, entry],
    };

    expect(marked.intervalIndex).toBe(3);
    expect(marked.lastPerf).toBe(80);
    expect(marked.history.length).toBe(3);

    // Simulate undoMarkReview
    const hist = marked.history;
    const last = hist[hist.length - 1];
    const prev = last._prev;
    const undone = {
      ...marked,
      intervalIndex: prev.intervalIndex,
      nextDue: prev.nextDue,
      lastPerf: prev.lastPerf,
      lastStudied: prev.lastStudied,
      history: hist.slice(0, -1),
    };

    expect(undone.intervalIndex).toBe(2);
    expect(undone.nextDue).toBe('2025-02-01');
    expect(undone.lastPerf).toBe(70);
    expect(undone.lastStudied).toBe('2025-01-15');
    expect(undone.history.length).toBe(2);
  });

  it('undo without _prev uses fallback', () => {
    // Older reviews may not have _prev metadata
    const review = {
      id: 'r2',
      history: [
        { date: '2025-01-01', pct: 60 },
        { date: '2025-01-15', pct: 80 },
      ],
      lastPerf: 80,
      lastStudied: '2025-01-15',
    };

    const hist = review.history;
    const last = hist[hist.length - 1];
    const prev = last._prev; // undefined

    // Fallback: use second-to-last history entry
    expect(prev).toBeUndefined();
    const prevEntry = hist.length >= 2 ? hist[hist.length - 2] : null;
    expect(prevEntry.pct).toBe(60);
    expect(prevEntry.date).toBe('2025-01-01');
  });
});

describe('Edge Cases — Dedup Logic', () => {
  it('dedup by key keeps review with more history', () => {
    const reviews = [
      { key: 'clinica__diabetes', history: [{ date: '2025-01-01', pct: 60 }], lastStudied: '2025-01-01' },
      { key: 'clinica__diabetes', history: [{ date: '2025-01-01', pct: 60 }, { date: '2025-01-10', pct: 80 }], lastStudied: '2025-01-10' },
    ];

    const seen = new Map();
    reviews.forEach((rv) => {
      const k = rv.key;
      const existing = seen.get(k);
      if (!existing) { seen.set(k, rv); return; }
      const existH = (existing.history || []).length;
      const rvH = (rv.history || []).length;
      if (rvH > existH || (rvH === existH && (rv.lastStudied || '') > (existing.lastStudied || ''))) {
        seen.set(k, rv);
      }
    });

    const deduped = Array.from(seen.values());
    expect(deduped.length).toBe(1);
    expect(deduped[0].history.length).toBe(2); // kept the one with more history
  });

  it('dedup revLogs by signature', () => {
    const logs = [
      { date: '2025-01-01', area: 'clinica', theme: 'Diabetes', pct: 80, total: 10 },
      { date: '2025-01-01', area: 'clinica', theme: 'Diabetes', pct: 80, total: 10 }, // dupe
      { date: '2025-01-01', area: 'clinica', theme: 'HAS', pct: 70, total: 10 }, // different theme
    ];

    const logSeen = new Set();
    const deduped = logs.filter((l) => {
      const k = `${l.date}__${l.area}__${(l.theme || '').toLowerCase().trim()}__${l.pct}__${l.total}`;
      if (logSeen.has(k)) return false;
      logSeen.add(k);
      return true;
    });

    expect(deduped.length).toBe(2);
  });
});

describe('Edge Cases — Auto-backup Rotation', () => {
  it('rotates backups correctly: prev2→slot3, prev1→slot2, new→slot1', () => {
    localStorage.setItem('rp26_auto_backup_1', JSON.stringify({ _savedAt: 'time1' }));
    localStorage.setItem('rp26_auto_backup_2', JSON.stringify({ _savedAt: 'time2' }));

    // Simulate rotation (same logic as App.jsx)
    const prev1 = localStorage.getItem('rp26_auto_backup_1');
    const prev2 = localStorage.getItem('rp26_auto_backup_2');
    if (prev2) localStorage.setItem('rp26_auto_backup_3', prev2);
    if (prev1) localStorage.setItem('rp26_auto_backup_2', prev1);
    localStorage.setItem('rp26_auto_backup_1', JSON.stringify({ _savedAt: 'time3' }));

    expect(JSON.parse(localStorage.getItem('rp26_auto_backup_1'))._savedAt).toBe('time3');
    expect(JSON.parse(localStorage.getItem('rp26_auto_backup_2'))._savedAt).toBe('time1');
    expect(JSON.parse(localStorage.getItem('rp26_auto_backup_3'))._savedAt).toBe('time2');
  });
});
