import { useState } from "react";
import { th, C } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";
import ProfileTab     from "./ProfileTab";
import SecurityTab    from "./SecurityTab";
import PreferencesTab from "./PreferencesTab";

const TABS = [
  { key:"profile",     label:"Profil",      icon:"person" },
  { key:"security",    label:"Sécurité",    icon:"lock" },
  { key:"preferences", label:"Préférences", icon:"tune" },
];

export default function SettingsPage({ dark, toggleDark }) {
  const t = th(dark);
  const [tab, setTab] = useState("profile");

  return (
    <div style={{ maxWidth:680, margin:"0 auto" }}>
      <h1 style={{ fontSize:24, fontWeight:800, color:t.text, marginBottom:24 }}>Paramètres</h1>

      {/* Sélecteur d'onglets */}
      <div style={{ display:"flex", gap:3, background:t.low, padding:4, borderRadius:11, marginBottom:24 }}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            padding:"9px 12px", borderRadius:8, border:"none", cursor:"pointer",
            fontFamily:"Inter", fontWeight:600, fontSize:13,
            background: tab === tb.key ? t.surface : "transparent",
            color:      tab === tb.key ? C.primary : t.muted,
            boxShadow:  tab === tb.key ? "0 1px 4px rgba(0,0,0,.08)" : "none",
            transition: "all .15s",
          }}>
            <MaterialIcon n={tb.icon} s={15} />
            {tb.label}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet */}
      <div style={{ background:t.surface, borderRadius:18, padding:28, border:`1px solid ${t.border}` }}>
        {tab === "profile"     && <ProfileTab     dark={dark} />}
        {tab === "security"    && <SecurityTab    dark={dark} />}
        {tab === "preferences" && <PreferencesTab dark={dark} toggleDark={toggleDark} />}
      </div>
    </div>
  );
}
