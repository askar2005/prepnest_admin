/**
 * PDF URL helpers.
 *
 * VIEW: previews always open in the browser's NATIVE PDF viewer in a new tab
 * (no modal, no iframe, no blob, no custom renderer). Extension-less Cloudinary
 * raw files (e.g. `raw/upload/v.../file_gngxdq`) are served with
 * `Content-Disposition: attachment` + `application/octet-stream`, which would
 * force a download even in a new tab. Cloudinary has no "inline" flag, so such
 * URLs are routed through the backend inline-proxy endpoint
 * (`/api/files/preview?url=...`) which re-serves the bytes as
 * `application/pdf` with an `inline` disposition — the browser then renders it
 * natively.
 *
 * DOWNLOAD: downloads deterministically force attachment by injecting
 * `fl_attachment` into the Cloudinary delivery URL. View never uses it.
 */

function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com');
}

/** True when the stored URL already carries a `.pdf` extension (served inline). */
function hasPdfExtension(url: string): boolean {
  return /\.pdf(?:[?#]|$)/i.test(url);
}

/**
 * Resolves a stored file URL into a URL the browser's native PDF viewer will
 * render inline in a new tab:
 *
 * - Cloudinary URLs ending in `.pdf` are served `application/pdf` with no
 *   Content-Disposition → usable directly.
 * - Extension-less Cloudinary raw URLs and data: PDF URLs → backend
 *   inline-proxy URL (browsers also block top-level data: navigation).
 * - Anything else → returned unchanged.
 */
export function getInlinePreviewUrl(url: string | null | undefined, backendOrigin: string): string | null {
  if (!url) return null;
  if (isCloudinaryUrl(url) && hasPdfExtension(url)) return url;
  if (url.startsWith('data:application/pdf')) {
    return `${backendOrigin}/api/files/preview?url=${encodeURIComponent(url)}`;
  }
  if (isCloudinaryUrl(url)) {
    return `${backendOrigin}/api/files/preview?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/**
 * Returns a URL that deterministically forces a download:
 *
 * - Cloudinary URLs get `fl_attachment` injected (verified: returns
 *   `Content-Disposition: attachment` for both raw and image resources).
 * - data: URLs and everything else are returned unchanged (the blob download
 *   helper handles those).
 */
export function getDownloadUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (isCloudinaryUrl(url) && !url.includes('/fl_attachment/')) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
}
