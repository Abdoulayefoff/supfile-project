import { C } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";
import Button from "../../components/ui/Button";

export default function LoginForm({
  isLogin, loading,
  email, setEmail,
  pw, setPw,
  name, setName,
  showPw, setShowPw,
  rememberMe, setRememberMe,
  onSubmit, onGoogle,
  onSwitchMode, onForgot,
}) {
  return (
    <>
      <div>
        <h2 style={{ fontSize:32, fontWeight:800, letterSpacing:"-0.025em", color:"#191c1d", marginBottom:6 }}>
          {isLogin ? "Bienvenue" : "Créez votre compte"}
        </h2>
        <p style={{ fontSize:14, color:"#414754" }}>
          {isLogin ? "Gérez vos fichiers avec précision." : "Rejoignez la nouvelle ère du stockage."}
        </p>
      </div>

      {/* Bouton Google */}
      <button onClick={onGoogle} style={{
        display:"flex", alignItems:"center", justifyContent:"center", gap:12,
        padding:"13px 24px", borderRadius:9999, border:"1.5px solid #c1c6d6",
        background:"white", cursor:"pointer", fontFamily:"Inter", fontWeight:600,
        fontSize:14, color:"#191c1d", transition:"background .2s", width:"100%",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "#f3f4f5"}
        onMouseLeave={e => e.currentTarget.style.background = "white"}
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.1 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 28.9 5 24 5 13 5 4 14 4 25s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
          <path fill="#FF3D00" d="M6.3 15.5l6.6 4.8C14.7 17 19 14 24 14c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 28.9 5 24 5 16.3 5 9.7 9.3 6.3 15.5z"/>
          <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 36.3 26.8 37 24 37c-5.2 0-9.6-3-11.3-7.3L6 34.7C9.4 40.7 16.2 45 24 45z"/>
          <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.2-4.5 5.5l6.2 5.2C36.9 39.1 44 34 44 25c0-1.3-.1-2.6-.4-3.9z"/>
        </svg>
        Continuer avec Google
      </button>

      {/* Séparateur */}
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ flex:1, height:1, background:"rgba(193,198,214,.4)" }} />
        <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".14em", color:"#727785" }}>ou via email</span>
        <div style={{ flex:1, height:1, background:"rgba(193,198,214,.4)" }} />
      </div>

      {/* Formulaire */}
      <form onSubmit={onSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {!isLogin && (
          <div>
            <label className="sf-label" style={{ color:"#414754" }}>Nom complet</label>
            <div style={{ position:"relative" }}>
              <MaterialIcon n="person" s={18} c="#9aa0ae" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} />
              <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Jean Dupont"
                className="sf-input" style={{ width:"100%", paddingLeft:42, background:"#f3f4f5", color:"#191c1d" }} />
            </div>
          </div>
        )}

        <div>
          <label className="sf-label" style={{ color:"#414754" }}>Adresse email</label>
          <div style={{ position:"relative" }}>
            <MaterialIcon n="mail" s={18} c="#9aa0ae" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} />
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="nom@exemple.com" required
              className="sf-input" style={{ width:"100%", paddingLeft:42, background:"#f3f4f5", color:"#191c1d" }} />
          </div>
        </div>

        <div>
          <label className="sf-label" style={{ color:"#414754" }}>Mot de passe</label>
          <div style={{ position:"relative" }}>
            <MaterialIcon n="lock" s={18} c="#9aa0ae" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} />
            <input value={pw} onChange={e => setPw(e.target.value)} type={showPw ? "text" : "password"} placeholder="••••••••" required
              className="sf-input" style={{ width:"100%", paddingLeft:42, paddingRight:42, background:"#f3f4f5", color:"#191c1d" }} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#727785", display:"flex", alignItems:"center" }}>
              <MaterialIcon n={showPw ? "visibility_off" : "visibility"} s={18} />
            </button>
          </div>
        </div>

        {isLogin && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 2px" }}>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                style={{ width:15, height:15, accentColor:C.primary }} />
              <span style={{ fontSize:13, fontWeight:500, color:"#414754" }}>Se souvenir de moi</span>
            </label>
            <button type="button" onClick={onForgot}
              style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"Inter", fontSize:13, fontWeight:700, color:C.primary }}>
              Oublié ?
            </button>
          </div>
        )}

        <Button style={{ width:"100%", marginTop:4 }} disabled={loading}>
          {loading && <MaterialIcon n="hourglass_empty" s={16} c="white" />}
          {isLogin ? "Se connecter" : "Créer mon compte"}
          {!loading && <MaterialIcon n="arrow_forward" s={18} c="white" />}
        </Button>
      </form>

      <p style={{ textAlign:"center", fontSize:14, color:"#414754" }}>
        {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
        <button onClick={onSwitchMode}
          style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"Inter", fontWeight:700, fontSize:14, color:C.primary }}>
          {isLogin ? "Inscrivez-vous" : "Se connecter"}
        </button>
      </p>
    </>
  );
}
