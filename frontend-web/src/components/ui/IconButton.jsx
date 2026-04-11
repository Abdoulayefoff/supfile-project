import { useState } from "react";

/**
 * Bouton icône avec fond au survol.
 */
export default function IconButton({ children, onClick, title, color, style = {} }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background:     hover ? "rgba(0,0,0,0.06)" : "none",
        border:         "none",
        cursor:         "pointer",
        padding:        7,
        borderRadius:   9999,
        display:        "inline-flex",
        alignItems:     "center",
        justifyContent: "center",
        color,
        transition:     "background 0.15s",
        ...style,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
}
