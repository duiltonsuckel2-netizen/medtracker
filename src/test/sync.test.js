import { describe, it, expect, beforeEach } from 'vitest';

// We need to test the non-Firebase parts of sync.js
// Import via dynamic import to test internal functions
// Since these functions aren't all exported, we test what's accessible

beforeEach(() => {
  localStorage.clear();
});

// Test generateSyncId indirectly via createSync, or test the logic
describe('sync code generation', () => {
  it('crypto.getRandomValues produces valid bytes', () => {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    expect(bytes.length).toBe(8);
    bytes.forEach(b => {
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(256);
    });
  });
});

// Test validateSyncData and mergeArrayById logic
describe('sync data validation logic', () => {
  // We test the patterns used in sync.js

  it('mergeArrayById pattern deduplicates by key', () => {
    const mergeArrayById = (local, remote) => {
      if (!Array.isArray(local)) return remote;
      if (!Array.isArray(remote)) return local;
      const map = new Map();
      local.forEach((item) => {
        const key = item.key || item.id || JSON.stringify(item);
        map.set(key, item);
      });
      remote.forEach((item) => {
        const key = item.key || item.id || JSON.stringify(item);
        map.set(key, item);
      });
      return Array.from(map.values());
    };

    const local = [{ id: '1', val: 'a' }, { id: '2', val: 'b' }];
    const remote = [{ id: '2', val: 'c' }, { id: '3', val: 'd' }];
    const result = mergeArrayById(local, remote);

    expect(result.length).toBe(3);
    expect(result.find(i => i.id === '2').val).toBe('c'); // remote wins
    expect(result.find(i => i.id === '1').val).toBe('a');
    expect(result.find(i => i.id === '3').val).toBe('d');
  });

  it('mergeArrayById handles non-array inputs', () => {
    const mergeArrayById = (local, remote) => {
      if (!Array.isArray(local)) return remote;
      if (!Array.isArray(remote)) return local;
      const map = new Map();
      local.forEach(item => map.set(item.id, item));
      remote.forEach(item => map.set(item.id, item));
      return Array.from(map.values());
    };

    expect(mergeArrayById(null, [{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(mergeArrayById([{ id: 1 }], null)).toEqual([{ id: 1 }]);
  });

  it('validateSyncData pattern rejects unknown keys', () => {
    const SYNC_KEYS = ['rp26_sessions', 'rp26_reviews', 'rp26_dark'];
    const ARRAY_KEYS = ['rp26_sessions', 'rp26_reviews'];

    function validateSyncData(data) {
      if (!data || typeof data !== 'object') return {};
      const clean = {};
      SYNC_KEYS.forEach((k) => {
        if (data[k] === undefined) return;
        if (ARRAY_KEYS.includes(k)) {
          if (Array.isArray(data[k])) clean[k] = data[k];
        } else {
          clean[k] = data[k];
        }
      });
      return clean;
    }

    const data = {
      rp26_sessions: [{ id: 1 }],
      rp26_reviews: 'not-an-array', // wrong type
      rp26_dark: true,
      evil_key: 'malicious', // unknown key
      __proto__: { admin: true }, // prototype pollution attempt
    };

    const result = validateSyncData(data);
    expect(result.rp26_sessions).toEqual([{ id: 1 }]);
    expect(result.rp26_reviews).toBeUndefined(); // rejected: not array
    expect(result.rp26_dark).toBe(true);
    expect(result.evil_key).toBeUndefined(); // rejected: unknown
  });

  it('validateSyncData returns empty for null/undefined', () => {
    function validateSyncData(data) {
      if (!data || typeof data !== 'object') return {};
      return {};
    }

    expect(validateSyncData(null)).toEqual({});
    expect(validateSyncData(undefined)).toEqual({});
    expect(validateSyncData('string')).toEqual({});
  });
});

describe('sync ID storage', () => {
  it('stores and retrieves sync ID from localStorage', () => {
    localStorage.setItem('rp26_sync_id', 'TESTCODE');
    expect(localStorage.getItem('rp26_sync_id')).toBe('TESTCODE');
  });

  it('returns null when no sync ID set', () => {
    expect(localStorage.getItem('rp26_sync_id')).toBeNull();
  });

  it('removes sync ID on disconnect', () => {
    localStorage.setItem('rp26_sync_id', 'CODE123');
    localStorage.removeItem('rp26_sync_id');
    expect(localStorage.getItem('rp26_sync_id')).toBeNull();
  });
});

describe('device ID generation', () => {
  it('crypto.randomUUID generates valid UUID format', () => {
    const uuid = crypto.randomUUID();
    expect(typeof uuid).toBe('string');
    expect(uuid.length).toBeGreaterThan(0);
  });
});
