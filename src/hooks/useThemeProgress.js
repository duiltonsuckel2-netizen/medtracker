import { useMemo } from "react";
import { perc } from "../utils.js";

export function useThemeProgress(revLogs, sessions, sortFn) {
  return useMemo(() => {
    const byTheme = {};
    [...revLogs, ...sessions.map((s) => ({ ...s, pct: perc(s.acertos, s.total) }))].forEach((l) => {
      if (!l.theme || !l.area) return;
      const k = `${l.area}__${l.theme}`;
      if (!byTheme[k]) byTheme[k] = { area: l.area, theme: l.theme, sessions: [] };
      byTheme[k].sessions.push({ date: l.date, pct: l.pct, total: l.total || 0 });
    });
    const items = Object.values(byTheme)
      .filter((t) => t.sessions.length >= 2)
      .map((t) => {
        const sorted = [...t.sessions].sort((a, b) => a.date.localeCompare(b.date));
        const first = sorted[0].pct; const last = sorted[sorted.length - 1].pct;
        const trend = last - first;
        const avg = Math.round(sorted.reduce((s, x) => s + x.pct, 0) / sorted.length);
        return { ...t, sorted, first, last, trend, avg, n: sorted.length };
      });
    return sortFn ? items.sort(sortFn) : items.sort((a, b) => b.n - a.n);
  }, [revLogs, sessions, sortFn]);
}
