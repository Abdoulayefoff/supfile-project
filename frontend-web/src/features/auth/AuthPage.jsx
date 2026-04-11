import { useAuth } from "../../hooks/useAuth";
import AuthLeftPanel from "./AuthLeftPanel";
import LoginForm from "./LoginForm";
import ForgotForm from "./ForgotForm";

export default function AuthPage({ onLogin, darkMode }) {
  const auth = useAuth(onLogin);

  return (
    <div style={{
      minHeight:"100vh", background:"#f0f2f5",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:24, gap:24, position:"relative",
    }}>
      {/* Blobs de fond */}
      <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none", opacity:.35 }}>
        <div style={{ position:"absolute", top:"-8%", left:"-4%", width:"35%", height:"35%", background:"rgba(0,91,191,.07)", filter:"blur(100px)", borderRadius:"50%" }} />
        <div style={{ position:"absolute", bottom:"-8%", right:"-4%", width:"35%", height:"35%", background:"rgba(71,94,140,.07)", filter:"blur(100px)", borderRadius:"50%" }} />
      </div>

      {/* Logo */}
      <div style={{ zIndex:10, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:40, height:40, borderRadius:11, background:"linear-gradient(135deg,#005bbf,#1a73e8)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontFamily:"'Material Symbols Outlined'", fontSize:22, color:"white", fontVariationSettings:"'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24" }}>cloud</span>
        </div>
        <span style={{ fontSize:22, fontWeight:900, letterSpacing:"-0.03em", color:"#005bbf" }}>Supfile</span>
      </div>

      {/* Carte principale */}
      <div style={{
        position:"relative", zIndex:10, width:"100%", maxWidth:940,
        background:"rgba(255,255,255,.88)", backdropFilter:"blur(24px)",
        borderRadius:40, boxShadow:"0 12px 40px rgba(0,91,191,.10)",
        overflow:"hidden", display:"flex",
      }} className="fade">
        <AuthLeftPanel />

        {/* Panneau droit – formulaire */}
        <div style={{ flex:1, padding:"52px 48px", display:"flex", flexDirection:"column", gap:24, justifyContent:"center" }}>
          {auth.mode === "login" && (
            <LoginForm
              isLogin={auth.isLogin}
              loading={auth.loading}
              email={auth.email}       setEmail={auth.setEmail}
              pw={auth.pw}             setPw={auth.setPw}
              name={auth.name}         setName={auth.setName}
              showPw={auth.showPw}     setShowPw={auth.setShowPw}
              rememberMe={auth.rememberMe} setRememberMe={auth.setRememberMe}
              onSubmit={auth.submit}
              onGoogle={onLogin}
              onSwitchMode={auth.switchMode}
              onForgot={auth.goForgot}
            />
          )}
          {auth.mode === "forgot" && (
            <ForgotForm
              loading={auth.loading}
              resetSent={auth.resetSent}
              resetEmail={auth.resetEmail} setResetEmail={auth.setResetEmail}
              onSubmit={auth.submitReset}
              onBack={auth.goLogin}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ zIndex:10, display:"flex", gap:28 }}>
        {["Confidentialité","Conditions","Aide"].map(l => (
          <a key={l} href="#" style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".10em", color:"#414754", textDecoration:"none" }}>{l}</a>
        ))}
      </div>
    </div>
  );
}
