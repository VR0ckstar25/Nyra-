// Guarded require so this safety-relevant module stays unit-testable in plain
// node (expo-file-system needs a native env). File deletion degrades to a no-op
// where the native module is unavailable; the scan-list bookkeeping still runs.
let FileSystem;
try { FileSystem = require('expo-file-system'); } catch (e) { FileSystem = { deleteAsync: async () => {} }; }

export const LABEL_IMAGE_RETENTION_DAYS = 7;
const RETENTION_MS = LABEL_IMAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

function isLocalFile(uri) {
  return typeof uri === 'string' && uri.startsWith('file://');
}

export function enrichCapturedImage(image, saveLabelImages) {
  if (!image?.uri) return null;
  const capturedAt = image.capturedAt || new Date().toISOString();
  return {
    uri: image.uri,
    capturedAt,
    retainedOnDevice: !!saveLabelImages,
    deleteAfter: saveLabelImages ? null : new Date(new Date(capturedAt).getTime() + RETENTION_MS).toISOString(),
  };
}

// Toggle-off enforcement (review finding: photos captured while "Save label
// photos" was ON had deleteAfter:null and could NEVER expire, permanently
// breaking the "removed after 7 days" settings promise). When the toggle turns
// off, every retained photo gets a real deadline starting NOW.
export function applyRetentionPolicy(scans = [], saveLabelImages = false) {
  if (saveLabelImages) return scans;
  const deadline = new Date(Date.now() + RETENTION_MS).toISOString();
  return scans.map((scan) => {
    const image = scan?.image;
    if (!image || (!image.retainedOnDevice && image.deleteAfter)) return scan;
    return { ...scan, image: { ...image, retainedOnDevice: false, deleteAfter: image.deleteAfter || deadline } };
  });
}

export async function cleanupExpiredLabelImages(scans = [], saveLabelImages = false) {
  if (saveLabelImages) return scans;
  const now = Date.now();
  const next = [];

  // Repair pass first: a null deleteAfter while the toggle is off means the
  // photo predates the toggle-off fix — give it a real deadline.
  const repaired = applyRetentionPolicy(scans, saveLabelImages);

  for (const scan of repaired) {
    const image = scan?.image;
    const expired = image?.deleteAfter && new Date(image.deleteAfter).getTime() <= now;
    if (expired && isLocalFile(image.uri)) {
      await FileSystem.deleteAsync(image.uri, { idempotent: true }).catch(() => {});
    }
    next.push(expired ? { ...scan, image: null } : scan);
  }

  return next;
}
