// Added to every workbook page: autosaves typed answers, ticks and choices in
// this browser, and powers the toolbar (print / save as PDF, clear answers).
(function () {
  var key = 'bih-workbook-' + (document.documentElement.dataset.session || location.pathname);
  var fields = function () {
    return document.querySelectorAll('[contenteditable="true"], input[type="checkbox"], input[type="radio"], input[type="text"], textarea');
  };

  function save() {
    var data = [];
    fields().forEach(function (el) {
      data.push(el.isContentEditable ? el.innerHTML : el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value);
    });
    try {
      localStorage.setItem(key, JSON.stringify({ at: Date.now(), data: data }));
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
    if (!saved || !saved.data) return;
    fields().forEach(function (el, i) {
      var v = saved.data[i];
      if (v === undefined) return;
      if (el.isContentEditable) el.innerHTML = v;
      else if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!v;
      else el.value = v;
    });
    flash('Your answers from ' + new Date(saved.at).toLocaleDateString() + ' were restored');
  }

  var timer;
  function flash(text) {
    var s = document.querySelector('.wb-status');
    if (!s) return;
    s.textContent = text;
    clearTimeout(timer);
    timer = setTimeout(function () { s.textContent = ''; }, 3000);
  }

  var pending;
  document.addEventListener('input', function () {
    clearTimeout(pending);
    pending = setTimeout(save, 600);
  });
  document.addEventListener('change', save);

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
      try { localStorage.removeItem(key); } catch (err) {}
      fields().forEach(function (el) {
        if (el.isContentEditable) el.innerHTML = '';
        else if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else el.value = '';
      });
      flash('Answers cleared');
    }
  });

  restore();
})();
