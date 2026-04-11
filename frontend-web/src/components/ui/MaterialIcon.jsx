/**
 * Affiche une icône Material Symbols Outlined.
 * @param {{ n:string, s?:number, c?:string, fill?:boolean, style?:object }} props
 */
export default function MaterialIcon({ n, s = 22, c, fill = false, style = {} }) {
  return (
    <span
      style={{
        fontFamily: "'Material Symbols Outlined'",
        fontStyle:  "normal",
        lineHeight: 1,
        userSelect: "none",
        display:    "inline-block",
        fontSize:   s,
        color:      c,
        fontVariationSettings: fill
          ? "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24"
          : "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
        ...style,
      }}
    >
      {n}
    </span>
  );
}
