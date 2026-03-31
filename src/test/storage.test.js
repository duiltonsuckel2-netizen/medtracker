import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadKey, saveKey } from '../storage.js';

beforeEach(() => {
  localStorage.clear();
});

describe('loadKey()', () => {
  it('returns default when key not found', () => {
    expect(loadKey('missing', [])).toEqual([]);
    expect(loadKey('missing', 42)).toBe(42);
    expect(loadKey('missing', 'hello')).toBe('hello');
  });

  it('loads stored JSON value', () => {
    localStorage.setItem('test', JSON.stringify({ a: 1 }));
    expect(loadKey('test', {})).toEqual({ a: 1 });
  });

  it('loads stored array', () => {
    localStorage.setItem('arr', JSON.stringify([1, 2, 3]));
    expect(loadKey('arr', [])).toEqual([1, 2, 3]);
  });

  it('loads stored string', () => {
    localStorage.setItem('str', JSON.stringify('hello'));
    expect(loadKey('str', '')).toBe('hello');
  });

  it('loads stored boolean', () => {
    localStorage.setItem('bool', JSON.stringify(true));
    expect(loadKey('bool', false)).toBe(true);
  });

  it('returns default for invalid JSON', () => {
    localStorage.setItem('bad', '{invalid json');
    expect(loadKey('bad', 'default')).toBe('default');
  });

  it('returns default when stored value is not array but default is', () => {
    localStorage.setItem('notarr', JSON.stringify('string'));
    expect(loadKey('notarr', [])).toEqual([]);
  });

  it('returns stored non-array when default is not array', () => {
    localStorage.setItem('str', JSON.stringify('value'));
    expect(loadKey('str', '')).toBe('value');
  });
});

describe('saveKey()', () => {
  it('saves value as JSON string', () => {
    saveKey('test', { a: 1 });
    expect(localStorage.getItem('test')).toBe(JSON.stringify({ a: 1 }));
  });

  it('saves array', () => {
    saveKey('arr', [1, 2, 3]);
    expect(JSON.parse(localStorage.getItem('arr'))).toEqual([1, 2, 3]);
  });

  it('saves primitive values', () => {
    saveKey('num', 42);
    expect(loadKey('num', 0)).toBe(42);

    saveKey('bool', true);
    expect(loadKey('bool', false)).toBe(true);
  });

  it('roundtrips complex data', () => {
    const data = {
      reviews: [{ id: '1', theme: 'Test', area: 'clinica' }],
      subtopics: { key: ['a', 'b'] },
    };
    saveKey('complex', data);
    expect(loadKey('complex', {})).toEqual(data);
  });
});
