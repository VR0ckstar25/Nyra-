// dataExport.js — user-facing "download my data" backup (the last local backup
// path). Builds a portable JSON of everything Nyara holds for the user, writes
// it to a file, and hands it to the OS share sheet.
//
// PRIVACY: label PHOTOS never leave the device, so the export carries only photo
// METADATA (capture date / retention), never image bytes or file URIs. Health
// data (profile/severity/diary) IS included — it's the user's own copy, on their
// explicit action. buildExportPayload is pure + tested; the file/share side is
// guarded so the module loads in plain node.

let FileSystem;
try { FileSystem = require('expo-file-system'); } catch (e) { FileSystem = null; }

export const EXPORT_SCHEMA_VERSION = 1;

function safeImageMeta(image) {
  if (!image) return null;
  // Keep only non-identifying retention metadata — drop the on-device file uri.
  return {
    capturedAt: image.capturedAt || null,
    retainedOnDevice: !!image.retainedOnDevice,
    deleteAfter: image.deleteAfter || null,
  };
}

// The full scanned label text is as sensitive as the photo it came from (it IS the
// label contents). Cloud writes strip it; the export must too — keep only the OCR
// confidence + capture time so the diary entry stays meaningful (review finding).
function safeOcrMeta(ocr) {
  if (!ocr) return null;
  return { confidence: ocr.confidence ?? null, capturedAt: ocr.capturedAt || null };
}

export function buildExportPayload({ profile = null, scans = [], feedback = [], settings = {}, exportedAt } = {}) {
  const stamp = exportedAt || new Date().toISOString();
  const scanList = Array.isArray(scans) ? scans.filter((s) => s && typeof s === 'object') : [];
  const feedbackList = Array.isArray(feedback) ? feedback : [];
  const safeSettings = settings && typeof settings === 'object' ? settings : {};
  return {
    app: 'Nyara',
    schema: EXPORT_SCHEMA_VERSION,
    exportedAt: stamp,
    note: 'Your Nyara data. Label photos stay on your device and are not included — only their dates.',
    profile,
    plan: safeSettings.commercial?.planId || 'free',
    counts: { scans: scanList.length, feedback: feedbackList.length, familyMembers: (Array.isArray(profile?.familyMembers) ? profile.familyMembers : []).length },
    scans: scanList.map((s) => ({ ...s, image: safeImageMeta(s.image), ocr: safeOcrMeta(s.ocr) })),
    feedback: feedbackList,
  };
}

export function exportFileName(exportedAt) {
  const day = String(exportedAt || new Date().toISOString()).slice(0, 10);
  return `nyara-data-${day}.json`;
}

// Native: write the export to a file and return its uri (or null if FS missing).
export async function writeExportFile(payload) {
  if (!FileSystem?.documentDirectory) return null;
  const uri = `${FileSystem.documentDirectory}${exportFileName(payload.exportedAt)}`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2));
  return uri;
}
