import { useState } from "react";

/**
 * Gère l'état du formulaire d'authentification.
 */
export function useAuth(onLogin) {
  const [mode, setMode]           = useState("login"); // "login" | "forgot"
  const [isLogin, setIsLogin]     = useState(true);
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [email, setEmail]         = useState("");
  const [pw, setPw]               = useState("");
  const [name, setName]           = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    onLogin();
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setResetSent(true);
  };

  const switchMode = () => setIsLogin(v => !v);
  const goForgot   = () => setMode("forgot");
  const goLogin    = () => { setMode("login"); setResetSent(false); };

  return {
    mode, isLogin, showPw, setShowPw,
    loading, resetSent,
    email, setEmail, pw, setPw, name, setName,
    resetEmail, setResetEmail, rememberMe, setRememberMe,
    submit, submitReset, switchMode, goForgot, goLogin,
  };
}
