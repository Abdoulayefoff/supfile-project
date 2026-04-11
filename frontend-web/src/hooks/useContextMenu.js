import { useState, useCallback } from "react";

/**
 * Gère l'état d'un menu contextuel (clic droit).
 */
export function useContextMenu() {
  const [ctx, setCtx] = useState(null); // { file, x, y }

  const open  = useCallback((e, file) => {
    e.preventDefault();
    e.stopPropagation();
    setCtx({ file, x: e.clientX, y: e.clientY });
  }, []);

  const close = useCallback(() => setCtx(null), []);

  return { ctx, openCtx: open, closeCtx: close };
}
