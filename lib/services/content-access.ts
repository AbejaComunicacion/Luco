import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAccessibleCourseContent(courseId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { authorized: false as const, content: [] };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new Error("No se pudo comprobar el estado de la cuenta.");
  if (profile?.account_status !== "active") return { authorized: false as const, content: [] };

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .is("revoked_at", null)
    .maybeSingle();

  if (enrollmentError) throw new Error("No se pudo comprobar la inscripción.");
  if (!enrollment) return { authorized: false as const, content: [] };

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, requires_active_subscription")
    .eq("id", courseId)
    .eq("status", "published")
    .maybeSingle();

  if (courseError) throw new Error("No se pudo comprobar la publicación del curso.");
  if (!course) return { authorized: false as const, content: [] };

  if (course.requires_active_subscription) {
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("student_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (subscriptionError) throw new Error("No se pudo comprobar la suscripción.");
    if (!subscription) return { authorized: false as const, content: [] };
  }

  const { data: content, error: contentError } = await supabase
    .from("course_contents")
    .select("id, title, description, content_type, resource_reference, sort_order")
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("sort_order");

  if (contentError) throw new Error("No se pudo consultar el contenido del curso.");
  return { authorized: true as const, content: content ?? [] };
}
