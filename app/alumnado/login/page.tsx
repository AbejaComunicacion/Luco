import Link from "next/link";
import { signInAction } from "@/lib/actions/auth";

const messages: Record<string, string> = {
  credentials: "No se han podido validar las credenciales. Revisa el correo y la contraseña.",
  disabled: "La cuenta está deshabilitada. Contacta con LUCO Estudio.",
};

export default async function StudentLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="portal-page">
      <section className="portal-card" style={{ maxWidth: "30rem", margin: "4rem auto" }}>
        <h1>Zona privada de alumnado</h1>
        <p className="portal-muted">Accede a tus cursos, contenidos y datos de suscripción.</p>
        {params.error && <p className="portal-alert" role="alert">{messages[params.error] ?? "No se pudo completar la operación."}</p>}
        {params.updated && <p className="portal-alert">La contraseña se ha actualizado. Ya puedes iniciar sesión.</p>}
        <form className="portal-form" action={signInAction}>
          <input type="hidden" name="expected_role" value="student" />
          <label>Correo electrónico<input name="email" type="email" autoComplete="email" required /></label>
          <label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="portal-button" type="submit">Iniciar sesión</button>
        </form>
        <p><Link className="portal-link" href="/alumnado/recuperar-contrasena">¿Has olvidado tu contraseña?</Link></p>
        <p><Link className="portal-link" href="/admin/login">Acceso administración</Link></p>
        <p><Link className="portal-link" href="/">Volver a la web de LUCO</Link></p>
      </section>
    </main>
  );
}
