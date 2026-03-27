const loadKey = (k, def) => { try { const v = localStorage.getItem(k); if (!v) return def; const parsed = JSON.parse(v); if (Array.isArray(def) && !Array.isArray(parsed)) return def; return parsed; } catch { return def; } };

const _timers = {};
const saveKey = (k, v) => {
  clearTimeout(_timers[k]);
  _timers[k] = setTimeout(() => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  }, 150);
};
const saveKeyImmediate = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export { loadKey, saveKey, saveKeyImmediate };
