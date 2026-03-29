function legacyCopyText(text: string): boolean {
  if (typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') {
    return false;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';

  document.body.appendChild(textarea);
  textarea.select();

  const copied = typeof document.execCommand === 'function' ? document.execCommand('copy') : false;

  document.body.removeChild(textarea);
  return copied;
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (legacyCopyText(text)) {
    return;
  }

  throw new Error('clipboard unavailable');
}
