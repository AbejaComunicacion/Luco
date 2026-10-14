import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth";

export default async function StudentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await requireUser();

  return (
    <main className="portal-page">
      <div className="portal-shell">
        <header className="portal-header">
          <Link href="/"><Image src="/images/Univero_Grafico_Luco/AC_Luco_Estudio_Marron.svg" alt="LUCO Estudio" width={176} height={44} priority /></Link>
          <p>Hola, {profile.first_name || "qué gusto verte"}</p>
          <form action={signOutAction}><button className="portal-button" type="submit">Cerrar sesión</button></form>
        </header>
        <nav className="portal-nav" aria-label="Navegación zona alumnado">
          <Link href="/alumnado">Inicio</Link>
          <Link href="/alumnado/cursos">Mis cursos</Link>
          <Link href="/alumnado/perfil">Mi perfil</Link>
          <Link href="/alumnado/pagos">Suscripción y pagos</Link>
        </nav>
        {children}
      </div>
    </main>
  );
}
