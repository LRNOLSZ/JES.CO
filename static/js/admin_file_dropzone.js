(function () {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────────────────────

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function getFieldType(input) {
    var accept = (input.getAttribute('accept') || '').toLowerCase();
    if (accept.indexOf('video') !== -1) return 'video';
    if (accept.indexOf('image') !== -1) return 'image';
    return 'file';
  }

  // Detect whether Django is already showing a "Currently: <file>" for this field
  function hasCurrentFile(input) {
    var el = input.parentNode;
    for (var depth = 0; depth < 5; depth++) {
      if (!el) break;
      if (el.querySelector) {
        var links = el.querySelectorAll('a[href]');
        for (var i = 0; i < links.length; i++) {
          var href = links[i].getAttribute('href') || '';
          // Only count links that look like media/storage paths, not nav links
          if (href.indexOf('/media/') !== -1 || href.indexOf('.b-cdn.net') !== -1 || href.indexOf('bunny') !== -1) {
            return true;
          }
        }
      }
      el = el.parentNode;
    }
    return false;
  }

  // ── SVG icons ──────────────────────────────────────────────────────────────

  var ICON_UPLOAD =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">' +
      '<path d="M12 15V4M12 4l-3.5 3.5M12 4l3.5 3.5" stroke="var(--purple,#60269E)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M4 17v1a3 3 0 003 3h10a3 3 0 003-3v-1" stroke="var(--purple,#60269E)" stroke-width="1.6" stroke-linecap="round"/>' +
    '</svg>';

  var ICON_FILE =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="30" height="30">' +
      '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="var(--gold,#D4AF37)" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M14 2v6h6" stroke="var(--gold,#D4AF37)" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M8 13h8M8 17h5" stroke="var(--gold,#D4AF37)" stroke-width="1.5" stroke-linecap="round"/>' +
    '</svg>';

  // ── Zone HTML builders ─────────────────────────────────────────────────────

  function buildEmptyZone(input) {
    var type      = getFieldType(input);
    var replacing = hasCurrentFile(input);
    var headline  = replacing
      ? 'Drop a new ' + type + ' to replace'
      : (type === 'video' ? 'Drop your video here' : type === 'image' ? 'Drop your image here' : 'Drop your file here');

    return '<div class="fdz-inner">' +
      '<div class="fdz-icon">' + ICON_UPLOAD + '</div>' +
      '<p class="fdz-headline">' + headline + '</p>' +
      '<p class="fdz-sub">or <span class="fdz-browse-link">click to browse</span></p>' +
    '</div>';
  }

  function buildSelectedZone(file) {
    return '<div class="fdz-inner fdz-inner--selected">' +
      '<div class="fdz-icon">' + ICON_FILE + '</div>' +
      '<p class="fdz-selected-name">' + escapeHtml(file.name) + '</p>' +
      '<p class="fdz-selected-size">' + formatBytes(file.size) + '</p>' +
      '<p class="fdz-sub fdz-sub--swap">Click or drop again to swap</p>' +
    '</div>';
  }

  // ── Core logic ─────────────────────────────────────────────────────────────

  function createDropZone(input) {
    var zone = document.createElement('div');
    zone.className = 'fdz-zone';
    zone.setAttribute('tabindex', '0');
    zone.setAttribute('role', 'button');
    zone.setAttribute('aria-label', 'Upload file — click or drag and drop');
    zone.innerHTML = buildEmptyZone(input);

    // Place zone immediately before the input in the DOM
    input.parentNode.insertBefore(zone, input);

    // Hide the real input — stays in DOM so FormData captures it
    input.classList.add('fdz-real-input');

    // ── Events ──────────────────────────────────────────────────────────────

    zone.addEventListener('click', function () {
      input.click();
    });

    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });

    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('fdz-zone--over');
    });

    zone.addEventListener('dragleave', function (e) {
      // Only remove highlight when leaving the zone itself, not a child element
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('fdz-zone--over');
      }
    });

    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('fdz-zone--over');
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length > 0) {
        try {
          var dt = new DataTransfer();
          dt.items.add(files[0]);
          input.files = dt.files;
        } catch (_) {
          // DataTransfer constructor not available — zone shows filename but
          // the dropped file may not transfer to the input on older browsers.
        }
        markSelected(zone, files[0]);
      }
    });

    input.addEventListener('change', function () {
      if (input.files && input.files.length > 0) {
        markSelected(zone, input.files[0]);
      }
    });
  }

  function markSelected(zone, file) {
    zone.classList.add('fdz-zone--has-file');
    zone.innerHTML = buildSelectedZone(file);
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('input[type="file"]').forEach(function (input) {
      createDropZone(input);
    });
  });

})();
