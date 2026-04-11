import { Download } from "lucide-react";
import { th, C, fileIcon, fmtSize } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";
import Button from "../../components/ui/Button";

const MD_CONTENT = `# Readme — SUPFile

## Introduction
SUPFile est une plateforme de stockage cloud haute performance.

## Installation
\`docker compose up -d\`

## Fonctionnalités
- Upload / Download avec progression
- Prévisualisation instantanée
- Partage sécurisé avec expiration
- Recherche unifiée par nom/type`;

export default function FileViewer({ dark, file }) {
  const t = th(dark);
  const { icon, color } = fileIcon(file.mime);

  const isImg = file.mime?.startsWith("image");
  const isVid = file.mime?.startsWith("video");
  const isAud = file.mime?.startsWith("audio");
  const isPDF = file.mime === "application/pdf";
  const isTxt = file.mime?.startsWith("text");

  return (
    <div style={{
      flex:1, background:t.surface, borderRadius:18, border:`1px solid ${t.border}`,
      overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", minHeight:480,
    }}>
      {/* Image */}
      {isImg && (
        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ width:"100%", maxWidth:480, aspectRatio:"4/3", borderRadius:12, background:`linear-gradient(135deg,rgba(0,91,191,.10),rgba(26,115,232,.06))`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
            <MaterialIcon n="image" s={68} c={`${C.primary}55`} />
            <p style={{ fontSize:13, color:t.muted }}>Aperçu — {file.name}</p>
          </div>
        </div>
      )}

      {/* Vidéo */}
      {isVid && (
        <div style={{ width:"100%", padding:24 }}>
          <div style={{ width:"100%", aspectRatio:"16/9", background:"#000", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
            <button style={{ width:58, height:58, borderRadius:"50%", border:"2px solid rgba(255,255,255,.4)", background:"rgba(255,255,255,.15)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <MaterialIcon n="play_arrow" s={30} c="white" fill />
            </button>
            <p style={{ fontSize:12, color:"rgba(255,255,255,.6)" }}>{file.name}</p>
            <div style={{ width:"75%", height:4, background:"rgba(255,255,255,.2)", borderRadius:9999 }}>
              <div style={{ height:"100%", width:"30%", background:C.primary, borderRadius:9999 }} />
            </div>
          </div>
        </div>
      )}

      {/* Audio */}
      {isAud && (
        <div style={{ padding:48, display:"flex", flexDirection:"column", alignItems:"center", gap:24, width:"100%" }}>
          <div className="float" style={{ width:110, height:110, borderRadius:"50%", background:`linear-gradient(135deg,${C.tertiary},#f97316)`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 16px 48px rgba(158,67,0,.3)` }}>
            <MaterialIcon n="music_note" s={48} c="white" fill />
          </div>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:17, fontWeight:700, color:t.text, marginBottom:4 }}>{file.name}</p>
            <p style={{ fontSize:13, color:t.muted }}>{fmtSize(file.size)}</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            {["skip_previous","play_arrow","skip_next"].map((ic, i) => (
              <button key={ic} style={{ width: i===1?52:38, height: i===1?52:38, borderRadius:"50%", border:"none", cursor:"pointer", background: i===1 ? `linear-gradient(135deg,${C.primary},${C.dark})` : t.low, display:"flex", alignItems:"center", justifyContent:"center", boxShadow: i===1 ? "0 4px 16px rgba(0,91,191,.3)" : "none" }}>
                <MaterialIcon n={ic} s={i===1?26:20} c={i===1?"white":t.muted} fill />
              </button>
            ))}
          </div>
          <div style={{ width:"65%", height:4, background:t.mid, borderRadius:9999 }}>
            <div style={{ width:"45%", height:"100%", borderRadius:9999, background:`linear-gradient(90deg,${C.primary},${C.dark})` }} />
          </div>
        </div>
      )}

      {/* PDF */}
      {isPDF && (
        <div style={{ padding:36, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:18, width:"100%" }}>
          <MaterialIcon n="picture_as_pdf" s={64} c={C.red} />
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:17, fontWeight:700, color:t.text, marginBottom:6 }}>{file.name}</p>
            <p style={{ fontSize:13, color:t.muted }}>{fmtSize(file.size)} · PDF</p>
          </div>
          <Button><MaterialIcon n="open_in_new" s={15} c="white" /> Ouvrir la visionneuse</Button>
        </div>
      )}

      {/* Texte / Markdown */}
      {isTxt && (
        <div style={{ width:"100%", height:"100%", padding:32, overflowY:"auto" }}>
          <pre style={{ fontFamily:"'Courier New',monospace", fontSize:13, lineHeight:1.8, color:t.text, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
            {MD_CONTENT}
          </pre>
        </div>
      )}

      {/* Fallback */}
      {!isImg && !isVid && !isAud && !isPDF && !isTxt && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14, opacity:.6 }}>
          <MaterialIcon n={icon} s={68} c={color} />
          <p style={{ fontSize:14, fontWeight:600, color:t.text }}>Aperçu non disponible</p>
          <Button><Download size={15} /> Télécharger</Button>
        </div>
      )}
    </div>
  );
}
