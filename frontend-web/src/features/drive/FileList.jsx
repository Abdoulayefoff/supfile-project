import { MoreVertical } from "lucide-react";
import { th, C, fileIcon, fmtSize } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";
import IconButton from "../../components/ui/IconButton";

const HEADERS = ["Nom", "Propriétaire", "Modifié", "Taille", ""];

export default function FileList({ files, dark, onOpen, onCtx }) {
  const t = th(dark);
  if (!files.length) return null;

  return (
    <section>
      <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".12em", color:t.muted, marginBottom:12 }}>Fichiers</p>
      <div style={{ background:t.surface, borderRadius:14, overflow:"hidden", border:`1px solid ${t.border}` }}>
        {/* En-tête */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 120px 120px 80px 36px", padding:"11px 18px", background:t.low, borderBottom:`1px solid ${t.border}` }}>
          {HEADERS.map((h, i) => (
            <span key={i} style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".10em", color:t.muted }}>{h}</span>
          ))}
        </div>

        {/* Lignes */}
        {files.map((f, i) => {
          const { icon, color } = fileIcon(f.mime);
          return (
            <div key={f.id} className="row-hover"
              onDoubleClick={() => onOpen(f)}
              onContextMenu={e => onCtx(e, f)}
              style={{ display:"grid", gridTemplateColumns:"1fr 120px 120px 80px 36px", padding:"12px 18px", alignItems:"center", borderBottom: i < files.length-1 ? `1px solid ${t.border}` : "none" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,91,191,.03)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <MaterialIcon n={icon} s={19} c={color} />
                <span style={{ fontSize:13, fontWeight:500, color:t.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:180 }}>{f.name}</span>
                {f.starred && <MaterialIcon n="star" s={13} c={C.amber} fill />}
              </div>
              <span style={{ fontSize:12, color:t.muted }}>{f.owner}</span>
              <span style={{ fontSize:12, color:t.muted }}>{f.modified}</span>
              <span style={{ fontSize:12, color:t.muted }}>{fmtSize(f.size)}</span>
              <IconButton color={t.muted} onClick={e => onCtx(e, f)}>
                <MoreVertical size={14} />
              </IconButton>
            </div>
          );
        })}
      </div>
    </section>
  );
}
