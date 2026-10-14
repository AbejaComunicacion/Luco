import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await requireAdmin();
  return (
    <main className="portal-page">
      <div className="portal-shell">
        <header className="portal-header">
          <Link href="/"><Image src="/images/Univero_Grafico_Luco/AC_Luco_Estudio_Marron.svg" alt="LUCO Estudio" width={176} height={44} priority /></Link>
          <p>Administración · {profile.first_name}</p>
          <form action={signOutAction}><button className="portal-button" type="submit">Cerrar sesión</button></form>
        </header>
        <AdminNav />
        {children}
      </div>
    </main>
  );
}
