# DESIGN.md — SetRack landing (dirección vigente, 2026-10-04)

## Concepto (una frase)
Página de trámite pegada a la app: sus tokens, su tipografía, su icono,
sus capturas. Cumple su cometido y poco más (URL de privacidad para Play,
presentación honesta, Ko-fi, placeholder de Play).

## Lenguaje (el de la app, ver `app/src/styles/tokens.css`)
- Fondo `--floor #000000`, superficies `--surface #121315` / `--raised #1d1f22`,
  líneas `--line #2c2f33`, texto `--chalk #eceee8`, secundario `--dust #9ba3ab`.
- Puntos de músculo con los colores de la app: push `#f2555a`,
  pull `#4a8cff`, legs `#2ba868`. El rojo `#f2555a` además en CTAs y ceros.
- Tipo: **Archivo variable** self-hosted (`fonts/archivo-latin.woff2` + `OFL-Archivo.txt`).
  Sin display decorativa, sin mono: la app no los usa.
- Radios: 26px tarjetas, 999px píldoras. Icono real: `assets/icon.svg`
  (barra con discos rojo+azul, el del launcher). Una sola ilustración de barra:
  el icono; prohibida la barra decorativa duplicada.

## Composición (compacta)
- Hero en dos columnas (texto + UNA captura 02-sesion), apilado en móvil.
- «La app»: 3 capturas representativas (sesión, sugerencias+músculos,
  ficha 1RM) + lista de funciones en palabras del producto, sin cifras reclamo
  (nada de «100 kg», nada de 61 como titular).
- Privacidad con `details.legal` íntegro, FAQ «Antes de instalar» (6),
  cierre compacto, pie con Ko-fi + incidencias + privacidad.
- Sin animaciones de entrada: contenido siempre visible (página de trámite,
  cero trampas de `opacity: 0`).

## Prohibiciones (claim-check)
- Nada de descargas APK ni URLs inventadas (Ko-fi ×4 + issues ×1 por idioma;
  Play siempre `<span>` sin href: sin URL pública).
- Cifras solo verificadas en `docs/play/ficha-play.md` o en código.
- Nada de conmutador JS de idioma: ruta `/en/` + hreflang.
- Legal exacto: «La app no solicita ningún permiso» (cero `<uses-permission>`
  en el manifest, verificado 2026-10-04).

## Preservar (intocable)
- URLs `/` y `/en/`, hreflang, sitemap, robots, llms.txt, OG + Twitter + JSON-LD.
- Ids `#app` y `#privacidad`, `main#contenido`, `a.saltar`, conmutador `en/`↔`../`.
- Bloque `details.legal` (fecha 3-oct-2026) y las 6 FAQ.

## Verificación antes de publicar
1. Capturas 1440 + 390: todo visible, tildes intactas, Archivo cargada, cero errores JS.
2. Cero peticiones externas (solo Ko-fi como enlace). Ko-fi ×4, play-href 0.
3. En vivo: `/`, `/en/`, icon.svg, woff2, webp, sitemap, llms.txt → 200.
