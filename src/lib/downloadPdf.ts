/**
 * Force-download a file (e.g. a Cloudinary PDF) as a blob.
 * Deliberately separate from any preview/view logic.
 */
import { getDownloadUrl } from './pdfUrl';

export async function downloadPdf(url: string, fileName = 'document.pdf'): Promise<void> {
  if (!url) throw new Error('Invalid file URL');

  const safeName = fileName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_') || 'document.pdf';
  const target = getDownloadUrl(url) ?? url;

  const response = await fetch(target, { credentials: 'omit' });
  if (!response.ok) throw new Error(`Failed to fetch file (${response.status})`);

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = safeName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Delay revocation so the download has time to start.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}