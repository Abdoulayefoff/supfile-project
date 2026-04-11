import { C } from "../../utils/theme";

/**
 * Bouton primaire avec dégradé bleu.
 */
export default function Button({ children, onClick, style = {}, disabled = false }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        background:    `linear-gradient(135deg,${C.primary},${C.dark})`,
        color:         "white",
        border:        "none",
        borderRadius:  9999,
        cursor:        "pointer",
        fontFamily:    "Inter",
        fontWeight:    600,
        fontSize:      14,
        padding:       "11px 22px",
        display:       "inline-flex",
        alignItems:    "center",
        justifyContent:"center",
        gap:           8,
        boxShadow:     "0 4px 16px rgba(0,91,191,0.28)",
        transition:    "all 0.2s",
        opacity:       disabled ? 0.65 : 1,
        ...style,
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.filter    = "brightness(1.08)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.filter    = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      {children}
    </button>
  );
}
