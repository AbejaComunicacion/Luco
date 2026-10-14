# Despliegue de LUCO Estudio en Plesk

## Requisitos y configuración

- Node.js 22 LTS en Plesk (Next.js requiere Node.js 20.9 o posterior).
- Dominio con HTTPS habilitado mediante un certificado válido en Plesk.
- Aplicación Node.js con raíz de aplicación en la raíz del repositorio y comando de inicio `npm start` (`server.mjs`). El proceso escucha el puerto `PORT` proporcionado por Plesk y el host `0.0.0.0` (o `HOST` si Plesk lo define).
- Configura estas variables en la sección de variables de entorno de la aplicación Node.js de Plesk:
  - `NODE_ENV=production`
  - `NEXT_PUBLIC_SUPABASE_URL=https://wtfsgdcbhllopgfwvwxj.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clave publicable del proyecto>`
  - `NEXT_PUBLIC_SITE_URL=https://<dominio>`
  - `SUPABASE_SERVICE_ROLE_KEY=<clave privada>` solo si se habilitan invitaciones desde el panel; mantenerla en el servidor.

No subas `.env.local` ni copies credenciales al árbol web público. Las variables `NEXT_PUBLIC_*` se incorporan al bundle del cliente y solo deben contener valores diseñados para ser públicos. La autorización siempre depende de Supabase Auth y RLS, no del carácter público de una clave.

## Instalación y puesta en marcha

Desde la raíz de la aplicación en Plesk:

```bash
npm ci
npm run build
npm start
```

Selecciona Node.js 22, guarda las variables en Plesk, compila y reinicia la aplicación Node.js desde el panel. Mantén la aplicación detrás del proxy HTTPS de Plesk. No alteres el DNS ni sustituyas el document root del sitio en producción hasta haber comprobado las rutas y acordado la migración con la propietaria. Si el alojamiento exige una configuración de document root/proxy concreta, confírmala con el administrador del servidor antes de activarla.

## Actualizaciones

1. Haz una copia de seguridad del repositorio, variables de Plesk y datos de Supabase.
2. Descarga el cambio aprobado en una copia de staging con las mismas versiones de Node.js.
3. Ejecuta `npm ci`, `npm run lint`, `npm run typecheck` y `npm run build`.
4. Revisa la lista de migraciones y su destino; aplica migraciones solo con aprobación y siguiendo [las instrucciones de Supabase](./supabase/README.md).
5. Reinicia la aplicación desde Plesk y comprueba inicio de sesión, rutas, imágenes y salud del servicio.
6. Conserva la versión anterior para poder revertir el despliegue de aplicación. No reviertas migraciones de datos de forma destructiva.

La aplicación mantiene `index.html`, `images/` y `src/` originales y sirve una copia estática conservada en `public/legacy.html`. Comprueba ambas páginas antes de cambiar el enrutamiento del dominio. Las claves de vídeo/archivo requieren además un proveedor de almacenamiento privado; no publiques URLs permanentes.
