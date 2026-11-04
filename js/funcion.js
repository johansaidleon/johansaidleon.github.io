// Interacciones del portafolio: tema claro/oscuro, menú móvil, filtros de proyectos,
// resaltado de la sección activa, visor de certificados y copiar el correo.

(function () {
  'use strict';

  // ---------- tema claro / oscuro ----------
  var root = document.documentElement;
  var themeBtn = document.getElementById('theme-toggle');

  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set === 'light' || set === 'dark') return set;
    return 'dark'; // el tema por defecto es el oscuro; el claro solo si la persona lo elige
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* sin almacenamiento: el cambio dura solo esta visita */ }
    });
  }

  // ---------- menú en móvil ----------
  var navToggle = document.getElementById('nav-toggle');
  var menu = document.getElementById('menu');

  function setMenu(open) {
    if (!navToggle || !menu) return;
    menu.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    var icon = navToggle.querySelector('i');
    if (icon) icon.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  }

  if (navToggle && menu) {
    navToggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  // ---------- filtros de proyectos ----------
  var filterBtns = document.querySelectorAll('.filter');
  var projectCards = document.querySelectorAll('#project-grid .project');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      var f = btn.dataset.filter;
      projectCards.forEach(function (card) {
        var cats = (card.dataset.cat || '').split(' ');
        card.classList.toggle('hide', f !== 'all' && cats.indexOf(f) === -1);
      });
    });
  });

  // ---------- sección activa en el menú ----------
  var navLinks = document.querySelectorAll('.menu a:not(.menu-cta)');
  var sections = Array.prototype.map.call(navLinks, function (a) {
    return document.querySelector(a.getAttribute('href'));
  }).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { so.observe(s); });

    // En el inicio (hero) ninguna sección del menú debe verse activa.
    var top = document.getElementById('top');
    if (top) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) navLinks.forEach(function (a) { a.classList.remove('active'); });
      }, { rootMargin: '-40% 0px -55% 0px' }).observe(top);
    }
  }

  // ---------- visor de certificados ----------
  var lb = document.getElementById('lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = document.getElementById('lb-img');
    var lbCap = document.getElementById('lb-cap');
    var lbClose = document.getElementById('lb-close');

    document.querySelectorAll('.cert').forEach(function (c) {
      c.addEventListener('click', function () {
        lbImg.src = c.dataset.img;
        lbImg.alt = c.dataset.title;
        lbCap.textContent = c.dataset.title;
        lb.showModal();
        document.body.style.overflow = 'hidden';
      });
    });
    lb.addEventListener('close', function () { document.body.style.overflow = ''; });
    lbClose.addEventListener('click', function () { lb.close(); });
    // clic fuera de la imagen cierra el visor
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }

  // ---------- copiar el correo ----------
  var copyBtn = document.getElementById('copy-mail');
  var copyLabel = document.getElementById('copy-label');
  var mailText = document.getElementById('mail-text');

  function flash(text) {
    if (!copyLabel) return;
    copyLabel.textContent = text;
    setTimeout(function () { copyLabel.textContent = 'Copiar'; }, 1800);
  }

  function selectMail() {
    if (!mailText || !window.getSelection) return;
    var range = document.createRange();
    range.selectNodeContents(mailText);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  if (copyBtn && mailText) {
    copyBtn.addEventListener('click', function () {
      var value = mailText.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(
          function () { flash('Copiado'); },
          function () { selectMail(); flash('Selecciónalo'); }
        );
      } else {
        selectMail();
        flash('Selecciónalo');
      }
    });
  }
})();
