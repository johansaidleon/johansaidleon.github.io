// Efectos del inicio: circuito dorado animado y terminal interactiva.
// Toda la salida de la terminal se crea con textContent: lo que escribe el visitante nunca se interpreta como HTML.
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- circuito ---------- */
  var cv = $('circuit');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d'), G = 26;
    var DIRS = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
    var W = 0, H = 0, traces = [], pulses = [], mouse = { x: -999, y: -999 }, run = false, raf = 0;

    var build = function () {
      var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var cols = Math.ceil(W / G), rows = Math.ceil(H / G), used = {}, n = Math.round((W * H) / 5200);
      traces = []; pulses = [];
      for (var t = 0; t < n; t++) {
        var x = Math.floor(Math.random() * cols), y = Math.floor(Math.random() * rows);
        if (used[x + ',' + y]) continue;
        var d = [0, 2, 4, 6][Math.floor(Math.random() * 4)], pts = [[x * G, y * G]], len = 3 + Math.floor(Math.random() * 9);
        for (var s = 0; s < len; s++) {
          if (Math.random() < 0.28) d = (d + (Math.random() < 0.5 ? 1 : 7)) % 8;
          var nx = x + DIRS[d][0], ny = y + DIRS[d][1];
          if (nx < 0 || ny < 0 || nx > cols || ny > rows || used[nx + ',' + ny]) break;
          x = nx; y = ny; used[x + ',' + y] = 1; pts.push([x * G, y * G]);
        }
        if (pts.length > 2) traces.push(pts);
      }
    };
    var near = function (p) { var dx = p[0] - mouse.x, dy = p[1] - mouse.y; return dx * dx + dy * dy < 22500; };
    var draw = function () {
      ctx.clearRect(0, 0, W, H); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      traces.forEach(function (tr) {
        var hot = near(tr[0]) || near(tr[tr.length - 1]) || near(tr[tr.length >> 1]);
        ctx.strokeStyle = hot ? 'rgba(228,203,142,.75)' : 'rgba(201,168,92,.22)'; ctx.lineWidth = hot ? 1.6 : 1.2;
        ctx.beginPath(); ctx.moveTo(tr[0][0], tr[0][1]);
        for (var i = 1; i < tr.length; i++) ctx.lineTo(tr[i][0], tr[i][1]);
        ctx.stroke();
        var e = tr[tr.length - 1];
        ctx.fillStyle = hot ? '#E4CB8E' : 'rgba(201,168,92,.45)'; ctx.beginPath(); ctx.arc(e[0], e[1], hot ? 3.2 : 2.4, 0, 7); ctx.fill();
        ctx.strokeStyle = hot ? 'rgba(228,203,142,.9)' : 'rgba(201,168,92,.35)'; ctx.beginPath(); ctx.arc(tr[0][0], tr[0][1], 3, 0, 7); ctx.stroke();
      });
      if (run && traces.length && pulses.length < Math.min(18, traces.length / 6) && Math.random() < 0.12) {
        pulses.push({ tr: traces[Math.floor(Math.random() * traces.length)], t: 0, v: 0.012 + Math.random() * 0.02 });
      }
      ctx.save(); ctx.shadowColor = '#E4CB8E'; ctx.shadowBlur = 12; ctx.fillStyle = '#F3DFAA';
      pulses = pulses.filter(function (p) {
        p.t += p.v; if (p.t >= 1) return false;
        var seg = (p.tr.length - 1) * p.t, i = Math.floor(seg), f = seg - i, a = p.tr[i], b = p.tr[i + 1];
        ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 2.6, 0, 7); ctx.fill();
        return true;
      });
      ctx.restore();
      if (run) raf = requestAnimationFrame(draw);
    };
    var start = function () { if (!run && !calm) { run = true; raf = requestAnimationFrame(draw); } };
    var stop = function () { run = false; cancelAnimationFrame(raf); };
    build(); draw();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }).observe(cv);
    else start();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); if (!run) draw(); }, 150); });
    var band = cv.parentElement;
    band.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; if (!run) draw(); });
    band.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; if (!run) draw(); });
  }

  /* ---------- terminal ---------- */
  var out = $('term-out'), input = $('term-cmd'), form = $('term-form');
  if (!out || !input || !form) return;

  var line = function (text, cls) { var p = document.createElement('p'); if (cls) p.className = cls; p.textContent = text; out.appendChild(p); out.scrollTop = out.scrollHeight; return p; };
  var prompt = function (cmd) { var p = document.createElement('p'), b = document.createElement('b'); p.className = 'pr'; b.textContent = '~ $ '; p.appendChild(b); p.appendChild(document.createTextNode(cmd)); out.appendChild(p); out.scrollTop = out.scrollHeight; };
  var go = function (id) { setTimeout(function () { var el = $(id); if (el) el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' }); }, 700); };
  var link = function (label, href) { var p = line(''), a = document.createElement('a'); a.href = href; a.textContent = label; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; } p.appendChild(a); };

  var CMDS = {
    ayuda: function () {
      line('Comandos disponibles:', 'gd');
      ['whoami       quién soy', 'proyectos    lo que he construido', 'stack        tecnologías que uso', 'experiencia  trayectoria y estudios', 'seguridad    mi enfoque', 'certificados cursos y diplomas', 'contacto     cómo escribirme', 'servicios    contratarme como freelance', 'limpiar      borrar la pantalla'].forEach(function (t) { line('  ' + t); });
    },
    whoami: function () { line('Johan Said Leon', 'gd'); line('Ingeniero de Sistemas, Bogotá, Colombia.'); line('Full stack, seguridad desde el diseño e IA aplicada.'); },
    proyectos: function () {
      ['pasapaginas     PDF a libro: web, escritorio y Android', 'flores-bot      Telegram + tienda web con tokens', 'invitacion-boda FastAPI + PostgreSQL, panel protegido', 'centinela       detección de incidentes con YOLOv8'].forEach(function (t) { line(t, 'ok'); });
      line('...y más abajo, en Proyectos.', 'dim'); go('proyectos');
    },
    stack: function () {
      line('frontend   HTML, CSS, JavaScript, TypeScript, Angular'); line('backend    Python, FastAPI, Node.js, Express, Java, C#');
      line('datos      PostgreSQL, SQL Server, MySQL, SQLite'); line('seguridad  Kali, Metasploit, Nmap, Wireshark, OWASP'); line('ia         YOLOv8, OpenCV, Ollama');
      go('habilidades');
    },
    experiencia: function () { line('2026  Practicante de Soporte Técnico, Adecco', 'ok'); line('2026  Diplomado en Seguridad de la Información', 'ok'); line('2022-2027  Ingeniería de Sistemas, UNIMINUTO', 'ok'); go('experiencia'); },
    seguridad: function () {
      line('Escaneando enfoque...', 'dim');
      ['credenciales fuera del código', 'contraseñas con hash', 'validación de entradas', 'límites de peticiones', 'buenas prácticas OWASP'].forEach(function (t, i) { setTimeout(function () { line('[ok] ' + t, 'ok'); }, 150 * (i + 1)); });
    },
    certificados: function () { line('7 cursos y diplomas: seguridad, programación web, .NET, Git, inglés B2...', 'ok'); go('certificados'); },
    contacto: function () { line('Correo:', 'gd'); link('hola@johansaidleon.dev', 'mailto:hola@johansaidleon.dev'); line('LinkedIn y GitHub en la sección de contacto.', 'dim'); go('contacto'); },
    servicios: function () { line('¿Necesitas una web, una app o un sistema a la medida?', 'gd'); line('Mira mis servicios y agenda una reunión gratis:'); link('johansaidleon.dev', 'https://johansaidleon.dev'); },
    limpiar: function () { while (out.firstChild) out.removeChild(out.firstChild); },
    sudo: function () { line('Permiso denegado. Aquí la seguridad va en serio.', 'gd'); }
  };
  var ALIAS = { contratar: 'servicios', hire: 'servicios', help: 'ayuda', clear: 'limpiar', cls: 'limpiar', ls: 'ayuda', projects: 'proyectos', contact: 'contacto' };

  var exec = function (raw) {
    var cmd = String(raw).trim().toLowerCase().slice(0, 60);
    if (!cmd) return;
    prompt(cmd);
    var key = cmd.split(/\s+/)[0], fn = CMDS[ALIAS[key] || key];
    if (fn) fn(); else line('comando no encontrado: ' + key + '. Escribe "ayuda".', 'dim');
  };
  form.addEventListener('submit', function (e) { e.preventDefault(); exec(input.value); input.value = ''; });
  Array.prototype.forEach.call(document.querySelectorAll('#term-chips [data-cmd]'), function (b) { b.addEventListener('click', function () { exec(b.getAttribute('data-cmd')); }); });
  setTimeout(function () { line('Escribe "ayuda" o toca un comando.', 'dim'); }, calm ? 0 : 900);
})();
