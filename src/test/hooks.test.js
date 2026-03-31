import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useThemeProgress } from '../hooks/useThemeProgress.js';

describe('useThemeProgress()', () => {
  it('returns empty array with no data', () => {
    const { result } = renderHook(() => useThemeProgress([], []));
    expect(result.current).toEqual([]);
  });

  it('filters themes with < 2 sessions', () => {
    const logs = [{ date: '2025-01-01', area: 'clinica', theme: 'Diabetes', pct: 70, total: 10 }];
    const { result } = renderHook(() => useThemeProgress(logs, []));
    expect(result.current.length).toBe(0);
  });

  it('computes progress for themes with >= 2 sessions', () => {
    const logs = [
      { date: '2025-01-01', area: 'clinica', theme: 'Diabetes', pct: 60, total: 10 },
      { date: '2025-01-05', area: 'clinica', theme: 'Diabetes', pct: 80, total: 10 },
    ];
    const { result } = renderHook(() => useThemeProgress(logs, []));
    expect(result.current.length).toBe(1);
    expect(result.current[0].theme).toBe('Diabetes');
    expect(result.current[0].first).toBe(60);
    expect(result.current[0].last).toBe(80);
    expect(result.current[0].trend).toBe(20);
    expect(result.current[0].avg).toBe(70);
    expect(result.current[0].n).toBe(2);
  });

  it('combines revLogs and sessions', () => {
    const logs = [
      { date: '2025-01-01', area: 'clinica', theme: 'HAS', pct: 50, total: 10 },
    ];
    const sessions = [
      { date: '2025-01-05', area: 'clinica', theme: 'HAS', acertos: 8, total: 10 },
    ];
    const { result } = renderHook(() => useThemeProgress(logs, sessions));
    expect(result.current.length).toBe(1);
    expect(result.current[0].first).toBe(50);
    expect(result.current[0].last).toBe(80);
  });

  it('sorts by session count by default', () => {
    const logs = [
      { date: '2025-01-01', area: 'clinica', theme: 'A', pct: 50 },
      { date: '2025-01-02', area: 'clinica', theme: 'A', pct: 60 },
      { date: '2025-01-01', area: 'clinica', theme: 'B', pct: 50 },
      { date: '2025-01-02', area: 'clinica', theme: 'B', pct: 60 },
      { date: '2025-01-03', area: 'clinica', theme: 'B', pct: 70 },
    ];
    const { result } = renderHook(() => useThemeProgress(logs, []));
    expect(result.current[0].theme).toBe('B'); // 3 sessions > 2
    expect(result.current[1].theme).toBe('A');
  });

  it('applies custom sort function', () => {
    const logs = [
      { date: '2025-01-01', area: 'clinica', theme: 'B', pct: 50 },
      { date: '2025-01-02', area: 'clinica', theme: 'B', pct: 60 },
      { date: '2025-01-01', area: 'clinica', theme: 'A', pct: 50 },
      { date: '2025-01-02', area: 'clinica', theme: 'A', pct: 60 },
    ];
    const sortFn = (a, b) => a.theme.localeCompare(b.theme);
    const { result } = renderHook(() => useThemeProgress(logs, [], sortFn));
    expect(result.current[0].theme).toBe('A');
    expect(result.current[1].theme).toBe('B');
  });

  it('skips entries without theme or area', () => {
    const logs = [
      { date: '2025-01-01', area: 'clinica', theme: '', pct: 50 },
      { date: '2025-01-02', area: '', theme: 'Test', pct: 60 },
      { date: '2025-01-01', area: 'clinica', theme: 'Valid', pct: 50 },
      { date: '2025-01-02', area: 'clinica', theme: 'Valid', pct: 60 },
    ];
    const { result } = renderHook(() => useThemeProgress(logs, []));
    expect(result.current.length).toBe(1);
    expect(result.current[0].theme).toBe('Valid');
  });
});
