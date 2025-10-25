const DEFAULT_BACKUP_KEY='drive_mock_backup_json';
// Lightweight Drive shim so the app compiles & works immediately.
// Uses localStorage as a placeholder. You can swap this later for real Drive API.

const CONNECT_KEY = 'drive_mock_connected';
const BACKUP_KEY  = 'drive_mock_backup_json';

// --- Connection state ---
export function isDriveConnected() {
  try { return localStorage.getItem(CONNECT_KEY) === '1'; } catch { return false; }
}

// --- Backward compatibility for older imports ---
//temporary change
export function isSignedIntoDrive() {
  return isDriveConnected();
}

// --- Authentication shims ---
export async function ensureDriveAuth() {
  try { localStorage.setItem(CONNECT_KEY, '1'); } catch {}
  return true;
}

export async function signInDrive() {
  try { localStorage.setItem(CONNECT_KEY, '1'); } catch {}
  return true;
}

export async function signOutDrive() {
  try { localStorage.removeItem(CONNECT_KEY); } catch {}
  return true;
}

// --- Data backup/load ---
export async function backupJSON(arg1, arg2) {
  const data = (Array.isArray(arg1) || typeof arg1 === 'object') ? arg1 : arg2;
  if (data === undefined) return false;
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('backupJSON failed:', e);
    return false;
  }
}

export async function loadBackupJSON(name){
  const key = (typeof name === 'string') ? name : DEFAULT_BACKUP_KEY;

  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('loadBackupJSON failed:', e);
    return null;
  }
}

export default {
  isDriveConnected,
  isSignedIntoDrive,
  ensureDriveAuth,
  signInDrive,
  signOutDrive,
  backupJSON,
  loadBackupJSON,
};
