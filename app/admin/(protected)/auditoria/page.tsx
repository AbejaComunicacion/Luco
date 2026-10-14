import { requireAdmin } from "@/lib/auth";

export default async function AuditLog() {
  const { supabase } = await requireAdmin();
  const { data: entries, error } = await supabase
    .from("admin_audit_log")
    .select("id, action, entity_type, entity_id, details, created_at, admin_id")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("No se pudo consultar la auditoría.");
  const adminIds = Array.from(new Set(entries.map((entry) => entry.admin_id)));
  const { data: admins, error: adminsError } = adminIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", adminIds)
    : { data: [], error: null };
  if (adminsError) throw new Error("No se pudieron consultar los administradores.");
  const adminNames = new Map(admins.map((admin) => [admin.id, `${admin.first_name} ${admin.last_name}`]));

  return (
    <section>
      <h1>Auditoría administrativa</h1>
      <p className="portal-muted">Se muestran las últimas 200 acciones registradas.</p>
      {entries.length ? <div className="portal-card portal-table-wrap"><table className="portal-table">
        <thead><tr><th>Fecha</th><th>Responsable</th><th>Acción</th><th>Registro</th><th>Datos</th></tr></thead>
        <tbody>{entries.map((entry) => <tr key={entry.id}>
          <td>{new Date(entry.created_at).toLocaleString("es-ES")}</td>
          <td>{adminNames.get(entry.admin_id) ?? "Administrador"}</td>
          <td><span className="portal-badge">{entry.action}</span></td>
          <td>{entry.entity_type}<br /><code className="portal-code">{entry.entity_id ?? "—"}</code></td>
          <td><pre className="portal-code portal-code--block">{JSON.stringify(entry.details, null, 1)}</pre></td>
        </tr>)}</tbody>
      </table></div> : <p>No hay acciones registradas.</p>}
    </section>
  );
}
