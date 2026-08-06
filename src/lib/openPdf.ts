/**
 * Open a PDF in the browser's NATIVE PDF viewer in a new tab.
 *
 * Resolves the stored URL to an inline-previewable URL (see lib/pdfUrl.ts —
 * extension-less Cloudinary raws go through the backend inline-proxy) and opens
 * it with window.open. Handles popup blockers by falling back to a
 * user-gesture anchor click, and never falls back to a download.
 */
import { getInlinePreviewUrl } from './pdfUrl';
import { BACKEND_ORIGIN } from '../api/client';

export function openPdf(url: string | null | undefined): void {
  if (!url) return;
  const target = getInlinePreviewUrl(url, BACKEND_ORIGIN) ?? url;

  let win: Window | null = null;
  try {
    win = window.open(target, '_blank', 'noopener,noreferrer');
  } catch {
    win = null;
  }

  if (win) {
    win.focus();
    return;
  }

  // Popup blocked → try a user-gesture anchor click (still a new tab).
  const a = document.createElement('a');
  a.href = target;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}