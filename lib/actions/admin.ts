"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type AuditEntry = Database["public"]["Tables"]["admin_audit_log"]["Insert"];
const courseStatuses = ["draft", "published", "archived"] as const;
const accountStatuses = ["active", "disabled"] as const;

async function recordAudit(entry: AuditEntry) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("admin_audit_log").insert(entry);
  if (error) throw new Error("La operación se guardó, pero no pudo registrarse en auditoría.");
}

function isOneOf<const T extends readonly string[]>(value: string, options: T): value is T[number] {
  return options.includes(value);
}

export async function inviteStudentAction(formData: FormData) {
  const { profile } = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (
    !email ||
    email.length > 254 ||
    !firstName ||
    firstName.length > 100 ||
    !lastName ||
    lastName.length > 100 ||
    phone.length > 40
  ) {
    redirect("/admin/alumnado?error=fields");
  }

  const adminClient = createSupabaseAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) throw new Error("Configura NEXT_PUBLIC_SITE_URL antes de invitar alumnado.");
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { first_name: firstName, last_name: lastName, phone: phone || null },
    redirectTo: `${siteUrl}/auth/callback?next=/alumnado/actualizar-contrasena`,
  });

  if (error) redirect("/admin/alumnado?error=invite");
  if (!data.user) redirect("/admin/alumnado?error=invite");

  await recordAudit({
    admin_id: profile.id,
    action: "student.invited",
    entity_type: "profile",
    entity_id: data.user.id,
    details: { email },
  });
  revalidatePath("/admin/alumnado");
  redirect("/admin/alumnado?invited=1");
}

export async function saveCourseAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawImageUrl = String(formData.get("image_url") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  const requiresActiveSubscription = formData.get("requires_active_subscription") === "on";

  if (!title || !isOneOf(status, courseStatuses)) {
    redirect("/admin/cursos?error=fields");
  }

  const imageUrl = rawImageUrl || null;
  if (imageUrl && !imageUrl.startsWith("/images/")) {
    let parsedImageUrl: URL;
    try {
      parsedImageUrl = new URL(imageUrl);
    } catch {
      redirect("/admin/cursos?error=fields");
    }
    if (parsedImageUrl.protocol !== "https:") redirect("/admin/cursos?error=fields");
  }

  const course = { title, description, image_url: imageUrl, status, requires_active_subscription: requiresActiveSubscription };
  const result = id
    ? await supabase.from("courses").update(course).eq("id", id).select("id").single()
    : await supabase.from("courses").insert(course).select("id").single();

  if (result.error) redirect("/admin/cursos?error=save");
  revalidatePath("/admin/cursos");
  revalidatePath("/alumnado/cursos");
  redirect("/admin/cursos?saved=1");
}

export async function assignCourseAction(formData: FormData) {
  const { profile, supabase } = await requireAdmin();
  const studentId = String(formData.get("student_id") ?? "");
  const courseId = String(formData.get("course_id") ?? "");
  const { error } = await supabase.from("enrollments").insert({
    student_id: studentId,
    course_id: courseId,
    assigned_by: profile.id,
  });

  if (error) redirect(`/admin/alumnado/${studentId}?error=assignment`);
  revalidatePath(`/admin/alumnado/${studentId}`);
  revalidatePath("/alumnado/cursos");
  redirect(`/admin/alumnado/${studentId}?assigned=1`);
}

export async function revokeCourseAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const enrollmentId = String(formData.get("enrollment_id") ?? "");
  const { data: enrollment, error: fetchError } = await supabase
    .from("enrollments")
    .select("student_id, course_id")
    .eq("id", enrollmentId)
    .is("revoked_at", null)
    .single();

  if (fetchError) throw new Error("No se pudo comprobar la inscripción.");

  const { error } = await supabase
    .from("enrollments")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", enrollmentId);
  if (error) throw new Error("No se pudo retirar la asignación.");

  revalidatePath(`/admin/alumnado/${enrollment.student_id}`);
  revalidatePath("/alumnado/cursos");
  redirect(`/admin/alumnado/${enrollment.student_id}?revoked=1`);
}

