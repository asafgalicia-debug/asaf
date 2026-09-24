import React, { useState, type FormEvent } from 'react';
import ReactDOM from 'react-dom/client';

type SessionUser = {
  id: string;
  email: string;
  name: string;
  companyId: string;
  branchId: string;
  roleId: string;
  permissions: string[];
};

type LoginResponse = {
  ok?: boolean;
  data?: { token?: string; user?: SessionUser };
  error?: { message?: string };
};

const styles = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #102a43; }
  button, input { font: inherit; }
  .auth-shell { min-height: 100vh; display: grid; grid-template-columns: minmax(300px, 0.9fr) minmax(360px, 1.1fr); background: #f4f7fb; }
  .auth-aside { display: flex; flex-direction: column; justify-content: space-between; padding: 48px clamp(28px, 6vw, 88px); color: #f8fafc; background: radial-gradient(circle at 20% 15%, #1b4965 0, transparent 36%), linear-gradient(145deg, #0b1f33, #0f766e); }
  .brand { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 700; letter-spacing: .04em; }
  .brand-mark { display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid rgba(255,255,255,.34); border-radius: 12px; background: rgba(255,255,255,.12); }
  .aside-copy { max-width: 470px; padding: 72px 0; }
  .aside-copy .eyebrow { color: #a7f3d0; font-size: 12px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
  .aside-copy h1 { margin: 18px 0; font-size: clamp(34px, 4.5vw, 58px); line-height: 1.06; letter-spacing: -.04em; }
  .aside-copy p { max-width: 420px; color: #d5e4ee; font-size: 16px; line-height: 1.7; }
  .aside-foot { color: #cbd5e1; font-size: 12px; }
  .auth-main { display: grid; place-items: center; padding: 36px 24px; }
  .login-card { width: min(100%, 440px); padding: clamp(28px, 5vw, 48px); border: 1px solid #e2e8f0; border-radius: 22px; background: #fff; box-shadow: 0 24px 70px rgba(15, 23, 42, .09); }
  .login-card h2 { margin: 0; color: #102a43; font-size: 28px; letter-spacing: -.03em; }
  .login-card .intro { margin: 10px 0 28px; color: #627d98; line-height: 1.55; }
  .field { display: grid; gap: 8px; margin: 18px 0; }
  .field label { color: #243b53; font-size: 13px; font-weight: 650; }
  .field input { width: 100%; min-height: 48px; padding: 0 14px; border: 1px solid #bcccdc; border-radius: 10px; outline: none; color: #102a43; background: #fff; }
  .field input:focus { border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15,118,110,.13); }
  .submit { width: 100%; min-height: 50px; margin-top: 10px; border: 0; border-radius: 10px; color: #fff; background: #087f70; font-weight: 700; cursor: pointer; }
  .submit:hover { background: #06695e; }
  .submit:disabled { opacity: .65; cursor: wait; }
  .error-box { margin: 16px 0; padding: 12px 14px; border: 1px solid #fecaca; border-radius: 10px; color: #991b1b; background: #fef2f2; font-size: 14px; line-height: 1.45; }
  .login-note { margin: 22px 0 0; color: #829ab1; font-size: 12px; line-height: 1.5; }
  .session-shell { min-height: 100vh; padding: clamp(24px, 6vw, 72px); background: #f4f7fb; }
  .session-card { max-width: 780px; margin: 0 auto; padding: clamp(24px, 5vw, 48px); border: 1px solid #e2e8f0; border-radius: 22px; background: #fff; box-shadow: 0 18px 50px rgba(15,23,42,.07); }
  .session-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
  .session-top h1 { margin: 8px 0; font-size: clamp(28px, 4vw, 40px); letter-spacing: -.04em; }
  .session-meta { color: #627d98; line-height: 1.7; }
  .logout { padding: 10px 14px; border: 1px solid #bcccdc; border-radius: 9px; color: #243b53; background: #fff; font-weight: 650; cursor: pointer; }
  .session-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin-top: 28px; }
  .info-item { padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; overflow-wrap: anywhere; }
  .info-label { color: #627d98; font-size: 12px; }
  .info-value { margin-top: 6px; color: #102a43; font-weight: 700; }
  @media (max-width: 760px) { .auth-shell { grid-template-columns: 1fr; } .auth-aside { min-height: 260px; padding: 28px; } .aside-copy { padding: 38px 0 24px; } .aside-copy h1 { font-size: 38px; } .aside-foot { display: none; } .auth-main { padding: 22px 16px 36px; } .session-top { flex-direction: column; } }
`;

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<{ token: string; user: SessionUser } | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json() as LoginResponse;

      if (!response.ok || !result.data?.token || !result.data.user) {
        throw new Error(result.error?.message || 'No se pudo iniciar sesiÃ³n. Revisa tus datos.');
      }

      setSession({ token: result.data.token, user: result.data.user });
      setPassword('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (session) {
    return (
      <>
        <style>{styles}</style>
        <main className="session-shell">
          <section className="session-card">
            <div className="session-top">
              <div>
                <div className="brand"><span className="brand-mark">EU</span><span>ERP UNIVERSAL MODULAR</span></div>
                <h1>SesiÃ³n iniciada</h1>
                <p className="session-meta">Bienvenido, {session.user.name}. Tu acceso fue autenticado por la API.</p>
              </div>
              <button className="logout" type="button" onClick={() => setSession(null)}>Cerrar sesiÃ³n</button>
            </div>
            <div className="session-info">
              <div className="info-item"><div className="info-label">Correo</div><div className="info-value">{session.user.email}</div></div>
              <div className="info-item"><div className="info-label">Empresa</div><div className="info-value">{session.user.companyId}</div></div>
              <div className="info-item"><div className="info-label">Sucursal</div><div className="info-value">{session.user.branchId}</div></div>
              <div className="info-item"><div className="info-label">Permisos cargados</div><div className="info-value">{session.user.permissions.length}</div></div>
            </div>
            <p className="login-note">La sesiÃ³n se conserva solo mientras esta pÃ¡gina permanezca abierta. Al recargarla tendrÃ¡s que iniciar sesiÃ³n otra vez.</p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <main className="auth-shell">
        <aside className="auth-aside">
          <div className="brand"><span className="brand-mark">EU</span><span>ERP UNIVERSAL MODULAR</span></div>
          <div className="aside-copy">
            <div className="eyebrow">Plataforma empresarial</div>
            <h1>Todo tu negocio, en un solo lugar.</h1>
            <p>Accede a tu espacio de trabajo para continuar con la operaciÃ³n de tu empresa.</p>
          </div>
          <div className="aside-foot">Acceso protegido Â· API ERP</div>
        </aside>
        <section className="auth-main">
          <div className="login-card">
            <h2>Iniciar sesiÃ³n</h2>
            <p className="intro">Ingresa con tu cuenta de usuario del ERP.</p>
            <form onSubmit={handleLogin}>
              <div className="field">
                <label htmlFor="email">Correo electrÃ³nico</label>
                <input id="email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
              </div>
              <div className="field">
                <label htmlFor="password">ContraseÃ±a</label>
                <input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={72} />
              </div>
              {error && <div className="error-box" role="alert">{error}</div>}
              <button className="submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Validando accesoâ€¦' : 'Entrar al ERP'}</button>
            </form>
            <p className="login-note">Tu contraseÃ±a se envÃ­a a la API por la conexiÃ³n local de desarrollo y nunca se guarda en este navegador.</p>
          </div>
        </section>
      </main>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);