import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { assignCourseAction, revokeCourseAction, updateProfileAction } from "@/lib/actions/admin";

export default async function StudentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; assigned?: string; revoked?: string }>;
}) {
  const { id } = await params;
  const notice = await searchParams;
  const { supabase } = await requireAdmin();
  const [
    { data: student, error: studentError },
    { data: enrollments, error: enrollmentsError },
    { data: courses, error: coursesError },
    { data: subscriptions, error: subscriptionsError },
  ] = await Promise.all([
    supabase.from("profiles").select("id, email, first_name, last_name, phone, account_status").eq("id", id).eq("role", "student").maybeSingle(),
    supabase.from("enrollments").select("id, course_id, assigned_at").eq("student_id", id).is("revoked_at", null),
    supabase.from("courses").select("id, title, status").order("title"),
    supabase.from("subscriptions").select("id, status, amount, currency").eq("student_id", id).order("created_at", { ascending: false }),
  ]);
  if (studentError || enrollmentsError || coursesError || subscriptionsError) throw new Error("No se pudo cargar la ficha del alumnado.");
  if (!student) notFound();

  const assignedCourseIds = new Set(enrollments.map((enrollment) => enrollment.course_id));
  const assignedCourses = courses.filter((course) => assignedCourseIds.has(course.id));
  const availableCourses = courses.filter((course) => !assignedCourseIds.has(course.id) && course.status !== "archived");

  return (
    <section>
      <h1>{student.first_name} {student.last_name}</h1>
      {notice.error && <p className="portal-alert">No se pudo completar la operación.</p>}
      {notice.saved && <p className="portal-alert">Los cambios se han guardado.</p>}
      {notice.assigned && <p className="portal-alert">El curso se ha asignado.</p>}
      {notice.revoked && <p className="portal-alert">Se ha retirado el acceso al curso.</p>}
      <section className="portal-card">
        <h2>Datos de la persona</h2>
        <p>Correo electrónico: {student.email}</p>
        <form className="portal-form" action={updateProfileAction}>
          <input type="hidden" name="student_id" value={id} />
          <label>Nombre<input name="first_name" defaultValue={student.first_name} required /></label>
          <label>Apellidos<input name="last_name" defaultValue={student.last_name} required /></label>
          <label>Teléfono<input name="phone" type="tel" defaultValue={student.phone ?? ""} /></label>
          <label>Cuenta<select name="account_status" defaultValue={student.account_status}><option value="active">Activa</option><option value="disabled">Deshabilitada</option></select></label>
          <button className="portal-button" type="submit">Guardar cambios</button>
        </form>
      </section>
      <section className="portal-card">
        <h2>Cursos asignados</h2>
        {assignedCourses.length ? <ul className="portal-list">{assignedCourses.map((course) => {
          const enrollment = enrollments.find((item) => item.course_id === course.id)!;
          return <li key={course.id}>{course.title} · {course.status}
            <form action={revokeCourseAction}><input type="hidden" name="enrollment_id" value={enrollment.id} /><button className="portal-button" type="submit">Retirar acceso</button></form>
          </li>;
        })}</ul> : <p>No tiene cursos asignados.</p>}
        {availableCourses.length > 0 && (
          <form className="portal-form" action={assignCourseAction}>
            <input type="hidden" name="student_id" value={id} />
            <label>Asignar curso<select name="course_id">{availableCourses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select></label>
            <button className="portal-button" type="submit">Asignar curso</button>
          </form>
        )}
      </section>
      <section className="portal-card">
        <h2>Suscripciones registradas</h2>
        {subscriptions.length ? <ul className="portal-list">{subscriptions.map((subscription) => <li key={subscription.id}>{subscription.status} · {subscription.amount} {subscription.currency}</li>)}</ul> : <p>No hay suscripciones registradas.</p>}
      </section>
    </section>
  );
}
