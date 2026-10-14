import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { inviteStudentAction } from "@/lib/actions/admin";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string; invited?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const { supabase } = await requireAdmin();
  let studentQuery = supabase.from("profiles").select("id, email, first_name, last_name, phone, role, account_status").eq("role", "student").order("last_name").limit(100);
  if (query) {
    const safeQuery = query.slice(0, 100).replace(/[(),.%*"\\]/g, "");
    studentQuery = studentQuery.or(`first_name.ilike.%${safeQuery}%,last_name.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%`);
  }
  const { data: students, error } = await studentQuery;
  if (error) throw new Error("No se pudo consultar el alumnado.");

  return (
    <section>
      <h1>Alumnado</h1>
      {params.error && <p className="portal-alert">No se pudo completar la invitación. Revisa los datos y la configuración de Supabase.</p>}
      {params.invited && <p className="portal-alert">La invitación se ha enviado.</p>}
      <section className="portal-card">
        <h2>Invitar alumnado</h2>
        <form className="portal-form portal-form--grid" action={inviteStudentAction}>
          <label>Correo electrónico<input name="email" type="email" required /></label>
          <label>Nombre<input name="first_name" required /></label>
          <label>Apellidos<input name="last_name" required /></label>
          <label>Teléfono<input name="phone" type="tel" /></label>
          <button className="portal-button" type="submit">Enviar invitación</button>
        </form>
      </section>
      <form className="portal-form portal-form--grid" method="get">
        <label>Buscar por nombre o apellido<input name="q" defaultValue={query} /></label>
        <button className="portal-button" type="submit">Buscar</button>
      </form>
      {students.length ? (
        <div className="portal-table-wrap"><table className="portal-table">
          <thead><tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Estado</th><th></th></tr></thead>
          <tbody>{students.map((student) => (
            <tr key={student.id}>
              <td>{student.first_name} {student.last_name}</td><td>{student.email}</td><td>{student.phone ?? "—"}</td>
              <td>{student.account_status === "active" ? "Activa" : "Deshabilitada"}</td>
              <td><Link className="portal-button portal-button--small" href={`/admin/alumnado/${student.id}`}>Ver ficha</Link></td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <p>No hay resultados que coincidan con la búsqueda.</p>}
    </section>
  );
}