export async function updateProfileAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const studentId = String(formData.get("student_id") ?? "");
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const accountStatus = String(formData.get("account_status") ?? "");

  if (!firstName || !lastName || !isOneOf(accountStatus, accountStatuses)) {
    redirect(`/admin/alumnado/${studentId}?error=fields`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ first_name: firstName, last_name: lastName, phone: phone || null, account_status: accountStatus })
    .eq("id", studentId)
    .eq("role", "student");

  if (error) redirect(`/admin/alumnado/${studentId}?error=profile`);
  revalidatePath(`/admin/alumnado/${studentId}`);
  redirect(`/admin/alumnado/${studentId}?saved=1`);
}

export async function updateSubscriptionStatusAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const subscriptionId = String(formData.get("subscription_id") ?? "");
  const nextStatus = String(formData.get("status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const allowed = ["pending", "active", "past_due", "cancelled", "expired"];

  if (!allowed.includes(nextStatus) || !reason) {
    redirect("/admin/suscripciones?error=fields");
  }

  const { error } = await supabase.rpc("change_subscription_status", {
    target_subscription_id: subscriptionId,
    new_status: nextStatus,
    reason,
  });

  if (error) redirect("/admin/suscripciones?error=transition");
  revalidatePath("/admin/suscripciones");
  revalidatePath("/alumnado/pagos");
  redirect("/admin/suscripciones?saved=1");
}

export async function createSubscriptionAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const studentId = String(formData.get("student_id") ?? "");
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "EUR").toUpperCase();
  const interval = String(formData.get("billing_interval") ?? "");

  if (
    !studentId ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    !/^[A-Z]{3}$/.test(currency) ||
    !["month", "year", "one_time"].includes(interval)
  ) {
    redirect("/admin/suscripciones?error=fields");
  }

  const { error } = await supabase.rpc("create_subscription", {
    target_student_id: studentId,
    subscription_amount: amount,
    subscription_currency: currency,
    subscription_interval: interval,
  });
  if (error) redirect("/admin/suscripciones?error=create-subscription");
  revalidatePath("/admin/suscripciones");
  revalidatePath("/admin/alumnado");
  redirect("/admin/suscripciones?saved=1");
}

export async function createPendingPaymentAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const subscriptionId = String(formData.get("subscription_id") ?? "");
  const amount = Number(formData.get("amount"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!subscriptionId || !Number.isFinite(amount) || amount < 0 || reason.length < 8) {
    redirect("/admin/suscripciones?error=payment-fields");
  }

  const { error } = await supabase.rpc("create_pending_payment", {
    target_subscription_id: subscriptionId,
    payment_amount: amount,
    reason,
  });
  if (error) redirect("/admin/suscripciones?error=payment-create");
  revalidatePath("/admin/suscripciones");
  revalidatePath("/alumnado/pagos");
  redirect("/admin/suscripciones?saved=1");
}

export async function saveCourseContentAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const courseId = String(formData.get("course_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const contentType = String(formData.get("content_type") ?? "text");
  const resourceReference = String(formData.get("resource_reference") ?? "").trim();
  const rawSortOrder = Number(formData.get("sort_order") ?? 0);
  const status = String(formData.get("status") ?? "draft");

  if (
    !courseId ||
    !title ||
    !Number.isSafeInteger(rawSortOrder) ||
    !["text", "video", "file", "link"].includes(contentType) ||
    !["draft", "published"].includes(status)
  ) {
    redirect("/admin/cursos?error=content");
  }

  const content = {
    course_id: courseId,
    title,
    description,
    content_type: contentType as "text" | "video" | "file" | "link",
    resource_reference: resourceReference || null,
    sort_order: rawSortOrder,
    status: status as "draft" | "published",
  };
  const result = id
    ? await supabase.from("course_contents").update(content).eq("id", id).select("id").single()
    : await supabase.from("course_contents").insert(content).select("id").single();

  if (result.error) redirect("/admin/cursos?error=content");
  revalidatePath("/admin/cursos");
  redirect("/admin/cursos?saved=1");
}
