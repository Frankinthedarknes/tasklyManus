import { useEffect, useState, type FormEvent } from "react";
import { getProfile, HttpError, request } from "./api";
import type { Profile } from "../shared/contracts";

function message(error: unknown) { return error instanceof Error ? error.message : "Algo no salió bien. Vuelve a probar."; }

function Brand() {
  return <a href="/" className="brand" aria-label="Taskly, inicio"><span aria-hidden="true">✳</span> taskly<span className="brand-dot">.</span></a>;
}

function AccountForm({ notice, onLogin }: { notice: string; onLogin: (profile: Profile) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(notice);
  function changeMode(next: "login" | "signup") { setMode(next); setError(""); setStatus(""); setPassword(""); setVisible(false); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setStatus("");
    try {
      if (mode === "signup") {
        await request("/api/auth/sign-up/email", "POST", { name, email, password });
        setMode("login"); setPassword(""); setVisible(false);
        setStatus("Solicitud de registro completada. Inicia sesión con tu correo y contraseña.");
      } else {
        await request("/api/auth/sign-in/email", "POST", { email, password });
        const result = await getProfile();
        onLogin(result.profile);
      }
    } catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  }
  return <section className="account-card" aria-labelledby="account-title">
    <div className="eyebrow">TU PRIMER PASO</div>
    <h2 id="account-title">{mode === "signup" ? "Hagamos espacio para ti." : "Qué bueno verte por aquí."}</h2>
    <p className="muted">{mode === "signup" ? "Crea tu cuenta y empieza por presentarte." : "Entra para cuidar de tu perfil."}</p>
    <div className="mode-switch" aria-label="Acceso a tu cuenta">
      <button type="button" className={mode === "login" ? "selected" : ""} aria-pressed={mode === "login"} disabled={busy} onClick={() => changeMode("login")}>Entrar</button>
      <button type="button" className={mode === "signup" ? "selected" : ""} aria-pressed={mode === "signup"} disabled={busy} onClick={() => changeMode("signup")}>Crear cuenta</button>
    </div>
    <form onSubmit={submit} aria-busy={busy}>
      {mode === "signup" && <label>Tu nombre<input name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={80} required disabled={busy} placeholder="¿Cómo te llamas?" /></label>}
      <label>Correo electrónico<input name="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} required disabled={busy} placeholder="tu@correo.com" /></label>
      <label htmlFor="account-password">Contraseña</label>
      <div className="password-field"><input id="account-password" name="password" type={visible ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} minLength={mode === "signup" ? 12 : 1} maxLength={128} required disabled={busy} aria-describedby={mode === "signup" ? "password-help" : undefined} /><button type="button" disabled={busy} onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}>{visible ? "Ocultar" : "Ver"}</button></div>
      {mode === "signup" && <p className="field-help" id="password-help">Al menos 12 caracteres. Una frase larga que recuerdes funciona bien.</p>}
      {error && <p className="feedback error" role="alert">{error}</p>}
      {status && <p className="feedback success" role="status">{status}</p>}
      <button className="primary" disabled={busy} type="submit">{busy ? "Un momento…" : mode === "signup" ? "Crear mi cuenta" : "Entrar a mi cuenta"}<span aria-hidden="true">↗</span></button>
    </form>
    <div className="card-foot"><span aria-hidden="true">◈</span> Tu perfil se guarda para tu próxima visita.</div>
  </section>;
}

