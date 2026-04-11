import { useState } from "react";
import GLOBAL_CSS from "./styles/global.js";
import Layout from "./components/layout/Layout.jsx";

import AuthPage        from "./features/auth/AuthPage.jsx";
import DashboardPage   from "./features/dashboard/DashboardPage.jsx";
import DrivePage       from "./features/drive/DrivePage.jsx";
import SharedPage      from "./features/shared/SharedPage.jsx";
import SearchPage      from "./features/search/SearchPage.jsx";
import TrashPage       from "./features/trash/TrashPage.jsx";
import PreviewPage     from "./features/preview/PreviewPage.jsx";
import SettingsPage    from "./features/settings/SettingsPage.jsx";
import PublicSharePage from "./features/public-share/PublicSharePage.jsx";

const PAGES = ["dashboard","drive","shared","search","trash","preview","settings"];

export default function App() {
  const [page, setPage]       = useState("auth");
  const [isAuth, setIsAuth]   = useState(false);
  const [dark, setDark]       = useState(false);
  const [preview, setPreview] = useState(null);

  const navigate   = (p, opts = {}) => { if (opts.file) setPreview(opts.file); setPage(p); };
  const login      = () => { setIsAuth(true); setPage("dashboard"); };
  const logout     = () => { setIsAuth(false); setPage("auth"); };
  const toggleDark = () => setDark(d => !d);

  // ── Pages hors app (Auth + Lien public) ───────────────────────
  if (!isAuth || page === "public-share") {
    return (
      <>
        <style>{GLOBAL_CSS}</style>

        {/* Switcher de démo */}
        <div style={{ position:"fixed", top:14, right:14, zIndex:9999, display:"flex", gap:6, background:"white", padding:5, borderRadius:10, boxShadow:"0 4px 20px rgba(0,0,0,.14)" }}>
          <button
            onClick={() => setPage("public-share")}
            style={{ padding:"5px 12px", borderRadius:7, border:"none", cursor:"pointer", fontFamily:"Inter", fontWeight:600, fontSize:11, background: page==="public-share" ? "#005bbf" : "transparent", color: page==="public-share" ? "white" : "#414754" }}>
            Lien public
          </button>
          <button
            onClick={login}
            style={{ padding:"5px 12px", borderRadius:7, border:"none", cursor:"pointer", fontFamily:"Inter", fontWeight:600, fontSize:11, background:"#f3f4f5", color:"#414754" }}>
            → App
          </button>
        </div>

        {page === "public-share"
          ? <PublicSharePage dark={dark} onLogin={login} />
          : <AuthPage onLogin={login} darkMode={dark} />
        }
      </>
    );
  }

  // ── Application principale ─────────────────────────────────────
  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Barre de navigation rapide (démo) */}
      <div style={{ position:"fixed", bottom:16, left:"50%", transform:"translateX(-50%)", zIndex:9999, display:"flex", gap:5, background:"white", padding:5, borderRadius:12, boxShadow:"0 6px 24px rgba(0,0,0,.16)" }}>
        {PAGES.map(p => (
          <button key={p}
            onClick={() => { if (p === "preview" && !preview) return; setPage(p); }}
            style={{
              padding:"5px 11px", borderRadius:7, border:"none", cursor:"pointer",
              fontFamily:"Inter", fontWeight:600, fontSize:10,
              background: page===p ? "#005bbf" : "transparent",
              color:      page===p ? "white" : "#414754",
              opacity:    p==="preview" && !preview ? .5 : 1,
            }}>
            {p}
          </button>
        ))}
        <div style={{ width:1, background:"#e0e0e0", margin:"0 2px" }} />
        <button onClick={logout} style={{ padding:"5px 11px", borderRadius:7, border:"none", cursor:"pointer", fontFamily:"Inter", fontWeight:600, fontSize:10, color:"#ba1a1a" }}>
          logout
        </button>
      </div>

      <Layout page={page} dark={dark} navigate={navigate} toggleDark={toggleDark}>
        {page === "dashboard" && <DashboardPage dark={dark} navigate={navigate} />}
        {page === "drive"     && <DrivePage     dark={dark} navigate={navigate} />}
        {page === "shared"    && <SharedPage    dark={dark} navigate={navigate} />}
        {page === "search"    && <SearchPage    dark={dark} navigate={navigate} />}
        {page === "trash"     && <TrashPage     dark={dark} />}
        {page === "settings"  && <SettingsPage  dark={dark} toggleDark={toggleDark} />}
        {page === "preview" && preview && <PreviewPage dark={dark} file={preview} onBack={() => setPage("drive")} />}
      </Layout>
    </>
  );
}
