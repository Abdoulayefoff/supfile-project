import { th, C, fileIcon } from "../../utils/theme";
import { FILES } from "../../data/mockData";
import MaterialIcon from "../../components/ui/MaterialIcon";

export default function SharedPage({ dark, navigate }) {
  const t = th(dark);
  const shared = FILES.filter(f => f.shared || f.owner !== "Me");

  return (
    <div style={{ maxWidth:860, margin:"0 auto" }}>
      <h1 style={{ fontSize:24, fontWeight:800, color:t.text, marginBottom:22 }}>Partagés avec moi</h1>

      <div style={{ background:t.surface, borderRadius:14, overflow:"hidden", border:`1px solid ${t.border}` }}>
        {/* En-tête */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 140px 120px 36px", padding:"11px 18px", background:t.low, borderBottom:`1px solid ${t.border}` }}>
          {["Nom","Partagé par","Modifié",""].map((h, i) => (
            <span key={i} style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".10em", color:t.muted }}>{h}</span>
          ))}
        </div>

        {/* Lignes */}
        {shared.map((f, i) => {
          const { icon, color } = fileIcon(f.mime);
          return (
            <div key={f.id} className="row-hover"
              onClick={() => f.type === "file" && navigate("preview", { file:f })}
              style={{ display:"grid", gridTemplateColumns:"1fr 140px 120px 36px", padding:"12px 18px", alignItems:"center", borderBottom: i < shared.length-1 ? `1px solid ${t.border}` : "none" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,91,191,.03)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <MaterialIcon n={f.type === "folder" ? "folder" : icon} s={19} c={f.type === "folder" ? t.muted : color} />
                <span style={{ fontSize:13, fontWeight:500, color:t.text }}>{f.name}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:`linear-gradient(135deg,${C.primary},${C.dark})`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:10, fontWeight:700 }}>
                  {f.owner[0]}
                </div>
                <span style={{ fontSize:12, color:t.muted }}>{f.owner}</span>
              </div>
              <span style={{ fontSize:12, color:t.muted }}>{f.modified}</span>
              <MaterialIcon n="open_in_new" s={15} c={t.muted} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
