(function () {
  'use strict';
  try {
  var WA = 'https://wa.me/923009492478?text=';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- hero: settles in once, then holds ---------- */
  var hero = $('#hero');
  if (hero && !reduce) {
    var img = $('.stage img', hero);
    var go = function () { hero.classList.add('go'); };
    if (img && img.decode) { img.decode().then(go).catch(go); } else { go(); }
    setTimeout(go, 2500);            // slow data never waits on motion
    var done = function () { hero.classList.add('done'); };
    hero.addEventListener('animationend', done);
    setTimeout(done, 4000);          // a background tab never runs the animation
  } else if (hero) { hero.classList.add('go'); }

  /* ---------- tags: the buyer marks the shapes that look like theirs ---------- */
  var KEY = 'fpi.tags';
  var tags = [];
  try { tags = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { tags = []; }
  if (!Array.isArray(tags)) tags = [];
  tags = tags.filter(function (t, i, a) {
    return typeof t === 'string' && /^\d{2}$/.test(t) && a.indexOf(t) === i;
  });

  function message() {
    if (!tags.length) return '';
    var list = tags.slice().sort();
    var which = list.length === 1 ? 'shape ' + list[0]
      : 'shapes ' + list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
    return 'Assalam o alaikum. From your catalogue I am interested in ' + which +
      '. Please tell me the capacities and neck sizes you run these in.';
  }

  function paint() {
    try { sessionStorage.setItem(KEY, JSON.stringify(tags)); } catch (e) {}
    $$('.tagbtn').forEach(function (b) {
      b.setAttribute('aria-pressed', tags.indexOf(b.dataset.tag) > -1 ? 'true' : 'false');
    });
    var n = tags.length;
    /* the header button says the count in words, so the badge is for the bar only */
    $$('#wabar .tagn').forEach(function (s) { s.textContent = n ? ' · ' + n : ''; });
    $$('.hdr .btn-send .tagn').forEach(function (s) { s.textContent = ''; });
    $$('.hdr .btn-send').forEach(function (a) {
      a.firstChild.nodeValue = n ? 'Send ' + n + ' shape' + (n > 1 ? 's' : '') : 'WhatsApp';
    });
    var href = n ? WA + encodeURIComponent(message()) : 'https://wa.me/923009492478';
    $$('#wabar, .hdr .btn-send, .hero-acts .btn-send').forEach(function (a) { a.href = href; });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.tagbtn') : null;
    if (!b) return;
    var n = b.dataset.tag, i = tags.indexOf(n);
    if (i > -1) { tags.splice(i, 1); } else { tags.push(n); }
    paint();
  });
  paint();

  /* ---------- strip progress ---------- */
  var strip = $('#strip'), prog = $('#prog');
  if (strip && prog) {
    var onScroll = function () {
      var max = strip.scrollWidth - strip.clientWidth;
      var p = max > 0 ? strip.scrollLeft / max : 0;
      prog.style.width = Math.max(10, 10 + p * 90) + '%';
    };
    strip.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- tiles fade in as they arrive ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '80px' });
    $$('.shape').forEach(function (s) { io.observe(s); });
    /* an observer that never fires (hidden tab, odd engine) must not leave the
       grid blank, so everything is shown unconditionally shortly after load */
    setTimeout(function () { $$('.shape').forEach(function (s) { s.classList.add('in'); }); }, 3000);
  } else {
    $$('.shape').forEach(function (s) { s.classList.add('in'); });
  }

  /* ---------- quote form: live preview of the message ---------- */
  var form = $('#qf');
  if (form) {
    var v = function (id) { var e = document.getElementById(id); return e && e.value ? e.value.trim() : ''; };
    var compose = function () {
      var L = ['Quote request from your website.', ''];
      L.push('Bottle for: ' + v('use'));
      if (v('cap')) L.push('Capacity: ' + v('cap'));
      L.push('Material: ' + v('mat'));
      if (v('col')) L.push('Colour: ' + v('col'));
      if (v('neck')) L.push('Neck size: ' + v('neck'));
      if (v('qty')) L.push('Quantity per order: ' + v('qty'));
      if (v('city')) L.push('City: ' + v('city'));
      if (v('nm')) L.push('Name: ' + v('nm'));
      if (v('ph')) L.push('Phone: ' + v('ph'));
      if (tags.length) L.push('Shapes: ' + tags.slice().sort().join(', '));
      return L.join('\n');
    };
    var preview = $('#preview');
    var refresh = function () {
      if (preview) preview.textContent = compose();
      var m = $('#mailto');
      if (m) m.href = 'mailto:fineplasticindustry@yahoo.com?subject=' +
        encodeURIComponent('Quote request') + '&body=' + encodeURIComponent(compose());
    };
    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);
    refresh();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var url = WA + encodeURIComponent(compose());
      if (!window.open(url, '_blank', 'noopener')) location.href = url;
    });
  }

  /* ---------- catalogue: counts, shown-of, and the detail dialog ---------- */
  var cat = $('#cat');
  if (cat) {
    var prods = $$('.prod', cat);
    var shown = $('#shown');

    var count = function () {
      var col = $('input[name="colour"]:checked'), form = $('input[name="form"]:checked');
      var cv = col ? col.value : 'all', fv = form ? form.value : 'all';
      prods.forEach(function (p) {
        p.hidden = !((cv === 'all' || p.dataset.colour === cv) &&
                     (fv === 'all' || p.dataset.form === fv));
      });
      var n = prods.filter(function (p) { return !p.hidden; }).length;
      if (shown) shown.textContent = n === 0
        ? 'No shape matches both filters. Set one row back to All.'
        : (n === prods.length ? 'Showing all ' + n + ' shapes'
                              : 'Showing ' + n + ' of ' + prods.length + ' shapes');
    };
    $$('.chip input').forEach(function (i) { i.addEventListener('change', count); });
    count();

    $$('.fcount').forEach(function (s) {
      var k = s.dataset.k, val = s.dataset.v;
      var n = val === 'all' ? prods.length
        : prods.filter(function (p) { return p.dataset[k] === val; }).length;
      s.textContent = ' ' + n;
    });

    var dlg = $('#detail');
    var visible = function () {
      return prods.filter(function (p) { return p.offsetParent !== null; });
    };
    if (dlg && dlg.showModal) {
      var cur = 0;
      var fill = function (i) {
        var list = visible();
        if (!list.length) return;
        cur = (i + list.length) % list.length;
        var p = list[cur], im = $('img', p), n = p.dataset.n;
        $('#d-img', dlg).src = im.currentSrc || im.src;
        $('#d-img', dlg).alt = im.alt;
        $('#d-num', dlg).textContent = n;
        $('#d-colour', dlg).textContent = 'Shown in ' + p.dataset.colour;
        $('#d-ask', dlg).href = WA + encodeURIComponent(
          'Assalam o alaikum. I am looking at Shape ' + n +
          ' on your catalogue. Please tell me the capacities and neck sizes you run it in.');
        var t = $('#d-tag', dlg);
        t.dataset.tag = n;
        t.setAttribute('aria-pressed', tags.indexOf(n) > -1 ? 'true' : 'false');
      };
      cat.addEventListener('click', function (e) {
        var a = e.target.closest('.ph');
        if (!a) return;
        e.preventDefault();
        fill(visible().indexOf(a.closest('.prod')));
        dlg.showModal();
      });
      $('#d-prev', dlg).addEventListener('click', function () { fill(cur - 1); });
      $('#d-next', dlg).addEventListener('click', function () { fill(cur + 1); });
      $('#d-close', dlg).addEventListener('click', function () { dlg.close(); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') fill(cur - 1);
        if (e.key === 'ArrowRight') fill(cur + 1);
      });
    }
  }
  } catch (err) {
    /* anything unexpected: fall back to the no-JS end state rather than a blank grid */
    document.documentElement.classList.remove('js');
    if (window.console) console.error('fpi:', err);
  }
})();
