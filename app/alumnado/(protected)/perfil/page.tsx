import { requireUser } from "@/lib/auth";

export default async function StudentProfile() {
  const { user, supabase, profile } = await requireUser();
  const { data: authUser, error } = await supabase.auth.getUser();
  if (error) throw new Error("No se pudo consultar el perfil.");

  return (
    <section className="portal-card">
      <h1>Mi perfil</h1>
      <dl>
        <dt>Nombre</dt><dd>{profile.first_name} {profile.last_name}</dd>
        <dt>Correo electrónico</dt><dd>{authUser.user?.email ?? user.email}</dd>
        <dt>Cuenta</dt><dd>{profile.account_status === "active" ? "Activa" : "Deshabilitada"}</dd>
      </dl>
      <p className="portal-muted">Para cambiar tus datos de contacto, ponte en contacto con LUCO Estudio.</p>
    </section>
  );
}
