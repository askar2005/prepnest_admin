/**
 * Open a PDF in the browser's NATIVE PDF viewer in a new tab.
 *
 * Two paths:
 *
 * 1. Direct-inline URLs (Cloudinary URLs ending in `.pdf`, plain http(s)
 *    links) need no auth → opened straight away with window.open.
 *
 * 2. Backend proxy URLs (`/api/files/preview?url=...`) REQUIRE the Bearer
 *    JWT. A new tab cannot carry an Authorization header, so instead we:
 *      - open a blank tab (keeps the user-gesture context),
 *      - fetch the PDF through the authenticated API client (Authorization
 *        header is injected by the client interceptor),
 *      - wrap the bytes in a Blob typed `application/pdf` and create an
 *        object URL,
 *      - navigate the blank tab to the blob URL → the browser's native PDF
 *        viewer renders it (toolbar, zoom, search, print, rotate, pages,
 *        thumbnails).
 *
 * Never falls back to a download for previews, and never loses the auth
 * context. Blob URLs are revoked after the tab has had time to load the file.
 */
import { getInlinePreviewUrl } from './pdfUrl';
import { BACKEND_ORIGIN, apiClient } from '../api/client';

const PROXY_PREFIX = '/api/files/preview?url=';

function isProxyTarget(target: string): boolean {
  return target.includes(PROXY_PREFIX);
}

function openBlankTab(): Window | null {
  try {
    return window.open('', '_blank');
  } catch {
    return null;
  }
}

function anchorFallback(href: string) {
  const a = document.createElement('a');
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function openPdf(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const target = getInlinePreviewUrl(url, BACKEND_ORIGIN) ?? url;

  if (!isProxyTarget(target)) {
    let win: Window | null = null;
    try {
      win = window.open(target, '_blank', 'noopener,noreferrer');
    } catch {
      win = null;
    }
    if (win) win.focus();
    else anchorFallback(target);
    return;
  }

  // Authenticated proxy path: fetch with Bearer JWT, hand the native viewer a
  // blob URL.
  const win = openBlankTab();
  try {
    const response = await apiClient.get(target, { responseType: 'blob' });
    const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);

    if (win) {
      win.location.href = objectUrl;
    } else {
      anchorFallback(objectUrl);
    }

    // Keep the blob alive long enough for the tab to fully load the document;
    // after that the resource is safe to release.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch {
    win?.close();
  }
}