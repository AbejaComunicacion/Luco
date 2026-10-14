import Link from "next/link";

export default function NotFound() {
  return (
    <main className="portal-page">
      <section className="portal-card">
        <h1>Página no encontrada</h1>
        <Link className="portal-link" href="/">
          Volver a LUCO Estudio
        </Link>
      </section>
    </main>
  );
}
