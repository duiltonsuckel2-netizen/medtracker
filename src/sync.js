let _db = null;
let _doc = null;
let _setDoc = null;
let _onSnapshot = null;
let _getDoc = null;

async function loadFirebase() {
  if (_db) return true;
  try {
    const { initializeApp } = await import("firebase/app");
    const { getFirestore, doc, setDoc, onSnapshot, getDoc } = await import("firebase/firestore");
    const app = initializeApp({
      apiKey: "AIzaSyDcKbbDD2Anw9Il6XoOK96afftRSdRday0",
      authDomain: "medtracker-ce055.firebaseapp.com",
      projectId: "medtracker-ce055",
      storageBucket: "medtracker-ce055.firebasestorage.app",
      messagingSenderId: "292292223003",
      appId: "1:292292223003:web:c6d1408a0b8cb486d618be",
    });
    _db = getFirestore(app);
    _doc = doc;
    _setDoc = setDoc;
    _onSnapshot = onSnapshot;
    _getDoc = getDoc;
    return true;
  } catch (e) {
    console.warn("Firebase load failed:", e);
    return false;
  }
}

const SYNC_KEYS = [
  "rp26_sessions", "rp26_reviews", "rp26_revlogs", "rp26_exams",
  "rp26_subtopics", "rp26_flashcards", "rp26_seeded12", "rp26_dark",
  "rp_agenda_v7", "rp_agenda_history", "rp_streak_start", "rp_max_streak",
  "rp26_mig_v4", "rp26_mig_v5", "rp26_mig_v6", "rp26_mig_v7", "rp26_mig_v8",
];

const DEVICE_ID = (() => {
  let id = localStorage.getItem("rp26_device_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("rp26_device_id", id); }
  return id;
})();

let _unsubscribe = null;
let _pushing = false;
let _syncId = null;
let _debounceTimer = null;
let _onSyncStatus = null;
let _initialized = false;

function getSyncId() {
  return localStorage.getItem("rp26_sync_id") || null;
}

function setSyncId(id) {
  localStorage.setItem("rp26_sync_id", id);
  _syncId = id;
}

function generateSyncId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function collectData() {
  const data = {};
  SYNC_KEYS.forEach((k) => {
    const v = localStorage.getItem(k);
    if (v !== null) {
      try { data[k] = JSON.parse(v); } catch { data[k] = v; }
    }
  });
  return data;
}

function applyData(data) {
  SYNC_KEYS.forEach((k) => {
    if (data[k] !== undefined) {
      localStorage.setItem(k, JSON.stringify(data[k]));
    }
  });
}

async function pushToCloud() {
  if (!_syncId || _pushing) return;
  const ok = await loadFirebase();
  if (!ok) return;
  _pushing = true;
  try {
    const data = collectData();
    data._updatedAt = Date.now();
    data._deviceId = DEVICE_ID;
    await _setDoc(_doc(_db, "sync", _syncId), data);
    if (_onSyncStatus) _onSyncStatus("synced");
  } catch (e) {
    console.warn("Sync push failed:", e);
    if (_onSyncStatus) _onSyncStatus("error");
  } finally {
    _pushing = false;
  }
}

function debouncedPush() {
  if (!_syncId || !_initialized) return;
  if (_debounceTimer) clearTimeout(_debounceTimer);
  if (_onSyncStatus) _onSyncStatus("syncing");
  _debounceTimer = setTimeout(pushToCloud, 2000);
}

async function startListening(onRemoteUpdate) {
  if (_unsubscribe) _unsubscribe();
  if (!_syncId) return;
  const ok = await loadFirebase();
  if (!ok) return;

  let _lastRemoteTs = 0;
  const RELOAD_COOLDOWN = 10000;

  _unsubscribe = _onSnapshot(_doc(_db, "sync", _syncId), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    if (data._deviceId === DEVICE_ID) return;
    const now = Date.now();
    const lastReload = Number(sessionStorage.getItem("rp26_last_sync_reload") || "0");
    if (now - lastReload < RELOAD_COOLDOWN) return;
    if (data._updatedAt && data._updatedAt <= _lastRemoteTs) return;
    _lastRemoteTs = data._updatedAt || now;
    applyData(data);
    if (_onSyncStatus) _onSyncStatus("synced");
    if (onRemoteUpdate) {
      sessionStorage.setItem("rp26_last_sync_reload", String(now));
      onRemoteUpdate();
    }
  }, (err) => {
    console.warn("Sync listen error:", err);
    if (_onSyncStatus) _onSyncStatus("error");
  });
}

function stopListening() {
  if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
}

async function initSync(onRemoteUpdate, onStatusChange) {
  _onSyncStatus = onStatusChange || null;
  _syncId = getSyncId();
  if (!_syncId) return false;
  await startListening(onRemoteUpdate);
  setTimeout(() => { _initialized = true; }, 5000);
  return true;
}

async function createSync() {
  const id = generateSyncId();
  setSyncId(id);
  _syncId = id;
  await pushToCloud();
  return id;
}

async function joinSync(code, onRemoteUpdate) {
  const id = code.toUpperCase().trim();
  const ok = await loadFirebase();
  if (!ok) throw new Error("Firebase não carregou");
  const snap = await _getDoc(_doc(_db, "sync", id));
  if (snap.exists()) {
    const data = snap.data();
    applyData(data);
  }
  setSyncId(id);
  _syncId = id;
  await startListening(onRemoteUpdate);
  await pushToCloud();
  return id;
}

function disconnectSync() {
  stopListening();
  localStorage.removeItem("rp26_sync_id");
  _syncId = null;
}

export {
  initSync, createSync, joinSync, disconnectSync,
  debouncedPush, getSyncId, pushToCloud,
};
