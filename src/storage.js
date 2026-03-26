const loadKey = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };
const saveKey = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
export { loadKey, saveKey };
