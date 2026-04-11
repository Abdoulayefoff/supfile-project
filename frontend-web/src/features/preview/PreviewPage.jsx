import { useState } from "react";
import { ArrowLeft, Download, Star, Info } from "lucide-react";
import { th, C, fileIcon } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";
import Button from "../../components/ui/Button";
import IconButton from "../../components/ui/IconButton";
import FileViewer from "./FileViewer";
import InfoPanel from "./InfoPanel";

export default function PreviewPage({ dark, file, onBack }) {
  const t = th(dark);
  const [showInfo, setShowInfo] = useState(false);
  const [starred, setStarred]   = useState(file.starred || false);
  const { icon, color } = fileIcon(file.mime);

  return (
    <div style={{ maxWidth:1060, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 }}>

      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={onBack}
            style={{ display:"flex", alignItems:"center", gap:7, background:"none", border:`1px solid ${t.border}`, borderRadius:9999, padding:"7px 15px", cursor:"pointer", color:t.text, fontFamily:"Inter", fontWeight:600, fontSize:13, transition:"all .2s" }}
            onMouseEnter={e => e.currentTarget.style.background = t.low}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <ArrowLeft size={15} /> Retour
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <MaterialIcon n={icon} s={20} c={color} />
            <span style={{ fontSize:15, fontWeight:600, color:t.text }}>{file.name}</span>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setStarred(!starred)}
            style={{ background:"none", border:`1px solid ${t.border}`, borderRadius:9999, padding:"7px 13px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:t.text }}>
            <Star size={14} fill={starred ? C.amber : "none"} color={starred ? C.amber : t.muted} />
            <span style={{ fontSize:12, fontWeight:600, fontFamily:"Inter" }}>{starred ? "Favori" : "Ajouter"}</span>
          </button>
          <Button style={{ padding:"8px 16px", fontSize:13 }}>
            <Download size={14} /> Télécharger
          </Button>
          <IconButton color={showInfo ? C.primary : t.muted} onClick={() => setShowInfo(!showInfo)}
            style={{ border:`1px solid ${t.border}`, borderRadius:9999, padding:"7px 12px" }}>
            <Info size={15} />
          </IconButton>
        </div>
      </div>

      {/* Viewer + Info panel */}
      <div style={{ display:"flex", gap:18, flex:1 }}>
        <FileViewer dark={dark} file={file} />
        {showInfo && <InfoPanel dark={dark} file={file} />}
      </div>
    </div>
  );
}
