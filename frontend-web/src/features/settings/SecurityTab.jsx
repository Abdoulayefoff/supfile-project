import { useState } from "react";
import { th, C } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";
import Button from "../../components/ui/Button";

const SESSIONS = [
  { device:"Chrome — Paris, FR", current:true,  last:"Maintenant" },
  { device:"Firefox — Lyon, FR", current:false, last:"Il y a 3j" },
];

const PW_FIELDS = ["Mot de passe actuel", "Nouveau mot de passe", "Confirmer le nouveau"];

export default function SecurityTab({ dark }) {
  const t = th(dark);
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <h3 style={{ fontSize:15, fontWeight:700, color:t.text }}>Changer le mot de passe</h3>

      {PW_FIELDS.map(label => (
        <div key={label}>
          <label className="sf-label" style={{ color:t.muted }}>{label}</label>
          <div style={{ position:"relative" }}>
            <MaterialIcon n="lock" s={17} c={t.muted} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }} />
            <input type="password" placeholder="••••••••" className="sf-input"
              style={{ width:"100%", paddingLeft:40, background:t.low, color:t.text, border:"none" }} />
          </div>
        </div>
      ))}

      {/* Sessions */}
      <div style={{ borderTop:`1px solid ${t.border}`, paddingTop:20 }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:12 }}>Sessions actives</h3>
        {SESSIONS.map(s => (
          <div key={s.device} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 0", borderBottom:`1px solid ${t.border}` }}>
            <MaterialIcon n="computer" s={19} c={t.muted} />
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:500, color:t.text }}>{s.device}</p>
              <p style={{ fontSize:11, color:t.muted }}>Dernière : {s.last}</p>
            </div>
            {s.current
              ? <span style={{ fontSize:11, fontWeight:700, color:C.green, background:`${C.green}15`, padding:"3px 10px", borderRadius:9999 }}>Actuelle</span>
              : <button style={{ fontSize:12, color:C.red, background:"none", border:`1px solid ${C.red}30`, borderRadius:9999, padding:"3px 10px", cursor:"pointer" }}>Révoquer</button>
            }
          </div>
        ))}
      </div>

      <Button style={{ alignSelf:"flex-start" }} onClick={save}>
        {saved ? "Mis à jour !" : "Mettre à jour le mot de passe"}
      </Button>
    </div>
  );
}
