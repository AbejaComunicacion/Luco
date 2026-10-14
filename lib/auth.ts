import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/alumnado/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new Error("No se pudo comprobar el perfil.");
  if (!profile || profile.account_status !== "active") redirect("/alumnado/login?error=disabled");

  return { supabase, user, profile };
}

export async function requireAdmin() {
  const context = await requireUser();
  if (context.profile.role !== "admin") redirect("/alumnado");
  return context;
}
