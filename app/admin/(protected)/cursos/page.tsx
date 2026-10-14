import { requireAdmin } from "@/lib/auth";
import { saveCourseAction, saveCourseContentAction } from "@/lib/actions/admin";

export default async function CoursesAdmin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const [
    { data: courses, error: coursesError },
    { data: content, error: contentError },
  ] = await Promise.all([
    supabase.from("courses").select("*").order("created_at", { ascending: false }),
    supabase.from("course_contents").select("*").order("course_id").order("sort_order"),
  ]);
  if (coursesError || contentError) throw new Error("No se pudieron cargar los cursos.");

  return (
    <section>
      <h1>Cursos y contenidos</h1>
      {params.error && <p className="portal-alert">No se pudo guardar. Comprueba los campos e inténtalo de nuevo.</p>}
      {params.saved && <p className="portal-alert">Los cambios se han guardado.</p>}
      <section className="portal-card">
        <h2>Crear curso</h2>
        <CourseForm action={saveCourseAction} />
      </section>
      <h2>Cursos ({courses.length})</h2>
      {courses.map((course) => (
        <details className="portal-card portal-course" key={course.id}>
          <summary>
            <span className="portal-course__title">{course.title}</span>
            <span className={`portal-badge portal-badge--${course.status === "published" ? "active" : course.status === "archived" ? "cancelled" : "pending"}`}>
              {course.status === "published" ? "Publicado" : course.status === "archived" ? "Archivado" : "Borrador"}
            </span>
            {course.requires_active_subscription && <span className="portal-badge">Requiere suscripción</span>}
          </summary>
          <CourseForm action={saveCourseAction} course={course} />
          <h3>Contenidos</h3>
          {!content.some((item) => item.course_id === course.id) && <p className="portal-muted">Este curso aún no tiene contenidos.</p>}
          <ul className="portal-list portal-list--plain">
            {content.filter((item) => item.course_id === course.id).map((item) => (
              <li key={item.id}>
                <ContentForm action={saveCourseContentAction} courseId={course.id} item={item} />
              </li>
            ))}
          </ul>
          <h3>Añadir contenido</h3>
          <ContentForm
            action={saveCourseContentAction}
            courseId={course.id}
            nextOrder={content.filter((item) => item.course_id === course.id).reduce((maximum, item) => Math.max(maximum, item.sort_order), -1) + 1}
          />
        </details>
      ))}
    </section>
  );
}

function CourseForm({
  action,
  course,
}: {
  action: (formData: FormData) => void | Promise<void>;
  course?: { id: string; title: string; description: string; image_url: string | null; status: string; requires_active_subscription: boolean };
}) {
  return (
    <form className="portal-form" action={action}>
      {course && <input type="hidden" name="id" value={course.id} />}
      <label>Título<input name="title" defaultValue={course?.title} required /></label>
      <label>Descripción<textarea name="description" defaultValue={course?.description} rows={5} /></label>
      <label>Imagen (ruta /images/ o URL HTTPS)<input name="image_url" type="text" defaultValue={course?.image_url ?? ""} /></label>
      <label>Estado<select name="status" defaultValue={course?.status ?? "draft"}><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label>
      <label><input type="checkbox" name="requires_active_subscription" defaultChecked={course?.requires_active_subscription} /> Requiere suscripción activa</label>
      <button className="portal-button" type="submit">{course ? "Guardar curso" : "Crear curso"}</button>
    </form>
  );
}

function ContentForm({
  action,
  courseId,
  item,
  nextOrder = 0,
}: {
  action: (formData: FormData) => void | Promise<void>;
  courseId: string;
  item?: { id: string; title: string; description: string; content_type: string; resource_reference: string | null; sort_order: number; status: string };
  nextOrder?: number;
}) {
  return (
    <form className="portal-form" action={action}>
      <input type="hidden" name="course_id" value={courseId} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <label>Título<input name="title" defaultValue={item?.title} required /></label>
      <label>Descripción<textarea name="description" defaultValue={item?.description} rows={2} /></label>
      <label>Tipo<select name="content_type" defaultValue={item?.content_type ?? "text"}><option value="text">Texto</option><option value="video">Vídeo</option><option value="file">Archivo</option><option value="link">Enlace</option></select></label>
      <label>Referencia privada o texto<input name="resource_reference" defaultValue={item?.resource_reference ?? ""} /></label>
      <label>Orden<input name="sort_order" type="number" defaultValue={item?.sort_order ?? nextOrder} /></label>
      <label>Estado<select name="status" defaultValue={item?.status ?? "draft"}><option value="draft">Borrador</option><option value="published">Publicado</option></select></label>
      <button className="portal-button" type="submit">{item ? "Guardar contenido" : "Añadir contenido"}</button>
    </form>
  );
}
