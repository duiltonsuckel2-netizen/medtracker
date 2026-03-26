const loadKey = (k, def) => { try { const v = localStorage.getItem(k); if (!v) return def; const parsed = JSON.parse(v); if (Array.isArray(def) && !Array.isArray(parsed)) return def; return parsed; } catch { return def; } };
const saveKey = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
export { loadKey, saveKey };
