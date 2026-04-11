// ─── Design tokens ────────────────────────────────────────────
export const C = {
  primary:  "#005bbf",
  dark:     "#1a73e8",
  green:    "#34a853",
  orange:   "#f97316",
  amber:    "#f59e0b",
  red:      "#ba1a1a",
  tertiary: "#9e4300",
};

/**
 * Retourne un objet de couleurs adapté au mode sombre/clair.
 * @param {boolean} dark
 */
export function th(dark) {
  return {
    bg:        dark ? "#0f172a"              : "#f0f2f5",
    surface:   dark ? "#1e293b"              : "#ffffff",
    low:       dark ? "#1a2535"              : "#f3f4f5",
    mid:       dark ? "#243044"              : "#e7e8e9",
    text:      dark ? "#f1f5f9"              : "#191c1d",
    muted:     dark ? "#94a3b8"              : "#414754",
    border:    dark ? "rgba(255,255,255,0.07)" : "rgba(193,198,214,0.35)",
    headerBg:  dark ? "#0f172a"              : "#f8f9fa",
    sidebarBg: dark ? "#111827"              : "#f3f4f5",
  };
}

/**
 * Retourne l'icône Material et la couleur associées à un type MIME.
 * @param {string|undefined} mime
 */
export function fileIcon(mime) {
  if (!mime)                     return { icon: "folder",           color: "#414754" };
  if (mime.startsWith("image"))  return { icon: "image",            color: C.primary };
  if (mime.startsWith("video"))  return { icon: "videocam",         color: C.orange };
  if (mime.startsWith("audio"))  return { icon: "music_note",       color: C.tertiary };
  if (mime === "application/pdf")return { icon: "picture_as_pdf",   color: C.red };
  if (mime.includes("xlsx"))     return { icon: "grid_on",          color: C.green };
  if (mime.includes("pptx"))     return { icon: "slideshow",        color: C.orange };
  if (mime.startsWith("text"))   return { icon: "description",      color: C.primary };
  return                                { icon: "insert_drive_file", color: "#727785" };
}

/**
 * Formate un nombre d'octets en Ko / Mo / Go lisible.
 * @param {number|undefined} b
 */
export function fmtSize(b) {
  if (!b) return "–";
  if (b < 1_048_576)    return (b / 1_024).toFixed(0) + " Ko";
  if (b < 1_073_741_824) return (b / 1_048_576).toFixed(1) + " Mo";
  return (b / 1_073_741_824).toFixed(2) + " Go";
}
