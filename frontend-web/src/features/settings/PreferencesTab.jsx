import { th, C } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";

export default function PreferencesTab({ dark, toggleDark }) {
  const t = th(dark);

  const rows = [
    {
      icon:  dark ? "dark_mode" : "light_mode",
      title: `Thème ${dark ? "Sombre" : "Clair"}`,
      sub:   "Basculer clair / sombre",
      right: (
        <div onClick={toggleDark} className="toggle" style={{ background: dark ? C.primary : t.mid }}>
          <div className="toggle-knob" style={{ left: dark ? 23 : 3 }} />
        </div>
      ),
    },
    {
      icon:  "language",
      title: "Langue",
      sub:   "Langue de l'interface",
      right: (
        <select className="sf-input" style={{ background:t.low, color:t.text, fontSize:13, padding:"7px 10px", border:"none" }}>
          <option>Français</option>
          <option>English</option>
        </select>
      ),
    },
    {
      icon:  "notifications",
      title: "Notifications",
      sub:   "Alertes de partage",
      right: (
        <div className="toggle" style={{ background: C.green }}>
          <div className="toggle-knob" style={{ left: 23 }} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"15px 0", borderBottom: i < rows.length-1 ? `1px solid ${t.border}` : "none" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <MaterialIcon n={row.icon} s={21} c={C.primary} />
            <div>
              <p style={{ fontSize:14, fontWeight:600, color:t.text }}>{row.title}</p>
              <p style={{ fontSize:12, color:t.muted }}>{row.sub}</p>
            </div>
          </div>
          {row.right}
        </div>
      ))}
    </div>
  );
}
