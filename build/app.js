(function () {
  'use strict';
  try {
  var WA_BASE = 'https://wa.me/923009492478';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    return 'Assalam o alaikum. From your website I am interested in ' + which +
      '. Please tell me the capacities and neck sizes you run these in.';
  }

  function shapeData() {
    var el = document.getElementById('shapeData');
    if (!el) return {};
    try { return JSON.parse(el.textContent) || {}; } catch (e) { return {}; }
  }

  function paint() {
    try { sessionStorage.setItem(KEY, JSON.stringify(tags)); } catch (e) {}
    var n = tags.length;

    $$('.tagbtn').forEach(function (b) {
      var on = tags.indexOf(b.dataset.tag) > -1;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var lab = b.querySelector('.tag-label');
      if (lab) lab.textContent = on ? 'Tagged' : 'Tag';
    });

    var href = n ? WA_BASE + '?text=' + encodeURIComponent(message()) : WA_BASE;

    var hdrWa = $('#hdrWa');
    if (hdrWa) {
      hdrWa.href = href;
      hdrWa.innerHTML = n
        ? 'Send ' + n + ' shape' + (n > 1 ? 's' : '')
        : 'WhatsApp<span class="n"> +92 300 9492478</span>';
    }
    $$('.bar .wa').forEach(function (a) {
      a.href = href;
      var badge = a.querySelector('.badge');
      if (badge) badge.textContent = n ? ' · ' + n : '';
    });

    /* quote page: small thumbnails of every tagged shape, each removable */
    var list = $('#taggedList');
    if (list) {
      var data = shapeData();
      list.innerHTML = '';
      tags.slice().sort().forEach(function (id) {
        var row = data[id];
        if (!row) return;
        var chip = document.createElement('span');
        chip.className = 'tchip';
        chip.innerHTML = '<span class="num" style="font-size:16px">' + id + '</span>';
        var rm = document.createElement('button');
        rm.type = 'button';
        rm.setAttribute('aria-label', 'Remove shape ' + id);
        rm.textContent = '×';
        rm.addEventListener('click', function () {
          var i = tags.indexOf(id);
          if (i > -1) { tags.splice(i, 1); paint(); refreshForm(); }
        });
        chip.appendChild(rm);
        list.appendChild(chip);
      });
      var wrap = $('#taggedWrap');
      if (wrap) wrap.hidden = tags.length === 0;
    }

    if (typeof refreshForm === 'function') refreshForm();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.tagbtn') : null;
    if (!b) return;
    var n = b.dataset.tag, i = tags.indexOf(n);
    if (i > -1) { tags.splice(i, 1); } else { tags.push(n); }
    paint();
  });

  /* ---------- mobile menu: enhance the native <details>, not required for it to work ---------- */
  var menu = $('.menu');
  if (menu) {
    document.addEventListener('click', function (e) {
      if (menu.open && !menu.contains(e.target)) menu.removeAttribute('open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.open) {
        menu.removeAttribute('open');
        $('summary', menu).focus();
      }
    });
  }

  /* ---------- quote form: live preview of the message ---------- */
  var form = $('#qf');
  var refreshForm = null;
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
    refreshForm = function () {
      if (preview) preview.textContent = compose();
      var m = $('#mailto');
      if (m) m.href = 'mailto:fineplasticindustry@yahoo.com?subject=' +
        encodeURIComponent('Quote request') + '&body=' + encodeURIComponent(compose());
    };
    form.addEventListener('input', refreshForm);
    form.addEventListener('change', refreshForm);
    refreshForm();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var url = WA_BASE + '?text=' + encodeURIComponent(compose());
      if (!window.open(url, '_blank', 'noopener')) location.href = url;
    });
  }

  paint();

  /* ---------- catalogue: counts, shown-of, and the detail dialog ---------- */
  var cat = $('#cat');
  if (cat) {
    var prods = $$('.prod', cat);
    var shown = $('#shown');

    var checkedValue = function (name) {
      var el = $('input[name="' + name + '"]:checked');
      return el ? el.value : 'all';
    };

    var count = function () {
      var uv = checkedValue('use'), cv = checkedValue('colour'), fv = checkedValue('form');
      prods.forEach(function (p) {
        var uses = (p.dataset.use || '').split(' ');
        var okU = uv === 'all' || uses.indexOf(uv) > -1;
        var okC = cv === 'all' || p.dataset.colour === cv;
        var okF = fv === 'all' || p.dataset.form === fv;
        p.hidden = !(okU && okC && okF);
      });
      var n = prods.filter(function (p) { return !p.hidden; }).length;
      if (shown) shown.textContent = n === 0
        ? 'No shape matches these filters. Set one row back to All.'
        : (n === prods.length ? 'Showing all ' + n + ' shapes'
                              : 'Showing ' + n + ' of ' + prods.length + ' shapes');
    };
    $$('input[name="use"], input[name="colour"], input[name="form"]').forEach(function (i) {
      i.addEventListener('change', count);
    });
    count();

    $$('.fcount').forEach(function (s) {
      var k = s.dataset.k, val = s.dataset.v;
      var n;
      if (val === 'all') { n = prods.length; }
      else if (k === 'use') { n = prods.filter(function (p) { return (p.dataset.use || '').split(' ').indexOf(val) > -1; }).length; }
      else { n = prods.filter(function (p) { return p.dataset[k] === val; }).length; }
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
        $('#d-colour', dlg).textContent = 'Photographed in ' + p.dataset.colour;
        $('#d-ask', dlg).href = WA_BASE + '?text=' + encodeURIComponent(
          'Assalam o alaikum. I am looking at Shape ' + n +
          ' on your catalogue. Please tell me the capacities and neck sizes you run it in.');
        var t = $('#d-tag', dlg);
        t.dataset.tag = n;
        var on = tags.indexOf(n) > -1;
        t.setAttribute('aria-pressed', on ? 'true' : 'false');
        var lab = t.querySelector('.tag-label');
        if (lab) lab.textContent = on ? 'Tagged' : 'Tag this shape';
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
    /* anything unexpected: fall back to the no-JS end state rather than a broken page */
    document.documentElement.classList.remove('js');
    if (window.console) console.error('fpi:', err);
  }
})();
