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
  "rp26_mig_v4", "rp26_mig_v5", "rp26_mig_v6", "rp26_mig_v7", "rp26_mig_v8", "rp26_mig_v9", "rp26_mig_v10b", "rp26_mig_v11", "rp26_mig_v12b",
  "rp26_dismissed_alerts",
];

// Keys that hold arrays — merge by combining unique items instead of overwriting
const ARRAY_KEYS = [
  "rp26_sessions", "rp26_reviews", "rp26_revlogs", "rp26_exams", "rp26_flashcards",
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
let _lastPushTs = 0;

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

// Smart merge: for arrays, combine items by id (remote wins on conflict)
function mergeArrayById(local, remote) {
  if (!Array.isArray(local)) return remote;
  if (!Array.isArray(remote)) return local;
  const map = new Map();
  // Local items first
  local.forEach((item) => {
    const key = item.id || item.key || JSON.stringify(item);
    map.set(key, item);
  });
  // Remote items overwrite on conflict
  remote.forEach((item) => {
    const key = item.id || item.key || JSON.stringify(item);
    map.set(key, item);
  });
  return Array.from(map.values());
}

// Merge remote data with local data intelligently
function mergeData(remoteData) {
  SYNC_KEYS.forEach((k) => {
    if (remoteData[k] === undefined) return;
    if (ARRAY_KEYS.includes(k)) {
      const localRaw = localStorage.getItem(k);
      let local = [];
      try { local = localRaw ? JSON.parse(localRaw) : []; } catch { local = []; }
      const merged = mergeArrayById(local, remoteData[k]);
      localStorage.setItem(k, JSON.stringify(merged));
    } else {
      // For non-array keys, remote wins
      localStorage.setItem(k, JSON.stringify(remoteData[k]));
    }
  });
}

async function pushToCloud() {
  if (!_syncId || _pushing) return false;
  const ok = await loadFirebase();
  if (!ok) return false;
  _pushing = true;
  try {
    const data = collectData();
    data._updatedAt = Date.now();
    data._deviceId = DEVICE_ID;
    await _setDoc(_doc(_db, "sync", _syncId), data);
    _lastPushTs = data._updatedAt;
    if (_onSyncStatus) _onSyncStatus("synced");
    return true;
  } catch (e) {
    console.warn("Sync push failed:", e);
    if (_onSyncStatus) _onSyncStatus("error");
    return false;
  } finally {
    _pushing = false;
  }
}

function debouncedPush() {
  if (!_syncId) return;
  if (_debounceTimer) clearTimeout(_debounceTimer);
  if (_onSyncStatus) _onSyncStatus("syncing");
  // Push immediately if not initialized yet (first interaction)
  if (!_initialized) {
    _initialized = true;
    _debounceTimer = setTimeout(pushToCloud, 500);
  } else {
    _debounceTimer = setTimeout(pushToCloud, 1500);
  }
}

// Pull latest from cloud — overwrites local data entirely
async function pullFromCloud() {
  if (!_syncId) return false;
  const ok = await loadFirebase();
  if (!ok) return false;
  try {
    const snap = await _getDoc(_doc(_db, "sync", _syncId));
    if (!snap.exists()) return false;
    const data = snap.data();
    applyData(data);
    if (_onSyncStatus) _onSyncStatus("synced");
    return true;
  } catch (e) {
    console.warn("Sync pull failed:", e);
    if (_onSyncStatus) _onSyncStatus("error");
    return false;
  }
}

// Force full sync: pull remote → merge → push merged result
async function forceSync() {
  if (!_syncId) return false;
  if (_onSyncStatus) _onSyncStatus("syncing");
  try {
    await pullFromCloud();
    await pushToCloud();
    return true;
  } catch (e) {
    console.warn("Force sync failed:", e);
    if (_onSyncStatus) _onSyncStatus("error");
    return false;
  }
}

async function startListening(onRemoteUpdate) {
  if (_unsubscribe) _unsubscribe();
  if (!_syncId) return;
  const ok = await loadFirebase();
  if (!ok) return;

  _unsubscribe = _onSnapshot(_doc(_db, "sync", _syncId), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    // Skip our own pushes
    if (data._deviceId === DEVICE_ID && data._updatedAt === _lastPushTs) return;
    // Skip if this is clearly our own recent push (within 3 seconds)
    if (data._deviceId === DEVICE_ID && Math.abs(Date.now() - data._updatedAt) < 3000) return;
    // Apply remote data (overwrite — no merge to avoid duplication)
    applyData(data);
    if (_onSyncStatus) _onSyncStatus("synced");
    if (onRemoteUpdate) {
      onRemoteUpdate();
    }
  }, (err) => {
    console.warn("Sync listen error:", err);
    if (_onSyncStatus) _onSyncStatus("error");
    // Try to reconnect after 5 seconds
    setTimeout(() => {
      if (_syncId) startListening(onRemoteUpdate);
    }, 5000);
  });
}

function stopListening() {
  if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
}

async function initSync(onRemoteUpdate, onStatusChange) {
  _onSyncStatus = onStatusChange || null;
  _syncId = getSyncId();
  if (!_syncId) return false;
  _initialized = true;
  // Just start listening — don't auto-pull to avoid overwriting local data
  await startListening(onRemoteUpdate);
  return true;
}

async function createSync() {
  const id = generateSyncId();
  setSyncId(id);
  _syncId = id;
  _initialized = true;
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
    // Overwrite local with remote data (no merge to avoid duplication)
    applyData(data);
  }
  setSyncId(id);
  _syncId = id;
  _initialized = true;
  await startListening(onRemoteUpdate);
  // Push merged data back so both devices are in sync
  await pushToCloud();
  return id;
}

function disconnectSync() {
  stopListening();
  localStorage.removeItem("rp26_sync_id");
  _syncId = null;
  _initialized = false;
}

export {
  initSync, createSync, joinSync, disconnectSync,
  debouncedPush, getSyncId, pushToCloud, pullFromCloud, forceSync,
};
