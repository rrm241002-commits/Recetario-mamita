# El Recetario — instrucciones de instalación

No hace falta usar la terminal en ningún momento. Todo se hace desde las webs
de Supabase y GitHub.

## 1. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (o entra si ya tienes).
2. Crea un **New project**. Elige nombre y contraseña de base de datos (guárdala, no hace falta usarla luego).
3. Cuando el proyecto esté listo, ve a **SQL Editor** (menú lateral) → **New query**.
4. Abre el archivo `sql/schema.sql` de esta carpeta, copia todo su contenido y pégalo ahí. Pulsa **Run**.
   Esto crea la tabla de recetas y las reglas de seguridad (solo quien inicie sesión puede ver o tocar las recetas).

## 2. Crear el almacén de fotos

1. En el menú lateral de Supabase, ve a **Storage**.
2. Crea un **New bucket** llamado exactamente `fotos-recetas`.
3. Márcalo como **Public bucket** (así las fotos se pueden mostrar en la web). Las recetas en sí solo las ve
   quien inicie sesión; solo las fotos sueltas serían accesibles por quien tuviera el enlace exacto, algo
   razonable para fotos de comida.

## 3. Crear las cuentas de acceso (tú y tu madre)

No hay registro público — así nadie más puede entrar. Las cuentas se crean a mano:

1. Ve a **Authentication → Users → Add user**.
2. Crea una cuenta con tu correo y una contraseña.
3. Repite para tu madre, con su correo y otra contraseña.
4. Marca **Auto Confirm User** al crearlas (así no hace falta verificar por email).

## 4. Conectar la web con tu proyecto de Supabase

1. En Supabase, ve a **Settings → API**.
2. Copia el valor de **Project URL** y pégalo en el archivo `js/config.js`, en `SUPABASE_URL`.
3. Copia el valor de **anon public key** y pégalo en `js/config.js`, en `SUPABASE_ANON_KEY`.
4. Si quieres, cambia también `NOMBRE_RECETARIO` por el nombre que quieras que aparezca arriba de la web,
   por ejemplo `"El Recetario de Mamá"`.

## 5. Publicar en GitHub Pages (arrastrando archivos, sin terminal)

1. Entra en [github.com](https://github.com) y crea un repositorio nuevo (por ejemplo `recetario`). Puede ser público
   o privado, da igual — quien no tenga tu correo y contraseña de Supabase no podrá entrar a la web igualmente.
2. Dentro del repositorio, pulsa **Add file → Upload files**.
3. Arrastra **todo el contenido de esta carpeta** (los archivos `.html`, y las carpetas `css` y `js` completas)
   directamente sobre la zona de subida. No arrastres la carpeta `recetario` en sí, sino lo que hay dentro.
4. Pulsa **Commit changes**.
5. Ve a **Settings → Pages** (dentro del repositorio).
6. En **Source**, elige la rama `main` y la carpeta `/ (root)`. Guarda.
7. Espera un par de minutos y GitHub te dará un enlace tipo `https://tu-usuario.github.io/recetario/`. Esa es
   la web ya publicada.

## Para futuros cambios

Cualquier cambio (por ejemplo si algún día quieres tocar el diseño) se hace igual: editas el archivo en tu
ordenador y lo vuelves a arrastrar a **Add file → Upload files** en GitHub, sustituyendo al anterior. Las
recetas en sí **no** hace falta subirlas nunca así — esas se añaden y editan directamente desde la propia web,
con el botón "+ Nueva receta" y "Editar", y se guardan automáticamente en Supabase.

## Cómo funciona el PDF

Al abrir una receta hay un botón **"Exportar / Imprimir PDF"**. Abre el diálogo de impresión del navegador;
eligiendo **"Guardar como PDF"** como destino se genera el PDF listo para imprimir, sin botones ni menús, solo
la receta. Si luego se edita la receta, basta con volver a pulsar el mismo botón para tener el PDF actualizado.

## Estructura de archivos

```
index.html        → pantalla de inicio de sesión
recetario.html     → el recetario: buscador, filtros, índice alfabético
receta.html         → ver una receta (y exportarla a PDF)
editar.html         → crear o editar una receta
css/style.css       → todo el diseño
js/config.js         → tus claves de Supabase (rellenar)
js/supabase-client.js → conexión con Supabase
js/auth.js, recetario.js, receta.js, editar.js → lógica de cada página
sql/schema.sql       → script para crear la base de datos en Supabase
```
