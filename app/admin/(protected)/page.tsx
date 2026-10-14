import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const [
    { count: studentCount, error: studentsError },
    { count: courseCount, error: coursesError },
    { count: subscriptionCount, error: subscriptionsError },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }),
  ]);
  if (studentsError || coursesError || subscriptionsError) throw new Error("No se pudo cargar el resumen.");

  return (
    <section>
      <h1>Panel de administración</h1>
      <div className="portal-grid">
        <article className="portal-card portal-stat"><h2>Alumnado</h2><p className="portal-stat__value">{studentCount ?? 0}</p><Link className="portal-button" href="/admin/alumnado">Gestionar alumnado</Link></article>
        <article className="portal-card portal-stat"><h2>Cursos</h2><p className="portal-stat__value">{courseCount ?? 0}</p><Link className="portal-button" href="/admin/cursos">Gestionar cursos</Link></article>
        <article className="portal-card portal-stat"><h2>Suscripciones</h2><p className="portal-stat__value">{subscriptionCount ?? 0}</p><Link className="portal-button" href="/admin/suscripciones">Consultar suscripciones</Link></article>
      </div>
    </section>
  );
}
