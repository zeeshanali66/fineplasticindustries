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

  /* ---------- send the tagged shapes as pictures, not just numbers ----------
     A wa.me link can only carry text, so the numbers alone reach the factory.
     Where the browser supports sharing files (Android Chrome, iOS Safari), we
     hand WhatsApp the actual shape photos instead. The files are built as the
     tags change, not on click, because Safari will refuse a share() that comes
     too long after the tap. Anything unsupported or broken falls through to
     the text link, which is what shipped before. */
  var shareFiles = null;
  var shareFilesKey = '';

  function canShareFiles() {
    return !!(window.File && navigator.share && navigator.canShare);
  }

  function toJpeg(blob, name) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext('2d').drawImage(img, 0, 0);
          c.toBlob(function (out) {
            URL.revokeObjectURL(url);
            resolve(out ? new File([out], name, { type: 'image/jpeg' }) : null);
          }, 'image/jpeg', 0.85);
        } catch (e) { URL.revokeObjectURL(url); resolve(null); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  function buildShareFiles() {
    if (!canShareFiles() || !tags.length) { shareFiles = null; shareFilesKey = ''; return; }
    var key = tags.slice().sort().join(',');
    if (key === shareFilesKey) return;
    var data = shapeData();
    var ids = tags.slice().sort().filter(function (id) { return data[id]; });
    if (!ids.length) { shareFiles = null; shareFilesKey = ''; return; }
    Promise.all(ids.map(function (id) {
      return fetch('/images/' + data[id][0] + '-700.webp')
        .then(function (r) { return r.ok ? r.blob() : null; })
        .then(function (b) { return b ? toJpeg(b, 'shape-' + id + '.jpg') : null; })
        .catch(function () { return null; });
    })).then(function (files) {
      files = files.filter(Boolean);
      var ok = false;
      try { ok = files.length && navigator.canShare({ files: files }); } catch (e) { ok = false; }
      shareFiles = ok ? files : null;
      shareFilesKey = ok ? key : '';
    }).catch(function () { shareFiles = null; shareFilesKey = ''; });
  }

  function openWa(url) {
    if (!window.open(url, '_blank', 'noopener')) location.href = url;
  }

  /* true if the share sheet took it; false means the caller should use the link */
  function shareTagged(text, fallbackUrl) {
    if (!shareFiles) return false;
    try {
      if (!navigator.canShare({ files: shareFiles })) return false;
    } catch (e) { return false; }
    navigator.share({ files: shareFiles, text: text }).catch(function (err) {
      /* a cancelled sheet is a decision, not a failure: only recover from real errors */
      if (!err || err.name !== 'AbortError') openWa(fallbackUrl);
    });
    return true;
  }

  function paint() {
    try { sessionStorage.setItem(KEY, JSON.stringify(tags)); } catch (e) {}
    var n = tags.length;
    buildShareFiles();

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

  /* the header and bottom-bar WhatsApp buttons carry the tagged shapes: send
     the photos where the browser allows it, otherwise follow the link as before */
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var a = e.target.closest('#hdrWa, .bar .wa');
    if (!a || !tags.length || !shareFiles) return;
    if (shareTagged(message(), a.href)) e.preventDefault();
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
      /* with shapes tagged, send their photos alongside the spec */
      if (shareTagged(compose(), url)) return;
      openWa(url);
    });
  }

  paint();

  /* ---------- catalogue: the detail dialog ---------- */
  var cat = $('#cat');
  if (cat) {
    var prods = $$('.prod', cat);

    var dlg = $('#detail');
    var visible = function () { return prods; };
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
