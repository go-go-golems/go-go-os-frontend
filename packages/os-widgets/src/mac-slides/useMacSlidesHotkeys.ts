import { useEffect } from 'react';

export function useMacSlidesHotkeys({
  paletteOpen,
  presentationOpen,
  openPalette,
  openPresentation,
  goPrev,
  goNext,
}: {
  paletteOpen: boolean;
  presentationOpen: boolean;
  openPalette: () => void;
  openPresentation: () => void;
  goPrev: () => void;
  goNext: () => void;
}) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (paletteOpen || presentationOpen) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        openPalette();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        openPresentation();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, openPalette, openPresentation, paletteOpen, presentationOpen]);
}
