# Taskly 2.0 — por dónde comenzamos

Frank: el código que gestiona cuentas, permisos y dinero necesita una base nueva. Empezaremos por ahí y rescataremos las pantallas y decisiones de producto que sirvan. El proyecto anterior queda conservado como referencia; no vamos a intentar arreglar todo a la vez.

## Lo que ya comprobamos

- El código auditado sigue en main, en el commit e9d39167a7255fe60597b645841650e1e1d6817a.
- GitHub conserva 27 commits accesibles de este repositorio. Eso permite consultar esas versiones sin reemplazar main.
- Siguen presentes Feed.tsx, FeedTinder.tsx, FeedTinderWithFilters.tsx y FeedWithMenu.tsx, además del feed activo. FeedWithMenu contiene el menú; Feed.tsx tiene el layout y la interfaz de reseñas. Son piezas de referencia, no versiones completas certificadas como funcionales.
- La comparación entre el commit del menú (720cdea) y el auditado muestra archivos añadidos/modificados, sin archivos eliminados en esa comparación. No prueba que todo lo que recuerdes esté en GitHub: cambios que nunca se guardaron allí necesitan otra fuente.

## Primer objetivo: dos personas y una tarea

La primera versión que comprobaremos debe permitir esto:

1. Frank crea una cuenta, entra, sale y vuelve a entrar.
2. Frank publica una tarea sencilla, por ejemplo: «Necesito ayuda para instalar una repisa».
3. Una segunda cuenta encuentra la tarea y expresa interés.
4. Frank selecciona a esa persona; ambos conversan y aceptan el mismo alcance, precio y fecha.

Cada paso debe quedar guardado y seguir existiendo al recargar. Un tercer usuario no debe poder leer el chat privado ni modificar ese acuerdo.

El primer entregable de código será más pequeño: registro, inicio de sesión y perfil básico que sobreviven a una recarga. No lo daremos por terminado por mostrar un mensaje de éxito: se probará con dos cuentas y con cierre de sesión.

## Orden de construcción

| Paso | Qué haremos | Qué comprobarás tú |
| --- | --- | --- |
| 1 | Cuentas y acceso fiables, en un entorno separado | Crear cuenta, entrar, recargar y salir |
| 2 | Publicar y encontrar una tarea | Una cuenta publica; otra la encuentra |
| 3 | Interés, selección, chat y acuerdo | Ambas cuentas aceptan el mismo trabajo |
| 4 | Pago de prueba y confirmación | El trabajo no comienza con pago fallido; repetir una acción no duplica saldo |
| 5 | Entrega, disputa, devolución y calificación | Completar un trabajo y probar también un problema |
| 6 | Piloto limitado con personas reales | Medir tareas completadas, problemas y usuarios que regresan |

Los pagos de prueba se señalarán como simulados y estarán separados de producción. Dinero real se habilita después de integrar y verificar al proveedor, las devoluciones y los desembolsos. No reutilizaremos los movimientos financieros inseguros de la versión vieja.

## Qué hago yo y qué haces tú

**Yo:** preparar código, revisar piezas antiguas, proponer la interfaz, conectar pantallas, escribir las pruebas necesarias y presentar avances comprobables. Mantendré los cambios separados de main.

**Tú:** decidir cómo debe sentirse Taskly y probar recorridos cortos. Cuando haga falta una cuenta de servicio o una configuración privada, te daré los clics concretos, una tarea a la vez. No pegues contraseñas ni claves privadas en el chat.

La siguiente información necesaria es sólo una: **¿Taskly ha sido únicamente pruebas, ya tiene usuarios reales sin pagos, o tiene usuarios y pagos reales?** Esto determina si necesitamos conservar/migrar datos reales y planear continuidad del servicio. Mientras no lo sepamos, no conectaremos la nueva versión a los datos existentes.

## Lo que puede esperar

Niveles, puntos, badges, vídeos, recomendaciones avanzadas y varias versiones de feed. Conservaremos sus ideas para después de cerrar el recorrido de una tarea. Para evaluar la posibilidad de negocio, mediremos si personas publican, completan trabajos y vuelven a usar Taskly; todavía no se ha validado eso con el código auditado.

## Referencias que podemos rescatar

- [Código auditado](https://github.com/Frankinthedarknes/tasklyManus/tree/e9d39167a7255fe60597b645841650e1e1d6817a).
- [Menú anterior](https://github.com/Frankinthedarknes/tasklyManus/blob/e9d39167a7255fe60597b645841650e1e1d6817a/client/src/pages/FeedWithMenu.tsx).
- [Feed con layout y reseñas](https://github.com/Frankinthedarknes/tasklyManus/blob/e9d39167a7255fe60597b645841650e1e1d6817a/client/src/pages/Feed.tsx).
- [Primera versión de la navegación](https://github.com/Frankinthedarknes/tasklyManus/blob/ffb19a1b98a60c0da96d1849b007971dec515c3d/client/src/App.tsx).

Estado de este paso: revisión de historia y preparación del arranque. La nueva aplicación todavía no está implementada.
