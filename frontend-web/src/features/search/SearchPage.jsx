import { useState } from "react";
import { th, C, fileIcon, fmtSize } from "../../utils/theme";
import { FILES } from "../../data/mockData";
import MaterialIcon from "../../components/ui/MaterialIcon";

const FILTERS = [
  ["Tous",      ""],
  ["Images",    "image/"],
  ["Vidéos",    "video/"],
  ["PDFs",      "application/pdf"],
  ["Textes",    "text/"],
  ["Tableurs",  "application/xlsx"],
];

export default function SearchPage({ dark, navigate }) {
  const t = th(dark);
  const [q, setQ]       = useState("");
  const [type, setType] = useState("");

  const results = FILES.filter(f => {
    if (f.type === "folder") return false;
    return (!q || f.name.toLowerCase().includes(q.toLowerCase())) &&
           (!type || f.mime?.startsWith(type));
  });

  return (
    <div style={{ maxWidth:860, margin:"0 auto" }}>
      <h1 style={{ fontSize:24, fontWeight:800, color:t.text, marginBottom:22 }}>Recherche</h1>

      {/* Champ de recherche */}
      <div style={{ position:"relative", marginBottom:18 }}>
        <MaterialIcon n="search" s={20} c={t.muted} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Nom de fichier, extension…"
          className="sf-input"
          style={{ width:"100%", paddingLeft:44, fontSize:15, background:t.surface, color:t.text, border:`1px solid ${t.border}`, padding:"13px 14px 13px 44px" }} />
      </div>

      {/* Filtres de type */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
        {FILTERS.map(([label, val]) => (
          <button key={val} onClick={() => setType(val)} style={{
            padding:"7px 15px", borderRadius:9999, border:"1.5px solid",
            borderColor: type===val ? C.primary : t.border,
            background:  type===val ? `${C.primary}18` : t.surface,
            color:        type===val ? C.primary : t.muted,
            fontFamily:"Inter", fontWeight:600, fontSize:12, cursor:"pointer", transition:"all .15s",
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Résultats */}
      {(q || type) ? (
        <div>
          <p style={{ fontSize:12, color:t.muted, marginBottom:12 }}>{results.length} résultat{results.length !== 1 ? "s" : ""}</p>
          <div style={{ background:t.surface, borderRadius:14, overflow:"hidden", border:`1px solid ${t.border}` }}>
            {results.length === 0 ? (
              <div style={{ padding:44, textAlign:"center", color:t.muted }}>
                <MaterialIcon n="search_off" s={44} style={{ marginBottom:10 }} />
                <p>Aucun fichier trouvé</p>
              </div>
            ) : results.map((f, i) => {
              const { icon, color } = fileIcon(f.mime);
              return (
                <div key={f.id} className="row-hover"
                  onClick={() => navigate("preview", { file:f })}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", borderBottom: i < results.length-1 ? `1px solid ${t.border}` : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,91,191,.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <MaterialIcon n={icon} s={21} c={color} />
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:500, color:t.text }}>{f.name}</p>
                    <p style={{ fontSize:11, color:t.muted }}>{fmtSize(f.size)} · {f.modified}</p>
                  </div>
                  <MaterialIcon n="open_in_new" s={15} c={t.muted} />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ textAlign:"center", paddingTop:56, opacity:.5 }}>
          <MaterialIcon n="manage_search" s={60} c={t.muted} />
          <p style={{ marginTop:14, fontSize:14, color:t.muted }}>Tapez pour rechercher</p>
        </div>
      )}
    </div>
  );
}
