import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getStudentPayments } from "@/lib/services/subscriptions";

export default async function StudentDashboard() {
  const { user, supabase, profile } = await requireUser();
  const [{ data: enrollments, error: enrollmentError }, { data: subscription, error: subscriptionError }] =
    await Promise.all([
      supabase.from("enrollments").select("course_id").eq("student_id", user.id).is("revoked_at", null),
      supabase.from("subscriptions").select("status").eq("student_id", user.id).in("status", ["active", "pending", "past_due"]).maybeSingle(),
    ]);

  if (enrollmentError || subscriptionError) throw new Error("No se pudo cargar tu panel.");
  const payments = await getStudentPayments(supabase, user.id);
  const courseIds = enrollments.map((enrollment) => enrollment.course_id);
  const { data: courses, error: coursesError } = courseIds.length
    ? await supabase.from("courses").select("id, title").in("id", courseIds).eq("status", "published")
    : { data: [], error: null };
  if (coursesError) throw new Error("No se pudieron consultar tus cursos.");

  return (
    <div className="portal-grid">
      <section className="portal-card">
        <h1>Bienvenid@{profile.first_name ? `, ${profile.first_name}` : ""}</h1>
        <p>Desde aquí puedes acceder a los cursos y consultar tu información.</p>
      </section>
      <section className="portal-card">
        <h2>Mis cursos</h2>
        {courses.length ? (
          <ul className="portal-list">{courses.map((course) => <li key={course.id}><Link className="portal-link" href={`/alumnado/cursos/${course.id}`}>{course.title}</Link></li>)}</ul>
        ) : <p className="portal-muted">Todavía no tienes cursos asignados. Contacta con LUCO Estudio si esperabas ver un curso aquí.</p>}
        <p><Link className="portal-link" href="/alumnado/cursos">Ver todos mis cursos</Link></p>
      </section>
      <section className="portal-card">
        <h2>Suscripción</h2>
        {subscription?.status === "past_due" && <p className="portal-alert">Hay un pago pendiente o una incidencia con el acceso. Contacta con LUCO Estudio.</p>}
        {payments.some((payment) => payment.status === "pending") && <p className="portal-alert">Tienes un pago pendiente registrado. El registro no significa que el pago se haya confirmado.</p>}
        {payments.some((payment) => payment.status === "failed") && <p className="portal-alert">Hay un pago que no se pudo procesar. Contacta con LUCO Estudio.</p>}
        <p>Estado registrado: {subscription?.status ?? "Sin suscripción registrada"}</p>
        <p><Link className="portal-link" href="/alumnado/pagos">Consultar pagos</Link></p>
      </section>
    </div>
  );
}
