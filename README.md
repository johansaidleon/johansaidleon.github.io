# Portafolio — Johan Said Leon

Sitio estático publicado en GitHub Pages: https://johansaidleon.github.io/

Hecho con HTML, CSS y JavaScript, sin frameworks ni pasos de compilación. Se puede abrir `index.html` directamente o servir la carpeta con cualquier servidor estático.

```
index.html              Portafolio
css/base.css            Fuentes, colores (tema oscuro por defecto y claro opcional), reset y botones. La usan todas las páginas
css/styles.css          Estilos del portafolio
js/funcion.js           Tema claro/oscuro, menú móvil, filtros de proyectos, visor de certificados, copiar correo
img/                    Foto (photo-avatar.jpg es el recorte circular del inicio) y certificados
fonts/                  Fuentes alojadas en el sitio (Cormorant Garamond, Instrument Sans, JetBrains Mono, Bricolage Grotesque)
vendor/fontawesome/     Íconos Font Awesome Free (alojados en el sitio, con su licencia)
coulomb_laws/           Demo: calculadora de la ley de Coulomb
pasapaginas/            Demo: Pasapáginas, visor de PDF como libro (PWA instalable, funciona sin internet)
```

## Demos en vivo

- **Pasapáginas:** `/pasapaginas/`. Es una PWA: se puede instalar en el celular o el computador y abre sin internet. Las librerías (pdf.js y page-flip) están dentro de `pasapaginas/vendor/`. Si cambias algo dentro de `pasapaginas/`, sube el número de `VERSION` en `pasapaginas/sw.js` para que los dispositivos que ya la instalaron reciban la versión nueva.
- **Calculadora de Coulomb:** `/coulomb_laws/`.
- **Flores Bot:** vive en su propio repositorio (https://github.com/johansaidleon/flores-bot) y en https://flores-bot.onrender.com; el portafolio solo enlaza a ambos. Render apaga el servicio tras 15 min sin tráfico, así que el primer clic puede tardar unos segundos.

El resto de proyectos (plataforma de invitaciones digitales, detección de incidentes con IA, Semillas del Amazonas, PubControl, laboratorios de seguridad, dron, bloqueo por cámara, etc.) aparecen solo como información; no hay código asociado en este repositorio.

## Cambiar datos de contacto

El correo aparece en `index.html`, en la sección `#contacto`: en el enlace `mailto:` y en el texto con id `mail-text`. No hay número de teléfono en ninguna parte del sitio.

## Licencias de terceros

- Font Awesome Free: íconos CC BY 4.0, fuentes SIL OFL 1.1, código MIT (`vendor/fontawesome/LICENSE.txt`).
- Fuentes Cormorant Garamond, Bricolage Grotesque, Instrument Sans y JetBrains Mono: SIL Open Font License 1.1 (vía Fontsource).
- Pasapáginas incluye pdf.js (Apache 2.0) y StPageFlip (MIT); sus licencias están en `pasapaginas/vendor/`.
