import { db } from "./firebase.js";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";

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

function getSyncId() {
  return localStorage.getItem("rp26_sync_id") || null;
}

function setSyncId(id) {
  localStorage.setItem("rp26_sync_id", id);
  _syncId = id;
}

function generateSyncId() {
  // 6-char alphanumeric code, easy to type on mobile
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
  _pushing = true;
  try {
    const data = collectData();
    data._updatedAt = Date.now();
    data._deviceId = DEVICE_ID;
    await setDoc(doc(db, "sync", _syncId), data);
    if (_onSyncStatus) _onSyncStatus("synced");
  } catch (e) {
    console.warn("Sync push failed:", e);
    if (_onSyncStatus) _onSyncStatus("error");
  } finally {
    _pushing = false;
  }
}

function debouncedPush() {
  if (!_syncId) return;
  if (_debounceTimer) clearTimeout(_debounceTimer);
  if (_onSyncStatus) _onSyncStatus("syncing");
  _debounceTimer = setTimeout(pushToCloud, 1500);
}

function startListening(onRemoteUpdate) {
  if (_unsubscribe) _unsubscribe();
  if (!_syncId) return;

  _unsubscribe = onSnapshot(doc(db, "sync", _syncId), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    // Ignore own writes
    if (data._deviceId === DEVICE_ID) return;
    applyData(data);
    if (_onSyncStatus) _onSyncStatus("synced");
    if (onRemoteUpdate) onRemoteUpdate();
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
  startListening(onRemoteUpdate);
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
  // Check if doc exists
  const snap = await getDoc(doc(db, "sync", id));
  if (snap.exists()) {
    // Pull remote data first
    const data = snap.data();
    applyData(data);
  }
  setSyncId(id);
  _syncId = id;
  startListening(onRemoteUpdate);
  // Push local data too (merge)
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
