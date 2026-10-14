"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const expectedRole = String(formData.get("expected_role") ?? "");

  if (!email || !password) redirect("/alumnado/login?error=credentials");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/alumnado/login?error=credentials");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/alumnado/login?error=credentials");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.account_status !== "active" ||
    (expectedRole && profile.role !== expectedRole)
  ) {
    await supabase.auth.signOut();
    redirect("/alumnado/login?error=credentials");
  }

  redirect(profile.role === "admin" ? "/admin" : "/alumnado");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("No se pudo cerrar la sesión.");
  redirect("/alumnado/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect("/alumnado/recuperar-contrasena?error=email");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/alumnado/actualizar-contrasena`,
  });

  if (error) redirect("/alumnado/recuperar-contrasena?error=request");
  redirect("/alumnado/recuperar-contrasena?sent=1");
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 12) redirect("/alumnado/actualizar-contrasena?error=password");

  const supabase = await createSupabaseServerClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) redirect("/alumnado/login?error=credentials");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/alumnado/actualizar-contrasena?error=update");
  redirect("/alumnado/login?updated=1");
}
