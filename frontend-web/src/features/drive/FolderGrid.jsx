import { th, C } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";

export default function FolderGrid({ folders, dark, onOpen, onCtx }) {
  const t = th(dark);
  if (!folders.length) return null;

  return (
    <section style={{ marginBottom:28 }}>
      <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".12em", color:t.muted, marginBottom:12 }}>Dossiers</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:9 }}>
        {folders.map(f => (
          <div key={f.id}
            onDoubleClick={() => onOpen(f.id)}
            onContextMenu={e => onCtx(e, f)}
            className="card-hover"
            style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 13px", borderRadius:11, background:t.low, border:"1px solid transparent" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,91,191,.15)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
          >
            <MaterialIcon n="folder" s={21} c={f.id === "d3" ? C.tertiary : t.muted} fill={f.id === "d3"} />
            <div style={{ flex:1, overflow:"hidden" }}>
              <p style={{ fontSize:13, fontWeight:500, color:t.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.name}</p>
              {f.shared && <span style={{ fontSize:10, color:C.primary, fontWeight:600 }}>Partagé</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
