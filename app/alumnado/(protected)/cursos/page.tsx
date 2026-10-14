import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function StudentCourses() {
  const { user, supabase } = await requireUser();
  const { data: enrollments, error } = await supabase
    .from("enrollments").select("course_id").eq("student_id", user.id).is("revoked_at", null);
  if (error) throw new Error("No se pudieron consultar tus cursos.");
  const ids = enrollments.map((enrollment) => enrollment.course_id);
  const { data: courses, error: courseError } = ids.length
    ? await supabase.from("courses").select("id, title, description, image_url").in("id", ids).eq("status", "published")
    : { data: [], error: null };
  if (courseError) throw new Error("No se pudieron consultar tus cursos.");

  return (
    <section>
      <h1>Mis cursos</h1>
      {courses.length ? (
        <div className="portal-grid">
          {courses.map((course) => (
            <article className="portal-card" key={course.id}>
              <h2>{course.title}</h2><p>{course.description || "Curso de LUCO Estudio."}</p>
              <p><Link className="portal-link" href={`/alumnado/cursos/${course.id}`}>Acceder al curso</Link></p>
            </article>
          ))}
        </div>
      ) : (
        <section className="portal-card"><h2>Aún no tienes cursos asignados</h2><p>Cuando LUCO Estudio te asigne un curso, aparecerá aquí.</p></section>
      )}
    </section>
  );
}
