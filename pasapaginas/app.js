(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var wrap = $('#bookwrap'), counter = $('#counter'), jump = $('#jump');
  var prevBtn = $('#prev'), nextBtn = $('#next'), meta = $('#meta'), msg = $('#msg');
  var closeBtn = $('#close-book'), installBtn = $('#install');
  var flip = null, urls = [], total = 0, loadToken = 0, current = null, lastFile = null;
  var hdBtn = $('#hd');
  var hd = false;
  var MAX_SAVED_BYTES = 80 * 1024 * 1024;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
  } catch (e) {}

  /* ---------- utilidades de interfaz ---------- */
  function say(text, isError) {
    msg.textContent = text || '';
    msg.className = isError ? 'error' : '';
  }
  function busy(text, pct) {
    var box = $('#busy');
    if (text === null) { box.hidden = true; return; }
    box.hidden = false;
    $('#busy-text').textContent = text;
    $('#busy-bar').style.width = Math.round((pct || 0) * 100) + '%';
  }
  function frame() { return new Promise(function (r) { requestAnimationFrame(function () { setTimeout(r, 0); }); }); }
  function toBlob(canvas, type, q) { return new Promise(function (res) { canvas.toBlob(res, type, q); }); }

  function setMeta(name, pages, isSample) {
    meta.textContent = '';
    if (isSample) {
      var t = document.createElement('span');
      t.className = 'tag'; t.textContent = 'Ejemplo';
      meta.appendChild(t);
      meta.appendChild(document.createTextNode(pages + ' páginas'));
    } else {
      meta.textContent = name + ' · ' + pages + (pages === 1 ? ' página' : ' páginas');
    }
    closeBtn.hidden = !!isSample;
  }

  function isLandscape() { return flip && flip.getOrientation() === 'landscape'; }

  function updateUI(idx) {
    if (!flip) return;
    var land = isLandscape();
    var label;
    if (land && idx > 0 && idx < total - 1) {
      label = 'Págs. ' + (idx + 1) + '–' + Math.min(idx + 2, total) + ' de ' + total;
    } else {
      label = 'Pág. ' + (idx + 1) + ' de ' + total;
    }
    counter.textContent = label;
    jump.max = String(total);
    jump.value = String(idx + 1);
    prevBtn.disabled = idx <= 0;
    var atEnd = land ? (idx > 0 ? idx + 1 >= total - 1 : total <= 1) : idx >= total - 1;
    nextBtn.disabled = atEnd;
  }

  /* ---------- libro ---------- */
  /* page-flip estira el libro a su contenedor y pinta de blanco todo el lienzo.
     Para que no queden franjas, el contenedor (#bookbox) se dimensiona a la
     proporción real de las páginas y el libro se vuelve a armar cuando cambia
     el tamaño o la orientación. Con dos páginas el libro mide el doble de ancho. */
  var MIN_PAGE_W = 280;   // ancho mínimo por página para mostrar dos a la vez
  var bookRatio = 0.7;
  var lastLayout = '';

  function layout() {
    var W = wrap.clientWidth, H = wrap.clientHeight;
    if (!W || !H) return null;
    var pw2 = Math.floor(Math.min(W / 2, H * bookRatio));
    if (pw2 >= MIN_PAGE_W) {
      return { two: true, pw: pw2, bw: pw2 * 2, bh: Math.round(pw2 / bookRatio) };
    }
    var pw1 = Math.max(60, Math.floor(Math.min(W, H * bookRatio)));
    return { two: false, pw: pw1, bw: pw1, bh: Math.round(pw1 / bookRatio) };
  }

  function build(startPage) {
    var box = $('#bookbox');
    var L = layout();
    if (!box || !L || !urls.length) return;
    if (flip) { try { flip.destroy(); } catch (e) {} flip = null; }
    box.innerHTML = '';
    box.style.width = L.bw + 'px';
    box.style.height = L.bh + 'px';
    var el = document.createElement('div');
    el.id = 'book';
    el.style.width = '100%';
    el.style.height = '100%';
    box.appendChild(el);
    lastLayout = L.two + ':' + L.bw + 'x' + L.bh;
    // minWidth = ancho de página: así page-flip elige 1 o 2 páginas según lo calculado
    // arriba (decide por ancho del libro < 2 × minWidth) y no ensancha el libro.
    flip = new St.PageFlip(el, {
      width: 500, height: Math.round(500 / bookRatio), size: 'stretch',
      minWidth: L.pw, maxWidth: L.pw * 2, minHeight: 1, maxHeight: 8000,
      showCover: true, usePortrait: true, drawShadow: true, maxShadowOpacity: 0.45,
      mobileScrollSupport: false, flippingTime: reduce ? 150 : 800
    });
    flip.loadFromImages(urls);
    flip.on('flip', function (e) { updateUI(e.data); rememberPage(e.data); });
    if (startPage > 0 && startPage < total) { try { flip.turnToPage(startPage); } catch (e) {} }
    updateUI(flip.getCurrentPageIndex());
  }

  var resizeTimer = null;
  function refit() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!flip) return;
      var L = layout();
      if (!L) return;
      if (lastLayout === L.two + ':' + L.bw + 'x' + L.bh) return;
      build(flip.getCurrentPageIndex());
    }, 120);
  }
  window.addEventListener('resize', refit);

  function mount(imageUrls, ratio, startPage) {
    if (flip) { try { flip.destroy(); } catch (e) {} flip = null; }
    wrap.innerHTML = '';
    var box = document.createElement('div');
    box.id = 'bookbox';
    wrap.appendChild(box);
    var old = urls;
    urls = imageUrls;
    total = imageUrls.length;
    bookRatio = ratio;
    build(startPage);
    old.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} });
  }

  /* ---------- libro de ejemplo (se dibuja con canvas) ---------- */
  function wrapText(ctx, text, x, y, maxW, lh) {
    var words = text.split(' '), line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = words[i]; y += lh; }
      else line = test;
    }
    if (line) { ctx.fillText(line, x, y); y += lh; }
    return y;
  }

  async function sampleBook() {
    var token = ++loadToken;
    try {
      await Promise.all([
        document.fonts.load('600 40px "Cormorant Garamond"'),
        document.fonts.load('italic 600 24px "Cormorant Garamond"'),
        document.fonts.load('400 20px "Instrument Sans"'),
        document.fonts.load('600 14px "Instrument Sans"')
      ]);
    } catch (e) {}
    var W = 640, H = 860;
    // Se dibuja al doble de resolución para que se vea nítido en pantallas de alta densidad.
    var SC = 2;
    var head = '"Cormorant Garamond", Georgia, serif';
    var body = '"Instrument Sans", system-ui, sans-serif';
    var pages = [
      { cover: true, title: 'Pasapáginas', sub: 'Libro de ejemplo' },
      { title: 'Cómo se usa', items: ['Pulsa Abrir PDF o arrastra un archivo a esta ventana.', 'Espera a que se preparen las páginas.', 'Pasa las páginas con el dedo, el mouse o las flechas del teclado.'], seq: true },
      { title: 'Pasar páginas', items: ['Haz clic en una esquina o arrastra el borde de la hoja.', 'Con el teclado, usa las flechas izquierda y derecha. Inicio y Fin saltan a la primera y última página.', 'La barra de abajo te lleva directo a cualquier página.'] },
      { title: 'En el celular', items: ['Se muestra una página a la vez.', 'Desliza el dedo desde el borde para voltearla.', 'Gira el teléfono para ver dos páginas juntas.'] },
      { title: 'Nitidez', items: ['El libro se prepara a la resolución de tu pantalla, así que el texto se ve nítido.', 'Si aun así lo ves pequeño, pulsa HD para preparar las páginas con más detalle.', 'Los PDF muy largos usan menos resolución para no llenar la memoria del teléfono.'] },
      { title: 'Privacidad y sin internet', items: ['El PDF se lee y se convierte dentro de tu dispositivo. No se envía a ningún servidor.', 'La app recuerda el último libro y la página donde lo dejaste.', 'Una vez instalada, abre sin conexión.'] },
      { title: 'Límites', items: ['Los PDF muy largos tardan más en prepararse.', 'Los PDF con contraseña no se pueden abrir.', 'Las páginas se guardan como imagen, no se puede seleccionar texto.'] },
      { cover: true, back: true, title: 'Abre tu PDF', sub: 'Botón Abrir PDF, arriba a la derecha' }
    ];
    var out = [];
    for (var i = 0; i < pages.length; i++) {
      var p = pages[i];
      var c = document.createElement('canvas');
      c.width = W * SC; c.height = H * SC;
      var ctx = c.getContext('2d');
      ctx.scale(SC, SC);
      ctx.textBaseline = 'alphabetic';
      if (p.cover) {
        ctx.fillStyle = '#0B0B0D'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#C9A55C'; ctx.lineWidth = 1.5; ctx.strokeRect(36, 36, W - 72, H - 72);
        ctx.strokeStyle = 'rgba(201,165,92,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(46, 46, W - 92, H - 92);
        ctx.fillStyle = '#F4EFE6'; ctx.font = '600 84px ' + head;
        ctx.fillText(p.title, 72, 372);
        ctx.fillStyle = '#C9A55C'; ctx.fillRect(74, 400, 64, 2);
        ctx.fillStyle = '#D9B96C'; ctx.font = 'italic 600 30px ' + head;
        ctx.fillText(p.sub, 74, 448);
        if (!p.back) {
          ctx.fillStyle = '#B9B2A5'; ctx.font = '500 14px ' + body;
          ctx.fillText('PÁGINA 1 DE ' + pages.length, 74, H - 76);
        }
      } else {
        ctx.fillStyle = '#FBF8F1'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#1A1610'; ctx.font = '600 52px ' + head;
        ctx.fillText(p.title, 64, 140);
        ctx.fillStyle = '#B8923F'; ctx.fillRect(64, 164, 56, 3);
        ctx.fillStyle = '#3A342A'; ctx.font = '400 22px ' + body;
        var y = 232;
        for (var k = 0; k < p.items.length; k++) {
          var x = 64;
          if (p.seq) {
            ctx.fillStyle = '#B8923F'; ctx.font = '600 30px ' + head;
            ctx.fillText(String(k + 1), 64, y + 2);
            ctx.fillStyle = '#3A342A'; ctx.font = '400 22px ' + body;
            x = 104;
          }
          y = wrapText(ctx, p.items[k], x, y, W - x - 64, 33) + 20;
        }
        ctx.fillStyle = '#8A7440'; ctx.font = '500 14px ' + body;
        ctx.textAlign = i % 2 === 0 ? 'left' : 'right';
        ctx.fillText(String(i + 1), i % 2 === 0 ? 64 : W - 64, H - 48);
        ctx.textAlign = 'left';
      }
      var b = await toBlob(c, 'image/jpeg', 0.94);
      out.push(URL.createObjectURL(b));
    }
    if (token !== loadToken) { out.forEach(function (u) { URL.revokeObjectURL(u); }); return; }
    current = null; lastFile = null;
    updateHd();
    mount(out, W / H, 0);
    setMeta('', out.length, true);
  }

  /* ---------- memoria del último libro (IndexedDB + localStorage) ---------- */
  function idb() {
    return new Promise(function (resolve, reject) {
      try {
        var req = indexedDB.open('pasapaginas', 1);
        req.onupgradeneeded = function () { req.result.createObjectStore('books'); };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      } catch (e) { reject(e); }
    });
  }
  async function idbPut(key, value) {
    var db = await idb();
    return new Promise(function (res, rej) {
      var tx = db.transaction('books', 'readwrite');
      tx.objectStore('books').put(value, key);
      tx.oncomplete = function () { db.close(); res(); };
      tx.onerror = function () { db.close(); rej(tx.error); };
    });
  }
  async function idbGet(key) {
    var db = await idb();
    return new Promise(function (res, rej) {
      var r = db.transaction('books').objectStore('books').get(key);
      r.onsuccess = function () { db.close(); res(r.result); };
      r.onerror = function () { db.close(); rej(r.error); };
    });
  }
  async function idbDelete(key) {
    var db = await idb();
    return new Promise(function (res, rej) {
      var tx = db.transaction('books', 'readwrite');
      tx.objectStore('books').delete(key);
      tx.oncomplete = function () { db.close(); res(); };
      tx.onerror = function () { db.close(); rej(tx.error); };
    });
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  var pageTimer = null;
  function rememberPage(idx) {
    if (!current) return;
    clearTimeout(pageTimer);
    pageTimer = setTimeout(function () { lsSet('pp:page', String(idx)); }, 250);
  }

  async function saveLast(file) {
    try {
      if (file.size > MAX_SAVED_BYTES) { lsDel('pp:name'); await idbDelete('last'); return; }
      await idbPut('last', file);
      lsSet('pp:name', file.name);
      lsSet('pp:page', '0');
    } catch (e) { /* sin espacio o modo privado: la app sigue funcionando */ }
  }

  async function restoreLast() {
    try {
      var blob = await idbGet('last');
      if (!blob) return false;
      var name = lsGet('pp:name') || 'libro.pdf';
      var page = parseInt(lsGet('pp:page') || '0', 10) || 0;
      var file = new File([blob], name, { type: 'application/pdf' });
      await loadPdf(file, { startPage: page, skipSave: true });
      return !!current;
    } catch (e) { return false; }
  }

  /* ---------- PDF real ---------- */
  async function looksLikePdf(file) {
    try {
      var head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
      var s = '';
      for (var i = 0; i < head.length; i++) s += String.fromCharCode(head[i]);
      return s.indexOf('%PDF') !== -1;
    } catch (e) { return false; }
  }

  /* ---------- resolución de las páginas ----------
     Antes todas las páginas se generaban a 860 px de ancho, sin importar el
     dispositivo: en un celular de densidad 3× (360 px CSS = 1080 px físicos) el
     texto salía borroso. Ahora el ancho se calcula con lo que realmente se verá:
       ancho CSS máximo de una página (en cualquier orientación o pantalla completa)
       × densidad de píxeles del dispositivo × sobremuestreo.
     Para no agotar la memoria, el tope baja con la cantidad de páginas. */
  function pageWidthFor(w, h, ratio) {
    var two = Math.min(w / 2, h * ratio);
    return two >= MIN_PAGE_W ? two : Math.min(w, h * ratio);
  }
  function targetPixels(ratio, n, wantHd) {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var W = wrap.clientWidth || window.innerWidth, H = wrap.clientHeight || window.innerHeight;
    var sw = (window.screen && screen.width) || W, sh = ((window.screen && screen.height) || H) - 130;
    var css = Math.max(
      pageWidthFor(W, H, ratio), pageWidthFor(H, W, ratio),
      pageWidthFor(sw, sh, ratio), pageWidthFor(sh, sw, ratio)
    );
    var px = css * dpr * (wantHd ? 2.2 : 1.5);
    // tope por cantidad de páginas (ancho en píxeles) y por área de cada imagen
    var cap = n <= 40 ? 2000 : n <= 150 ? 1500 : 1100;
    if (wantHd) cap = Math.round(cap * 1.3);
    var maxArea = wantHd ? 6.5e6 : 4.2e6;
    var W2 = Math.max(900, Math.min(px, cap));
    var H2 = W2 / ratio;
    if (W2 * H2 > maxArea) { W2 = Math.sqrt(maxArea * ratio); H2 = W2 / ratio; }
    return { W: Math.round(W2), H: Math.round(H2) };
  }

  function updateHd() {
    if (!hdBtn) return;
    hdBtn.setAttribute('aria-pressed', String(hd));
    hdBtn.disabled = !lastFile;
  }

  async function loadPdf(file, opts) {
    opts = opts || {};
    if (!file) return;
    if (!(await looksLikePdf(file))) {
      say('Ese archivo no es un PDF. Elige un archivo que termine en .pdf.', true);
      return;
    }
    var token = ++loadToken;
    say('');
    busy('Leyendo el archivo…', 0);
    await frame();
    var made = [];
    var pdf = null;
    try {
      var data = new Uint8Array(await file.arrayBuffer());
      pdf = await pdfjsLib.getDocument({
        data: data,
        cMapUrl: 'vendor/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'vendor/standard_fonts/'
      }).promise;
      var n = pdf.numPages;
      var first = await pdf.getPage(1);
      var v1 = first.getViewport({ scale: 1 });
      var ratio = v1.width / v1.height;
      var T = targetPixels(ratio, n, hd);
      var W = T.W, H = T.H;
      // un solo lienzo reutilizado para todas las páginas
      var canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      var ctx = canvas.getContext('2d');
      var quality = hd ? 0.95 : 0.9;
      for (var i = 1; i <= n; i++) {
        if (token !== loadToken) throw new Error('cancelado');
        busy('Preparando páginas ' + i + ' de ' + n, (i - 1) / n);
        await frame();
        var page = i === 1 ? first : await pdf.getPage(i);
        var vb = page.getViewport({ scale: 1 });
        var sc = Math.min(W / vb.width, H / vb.height);
        var vp = page.getViewport({ scale: sc });
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
        var dx = (W - vp.width) / 2, dy = (H - vp.height) / 2;
        await page.render({ canvasContext: ctx, viewport: vp, transform: [1, 0, 0, 1, dx, dy], intent: 'display' }).promise;
        var blob = await toBlob(canvas, 'image/jpeg', quality);
        made.push(URL.createObjectURL(blob));
        page.cleanup();
      }
      busy('Armando el libro…', 1);
      await frame();
      current = { name: file.name, size: file.size };
      lastFile = file;
      updateHd();
      mount(made, W / H, opts.startPage || 0);
      setMeta(file.name, n, false);
      if (!opts.skipSave) saveLast(file);
    } catch (err) {
      made.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} });
      if (err && err.message === 'cancelado') return;
      var name = err && err.name;
      if (name === 'PasswordException') say('Este PDF tiene contraseña. Quítala y vuelve a intentarlo.', true);
      else if (name === 'InvalidPDFException') say('No se pudo leer el archivo. Puede estar dañado o no ser un PDF válido.', true);
      else if (err && /memory|allocation|canvas/i.test(String(err.message))) say('Se acabó la memoria del dispositivo. Desactiva HD o prueba con un PDF más corto.', true);
      else say('No se pudo abrir el PDF. Prueba con otro archivo.', true);
    } finally {
      if (pdf) { try { pdf.destroy(); } catch (e) {} }
      if (token === loadToken) busy(null);
    }
  }

  /* ---------- controles ---------- */
  $('#open').addEventListener('click', function () { $('#pdf-input').click(); });
  $('#pdf-input').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    e.target.value = '';
    loadPdf(f);
  });
  prevBtn.addEventListener('click', function () { if (flip) flip.flipPrev('top'); });
  nextBtn.addEventListener('click', function () { if (flip) flip.flipNext('top'); });
  jump.addEventListener('input', function () {
    if (!flip) return;
    flip.turnToPage(parseInt(jump.value, 10) - 1);
    var idx = flip.getCurrentPageIndex();
    updateUI(idx); rememberPage(idx);
  });
  closeBtn.addEventListener('click', async function () {
    try { await idbDelete('last'); } catch (e) {}
    lsDel('pp:name'); lsDel('pp:page');
    say('');
    sampleBook();
  });
  document.addEventListener('keydown', function (e) {
    if (!flip) return;
    var t = e.target;
    if (t && t.tagName === 'INPUT' && t.type === 'range') return;
    if (e.key === 'ArrowRight') flip.flipNext('top');
    else if (e.key === 'ArrowLeft') flip.flipPrev('top');
    else if (e.key === 'Home') { flip.turnToPage(0); updateUI(0); rememberPage(0); }
    else if (e.key === 'End') { flip.turnToPage(total - 1); var i = flip.getCurrentPageIndex(); updateUI(i); rememberPage(i); }
  });

  var fullBtn = $('#full');
  if (!document.fullscreenEnabled) fullBtn.hidden = true;
  fullBtn.addEventListener('click', function () {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(function () {});
    } catch (e) {}
  });
  document.addEventListener('fullscreenchange', function () {
    setTimeout(refit, 150);
  });

  /* ---------- nitidez HD ---------- */
  hd = lsGet('pp:hd') === '1';
  if (hdBtn) {
    updateHd();
    hdBtn.addEventListener('click', function () {
      hd = !hd;
      lsSet('pp:hd', hd ? '1' : '0');
      updateHd();
      if (lastFile) {
        var idx = flip ? flip.getCurrentPageIndex() : 0;
        loadPdf(lastFile, { startPage: idx, skipSave: true });
      }
    });
  }

  /* ---------- tema claro / oscuro (se comparte con el portafolio) ---------- */
  var themeBtn = $('#theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var root = document.documentElement;
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      var tc = $('#theme-color');
      if (tc) tc.setAttribute('content', next === 'light' ? '#F8F4EC' : '#0B0B0D');
    });
  }

  /* ---------- arrastrar y soltar ---------- */
  var drop = $('#drop'), depth = 0;
  function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') !== -1; }
  window.addEventListener('dragenter', function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth++; drop.hidden = false; });
  window.addEventListener('dragover', function (e) { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('dragleave', function (e) { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) drop.hidden = true; });
  window.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0; drop.hidden = true;
    loadPdf(e.dataTransfer.files && e.dataTransfer.files[0]);
  });

  /* ---------- instalación como app (PWA) ---------- */
  var deferredInstall = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstall = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async function () {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    try { await deferredInstall.userChoice; } catch (e) {}
    deferredInstall = null;
    installBtn.hidden = true;
  });
  window.addEventListener('appinstalled', function () { installBtn.hidden = true; });

  // iPhone y iPad no avisan que se puede instalar: se muestra el botón con los pasos.
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIos && !standalone) {
    installBtn.hidden = false;
    installBtn.addEventListener('click', function () {
      if (deferredInstall) return;
      say('Para instalarla en iPhone o iPad: toca el botón Compartir de Safari y elige «Añadir a pantalla de inicio».');
    });
  }

  /* PDF abiertos desde el sistema: "Abrir con" en escritorio (PWA) */
  var launched = false;
  if ('launchQueue' in window) {
    window.launchQueue.setConsumer(async function (params) {
      if (!params.files || !params.files.length) return;
      launched = true;
      try {
        var f = await params.files[0].getFile();
        loadPdf(f);
      } catch (e) { say('No se pudo abrir el archivo desde el sistema.', true); }
    });
  }

  /* PDF abiertos desde la app de escritorio (Electron) */
  if (window.nativeBridge && window.nativeBridge.onOpenFile) {
    window.nativeBridge.onOpenFile(function (info) {
      launched = true;
      var file = new File([info.bytes], info.name, { type: 'application/pdf' });
      loadPdf(file);
    });
    if (window.nativeBridge.ready) window.nativeBridge.ready();
  }

  /* ---------- service worker (modo sin internet) ---------- */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  /* ---------- arranque ---------- */
  (async function start() {
    // Deja un instante por si el sistema entrega un PDF al abrir la app.
    await new Promise(function (r) { setTimeout(r, 250); });
    if (launched) return;
    var restored = await restoreLast();
    if (!restored && !launched) sampleBook();
  })();
})();
