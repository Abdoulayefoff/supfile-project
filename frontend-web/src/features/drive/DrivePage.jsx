import { useState } from "react";
import { Grid, List } from "lucide-react";
import { th, C } from "../../utils/theme";
import { FILES } from "../../data/mockData";
import MaterialIcon from "../../components/ui/MaterialIcon";
import { useContextMenu } from "../../hooks/useContextMenu";
import FolderGrid from "./FolderGrid";
import FileGrid from "./FileGrid";
import FileList from "./FileList";
import ContextMenu from "./ContextMenu";
import ShareModal from "./ShareModal";

export default function DrivePage({ dark, navigate }) {
  const t = th(dark);
  const [view, setView]         = useState("grid");
  const [folder, setFolder]     = useState(null);
  const [mime, setMime]         = useState("");
  const [shareFile, setShareFile] = useState(null);
  const { ctx, openCtx, closeCtx } = useContextMenu();

  // Breadcrumb
  const crumb = [];
  let cur = folder;
  while (cur) {
    const f = FILES.find(x => x.id === cur);
    if (!f) break;
    crumb.unshift(f);
    cur = f.parentId || null;
  }

  const items   = FILES.filter(f => f.parentId === folder && (!mime || f.mime?.startsWith(mime)));
  const folders = items.filter(f => f.type === "folder");
  const files   = items.filter(f => f.type === "file");

  return (
    <div style={{ maxWidth:1060, margin:"0 auto" }} onClick={closeCtx}>

      {/* Header Drive */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <button onClick={() => setFolder(null)}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:21, fontWeight:800, color:t.text, fontFamily:"Inter" }}>
            Mon Drive
          </button>
          {crumb.map((b, i) => (
            <div key={b.id} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <MaterialIcon n="chevron_right" s={17} c={t.muted} />
              <button onClick={() => setFolder(b.id)}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize: i === crumb.length-1 ? 19 : 15, fontWeight: i === crumb.length-1 ? 700 : 500, color: i === crumb.length-1 ? t.text : t.muted, fontFamily:"Inter" }}>
                {b.name}
              </button>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <select value={mime} onChange={e => setMime(e.target.value)} className="sf-input"
            style={{ background:t.low, color:t.text, fontSize:12, padding:"7px 10px" }}>
            <option value="">Tous types</option>
            <option value="image/">Images</option>
            <option value="video/">Vidéos</option>
            <option value="audio/">Audio</option>
            <option value="application/pdf">PDFs</option>
            <option value="text/">Textes</option>
          </select>
          <div style={{ display:"flex", background:t.low, borderRadius:9, padding:3, gap:2 }}>
            {["grid","list"].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ background: view===v ? t.surface : "transparent", border:"none", cursor:"pointer", borderRadius:7, padding:7, color: view===v ? C.primary : t.muted, transition:"all .15s" }}>
                {v === "grid" ? <Grid size={16} /> : <List size={16} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <FolderGrid folders={folders} dark={dark} onOpen={setFolder} onCtx={openCtx} />

      {view === "grid"
        ? <FileGrid files={files} dark={dark} onOpen={f => navigate("preview", { file:f })} onCtx={openCtx} />
        : <FileList files={files} dark={dark} onOpen={f => navigate("preview", { file:f })} onCtx={openCtx} />
      }

      {items.length === 0 && (
        <div style={{ textAlign:"center", paddingTop:72, opacity:.5 }}>
          <MaterialIcon n="folder_open" s={60} c={t.muted} />
          <p style={{ marginTop:14, fontSize:15, fontWeight:600, color:t.text }}>Dossier vide</p>
          <p style={{ fontSize:13, color:t.muted, marginTop:4 }}>Cliquez sur « Nouveau » pour ajouter des fichiers</p>
        </div>
      )}

      {ctx && <ContextMenu ctx={ctx} dark={dark} navigate={navigate} onShare={setShareFile} onClose={closeCtx} />}
      {shareFile && <ShareModal dark={dark} file={shareFile} onClose={() => setShareFile(null)} />}
    </div>
  );
}
