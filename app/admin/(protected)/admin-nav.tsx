"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/alumnado", label: "Alumnado" },
  { href: "/admin/cursos", label: "Cursos y contenidos" },
  { href: "/admin/suscripciones", label: "Suscripciones y pagos" },
  { href: "/admin/auditoria", label: "Auditoría" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="portal-nav" aria-label="Navegación de administración">
      {items.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className="portal-nav__item" aria-current={active ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
