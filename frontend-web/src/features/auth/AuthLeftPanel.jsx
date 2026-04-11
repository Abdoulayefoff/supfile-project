import MaterialIcon from "../../components/ui/MaterialIcon";

export default function AuthLeftPanel() {
  return (
    <div style={{
      flex: "0 0 44%",
      background: "linear-gradient(145deg,#1255b8,#1976d2 50%,#2094f3)",
      padding: "64px 52px",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
      color: "white", textAlign: "center",
    }}>
      {/* Blobs décoratifs */}
      <div style={{ position:"absolute", top:"-15%", right:"-15%", width:300, height:300, background:"rgba(255,255,255,.10)", borderRadius:"50%", filter:"blur(48px)" }} />
      <div style={{ position:"absolute", bottom:"-10%", left:"-10%", width:220, height:220, background:"rgba(255,255,255,.06)", borderRadius:"50%", filter:"blur(36px)" }} />

      <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", gap:28 }}>
        <div className="float">
          <MaterialIcon n="folder_shared" s={108} c="white" fill style={{ opacity:.95 }} />
        </div>
        <div>
          <h2 style={{ fontSize:26, fontWeight:700, letterSpacing:"-0.02em", marginBottom:12 }}>
            Gestion intelligente
          </h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,.78)", lineHeight:1.65, maxWidth:260, margin:"0 auto" }}>
            Collaborez et sécurisez vos documents en quelques clics.
          </p>
        </div>
      </div>
    </div>
  );
}