function ProfileForm({ initial, onChange, onSessionEnd }: { initial: Profile; onChange: (profile: Profile) => void; onSessionEnd: (notice: string) => void }) {
  const [name, setName] = useState(initial.name);
  const [city, setCity] = useState(initial.city);
  const [bio, setBio] = useState(initial.bio);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setStatus("");
    try {
      const result = await request<{ profile: Profile }>("/api/profile", "PATCH", { name, city, bio });
      onChange(result.profile); setName(result.profile.name); setCity(result.profile.city); setBio(result.profile.bio);
      setStatus("Perfil guardado. Puedes recargar la página: tus datos seguirán aquí.");
    } catch (failure) {
      if (failure instanceof HttpError && failure.status === 401) onSessionEnd("Tu sesión terminó. Vuelve a entrar.");
      else setError(message(failure));
    } finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError(""); setStatus("");
    try { await request("/api/auth/sign-out", "POST", {}); onSessionEnd("Sesión cerrada. Hasta la próxima."); }
    catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  }
  return <main className="profile-layout">
    <aside className="profile-aside">
      <div className="avatar" aria-hidden="true">{initial.name.slice(0, 1).toUpperCase()}</div>
      <div className="eyebrow">TU ESPACIO EN TASKLY</div>
      <h1>Ya tienes un<br /> comienzo.</h1>
      <p>Las buenas conexiones empiezan con una persona. Cuéntanos un poco de ti.</p>
      <ol className="progress"><li className="done"><span>✓</span> Crear tu cuenta</li><li className="active"><span>2</span> Completar tu perfil</li><li><span>3</span> Publicar una tarea <small>Próximo paso</small></li></ol>
      <button className="logout" type="button" disabled={busy} onClick={logout}>Cerrar sesión <span aria-hidden="true">↗</span></button>
    </aside>
    <section className="profile-card" aria-labelledby="profile-title">
      <div className="section-top"><div><div className="eyebrow">HOLA, {initial.name.split(" ")[0].toUpperCase()}</div><h2 id="profile-title">Tu perfil</h2></div><span className="small-badge">Cuenta de prueba</span></div>
      <p className="muted">Por ahora, esta información solo la ves tú.</p>
      <form onSubmit={save} aria-busy={busy}>
        <label>Nombre<input name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={80} required disabled={busy} /></label>
        <label>Ciudad <span className="optional">opcional</span><input name="city" autoComplete="address-level2" value={city} onChange={e => setCity(e.target.value)} maxLength={100} disabled={busy} placeholder="¿Dónde estás?" /></label>
        <label>Sobre ti <span className="optional">opcional</span><textarea name="bio" value={bio} onChange={e => setBio(e.target.value)} maxLength={500} rows={4} disabled={busy} placeholder="Qué disfrutas hacer, tus habilidades, lo que te gustaría aprender…" /></label>
        <p className="counter">{bio.length}/500</p>
        <div className="email-info"><span>Correo de la cuenta</span><strong>{initial.email}</strong><small>{initial.emailVerified ? "Correo verificado" : "Correo sin verificar · Verificación pendiente para una futura versión"}</small></div>
        {error && <p className="feedback error" role="alert">{error}</p>}
        {status && <p className="feedback success" role="status">{status}</p>}
        <button className="primary" type="submit" disabled={busy}>{busy ? "Un momento…" : "Guardar perfil"}<span aria-hidden="true">↗</span></button>
      </form>
    </section>
  </main>;
}

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checking, setChecking] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setChecking(true); setLoadError("");
    getProfile().then(result => { if (active) setProfile(result.profile); }).catch(failure => {
      if (!active) return;
      if (failure instanceof HttpError && failure.status === 401) setProfile(null);
      else setLoadError(message(failure));
    }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [attempt]);
  function sessionEnd(text: string) { setProfile(null); setNotice(text); }
  return <div className="shell">
    <header className="site-header"><Brand /><span className="version-badge"><span aria-hidden="true">●</span> Un nuevo comienzo · 2.0</span></header>
    {checking ? <main className="loading" role="status">Preparando tu espacio…</main> : loadError ? <main className="loading"><p role="alert">{loadError}</p><button className="primary" onClick={() => setAttempt(attempt + 1)}>Volver a intentar</button></main> : profile ? <ProfileForm key={profile.id} initial={profile} onChange={setProfile} onSessionEnd={sessionEnd} /> : <main className="welcome-layout">
      <section className="welcome-story"><div className="eyebrow"><span className="dash" /> LO QUE SABES HACER IMPORTA</div><h1>Una mano.<br />Una oportunidad.<br /><em>Un comienzo.</em></h1><p>Estamos construyendo un lugar para conectar lo que alguien necesita con lo que tú sabes hacer.</p><div className="story-note"><div className="note-symbol" aria-hidden="true">↗</div><div><strong>Todo empieza por conocerte.</strong><span>Crea tu cuenta, completa tu perfil<br />y da el primer paso.</span></div></div><div className="story-mark" aria-hidden="true">✳</div></section>
      <AccountForm notice={notice} onLogin={value => { setNotice(""); setProfile(value); }} />
    </main>}
    <footer><span>Hecho para personas que hacen.</span><span>Taskly 2.0 · Prueba de cuentas y perfiles</span></footer>
  </div>;
}
