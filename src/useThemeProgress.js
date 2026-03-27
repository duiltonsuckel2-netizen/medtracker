import { useMemo } from "react";
import { perc } from "./utils.js";

export function useThemeProgress(revLogs, sessions) {
  return useMemo(() => {
    const byTheme = {};
    const allLogs = revLogs.length + sessions.length;
    if (allLogs === 0) return [];
    for (let i = 0; i < revLogs.length; i++) {
      const l = revLogs[i];
      const k = `${l.area}__${l.theme}`;
      if (!byTheme[k]) byTheme[k] = { area: l.area, theme: l.theme, sessions: [] };
      byTheme[k].sessions.push({ date: l.date, pct: l.pct, total: l.total || 0 });
    }
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      const k = `${s.area}__${s.theme}`;
      if (!byTheme[k]) byTheme[k] = { area: s.area, theme: s.theme, sessions: [] };
      byTheme[k].sessions.push({ date: s.date, pct: perc(s.acertos, s.total), total: s.total || 0 });
    }
    const result = [];
    const keys = Object.keys(byTheme);
    for (let i = 0; i < keys.length; i++) {
      const t = byTheme[keys[i]];
      if (t.sessions.length < 2) continue;
      const sorted = t.sessions.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
      const first = sorted[0].pct;
      const last = sorted[sorted.length - 1].pct;
      let sum = 0;
      for (let j = 0; j < sorted.length; j++) sum += sorted[j].pct;
      result.push({ ...t, sorted, first, last, trend: last - first, avg: Math.round(sum / sorted.length), n: sorted.length });
    }
    result.sort((a, b) => b.n - a.n);
    return result;
  }, [revLogs, sessions]);
}
