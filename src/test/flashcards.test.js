import { describe, it, expect } from 'vitest';
import { sm2, QUALITY_MAP, mergeDecks, getDueCards, reviewCard, deckStats } from '../flashcards.js';
import { today, addDays } from '../utils.js';

describe('SM-2 Algorithm', () => {
  const newCard = { easeFactor: 2.5, interval: 0, repetitions: 0 };

  describe('quality < 3 (failure)', () => {
    it('resets repetitions on "again" (quality=0)', () => {
      const result = sm2({ ...newCard, repetitions: 5, interval: 30 }, 0);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('resets repetitions on "hard" (quality=2)', () => {
      const result = sm2({ ...newCard, repetitions: 3, interval: 15 }, 2);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });
  });

  describe('quality >= 3 (success)', () => {
    it('first success sets interval to 1', () => {
      const result = sm2(newCard, 3);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('second success sets interval to 6', () => {
      const result = sm2({ easeFactor: 2.5, interval: 1, repetitions: 1 }, 3);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it('subsequent success multiplies by easeFactor', () => {
      const result = sm2({ easeFactor: 2.5, interval: 6, repetitions: 2 }, 3);
      expect(result.interval).toBe(15); // round(6 * 2.5) = 15
      expect(result.repetitions).toBe(3);
    });
  });

  describe('ease factor adjustment', () => {
    it('ease factor never goes below 1.3', () => {
      // quality 0 reduces EF the most
      const result = sm2({ easeFactor: 1.3, interval: 0, repetitions: 0 }, 0);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('quality 5 increases ease factor', () => {
      const result = sm2(newCard, 5);
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it('quality 0 decreases ease factor', () => {
      const result = sm2(newCard, 0);
      expect(result.easeFactor).toBeLessThan(2.5);
    });
  });

  describe('easy bonus', () => {
    it('quality 5 gives 1.3x interval bonus', () => {
      const result = sm2({ easeFactor: 2.5, interval: 6, repetitions: 2 }, 5);
      // Base: round(6 * 2.5) = 15, then * 1.3 = round(19.5) = 20
      expect(result.interval).toBe(20);
    });
  });

  describe('nextDue calculation', () => {
    it('sets nextDue based on interval', () => {
      const result = sm2(newCard, 3);
      expect(result.nextDue).toBe(addDays(today(), 1));
    });

    it('sets lastReview to today', () => {
      const result = sm2(newCard, 3);
      expect(result.lastReview).toBe(today());
    });
  });

  describe('default values', () => {
    it('handles card with missing properties', () => {
      const result = sm2({}, 3);
      expect(result.easeFactor).toBeDefined();
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });
  });
});

describe('QUALITY_MAP', () => {
  it('maps all quality keys', () => {
    expect(QUALITY_MAP.again).toBe(0);
    expect(QUALITY_MAP.hard).toBe(2);
    expect(QUALITY_MAP.good).toBe(3);
    expect(QUALITY_MAP.easy).toBe(5);
  });
});

describe('mergeDecks()', () => {
  const makeDeck = (theme, area, version = 1) => ({
    id: 'deck-1',
    _v: version,
    theme,
    area,
    cards: [{
      id: 'card-1',
      front: 'Q1',
      back: 'A1',
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextDue: today(),
      lastReview: null,
      history: [],
    }],
  });

  it('adds new decks that do not exist', () => {
    const existing = [makeDeck('Diabetes', 'clinica')];
    const newDecks = [makeDeck('Pneumonia', 'clinica')];
    const result = mergeDecks(existing, newDecks);
    expect(result.length).toBe(2);
  });

  it('does not duplicate existing themes', () => {
    const existing = [makeDeck('Diabetes', 'clinica')];
    const newDecks = [makeDeck('Diabetes', 'clinica')];
    const result = mergeDecks(existing, newDecks);
    expect(result.length).toBe(1);
  });

  it('preserves SM-2 state on version upgrade', () => {
    const old = makeDeck('Diabetes', 'clinica', 1);
    old.cards[0].easeFactor = 3.0;
    old.cards[0].interval = 15;
    old.cards[0].repetitions = 5;
    old.cards[0].history = [{ date: '2025-01-01', quality: 'good', interval: 6 }];

    const newDeck = makeDeck('Diabetes', 'clinica', 2);
    newDeck.cards[0].front = 'Updated Q1';
    newDeck.cards[0].back = 'Updated A1';

    const result = mergeDecks([old], [newDeck]);
    expect(result.length).toBe(1);
    expect(result[0]._v).toBe(2);
    // SM-2 state preserved
    expect(result[0].cards[0].easeFactor).toBe(3.0);
    expect(result[0].cards[0].interval).toBe(15);
    expect(result[0].cards[0].repetitions).toBe(5);
    expect(result[0].cards[0].history.length).toBe(1);
  });

  it('handles empty existing decks', () => {
    const result = mergeDecks([], [makeDeck('Test', 'clinica')]);
    expect(result.length).toBe(1);
  });

  it('handles empty new decks', () => {
    const result = mergeDecks([makeDeck('Test', 'clinica')], []);
    expect(result.length).toBe(1);
  });
});

describe('getDueCards()', () => {
  it('returns cards with nextDue <= today', () => {
    const decks = [{
      id: 'd1',
      theme: 'Test',
      area: 'clinica',
      areaColor: '#000',
      areaLabel: 'Clínica',
      cards: [
        { id: 'c1', nextDue: today(), front: 'Q1' },
        { id: 'c2', nextDue: addDays(today(), 5), front: 'Q2' },
        { id: 'c3', nextDue: addDays(today(), -1), front: 'Q3' },
      ],
    }];
    const due = getDueCards(decks);
    expect(due.length).toBe(2); // c1 (today) and c3 (yesterday)
    expect(due.map(c => c.id)).toContain('c1');
    expect(due.map(c => c.id)).toContain('c3');
  });

  it('returns empty for no due cards', () => {
    const decks = [{
      id: 'd1', theme: 'Test', area: 'clinica', areaColor: '#000', areaLabel: 'Cl',
      cards: [{ id: 'c1', nextDue: addDays(today(), 10) }],
    }];
    expect(getDueCards(decks).length).toBe(0);
  });

  it('enriches cards with deck metadata', () => {
    const decks = [{
      id: 'd1', theme: 'Diabetes', area: 'clinica', areaColor: '#60A5FA', areaLabel: 'Clínica',
      cards: [{ id: 'c1', nextDue: today() }],
    }];
    const due = getDueCards(decks);
    expect(due[0].deckId).toBe('d1');
    expect(due[0].deckTheme).toBe('Diabetes');
    expect(due[0].deckArea).toBe('clinica');
  });
});

describe('reviewCard()', () => {
  it('updates SM-2 state for reviewed card', () => {
    const decks = [{
      id: 'd1', theme: 'Test', area: 'clinica',
      cards: [{
        id: 'c1', easeFactor: 2.5, interval: 0, repetitions: 0,
        nextDue: today(), lastReview: null, history: [],
      }],
    }];

    const result = reviewCard(decks, 'd1', 'c1', 'good');
    const card = result[0].cards[0];
    expect(card.repetitions).toBe(1);
    expect(card.interval).toBe(1);
    expect(card.history.length).toBe(1);
    expect(card.history[0].quality).toBe('good');
  });

  it('returns unchanged decks for non-existent deck', () => {
    const decks = [{
      id: 'd1', theme: 'Test', area: 'clinica',
      cards: [{ id: 'c1', easeFactor: 2.5, interval: 0, repetitions: 0, history: [] }],
    }];

    const result = reviewCard(decks, 'nonexistent', 'c1', 'good');
    expect(result[0].cards[0].repetitions).toBe(0);
  });
});

describe('deckStats()', () => {
  it('computes correct stats', () => {
    const deck = {
      cards: [
        { easeFactor: 2.5, interval: 30, repetitions: 5, nextDue: addDays(today(), -1) },
        { easeFactor: 2.0, interval: 0, repetitions: 0, nextDue: today() },
        { easeFactor: 3.0, interval: 25, repetitions: 3, nextDue: addDays(today(), 10) },
      ],
    };

    const stats = deckStats(deck);
    expect(stats.total).toBe(3);
    expect(stats.due).toBe(2); // past + today
    expect(stats.learned).toBe(2); // repetitions >= 2
    expect(stats.mature).toBe(2); // interval >= 21
    expect(stats.newCards).toBe(1); // total - learned
    expect(stats.avgEase).toBeCloseTo(2.5, 1);
  });

  it('handles empty deck', () => {
    const stats = deckStats({ cards: [] });
    expect(stats.total).toBe(0);
    expect(stats.due).toBe(0);
    expect(stats.avgEase).toBe(2.5);
  });
});
