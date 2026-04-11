import { useState } from "react";
import { X } from "lucide-react";
import { th, C } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";
import IconButton from "../../components/ui/IconButton";
import Button from "../../components/ui/Button";

const SHARE_LINK = "https://supfile.io/s/xK9mP2aR";

export default function ShareModal({ dark, file, onClose }) {
  const t = th(dark);
  const [exp, setExp] = useState("");
  const [pw, setPw]   = useState("");

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,.45)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:t.surface, borderRadius:22, padding:28, width:440, boxShadow:"0 24px 80px rgba(0,0,0,.2)" }} className="fade">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h3 style={{ fontSize:17, fontWeight:700, color:t.text }}>Partager « {file.name} »</h3>
          <IconButton onClick={onClose} color={t.muted}><X size={18} /></IconButton>
        </div>

        {/* Lien */}
        <div style={{ background:t.low, borderRadius:10, padding:"11px 13px", display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <MaterialIcon n="link" s={17} c={C.primary} />
          <span style={{ flex:1, fontSize:12, color:t.text, fontFamily:"monospace", wordBreak:"break-all" }}>{SHARE_LINK}</span>
          <button onClick={() => navigator.clipboard?.writeText(SHARE_LINK)}
            style={{ background:"none", border:"none", cursor:"pointer", color:C.primary, fontWeight:700, fontSize:12, fontFamily:"Inter" }}>
            Copier
          </button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label className="sf-label" style={{ color:t.muted }}>Expiration</label>
            <input type="date" value={exp} onChange={e => setExp(e.target.value)} className="sf-input"
              style={{ width:"100%", background:t.low, color:t.text, border:"none" }} />
          </div>
          <div>
            <label className="sf-label" style={{ color:t.muted }}>Mot de passe (optionnel)</label>
            <input type="password" placeholder="Aucun" value={pw} onChange={e => setPw(e.target.value)} className="sf-input"
              style={{ width:"100%", background:t.low, color:t.text, border:"none" }} />
          </div>
        </div>

        <Button style={{ width:"100%", marginTop:18 }} onClick={onClose}>
          <MaterialIcon n="share" s={16} c="white" /> Générer le lien
        </Button>
      </div>
    </div>
  );
}
