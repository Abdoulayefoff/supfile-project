import { C } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";
import Button from "../../components/ui/Button";

export default function ForgotForm({ loading, resetSent, resetEmail, setResetEmail, onSubmit, onBack }) {
  if (resetSent) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, textAlign:"center", padding:"16px 0" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#e8f5e9,#c8e6c9)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <MaterialIcon n="mark_email_read" s={36} c={C.green} fill />
        </div>
        <div>
          <h2 style={{ fontSize:24, fontWeight:800, color:"#191c1d", marginBottom:8 }}>Email envoyé !</h2>
          <p style={{ fontSize:14, color:"#414754", lineHeight:1.7 }}>
            Lien envoyé à <strong>{resetEmail}</strong>.<br />Vérifiez votre boîte mail.
          </p>
        </div>
        <Button style={{ maxWidth:260, width:"100%" }} onClick={onBack}>
          <MaterialIcon n="arrow_back" s={16} c="white" /> Retour à la connexion
        </Button>
      </div>
    );
  }

  return (
    <>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#e8f0fe,#d2e3fc)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <MaterialIcon n="lock_reset" s={26} c={C.primary} />
        </div>
        <h2 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.025em", color:"#191c1d" }}>
          Mot de passe oublié ?
        </h2>
        <p style={{ fontSize:14, color:"#414754", lineHeight:1.6 }}>
          Entrez votre email et nous vous enverrons un lien de réinitialisation.
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div>
          <label className="sf-label" style={{ color:"#414754" }}>Adresse email</label>
          <div style={{ position:"relative" }}>
            <MaterialIcon n="mail" s={18} c="#9aa0ae" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} />
            <input value={resetEmail} onChange={e => setResetEmail(e.target.value)} type="email"
              placeholder="nom@exemple.com" required className="sf-input"
              style={{ width:"100%", paddingLeft:42, background:"#f3f4f5", color:"#191c1d" }} />
          </div>
        </div>
        <Button style={{ width:"100%" }} disabled={loading}>
          {loading
            ? <MaterialIcon n="hourglass_empty" s={16} c="white" />
            : <MaterialIcon n="arrow_forward" s={18} c="white" />}
          Envoyer le lien
        </Button>
      </form>

      <div style={{ textAlign:"center" }}>
        <button onClick={onBack}
          style={{ background:"none", border:"none", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, color:C.primary, fontWeight:600, fontSize:14, fontFamily:"Inter" }}>
          <MaterialIcon n="arrow_back" s={16} c={C.primary} /> Retour à la connexion
        </button>
      </div>
    </>
  );
}
