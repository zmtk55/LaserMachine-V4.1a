# Reconciliacion de fuente publicada - 16 noviembre 2026

Base de revision: main 5f64114111640d4da92698d01d204a4e09dba0ca.

Esta rama reconstruye el frontend reparado publicado en https://laser-machine-v4.vercel.app/ . No es un merge de PR2 y no habilita recepcion de pedidos ni pagos online.

## Cambios conservados

- Version publicada del personalizador, vistas frente/reverso, rotacion de90grados, borradores, imagenes, fuentes y controles de editor movil.
- Fondo frost de escritorio con10escenas y un icono discreto. Sin galeria y sin descarga frost en movil.
- Persistencia local del carrito con validacion de esquema, lectura de formato anterior valido, conservacion de lados/fotos/cantidades y aviso visible ante cuota o almacenamiento denegado. No conserva contactos ni credenciales.
- Cabeceras de seguridad de main adaptadas a Captcha y camara; firebaseConfig.ts de main conservado sin recuperar el override local antiguo.
- Se conservan archivos externos no sustituidos por la fuente publicada. Los modulos alternativos Firebase/Neon heredados no se presentan como el backend activo.

## Cambios no aplicados

No se incorporaron la migracion SQL permisiva, el auth alternativo ni la sincronizacion global de pedidos de PR2. No se ejecuto SQL ni se cambiaron datos, permisos, variables de entorno, recursos, integraciones o credenciales.

Dos scripts historicos con credenciales incrustadas se excluyen del nuevo arbol: database/init.mjs y database/setup.mjs. Esto no borra su historial ni sustituye la rotacion pendiente de credenciales.

server/ y supabase/ incluyen soporte fuente del proyecto publicado. Su presencia no autoriza desplegar funciones, ejecutar migraciones ni cambiar politicas. No se publicaron secretos locales.

## Verificacion

- TypeScript y build correctos.
- El build comparado con el deploy reparado contiene104archivos byte-identicos, incluido assets/index-Bl77e1cq.js. La comparacion se hizo usando la configuracion local existente, no incluida en este repositorio. Otra configuracion publica puede cambiar hashes.
-16pruebas (13 de persistencia y3 de frost) aprobadas de nuevo en esta reconciliacion.
- La fuente publicada paso previamente528pruebas en95archivos, por lotes. No se afirma una unica corrida continua.
- Validaciones visuales previas del sitio real:320/390/1280, frente/reverso/revision/carrito/editar/recarga sin duplicados, aviso de cuota y recepcion cerrada.

## Revision antes de integrar

La diferencia es amplia porque main no contenia toda la fuente publicada. Revisar por grupos: App/editor; componentes de administracion; servicios de sesion y almacenamiento; recursos; pruebas. No mezclar con PR2 a ciegas. No integrar a main ni cambiar la rama de produccion sin revisar las diferencias y la autoridad correspondiente.

Para reproducir: npm ci; configurar las variables publicas segun .env.example sin claves privilegiadas; npm run typecheck; npm run build; npm test -- --run.
