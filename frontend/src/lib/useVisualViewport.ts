import { useEffect, useState } from 'react';

interface ViewportBox {
  height: number;
  offsetTop: number;
}

/**
 * Tracks the part of the screen that is actually visible.
 *
 * On iOS Safari the on-screen keyboard does not resize the layout viewport
 * (and so not `dvh` either): it only shrinks the visual viewport and may pan
 * it. Fixed elements sized from `dvh` then end up cut off or centred in the
 * wrong place, so they have to follow the visual viewport instead.
 * Returns null where the API is missing; callers then rely on their CSS.
 */
export function useVisualViewport(active: boolean): ViewportBox | null {
  const [box, setBox] = useState<ViewportBox | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => setBox({ height: vv.height, offsetTop: vv.offsetTop });
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      setBox(null);
    };
  }, [active]);

  return box;
}
