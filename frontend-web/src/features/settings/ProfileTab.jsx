import { useState } from "react";
import { th, C } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";
import Button from "../../components/ui/Button";

export default function ProfileTab({ dark }) {
  const t = th(dark);
  const [name, setName]   = useState("Marie Dupont");
  const [email, setEmail] = useState("jean@supfile.com");
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const fields = [
    { label:"Nom complet",   val:name,  set:setName,  type:"text",  icon:"person" },
    { label:"Adresse email", val:email, set:setEmail, type:"email", icon:"mail" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      {/* Avatar */}
      <div style={{ display:"flex", alignItems:"center", gap:18 }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${C.primary},${C.dark})`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:26, fontWeight:700, boxShadow:"0 8px 24px rgba(0,91,191,.3)" }}>M</div>
        <div>
          <Button style={{ fontSize:13, padding:"8px 16px" }}>
            <MaterialIcon n="photo_camera" s={14} c="white" /> Changer l'avatar
          </Button>
          <p style={{ fontSize:12, color:t.muted, marginTop:5 }}>JPG, PNG · Max 2 Mo</p>
        </div>
      </div>

      {/* Champs */}
      {fields.map(f => (
        <div key={f.label}>
          <label className="sf-label" style={{ color:t.muted }}>{f.label}</label>
          <div style={{ position:"relative" }}>
            <MaterialIcon n={f.icon} s={17} c={t.muted} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }} />
            <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} className="sf-input"
              style={{ width:"100%", paddingLeft:40, background:t.low, color:t.text, border:"none" }} />
          </div>
        </div>
      ))}

      <Button style={{ alignSelf:"flex-start" }} onClick={save}>
        {saved ? <><MaterialIcon n="check" s={15} c="white" /> Sauvegardé !</> : "Enregistrer"}
      </Button>
    </div>
  );
}
