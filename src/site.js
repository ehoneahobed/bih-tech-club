// Runs on every page: progress for self-study (saved in this browser only),
// and offline saving on the website.
(function () {
  // Sessions were renumbered twice in October 2026 (20 → 22 → 44 sessions).
  // Move work saved under the old numbers, once per browser.
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
    // 44-session course: move work saved under the 22-session numbers.
    if (!localStorage.getItem('bih-renumbered-44')) {
      var MAP = { 6: 11, 7: 13, 8: 16, 9: 17, 10: 19, 11: 20, 12: 23, 13: 24, 14: 29, 15: 33, 16: 36, 17: 37, 18: 39, 19: 40, 20: 42, 21: 43, 22: 44 };
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      var olds = Object.keys(MAP).sort(function (a, b) { return b - a; });
      var moved44 = {};
      olds.forEach(function (from) {
        ['', '-old'].forEach(function (end) {
          var k = 'bih-workbook-' + pad(+from) + end;
          var v = localStorage.getItem(k);
          if (v !== null) { moved44[k] = v; localStorage.removeItem(k); }
        });
      });
      olds.forEach(function (from) {
        ['', '-old'].forEach(function (end) {
          var v = moved44['bih-workbook-' + pad(+from) + end];
          if (v !== undefined) localStorage.setItem('bih-workbook-' + pad(MAP[from]) + end, v);
        });
      });
      var p44 = JSON.parse(localStorage.getItem('bih-progress') || 'null');
      if (p44 && p44.sessions) {
        var s44 = {};
        Object.keys(p44.sessions).forEach(function (id) { s44[MAP[+id] ? pad(MAP[+id]) : id] = p44.sessions[id]; });
        p44.sessions = s44;
        if (p44.last && MAP[+p44.last.id]) p44.last.id = pad(MAP[+p44.last.id]);
        localStorage.setItem('bih-progress', JSON.stringify(p44));
      }
      localStorage.setItem('bih-renumbered-44', '1');
    }
  } catch (e) {}
  var KEY = 'bih-progress';
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function store(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
  }
  var progress = load();
  progress.sessions = progress.sessions || {};
  var hasWorkbook = function (id) {
    try { return !!localStorage.getItem('bih-workbook-' + id); } catch (e) { return false; }
  };
  // A session is "done" when every step is ticked, "started" when any step is
  // ticked or the workbook has saved answers.
  function statusOf(id) {
    var s = progress.sessions[id];
    if (s && s.total && s.steps && s.steps.filter(Boolean).length >= s.total) return 'done';
    if ((s && s.steps && s.steps.some(Boolean)) || hasWorkbook(id)) return 'started';
    return '';
  }

  // ---------- Session page: the step-by-step path ----------
  var path = document.querySelector('[data-path]');
  if (path) {
    var id = path.dataset.path;
    var title = path.dataset.title;
    var steps = Array.prototype.slice.call(path.querySelectorAll(':scope > li'));
    var rec = progress.sessions[id] || { steps: [] };
    rec.total = steps.length;
    var render = function () {
      var current = -1;
      steps.forEach(function (li, i) {
        var done = !!rec.steps[i];
        li.classList.toggle('done', done);
        li.querySelector('input[type="checkbox"]').checked = done;
        if (!done && current < 0) current = i;
      });
      steps.forEach(function (li, i) { li.classList.toggle('current', i === current); });
      var finished = current < 0;
      var box = document.querySelector('.path-done');
      if (box) box.classList.toggle('show', finished);
      var count = document.querySelector('[data-path-count]');
      if (count) count.textContent = rec.steps.filter(Boolean).length + ' of ' + steps.length + ' steps done';
    };
    var save = function () {
      rec.at = Date.now();
      progress.sessions[id] = rec;
      progress.last = { id: id, title: title, at: rec.at };
      store(progress);
      render();
    };
    path.addEventListener('change', function (e) {
      var li = e.target.closest('li');
      if (!li || e.target.type !== 'checkbox') return;
      rec.steps[steps.indexOf(li)] = e.target.checked;
      save();
    });
    // Opening the workbook counts as starting this session.
    path.addEventListener('click', function (e) {
      if (e.target.closest('a[href*="workbooks/"]')) { progress.last = { id: id, title: title, at: Date.now() }; store(progress); }
    });
    // The 3D labs report their missions; finishing all of them ticks the lab step.
    var labs = {};
    document.addEventListener('bih-missions', function (e) {
      var d = e.detail;
      labs[d.lab] = d;
      var out = document.querySelector('[data-missions="' + d.lab + '"]');
      if (out) out.textContent = d.done === d.total ? '🏆 All ' + d.total + ' missions done' : d.done + ' of ' + d.total + ' missions done';
      var step = path.querySelector('[data-lab-step]');
      if (!step) return;
      var names = step.dataset.labStep.split(' ');
      var all = names.every(function (n) { return labs[n] && labs[n].total && labs[n].done === labs[n].total; });
      var i = steps.indexOf(step);
      if (all && !rec.steps[i]) { rec.steps[i] = true; save(); }
    });
    render();
  }

  // ---------- Home and course pages: status on each session card ----------
  var done = 0;
  document.querySelectorAll('[data-card]').forEach(function (card) {
    var st = statusOf(card.dataset.card);
    if (st === 'done') done++;
    var chip = card.querySelector('.status');
    if (chip && st) {
      chip.className = 'status ' + st;
      chip.textContent = st === 'done' ? '✓ Done' : 'In progress';
    }
  });
  document.querySelectorAll('[data-done-count]').forEach(function (el) {
    el.textContent = done ? 'You have finished ' + done + ' of ' + el.dataset.doneCount + ' sessions on this device.' : '';
  });
  var cont = document.querySelector('[data-continue]');
  if (cont && progress.last) {
    // data-continue holds the path back to the site root ("" or "../").
    cont.querySelector('b').textContent = 'Session ' + Number(progress.last.id) + ': ' + progress.last.title;
    cont.querySelector('a').href = cont.dataset.continue + 'sessions/' + progress.last.id + '/' + (location.protocol === 'file:' ? 'index.html' : '') + '#path';
    cont.classList.add('show');
  }
  var sessionBar = document.querySelector('[data-course-done]');
  if (sessionBar) {
    var total = Number(sessionBar.dataset.courseDone);
    var n = 0;
    for (var k in progress.sessions) if (statusOf(k) === 'done') n++;
    sessionBar.querySelector('span').style.width = (n / total) * 100 + '%';
    sessionBar.nextElementSibling.textContent = n + ' of ' + total + ' sessions done';
  }
  var reset = document.querySelector('[data-reset-progress]');
  if (reset) reset.addEventListener('click', function () {
    if (!confirm('Clear your progress ticks on this device? Your workbook answers are kept.')) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    reset.textContent = 'Progress cleared';
  });

  // ---------- Offline (website only; the USB kit already works offline) ----------
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('/sw.js').then(function () { return navigator.serviceWorker.ready; })
    .then(function () { document.querySelectorAll('.offline-ready').forEach(function (el) { el.hidden = false; }); })
    .catch(function () {});
  // Mentors page: "Save the whole course on this computer".
  var btn = document.querySelector('[data-save-all]');
  var out = document.querySelector('[data-save-status]');
  if (!btn || !out) return;
  try { var at = localStorage.getItem('bih-whole-course'); if (at) out.textContent = '✓ Whole course saved on this computer on ' + at + '.'; } catch (e) {}
  btn.addEventListener('click', function () {
    btn.disabled = true;
    out.textContent = 'Starting…';
    navigator.serviceWorker.ready.then(function (reg) { reg.active.postMessage('save-all'); });
  });
  navigator.serviceWorker.addEventListener('message', function (e) {
    var m = e.data || {};
    if (m.type === 'save-progress') out.textContent = 'Saving… ' + m.done + ' of ' + m.total + ' files';
    if (m.type !== 'save-done') return;
    btn.disabled = false;
    if (m.failed) { out.textContent = '⚠️ ' + m.failed + ' of ' + m.total + ' files did not download. Check the internet and press the button again.'; return; }
    var day = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    out.textContent = '✓ Whole course saved on this computer on ' + day + '. It now works with no internet.';
    try { localStorage.setItem('bih-whole-course', day); } catch (e) {}
  });
})();
