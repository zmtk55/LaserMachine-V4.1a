# LaserMachine

Fuente reconciliada del frontend actualmente publicado en https://laser-machine-v4.vercel.app/ . Ver [notas de reconciliacion](RECONCILIATION-2026-11-16.md).

## Estado y limites

- La recepcion publica de pedidos permanece cerrada. Publicar codigo no autoriza abrirla.
- El carrito conserva el diseno en el mismo navegador. No equivale a pedido recibido ni sincronizacion entre dispositivos.
- Pago presencial o transferencia; sin cobro online. Existencias y fotos reales pendientes no se sustituyen por demos.
- Esta rama no es un merge del PR #2. No seguir su lista de migracion como instrucciones de la implementacion actual.

## Ejecutar y revisar localmente

Requiere Node.js compatible con las dependencias fijadas en package-lock.json.

1. Instalar: `npm ci`.
2. Preparar `.env.local` con las variables publicas del proyecto autorizado, tomando `.env.example` como referencia. No copiar secretos ni valores de otro proyecto. El cliente verifica que la URL de Supabase sea la del proyecto existente; el dominio de ejemplo no es una configuracion ejecutable.
3. Revisar tipos: `npm run typecheck`.
4. Ejecutar pruebas: `npm test -- --run`.
5. Desarrollar: `npm run dev`. Compilar: `npm run build`.

Las pruebas usan mocks y fixtures. No ejecutar pruebas de pedidos, correos o recursos contra servicios reales sin autorizacion especifica. Un build correcto no prueba permisos de backend ni autoriza apertura.

## Configuracion vigente

La autenticacion activa del frontend usa Supabase mediante `services/supabaseClient.ts`, no una migracion a Firebase. La persistencia compartida usa los servicios y registros `lm_*` existentes. Conservar el acceso y las politicas actuales; no crear un administrador en Firestore para intentar arreglar este flujo.

Variables publicas relevantes:

- `VITE_SUPABASE_URL`: destino existente autorizado.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: clave publica del cliente, no service_role.
- `VITE_TURNSTILE_SITE_KEY`: clave publica del Captcha.
- `VITE_CHECKOUT_ENABLED=false`: mantener recepcion cerrada.

No cambiar variables del despliegue para seguir esta guia. Este documento describe el codigo, no autoriza cambios de configuracion. No introducir claves privadas de remove.bg, Groq, Hugging Face, base de datos o service_role en variables `VITE_*`: su contenido puede acabar en el navegador. GEMINI_API_KEY no es un requisito del frontend actual.

## Base de datos y codigo heredado

Los archivos SQL y las funciones versionadas son material de revision, no una secuencia para ejecutar de nuevo. La presencia de un archivo no demuestra que falte aplicarlo. No pegar ni ejecutar `database/supabase-schema.sql` del PR #2: propone otra estructura y politicas permisivas, incompatible con el flujo `lm_*` conservado aqui.

Los modulos Firebase/Neon heredados que siguen en el repositorio no definen el backend activo. No activar doble escritura ni importar pedidos/catalogos por seguir instrucciones antiguas. No se ejecutaron migraciones como parte de esta reconciliacion.

## Publicacion y revision

El arreglo esta publicado en Vercel, pero esta rama debe revisarse antes de integrarla. Produccion estaba ligada a `main` en la comprobacion del16nov2026; verificar la configuracion real antes de cualquier publicacion. No cambiar la integracion ni mezclar PR #2 a ciegas. No ejecutar SQL, cambiar auth, abrir pedidos o crear recursos como efecto secundario de publicar el frontend.

Ver el detalle de pruebas, diferencias amplias y exclusiones en las notas de reconciliacion. La rotacion de credenciales historicas sigue siendo una tarea separada; retirarlas del arbol no las elimina del historial.
