export async function loadKey(k, fb) {
  try {
    const raw = localStorage.getItem(k);
    return raw != null ? JSON.parse(raw) : fb;
  } catch {
    return fb;
  }
}
export async function saveKey(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch(e) { console.error("saveKey failed:", k, e); }
}
