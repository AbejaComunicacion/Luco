import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccessibleCourseContent } from "@/lib/services/content-access";

export default async function CourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAccessibleCourseContent(id);
  if (!result.authorized) notFound();

  return (
    <section>
      <p><Link className="portal-link" href="/alumnado/cursos">Volver a mis cursos</Link></p>
      <h1>Contenidos del curso</h1>
      {result.content.length ? (
        <div className="portal-grid">
          {result.content.map((item) => (
            <article className="portal-card" key={item.id}>
              <h2>{item.title}</h2><p>{item.description}</p>
              {item.content_type === "text" && item.resource_reference && <p>{item.resource_reference}</p>}
              {item.content_type !== "text" && <p className="portal-muted">El recurso protegido estará disponible cuando se configure un proveedor de alojamiento privado.</p>}
            </article>
          ))}
        </div>
      ) : <section className="portal-card"><p>Este curso todavía no tiene contenidos publicados.</p></section>}
    </section>
  );
}
