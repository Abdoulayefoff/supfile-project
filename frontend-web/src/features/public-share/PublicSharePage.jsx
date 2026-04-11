import { useState } from "react";
import { th, C, fmtSize } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";
import Button from "../../components/ui/Button";

const DEMO_FILE = {
  name:    "contrat-2026.pdf",
  size:    2_500_000,
  owner:   "Marie D.",
  expires: "30 Avril 2026",
};

export default function PublicSharePage({ dark, onLogin }) {
  const t = th(dark);
  const [pw, setPw]           = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError]     = useState(false);

  const unlock = () => {
    if (pw === "1234") { setUnlocked(true); setError(false); }
    else setError(true);
  };

  return (
    <div style={{ minHeight:"100vh", background:t.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:28 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#005bbf,#1a73e8)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <MaterialIcon n="cloud" s={19} c="white" />
        </div>
        <span style={{ fontSize:19, fontWeight:900, letterSpacing:"-0.03em", color:"#005bbf" }}>Supfile</span>
      </div>

      {/* Carte */}
      <div style={{ background:t.surface, borderRadius:22, padding:32, width:"100%", maxWidth:420, boxShadow:"0 16px 56px rgba(0,91,191,.10)", border:`1px solid ${t.border}` }} className="fade">

        {/* En-tête fichier */}
        <div style={{ textAlign:"center", marginBottom:22 }}>
          <MaterialIcon n="folder_zip" s={52} c={C.primary} style={{ marginBottom:10 }} />
          <h2 style={{ fontSize:19, fontWeight:700, color:t.text, marginBottom:4 }}>{DEMO_FILE.name}</h2>
          <p style={{ fontSize:13, color:t.muted }}>
            Partagé par <strong>{DEMO_FILE.owner}</strong> · {fmtSize(DEMO_FILE.size)}
          </p>
          <p style={{ fontSize:12, color:t.muted, marginTop:3 }}>Expire le {DEMO_FILE.expires}</p>
        </div>

        {/* Accès verrouillé */}
        {!unlocked ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <label className="sf-label" style={{ color:t.muted }}>Mot de passe requis</label>
            <div style={{ position:"relative" }}>
              <MaterialIcon n="lock" s={17} c={t.muted} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }} />
              <input
                type="password"
                placeholder="••••••••"
                value={pw}
                onChange={e => { setPw(e.target.value); setError(false); }}
                onKeyDown={e => e.key === "Enter" && unlock()}
                className="sf-input"
                style={{ width:"100%", paddingLeft:40, background:t.low, color:t.text, border:"none", boxShadow: error ? "0 0 0 2px #ba1a1a" : "none" }}
              />
            </div>
            {error && (
              <p style={{ fontSize:12, color:C.red }}>Incorrect — essayez « 1234 »</p>
            )}
            <Button style={{ width:"100%" }} onClick={unlock}>
              <MaterialIcon n="lock_open" s={15} c="white" /> Accéder au fichier
            </Button>
          </div>
        ) : (
          /* Accès autorisé */
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ background:`${C.green}12`, border:`1px solid ${C.green}30`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
              <MaterialIcon n="check_circle" s={19} c={C.green} fill />
              <span style={{ fontSize:13, fontWeight:600, color:C.green }}>Accès autorisé</span>
            </div>
            <Button style={{ width:"100%" }}>
              <MaterialIcon n="download" s={15} c="white" /> Télécharger
            </Button>
            <button onClick={onLogin} style={{ width:"100%", padding:"11px", borderRadius:9999, border:`1px solid ${t.border}`, background:"none", cursor:"pointer", color:t.muted, fontFamily:"Inter", fontWeight:600, fontSize:13 }}>
              Se connecter pour plus de fonctionnalités
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
