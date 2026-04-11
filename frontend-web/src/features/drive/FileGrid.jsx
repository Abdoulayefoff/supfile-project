import { th, C, fileIcon, fmtSize } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";

export default function FileGrid({ files, dark, onOpen, onCtx }) {
  const t = th(dark);
  if (!files.length) return null;

  return (
    <section>
      <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".12em", color:t.muted, marginBottom:12 }}>Fichiers</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
        {files.map(f => {
          const { icon, color } = fileIcon(f.mime);
          return (
            <div key={f.id}
              onDoubleClick={() => onOpen(f)}
              onContextMenu={e => onCtx(e, f)}
              className="card-hover"
              style={{ background:t.surface, borderRadius:12, padding:13, border:`1px solid ${t.border}` }}
            >
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:9 }}>
                <MaterialIcon n={icon} s={28} c={color} />
                {f.starred && <MaterialIcon n="star" s={14} c={C.amber} fill />}
              </div>
              <p style={{ fontSize:12, fontWeight:600, color:t.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginBottom:2 }}>{f.name}</p>
              <p style={{ fontSize:11, color:t.muted }}>{fmtSize(f.size)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
