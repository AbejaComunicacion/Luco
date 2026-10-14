import { requireAdmin } from "@/lib/auth";
import { createPendingPaymentAction, createSubscriptionAction, updateSubscriptionStatusAction } from "@/lib/actions/admin";

export default async function SubscriptionAdmin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const [
    { data: subscriptions, error: subscriptionsError },
    { data: payments, error: paymentsError },
    { data: students, error: studentsError },
  ] = await Promise.all([
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("profiles").select("id, first_name, last_name").eq("role", "student"),
  ]);
  if (subscriptionsError || paymentsError || studentsError) throw new Error("No se pudieron consultar suscripciones y pagos.");
  const studentNames = new Map(students.map((student) => [student.id, `${student.first_name} ${student.last_name}`]));
  const paymentLabels: Record<string, string> = { pending: "Pendiente", confirmed: "Confirmado", failed: "Fallido", refunded: "Reembolsado" };
  const subscriptionLabels: Record<string, string> = { pending: "Pendiente", active: "Activa", past_due: "Pago pendiente", cancelled: "Cancelada", expired: "Finalizada" };
  const intervalLabels: Record<string, string> = { month: "Mensual", year: "Anual", one_time: "Pago único" };

  return (
    <section>
      <h1>Suscripciones y pagos</h1>
      {params.error && <p className="portal-alert">No se pudo cambiar el estado. Comprueba que la transición está permitida y añade el motivo.</p>}
      {params.saved && <p className="portal-alert">El estado de la suscripción se ha cambiado y auditado.</p>}
      <section className="portal-card">
        <h2>Crear suscripción pendiente</h2>
        <p>Crear una suscripción no registra ni confirma un pago.</p>
        <form className="portal-form portal-form--grid" action={createSubscriptionAction}>
          <label>Alumnado<select name="student_id" required>{students.filter((student) => student.id).map((student) => <option value={student.id} key={student.id}>{student.first_name} {student.last_name}</option>)}</select></label>
          <label>Importe<input name="amount" type="number" step="0.01" min="0" required /></label>
          <label>Moneda<input name="currency" defaultValue="EUR" pattern="[A-Za-z]{3}" required /></label>
          <label>Periodicidad<select name="billing_interval"><option value="month">Mensual</option><option value="year">Anual</option><option value="one_time">Pago único</option></select></label>
          <button className="portal-button" type="submit">Crear suscripción pendiente</button>
        </form>
      </section>
      <h2>Suscripciones</h2>
      {subscriptions.length ? subscriptions.map((subscription) => (
        <article className="portal-card" key={subscription.id}>
          <div className="portal-card__heading">
            <h3>{studentNames.get(subscription.student_id) ?? "Alumnado"}</h3>
            <span className={`portal-badge portal-badge--${subscription.status}`}>{subscriptionLabels[subscription.status] ?? subscription.status}</span>
          </div>
          <p className="portal-muted">{subscription.amount} {subscription.currency} · {intervalLabels[subscription.billing_interval] ?? subscription.billing_interval} · Proveedor: {subscription.payment_provider ?? "Sin configurar"}</p>
          <form className="portal-form portal-form--grid portal-form--divided" action={updateSubscriptionStatusAction}>
            <input type="hidden" name="subscription_id" value={subscription.id} />
            <label>Nuevo estado<select name="status" defaultValue={subscription.status}><option value="pending">Pendiente</option><option value="active">Activa (estado administrativo, no confirma un pago)</option><option value="past_due">Pago pendiente</option><option value="cancelled">Cancelada</option><option value="expired">Finalizada</option></select></label>
            <label>Motivo del cambio<input name="reason" minLength={8} required /></label>
            <button className="portal-button" type="submit">Cambiar estado</button>
          </form>
          {["pending", "active", "past_due"].includes(subscription.status) && (
            <form className="portal-form portal-form--grid portal-form--divided" action={createPendingPaymentAction}>
              <input type="hidden" name="subscription_id" value={subscription.id} />
              <label>Registrar pago pendiente (sin confirmar)<input name="amount" type="number" step="0.01" min="0" defaultValue={subscription.amount} required /></label>
              <label>Motivo<input name="reason" minLength={8} required /></label>
              <button className="portal-button" type="submit">Registrar pendiente</button>
            </form>
          )}
        </article>
      )) : <p>No hay suscripciones registradas.</p>}
      <h2>Historial de pagos</h2>
      {payments.length ? <div className="portal-table-wrap"><table className="portal-table">
        <thead><tr><th>Alumnado</th><th>Importe</th><th>Estado</th><th>Confirmado en</th><th>Proveedor</th></tr></thead>
        <tbody>{payments.map((payment) => {
          const subscription = subscriptions.find((item) => item.id === payment.subscription_id);
          return <tr key={payment.id}><td>{subscription ? studentNames.get(subscription.student_id) : "—"}</td><td>{payment.amount} {payment.currency}</td><td><span className={`portal-badge portal-badge--${payment.status}`}>{paymentLabels[payment.status]}</span></td><td>{payment.paid_at ? new Date(payment.paid_at).toLocaleString("es-ES") : "—"}</td><td>{payment.payment_provider ?? "—"}</td></tr>;
        })}</tbody>
      </table></div> : <p>No hay pagos registrados. No se ha marcado ningún pago como confirmado.</p>}
    </section>
  );
}
