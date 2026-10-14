import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/auth";

export default async function RecoverPassword({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="portal-page">
      <section className="portal-card" style={{ maxWidth: "30rem", margin: "4rem auto" }}>
        <h1>Recuperar contraseña</h1>
        {params.sent ? (
          <p className="portal-alert">Si hay una cuenta asociada a ese correo, recibirás instrucciones para actualizar la contraseña.</p>
        ) : (
          <>
            {params.error && <p className="portal-alert" role="alert">No se ha podido enviar la solicitud. Comprueba los datos e inténtalo de nuevo.</p>}
            <form className="portal-form" action={requestPasswordResetAction}>
              <label>Correo electrónico<input name="email" type="email" autoComplete="email" required /></label>
              <button className="portal-button" type="submit">Enviar instrucciones</button>
            </form>
          </>
        )}
        <p><Link className="portal-link" href="/alumnado/login">Volver al inicio de sesión</Link></p>
      </section>
    </main>
  );
}
