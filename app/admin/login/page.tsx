import { signInAction } from "@/lib/actions/auth";

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="portal-page">
      <section className="portal-card" style={{ maxWidth: "30rem", margin: "4rem auto" }}>
        <h1>Acceso administración</h1>
        <p>El acceso está limitado a cuentas autorizadas.</p>
        {error && <p className="portal-alert" role="alert">No se han podido validar las credenciales.</p>}
        <form className="portal-form" action={signInAction}>
          <input type="hidden" name="expected_role" value="admin" />
          <label>Correo electrónico<input name="email" type="email" autoComplete="email" required /></label>
          <label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="portal-button" type="submit">Iniciar sesión</button>
        </form>
        <p><a className="portal-link" href="/alumnado/login">Volver al acceso del alumnado</a></p>
      </section>
    </main>
  );
}
