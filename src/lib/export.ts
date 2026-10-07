import JSZip from 'jszip';

export async function exportProjectZip(files: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();
  for (const [rel, content] of Object.entries(files)) zip.file(rel, content);
  return zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

