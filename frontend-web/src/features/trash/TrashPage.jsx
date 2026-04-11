import { useState } from "react";
import { th, C, fmtSize } from "../../utils/theme";
import { TRASH } from "../../data/mockData";
import MaterialIcon from "../../components/ui/MaterialIcon";

export default function TrashPage({ dark }) {
  const t = th(dark);
  const [items, setItems] = useState(TRASH);

  const restore = (id) => setItems(p => p.filter(x => x.id !== id));
  const remove  = (id) => setItems(p => p.filter(x => x.id !== id));

  return (
    <div style={{ maxWidth:860, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:t.text }}>Corbeille</h1>
        {items.length > 0 && (
          <button onClick={() => setItems([])}
            style={{ background:"none", border:`1px solid ${C.red}40`, borderRadius:9999, padding:"7px 16px", cursor:"pointer", color:C.red, fontFamily:"Inter", fontWeight:600, fontSize:13 }}>
            Vider la corbeille
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign:"center", paddingTop:72, opacity:.5 }}>
          <MaterialIcon n="delete_sweep" s={64} c={t.muted} />
          <p style={{ marginTop:14, fontSize:14, color:t.muted }}>La corbeille est vide</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize:13, color:t.muted, marginBottom:14 }}>Suppression définitive après 30 jours.</p>
          <div style={{ background:t.surface, borderRadius:14, overflow:"hidden", border:`1px solid ${t.border}` }}>
            {items.map((item, i) => (
              <div key={item.id}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", borderBottom: i < items.length-1 ? `1px solid ${t.border}` : "none" }}>
                <MaterialIcon n="insert_drive_file" s={21} c={t.muted} />
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:500, color:t.text }}>{item.name}</p>
                  <p style={{ fontSize:11, color:t.muted }}>Supprimé {item.deleted} · {fmtSize(item.size)}</p>
                </div>
                <button onClick={() => restore(item.id)}
                  style={{ padding:"5px 13px", borderRadius:9999, border:`1px solid ${t.border}`, background:"none", cursor:"pointer", color:C.primary, fontFamily:"Inter", fontWeight:600, fontSize:12 }}>
                  Restaurer
                </button>
                <button onClick={() => remove(item.id)}
                  style={{ padding:"5px 13px", borderRadius:9999, border:`1px solid ${C.red}35`, background:"none", cursor:"pointer", color:C.red, fontFamily:"Inter", fontWeight:600, fontSize:12 }}>
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
