// Added to every workbook page: autosaves typed answers, ticks and choices in
// this browser, and powers the toolbar (print / save as PDF, clear answers).
(function () {
  // October 2026: two AI sessions became 18 and 19, so the capstone moved from
  // 18–20 to 20–22. Move work saved under the old numbers, once per browser.
  try {
    if (!localStorage.getItem('bih-renumbered-22')) {
      ['20', '19', '18'].forEach(function (from) {
        var to = String(+from + 2);
        ['', '-old'].forEach(function (end) {
          var v = localStorage.getItem('bih-workbook-' + from + end);
          if (v !== null) { localStorage.setItem('bih-workbook-' + to + end, v); localStorage.removeItem('bih-workbook-' + from + end); }
        });
      });
      var p = JSON.parse(localStorage.getItem('bih-progress') || 'null');
      if (p && p.sessions) {
        var moved = {};
        Object.keys(p.sessions).forEach(function (id) { moved[+id >= 18 && +id <= 20 ? String(+id + 2) : id] = p.sessions[id]; });
        p.sessions = moved;
        if (p.last && +p.last.id >= 18 && +p.last.id <= 20) p.last.id = String(+p.last.id + 2);
        localStorage.setItem('bih-progress', JSON.stringify(p));
      }
      localStorage.setItem('bih-renumbered-22', '1');
    }
  } catch (e) {}
  var key = 'bih-workbook-' + (document.documentElement.dataset.session || location.pathname);
  var FIELD = '[contenteditable="true"], input[type="checkbox"], input[type="radio"], input[type="text"], textarea';

  // Each answer is saved under a name made from the heading it sits under and
  // its position in that section, so editing one part of a workbook doesn't
  // move answers into the wrong boxes everywhere else.
  function fields() {
    var out = [];
    var section = 'top';
    var count = {};
    document.querySelectorAll('h1, h2, h3, ' + FIELD).forEach(function (el) {
      if (/^H[123]$/.test(el.tagName) && !el.closest('[contenteditable="true"]')) {
        section = el.textContent.replace(/\s+/g, ' ').trim().slice(0, 80);
        return;
      }
      var k = section + '|' + (el.type === 'radio' ? 'radio:' + el.name + ':' + el.value : el.isContentEditable ? 'text' : el.type || el.tagName);
      count[k] = (count[k] || 0) + 1;
      out.push({ el: el, id: k + '|' + count[k] });
    });
    return out;
  }
  var valueOf = function (el) {
    return el.isContentEditable ? el.innerHTML : el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value;
  };
  // Only simple formatting comes back from storage, never scripts or attributes.
  function clean(html) {
    var t = document.createElement('template');
    t.innerHTML = String(html);
    t.content.querySelectorAll('*').forEach(function (n) {
      if (!/^(B|I|U|BR|DIV|P|SPAN|STRONG|EM)$/.test(n.tagName)) n.replaceWith(document.createTextNode(n.textContent));
      else while (n.attributes.length) n.removeAttribute(n.attributes[0].name);
    });
    return t.innerHTML;
  }
  function put(el, v) {
    if (el.isContentEditable) el.innerHTML = clean(v);
    else if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!v;
    else el.value = v;
  }

  var dirty = false;
  function save() {
    if (!dirty) return;
    dirty = false;
    var answers = {};
    fields().forEach(function (f) { answers[f.id] = valueOf(f.el); });
    try {
      localStorage.setItem(key, JSON.stringify({ v: 2, at: Date.now(), answers: answers }));
      flash('Saved on this computer');
    } catch (e) {
      flash('Could not save in this browser — print or save as PDF instead');
    }
  }

  function restore() {
    var saved;
    try {
      saved = JSON.parse(localStorage.getItem(key) || 'null');
    } catch (e) {}
    if (!saved) return;
    var list = fields();
    if (saved.answers) {
      list.forEach(function (f) { if (f.id in saved.answers) put(f.el, saved.answers[f.id]); });
    } else if (saved.data) {
      // Answers saved before October 2026 were stored by position. Only trust
      // them if the workbook still has the same number of boxes.
      if (saved.data.length !== list.length) {
        try { localStorage.setItem(key + '-old', JSON.stringify(saved)); localStorage.removeItem(key); } catch (e) {}
        flash('This workbook was updated, so your older answers could not be put back. Ask your mentor if you need them.');
        return;
      }
      list.forEach(function (f, i) { if (saved.data[i] !== undefined) put(f.el, saved.data[i]); });
      dirty = true;
      save();
    }
    flash('Your answers from ' + new Date(saved.at).toLocaleDateString() + ' were restored');
  }

  var timer;
  function flash(text) {
    var s = document.querySelector('.wb-status');
    if (!s) return;
    s.textContent = text;
    clearTimeout(timer);
    timer = setTimeout(function () { s.textContent = ''; }, text.length > 60 ? 8000 : 3000);
  }

  var pending;
  document.addEventListener('input', function () {
    dirty = true;
    clearTimeout(pending);
    pending = setTimeout(save, 600);
  });
  document.addEventListener('change', function () { dirty = true; save(); });
  // Save straight away when the pupil clicks away, leaves or closes the page.
  document.addEventListener('focusout', save);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') save(); });

  // Contenteditable boxes that are emptied must stay truly empty so the hint shows again.
  document.addEventListener('blur', function (e) {
    var el = e.target;
    if (el.isContentEditable && el.textContent.trim() === '' && !el.querySelector('img')) el.innerHTML = '';
  }, true);

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-wb]');
    if (!b) return;
    if (b.dataset.wb === 'print') window.print();
    if (b.dataset.wb === 'clear' && confirm('Clear all your answers in this workbook? This cannot be undone.')) {
      try { localStorage.removeItem(key); localStorage.removeItem(key + '-old'); } catch (err) {}
      fields().forEach(function (f) { put(f.el, f.el.type === 'checkbox' || f.el.type === 'radio' ? false : ''); });
      dirty = false;
      flash('Answers cleared');
    }
  });

  restore();
})();
