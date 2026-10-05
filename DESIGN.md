# DESIGN.md — SetRack web (dirección vigente, 2026-10-05)

## Concepto
La web es la barra de la app. Pocas palabras en la condensada enorme de la app,
la barra cargándose de discos y dos pantallas reales. Una idea por bloque:
apuntar, qué hace, tus datos y apoyar. Debe sentirse hecha a mano, no como una
plantilla de producto.

## Lenguaje (el de la app: `src/styles/tokens.css`)
- Negro AMOLED `#000`, superficies `--surface #121315`, líneas `--line #2c2f33` y `--line-soft #1f2124`.
- Texto en tiza `#eceee8`. El secundario va en `--mist #b9bfc6` (entradillas), `--dust #9ba3ab` y `--faint #7c848d`; la segunda línea de cada titular va en `--faint`.
- Color **solo** de discos: push `#f2555a`, pull `#4a8cff`, legs `#2ba868`, core `#e6e8eb`. Nunca en botones.
- Botón principal en tiza sólida con texto `--ink`, igual que en la app: es Google Play («Disponible en Google Play», con `&hl=` del idioma de la página). Ko-fi, al lado, con borde.
- Tipo: Archivo variable self-hosted (`fonts/archivo-latin.woff2`, eje de anchura 62–125 %). Los titulares van a `font-stretch: 68%`, peso 800 y `line-height: 0.86`. El texto se lee en anchura normal.
- Radios: 30 px en pantallas, 26 px en la tarjeta legal, 999 px en píldoras.

## Tono (2026-10-05)
Llano y modesto: describe lo que hace la app como lo contaría quien la hizo para sí y la comparte («Un diario de gimnasio sencillo», «Tus datos se quedan en tu móvil»). Nada de eslóganes imperativos ni tríos «Sin X. Sin Y. Sin Z.»; los hechos de privacidad se dicen con naturalidad. Los textos de las capturas de Play siguen el mismo tono (`docs/play/store/copy.mjs` del repo de la app). Las imágenes OG salen de `docs/play/store/compose.mjs` de ese repo.

## Composición
1. **Portada**: titular en dos líneas (la segunda en `--faint`) → barra SVG a todo el ancho → entradilla + Play + Ko-fi.
2. **La app**: titular + lista de 6 funciones con la forma de las filas de la app (número condensado y texto; sin disco de color: los colores de los discos solo marcan datos). Al lado van dos recortes reales superpuestos: la sesión delante y el selector asomando por la izquierda.
3. **Tus datos** (`#privacidad`): titular + entradilla. La política íntegra (`#politica`) va al lado en escritorio y debajo en móvil.
4. **Apoyo**: «SetRack es gratis» + Ko-fi.
5. Pie: Ko-fi, incidencias y privacidad.

## Movimiento
Uno solo: los discos entran en la barra al cargar (de dentro a fuera, 90 ms
entre pares, `--ease-out`). Es CSS puro: sin JS, el contenido se ve igual.
Con `prefers-reduced-motion` no se mueve.

## Idiomas y URLs
- `build/texts.mjs` contiene todo el texto. `node build/build.mjs` genera las 12 páginas y `sitemap.xml`. **No edites los `index.html` a mano.**
- Inicio: `/` (es), `/en/`, `/pt/` (pt-BR), `/de/`, `/fr/`, `/it/`.
- Privacidad: `/privacidad/`, `/en/privacy/`, `/pt/privacidade/`, `/de/datenschutz/`, `/fr/confidentialite/`, `/it/privacy/`.
- La URL registrada en Play es `/`, así que la portada conserva la política íntegra en `#politica`.
- hreflang en todas las páginas, con `x-default` → `/en/`. Sin JS de cambio de idioma.
- Capturas: `assets/img/{lang}-sesion.webp` y `{lang}-selector.webp`, recortes de las series `SHOTS=1` de la app (640 px de ancho, webp q82). OG: `assets/og.jpg` (es) y `og-{lang}.jpg`, renderizadas desde la propia portada.

## Claims (prohibiciones)
- Solo hechos verificados en el código o en `docs/play/ficha-play.md`: gratis, sin anuncios, sin cuenta, sin permiso de internet (único permiso: vibración), datos en el móvil, copia en Descargas y CSV, 61 ejercicios base + propios, 1RM Brzycki, 6 idiomas, kg/lb.
- Prohibido: temporizador de descanso, importar CSV y «qué discos cargar» (no hay calculadora de discos). El calentamiento son 3 aproximaciones calculadas sobre la última sesión.
- Sin enlaces de descarga de APK. Play: `https://play.google.com/store/apps/details?id=com.setrack.app`. Ko-fi: `https://ko-fi.com/iggykimi`.
- Cero peticiones externas: fuente, iconos e imágenes servidos desde el repo.

## Verificación antes de publicar
1. `node build/build.mjs`.
2. Servir en local y sacar capturas a 1440 y 390 px de las 6 portadas y las 6 políticas: sin desbordes horizontales, tildes y umlauts intactos, cero errores de consola.
3. Comprobar los enlaces internos (todo en 200).
4. Ya publicado, comprobar que `/`, `/en/` … y `sitemap.xml` responden 200.
