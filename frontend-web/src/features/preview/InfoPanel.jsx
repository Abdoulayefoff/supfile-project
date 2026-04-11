import { th } from "../../utils/theme";
import { fmtSize } from "../../utils/theme";

export default function InfoPanel({ dark, file }) {
  const t = th(dark);
  const rows = [
    ["Nom",          file.name],
    ["Type",         file.mime || "–"],
    ["Taille",       fmtSize(file.size)],
    ["Modifié",      file.modified],
    ["Propriétaire", file.owner],
  ];

  return (
    <div style={{
      width:256, background:t.surface, borderRadius:18, border:`1px solid ${t.border}`,
      padding:22, flexShrink:0, display:"flex", flexDirection:"column", gap:18,
    }} className="fade">
      <h4 style={{ fontSize:14, fontWeight:700, color:t.text }}>Détails</h4>
      {rows.map(([k, v]) => (
        <div key={k}>
          <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:t.muted, marginBottom:3 }}>{k}</p>
          <p style={{ fontSize:13, color:t.text, wordBreak:"break-all" }}>{v}</p>
        </div>
      ))}
    </div>
  );
}
