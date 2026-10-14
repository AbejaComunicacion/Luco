import Link from "next/link";
import { updatePasswordAction } from "@/lib/actions/auth";

export default async function UpdatePassword({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="portal-page">
      <section className="portal-card" style={{ maxWidth: "30rem", margin: "4rem auto" }}>
        <h1>Crear una contraseña nueva</h1>
        {error && <p className="portal-alert" role="alert">No se pudo actualizar la contraseña. Usa el enlace más reciente del correo y una contraseña de al menos 12 caracteres.</p>}
        <form className="portal-form" action={updatePasswordAction}>
          <label>Nueva contraseña<input name="password" type="password" minLength={12} autoComplete="new-password" required /></label>
          <button className="portal-button" type="submit">Actualizar contraseña</button>
        </form>
        <p><Link className="portal-link" href="/alumnado/login">Ir al inicio de sesión</Link></p>
      </section>
    </main>
  );
}
