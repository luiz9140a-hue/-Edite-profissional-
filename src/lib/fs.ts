export async function saveTextToDisk(text: string, suggestedName = 'index.html') {
  const anyWin = window as any;
  if (anyWin.showSaveFilePicker) {
    const handle = await anyWin.showSaveFilePicker({
      suggestedName,
      types: [{ description: 'HTML', accept: { 'text/html': ['.html'] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
    return true;
  }
  const blob = new Blob([text], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

