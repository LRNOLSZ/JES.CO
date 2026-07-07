(function () {
  'use strict';

  function getSelectedVideoInput(form) {
    var inputs = form.querySelectorAll('input[type="file"]');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      var accept = (el.getAttribute('accept') || '').toLowerCase();
      if (accept.indexOf('video') !== -1 && el.files && el.files.length > 0) {
        return el;
      }
    }
    return null;
  }

  // ── Formatting helpers ──────────────────────────────────────────────────────

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
  }

  function formatSpeed(bps) {
    return formatBytes(bps) + '/s';
  }

  function formatETA(seconds) {
    if (seconds === null || !isFinite(seconds) || seconds < 0) return '';
    if (seconds < 5)  return 'almost done';
    if (seconds < 60) return Math.round(seconds) + 's left';
    var mins = Math.floor(seconds / 60);
    var secs = Math.round(seconds % 60);
    if (mins < 60)    return secs > 0 ? mins + 'm ' + secs + 's left' : mins + ' min left';
    var hrs  = Math.floor(mins / 60);
    mins     = mins % 60;
    return hrs + 'h ' + mins + 'm left';
  }

  // ── Rolling speed window ────────────────────────────────────────────────────
  // Uses the last WINDOW_MS of samples so speed stabilises quickly
  // instead of fluctuating on every tick.

  var SPEED_WINDOW_MS = 8000;
  var speedSamples    = []; // [{time, loaded}]

  function recordSample(loaded) {
    var now = Date.now();
    speedSamples.push({ time: now, loaded: loaded });
    // Drop samples outside the window
    speedSamples = speedSamples.filter(function (s) {
      return now - s.time <= SPEED_WINDOW_MS;
    });
  }

  function calcSpeed() {
    if (speedSamples.length < 2) return null;
    var oldest  = speedSamples[0];
    var newest  = speedSamples[speedSamples.length - 1];
    var elapsed = (newest.time - oldest.time) / 1000;
    if (elapsed < 0.5) return null; // wait for at least half a second of data
    return (newest.loaded - oldest.loaded) / elapsed; // bytes per second
  }

  // ── Overlay HTML & CSS ──────────────────────────────────────────────────────

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '#vup-overlay{',
        'position:fixed;inset:0;',
        'background:rgba(8,4,18,0.9);',
        'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);',
        'z-index:99999;',
        'display:flex;align-items:center;justify-content:center;',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
      '}',
      '.vup-card{',
        'background:#150d28;border:1px solid #60269E;border-radius:18px;',
        'padding:2.75rem 2.25rem;width:460px;max-width:calc(100vw - 2rem);',
        'text-align:center;box-shadow:0 0 80px rgba(96,38,158,0.45);',
      '}',
      '.vup-icon-wrap{',
        'width:60px;height:60px;margin:0 auto 1.4rem;',
        'background:rgba(96,38,158,0.2);border-radius:50%;',
        'display:flex;align-items:center;justify-content:center;',
      '}',
      '.vup-icon-wrap svg{width:30px;height:30px;}',
      '.vup-title{color:#fff;font-size:1.3rem;font-weight:700;margin-bottom:0.35rem;letter-spacing:0.01em;}',
      '.vup-filename{color:#8b6bbf;font-size:0.78rem;margin-bottom:1.75rem;word-break:break-all;padding:0 0.5rem;line-height:1.4;}',
      '.vup-bar-track{height:10px;background:rgba(255,255,255,0.07);border-radius:999px;overflow:hidden;margin-bottom:0.9rem;}',
      '.vup-bar-fill{height:100%;width:0%;background:linear-gradient(90deg,#60269E,#D4AF37);border-radius:999px;transition:width 0.35s ease;}',
      '.vup-percent{color:#D4AF37;font-size:2.4rem;font-weight:800;margin-bottom:0.2rem;letter-spacing:-0.03em;min-height:3rem;line-height:1;}',
      '.vup-sizes{color:#5a4a7a;font-size:0.78rem;margin-bottom:0.35rem;min-height:1.1em;}',
      '.vup-eta{',
        'font-size:0.82rem;font-weight:600;min-height:1.2em;margin-bottom:1.5rem;',
        'display:flex;align-items:center;justify-content:center;gap:0.6rem;',
        'color:#b8a0e0;',
      '}',
      '.vup-eta-time{color:#e8d5ff;font-size:0.9rem;}',
      '.vup-eta-dot{color:#3a2a5a;}',
      '.vup-eta-speed{color:#7a6a9a;}',
      '.vup-warning{color:#c08000;font-size:0.78rem;display:flex;align-items:center;justify-content:center;gap:0.45rem;}',
      '.vup-spinner{width:30px;height:30px;border:3px solid rgba(212,175,55,0.15);border-top-color:#D4AF37;border-radius:50%;animation:vup-spin 0.75s linear infinite;}',
      '@keyframes vup-spin{to{transform:rotate(360deg);}}'
    ].join('');
    document.head.appendChild(style);
  }

  function buildOverlay(fileName) {
    var div = document.createElement('div');
    div.id  = 'vup-overlay';
    div.innerHTML =
      '<div class="vup-card">' +
        '<div class="vup-icon-wrap">' +
          '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.9L15 14' +
            'M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"' +
            ' stroke="#D4AF37" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
        '</div>' +
        '<div class="vup-title" id="vup-title">Uploading Video</div>' +
        '<div class="vup-filename" id="vup-filename">' + fileName + '</div>' +
        '<div class="vup-bar-track"><div class="vup-bar-fill" id="vup-bar-fill"></div></div>' +
        '<div class="vup-percent" id="vup-percent">0%</div>' +
        '<div class="vup-sizes"  id="vup-sizes">Preparing upload…</div>' +
        '<div class="vup-eta"    id="vup-eta">' +
          '<span class="vup-eta-time" id="vup-eta-time"></span>' +
          '<span class="vup-eta-dot"  id="vup-eta-dot"></span>' +
          '<span class="vup-eta-speed" id="vup-eta-speed"></span>' +
        '</div>' +
        '<div class="vup-warning">' +
          '<svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">' +
            '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92' +
            'c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z' +
            'M11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"' +
            ' clip-rule="evenodd"/>' +
          '</svg>' +
          'Do not close or refresh this tab' +
        '</div>' +
      '</div>';
    document.body.appendChild(div);
  }

  // ── State updaters ──────────────────────────────────────────────────────────

  function setProgress(loaded, total) {
    var pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
    document.getElementById('vup-bar-fill').style.width = pct + '%';
    document.getElementById('vup-percent').textContent  = pct + '%';
    document.getElementById('vup-sizes').textContent    =
      formatBytes(loaded) + ' of ' + formatBytes(total);
  }

  function setETA(loaded, total) {
    var speed = calcSpeed();
    var timeEl  = document.getElementById('vup-eta-time');
    var dotEl   = document.getElementById('vup-eta-dot');
    var speedEl = document.getElementById('vup-eta-speed');

    if (!speed || speed < 1024) {
      // Not enough data yet or essentially stalled
      timeEl.textContent  = speedSamples.length < 3 ? 'Calculating…' : 'Stalled…';
      dotEl.textContent   = '';
      speedEl.textContent = '';
      return;
    }

    var remaining = total - loaded;
    var eta       = remaining / speed;

    timeEl.textContent  = formatETA(eta);
    dotEl.textContent   = '·'; // middle dot
    speedEl.textContent = formatSpeed(speed);
  }

  function showProcessingState() {
    document.getElementById('vup-title').textContent    = 'Sending to Bunny Stream';
    document.getElementById('vup-percent').textContent  = '';
    document.getElementById('vup-sizes').textContent    = 'File received — server forwarding to Bunny…';
    document.getElementById('vup-eta-time').textContent  = '';
    document.getElementById('vup-eta-dot').textContent   = '';
    document.getElementById('vup-eta-speed').textContent = '';
    document.querySelector('.vup-bar-fill').style.width  = '100%';
    document.querySelector('.vup-icon-wrap').innerHTML   = '<div class="vup-spinner"></div>';
  }

  function showDoneState() {
    document.getElementById('vup-title').textContent = 'Upload Complete';
    document.getElementById('vup-sizes').textContent = 'Redirecting…';
  }

  function showErrorState() {
    document.getElementById('vup-title').textContent = 'Upload Failed';
    document.getElementById('vup-sizes').textContent = 'Something went wrong. Please try again.';
    var bar = document.getElementById('vup-bar-fill');
    if (bar) bar.style.background = '#c0392b';
    document.getElementById('vup-eta-time').textContent = '';
    document.getElementById('vup-eta-dot').textContent  = '';
    document.getElementById('vup-eta-speed').textContent = '';
    var warning = document.querySelector('.vup-warning');
    if (warning) warning.style.color = '#e05252';
  }

  // ── Main ────────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('form[method="post"]:not(#logout-form)');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      var videoInput = getSelectedVideoInput(form);
      if (!videoInput) return;
      var videoFile = videoInput.files[0];

      if (videoInput.getAttribute('data-has-existing') === '1') {
        var proceed = window.confirm(
          'Replacing this video will permanently delete the currently uploaded video. Continue?'
        );
        if (!proceed) return;
      }

      e.preventDefault();
      speedSamples = []; // reset for this upload

      injectStyles();
      buildOverlay(videoFile.name);
      var overlayShownAt = Date.now();

      var formData = new FormData(form);
      var xhr      = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', function (ev) {
        if (ev.lengthComputable) {
          recordSample(ev.loaded);
          setProgress(ev.loaded, ev.total);
          setETA(ev.loaded, ev.total);
        }
      });

      xhr.upload.addEventListener('load', function () {
        showProcessingState();
      });

      xhr.addEventListener('load', function () {
        if (xhr.status >= 200 && xhr.status < 400) {
          var elapsed    = Date.now() - overlayShownAt;
          var MIN_SHOW   = 1500;
          var DONE_PAUSE = 700;
          var doneDelay  = Math.max(0, MIN_SHOW - DONE_PAUSE - elapsed);
          setTimeout(function () {
            showDoneState();
            setTimeout(function () {
              window.location.href =
                xhr.responseURL || form.getAttribute('action') || window.location.href;
            }, DONE_PAUSE);
          }, doneDelay);
        } else {
          showErrorState();
        }
      });

      xhr.addEventListener('error', function () {
        showErrorState();
      });

      xhr.open('POST', form.getAttribute('action') || window.location.href);
      xhr.send(formData);
    });
  });

})();
