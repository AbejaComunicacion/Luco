# Supabase: migrations, Auth y seguridad

El esquema se define en `migrations/20261014080000_initial_academy_schema.sql`. La comprobación de solo lectura devolvió HTTP 200 en `/auth/v1/health` y `PGRST205` para `public.profiles` en PostgREST: esa tabla no aparece en su caché de esquema. Esto **no demuestra que la base de datos esté vacía** ni verifica otros esquemas, funciones, políticas o datos. La migración no se ha aplicado al proyecto remoto `wtfsgdcbhllopgfwvwxj`. Inspecciona el esquema completo y el historial desde Supabase Dashboard/CLI y obtén autorización antes de modificarlo.

## Variables

Copia `.env.example` a `.env.local` para desarrollo. Obtén la clave publicable desde la configuración de API del proyecto Supabase y añádela localmente como `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. La URL ya está configurada en el ejemplo. `SUPABASE_SERVICE_ROLE_KEY` solo se necesita para invitaciones administrativas; guárdala exclusivamente en el entorno local/servidor. No la pongas en código cliente ni la compartas en el repositorio. `NEXT_PUBLIC_SITE_URL` debe ser el origen HTTPS del dominio en producción.

## Revisar y aplicar la migración de forma controlada

1. Comprueba el nombre, propietario y project ref en el dashboard antes de enlazar: `wtfsgdcbhllopgfwvwxj`. Configura el Site URL y las Redirect URLs de Auth para incluir `https://<dominio>/auth/callback` y el origen local de desarrollo.
2. Revisa tablas, migraciones, tipos y políticas existentes desde Supabase Dashboard. Esta primera migración crea tipos y objetos nuevos y puede fallar por colisiones si ya existen objetos con esos nombres. No borres ni sustituyas datos para resolver una colisión.
3. Instala la CLI oficial siguiendo la documentación de Supabase. Después ejecuta desde la raíz:

   ```powershell
   npx supabase login
   npx supabase link --project-ref wtfsgdcbhllopgfwvwxj
   npx supabase migration list --linked
   npx supabase db push --dry-run
   ```

4. Inspecciona la migración y el resultado de `--dry-run`. Antes de aplicarla a un proyecto que pueda contener datos, comprueba la definición real del esquema y prepara una copia de seguridad.
5. Aplica `npx supabase db push` solo después de verificar el destino y tener autorización explícita para modificar esa base. No se ejecutó ese comando en este trabajo.
6. Confirma el estado de migraciones y verifica las tablas, restricciones, índices, funciones, grants y políticas con la CLI o SQL Editor. No interpretes el mensaje de una compilación local como prueba de cambios en Supabase.

Para aplicar desde el SQL Editor, abre el archivo de migración completo, confirma primero que los nombres de objetos no existen y ejecútalo únicamente en el proyecto verificado. El SQL usa una transacción; no elimina tablas o registros existentes.

## Autorización y RLS

RLS está activado en las siete tablas públicas. `anon` no recibe acceso; las políticas `authenticated` limitan perfiles, cursos, contenidos, inscripciones, suscripciones, pagos y auditoría. Cada persona solo consulta su propio perfil, salvo las administradoras activas, que pueden consultar los perfiles necesarios para gestionar el servicio. El alumnado no puede modificar su rol ni el estado de su cuenta, y no dispone de permisos de escritura sobre suscripciones o pagos. No se crean políticas ni permisos de borrado permanente: se deshabilitan cuentas y se revocan inscripciones. Los pagos quedan pendientes por defecto y no existe una operación de navegador para confirmarlos. Las altas de pagos pendientes y cambios administrativos de suscripciones usan RPCs `SECURITY DEFINER` que validan `auth.uid()` y `private.is_admin()`, limitan los cambios, fijan `search_path` y escriben auditoría en la misma transacción.

La transición de estado permitida es:

- `pending` → `active`, `cancelled` o `expired`.
- `active` → `past_due`, `cancelled` o `expired`.
- `past_due` → `active`, `cancelled` o `expired`.
- `cancelled` → `expired`.
- `expired` es terminal.

`active` es un estado administrativo de suscripción; no certifica que exista un pago confirmado. La aplicación no implementa pasarela ni webhooks.

Antes de dar por verificada una instalación, usa `verify.sql` y prueba con dos cuentas del alumnado y una de administración: perfil propio frente a perfil ajeno; cambio de rol y de estado de pago denegado a personas del alumnado; lectura de un curso no asignado; y operaciones administrativas autorizadas. Esta comprobación en la base real no se ha ejecutado en este entorno.

## Primer administrador

1. Deshabilita el registro público en Supabase Auth y crea manualmente una cuenta de confianza desde el dashboard de Auth con correo y contraseña segura.
2. Espera a que se cree su perfil mediante el trigger de la migración y copia el UUID de Auth.
3. Sustituye el UUID de ejemplo de `seed/first-admin.example.sql` por ese UUID y ejecuta el bloque en el SQL Editor del proyecto verificado. El bloque aborta si ya existe una administradora activa o no coincide una cuenta activa; registra la promoción inicial.
4. Inicia sesión en `/admin/login` y elimina el UUID de la copia de trabajo antes de compartirla (el archivo de ejemplo versionado contiene únicamente ceros).

No crees administradoras por invitación desde el panel: las invitaciones crean cuentas del alumnado.

## Conservación y auditoría

La plataforma no ofrece borrado permanente de cuentas, cursos ni registros financieros: se deshabilitan cuentas y se revocan inscripciones. No se ha automatizado una retención o borrado de auditoría; la escuela debe definir una política documentada de conservación/minimización con asesoría legal o de protección de datos, atendiendo a obligaciones fiscales, contractuales y de privacidad. La auditoría guarda motivos de cambios y datos mínimos de cuenta, nunca contraseñas, tokens ni credenciales.

## Pasarela futura

La interfaz `PaymentProvider` de `lib/services/subscriptions.ts` define un contrato para validar una carga y obtener identificadores verificados. La futura integración debe recibir el cuerpo original, validar la firma y antigüedad del webhook en servidor, comprobar proveedor, importe, moneda, suscripción e idempotencia, y registrar la confirmación dentro de una operación privilegiada auditada. No se debe exponer un enlace permanente de vídeo/archivo en `resource_reference`; para proteger contenido multimedia aún hace falta un proveedor privado y URLs firmadas de corta duración.
