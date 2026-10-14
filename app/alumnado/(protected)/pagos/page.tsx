import { requireUser } from "@/lib/auth";
import { getSubscriptionHistory } from "@/lib/services/subscriptions";

const paymentLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  failed: "Fallido",
  refunded: "Reembolsado",
};
const subscriptionLabels: Record<string, string> = {
  pending: "Pendiente",
  active: "Activa",
  past_due: "Pago pendiente",
  cancelled: "Cancelada",
  expired: "Finalizada",
};

export default async function StudentPayments() {
  const { user, supabase } = await requireUser();
  const history = await getSubscriptionHistory(supabase, user.id);

  return (
    <section>
      <h1>Suscripción e historial de pagos</h1>
      {(history.subscriptions.some((subscription) => subscription.status === "past_due") ||
        history.payments.some((payment) => payment.status === "pending" || payment.status === "failed")) && (
        <p className="portal-alert">Hay una incidencia o pago pendiente. Ponte en contacto con LUCO Estudio.</p>
      )}
      <h2>Suscripciones</h2>
      {history.subscriptions.length ? (
        <div className="portal-table-wrap"><table className="portal-table">
          <thead><tr><th>Estado</th><th>Importe</th><th>Periodicidad</th><th>Desde</th><th>Próximo cobro</th></tr></thead>
          <tbody>{history.subscriptions.map((subscription) => (
            <tr key={subscription.id}>
              <td>{subscriptionLabels[subscription.status]}</td><td>{subscription.amount} {subscription.currency}</td>
              <td>{subscription.billing_interval === "one_time" ? "Pago único" : subscription.billing_interval === "month" ? "Mensual" : "Anual"}</td>
              <td>{subscription.start_date ?? "—"}</td><td>{subscription.next_billing_date ?? "—"}</td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <p className="portal-muted">No hay suscripciones registradas.</p>}
      <h2>Pagos</h2>
      {history.payments.length ? (
        <div className="portal-table-wrap"><table className="portal-table">
          <thead><tr><th>Fecha</th><th>Importe</th><th>Estado</th><th>Proveedor</th></tr></thead>
          <tbody>{history.payments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString("es-ES") : "—"}</td>
              <td>{payment.amount} {payment.currency}</td><td>{paymentLabels[payment.status]}</td>
              <td>{payment.payment_provider ?? "—"}</td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <p className="portal-muted">No hay pagos registrados. No se ha generado ningún cargo en la plataforma.</p>}
    </section>
  );
}
