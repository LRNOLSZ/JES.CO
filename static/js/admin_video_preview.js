(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var videos = document.querySelectorAll('video[data-hls-src]');
    if (!videos.length) return;

    videos.forEach(function (video) {
      var src = video.getAttribute('data-hls-src');
      if (!src) return;

      // Safari supports HLS natively — canPlayType returns "maybe" for many
      // non-Safari browsers too, and "maybe" is a non-empty string so it was
      // being treated as truthy/yes. Only "probably" is a confident native-
      // support answer; require that exact value (same fix as VideoPlayer.jsx).
      if (video.canPlayType('application/vnd.apple.mpegurl') === 'probably') {
        video.src = src;
        return;
      }

      // Chrome, Firefox, Edge — use hls.js (loaded before this script)
      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        video.src = src; // best-effort fallback
      }
    });
  });
})();
