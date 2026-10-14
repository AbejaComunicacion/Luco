import "server-only";

import type { Database } from "@/lib/supabase/database.types";

export type PaymentConfirmation = {
  provider: string;
  externalPaymentId: string;
  amount: number;
  currency: string;
  paidAt: string;
};

export interface PaymentProvider {
  verifyWebhook(
    rawBody: string,
    headers: Headers,
  ): Promise<PaymentConfirmation | null>;
}

export async function getSubscriptionHistory(
  supabase: import("@supabase/supabase-js").SupabaseClient<Database>,
  studentId: string,
) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("No se pudo consultar el historial de suscripciones.");
  const ids = data.map((subscription) => subscription.id);
  if (ids.length === 0) return { subscriptions: data, payments: [] };

  const { data: payments, error: paymentError } = await supabase
    .from("payments")
    .select("*")
    .in("subscription_id", ids)
    .order("created_at", { ascending: false });

  if (paymentError) throw new Error("No se pudo consultar el historial de pagos.");
  return { subscriptions: data, payments };
}

export async function getStudentPayments(
  supabase: import("@supabase/supabase-js").SupabaseClient<Database>,
  studentId: string,
) {
  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("student_id", studentId);

  if (subscriptionError) throw new Error("No se pudo consultar el historial de pagos.");
  if (subscriptions.length === 0) return [];

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .in("subscription_id", subscriptions.map((subscription) => subscription.id))
    .order("created_at", { ascending: false });

  if (error) throw new Error("No se pudo consultar el historial de pagos.");
  return data;
}
