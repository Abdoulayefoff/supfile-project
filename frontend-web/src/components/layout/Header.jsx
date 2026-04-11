import { useState } from "react";
import { Search, HelpCircle, Settings, Moon, Sun, Grid } from "lucide-react";
import { MaterialIcon, IconButton } from "../ui";
import { th } from "../../utils/theme";

export default function Header({ dark, navigate, toggleDark }) {
  const t = th(dark);
  const [search, setSearch] = useState("");

  const actions = [
    { el: <HelpCircle size={18} />,                         tip: "Aide" },
    { el: dark ? <Sun size={18} /> : <Moon size={18} />,   tip: "Thème",      fn: toggleDark },
    { el: <Settings size={18} />,                           tip: "Paramètres", fn: () => navigate("settings") },
    { el: <Grid size={18} />,                               tip: "Apps" },
  ];

  return (
    <header style={{
      position:      "sticky", top: 0, zIndex: 50, height: 64,
      background:    t.headerBg, borderBottom: `1px solid ${t.border}`,
      display:       "flex", alignItems: "center", justifyContent: "space-between",
      padding:       "0 22px",
    }}>
      {/* Logo + Recherche */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          onClick={() => navigate("dashboard")}
        >
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#005bbf,#1a73e8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MaterialIcon n="cloud" s={18} c="white" />
          </div>
          <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-0.03em", color: "#005bbf" }}>Supfile</span>
        </div>

        <div style={{ position: "relative", maxWidth: 360, flex: 1 }}>
          <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: t.muted, pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && search) navigate("search"); }}
            placeholder="Rechercher…"
            className="sf-input"
            style={{ width: "100%", paddingLeft: 34, background: t.mid, color: t.text, border: "none" }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {actions.map((b, i) => (
          <IconButton key={i} title={b.tip} onClick={b.fn} color={t.muted}>{b.el}</IconButton>
        ))}
        <div style={{ width: 32, height: 32, borderRadius: "50%", marginLeft: 8, background: "linear-gradient(135deg,#005bbf,#1a73e8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,91,191,.25)" }}>M</div>
      </div>
    </header>
  );
}
