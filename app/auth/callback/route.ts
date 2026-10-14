import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/alumnado/actualizar-contrasena";

  if (!code || !next.startsWith("/") || next.startsWith("//")) {
    return NextResponse.redirect(new URL("/alumnado/login?error=credentials", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/alumnado/login?error=credentials", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
