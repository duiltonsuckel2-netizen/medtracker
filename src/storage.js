let _storageWarned = false;
const loadKey = (k, def) => { try { const v = localStorage.getItem(k); if (!v) return def; const parsed = JSON.parse(v); if (Array.isArray(def) && !Array.isArray(parsed)) return def; return parsed; } catch { return def; } };
const saveKey = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    if (!_storageWarned) {
      _storageWarned = true;
      alert("Espaço de armazenamento cheio! Exporte um backup e limpe dados antigos para continuar salvando.");
    }
  }
};
export { loadKey, saveKey };
