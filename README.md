# LUCO Estudio - Landing Mobile First

# LUCO Estudio

Next.js App Router y TypeScript para la zona privada; la página HTML/CSS/JavaScript pública original se conserva en `index.html`, junto con los recursos originales. Next.js sirve una copia de esa página en `public/legacy.html`; la página original incluye el enlace a la zona de alumnado. No se elimina ni sustituye la web estática de partida.

## Desarrollo local

Requiere Node.js 22 y npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

En Windows, copia `.env.example` a `.env.local` con el Explorador o PowerShell. Añade localmente la clave publicable de Supabase y la clave de servicio solo si se necesitan invitaciones; `.env.local` está excluido de Git.

- Web pública: `http://localhost:3000/`
- Zona alumnado: `http://localhost:3000/alumnado/login`
- Administración: `http://localhost:3000/admin/login`

La API de Supabase respondió a una comprobación de salud de Auth. La API REST respondió que `public.profiles` no está en la caché de esquema (`PGRST205`), así que la migración aún no está aplicada. No se incluye registro público. Consulta [Supabase y las migraciones](./supabase/README.md) y [el despliegue Plesk](./DEPLOYMENT.md).

## Comprobaciones

```bash
npm run lint
npm run typecheck
npm run build
```

No apliques migraciones remotas ni modifiques DNS o producción sin comprobar el destino y autorización.
