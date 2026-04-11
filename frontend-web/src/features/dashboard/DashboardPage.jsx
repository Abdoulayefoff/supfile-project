import { BarChart3, FileText, Image, Video, Folder } from "lucide-react";
import { th, C, fileIcon, fmtSize } from "../../utils/theme";
import { FILES } from "../../data/mockData";
import MaterialIcon from "../../components/ui/MaterialIcon";

const STORAGE_PCT = 60;

const TYPE_STATS = [
  { label:"Docs",   val:"8 Go",  color:C.primary, Icon:FileText },
  { label:"Photos", val:"7 Go",  color:C.green,   Icon:Image },
  { label:"Vidéos", val:"3 Go",  color:C.orange,  Icon:Video },
  { label:"Autres", val:"12 Go", color:"#727785", Icon:Folder },
];

const QUICK_ACTIONS = [
  { icon:"create_new_folder", label:"Nouveau dossier", color:C.green },
  { icon:"upload_file",       label:"Upload",          color:C.primary },
  { icon:"share",             label:"Partager",        color:C.tertiary },
  { icon:"star",              label:"Favoris",         color:C.amber },
];

export default function DashboardPage({ dark, navigate }) {
  const t = th(dark);
  const recent = FILES.filter(f => f.type === "file").slice(0, 5);

  return (
    <div style={{ maxWidth:1060, margin:"0 auto", display:"flex", flexDirection:"column", gap:32 }}>

      {/* Greeting */}
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:50, height:50, borderRadius:14, background:`linear-gradient(135deg,${C.primary},${C.dark})`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <BarChart3 size={22} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:t.text, letterSpacing:"-0.02em" }}>Bonjour, Marie</h1>
          <p style={{ fontSize:13, color:t.muted }}>jean@supfile.com</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:18 }}>
        {/* Stockage */}
        <div style={{ background:t.surface, borderRadius:18, padding:22, border:`1px solid ${t.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg,${C.primary},${C.dark})`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <BarChart3 size={20} color="white" />
            </div>
            <div>
              <p style={{ fontSize:11, color:t.muted, fontWeight:500 }}>Espace utilisé</p>
              <p style={{ fontSize:26, fontWeight:800, color:t.text }}>18 Go</p>
              <p style={{ fontSize:12, color:C.green, fontWeight:700 }}>/ 30 Go</p>
            </div>
          </div>
          <div style={{ background:t.mid, borderRadius:9999, height:7 }}>
            <div className="progress" style={{ width:`${STORAGE_PCT}%` }} />
          </div>
          <p style={{ fontSize:11, color:t.muted, marginTop:6 }}>{STORAGE_PCT}% utilisé</p>
        </div>

        {/* Répartition */}
        <div style={{ background:t.surface, borderRadius:18, padding:22, border:`1px solid ${t.border}` }}>
          <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:t.muted, marginBottom:14 }}>Répartition</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {TYPE_STATS.map(({ label, val, color, Icon }) => (
              <div key={label} style={{ textAlign:"center", padding:"10px 6px", borderRadius:10, background:t.low }}>
                <div style={{ width:36, height:36, borderRadius:9, margin:"0 auto 6px", background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon size={17} color={color} />
                </div>
                <p style={{ fontSize:11, fontWeight:600, color:t.muted, marginBottom:2 }}>{label}</p>
                <p style={{ fontSize:14, fontWeight:800, color }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fichiers récents */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".12em", color:t.muted }}>Fichiers récents</p>
          <button onClick={() => navigate("drive")} style={{ background:"none", border:"none", cursor:"pointer", color:C.primary, fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:".08em" }}>Voir tout</button>
        </div>
        <div style={{ background:t.surface, borderRadius:14, overflow:"hidden", border:`1px solid ${t.border}` }}>
          {recent.map((f, i) => {
            const { icon, color } = fileIcon(f.mime);
            return (
              <div key={f.id} className="row-hover"
                onClick={() => navigate("preview", { file:f })}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", borderBottom: i < recent.length-1 ? `1px solid ${t.border}` : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,91,191,.03)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width:38, height:38, borderRadius:9, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <MaterialIcon n={icon} s={19} c={color} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:t.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.name}</p>
                  <p style={{ fontSize:11, color:t.muted }}>{f.modified} · {fmtSize(f.size)}</p>
                </div>
                {f.starred && <MaterialIcon n="star" s={14} c={C.amber} fill />}
                <MaterialIcon n="open_in_new" s={15} c={t.muted} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions rapides */}
      <div>
        <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".12em", color:t.muted, marginBottom:12 }}>Actions rapides</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {QUICK_ACTIONS.map(a => (
            <button key={a.label}
              style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:12, padding:"16px 12px", cursor:"pointer", transition:"all .2s", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
            >
              <div style={{ width:40, height:40, borderRadius:10, background:`${a.color}15`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <MaterialIcon n={a.icon} s={20} c={a.color} />
              </div>
              <span style={{ fontSize:12, fontWeight:600, color:t.text }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
