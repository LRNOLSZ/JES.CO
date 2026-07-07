(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var videos = document.querySelectorAll('video[data-hls-src]');
    if (!videos.length) return;

    videos.forEach(function (video) {
      var src = video.getAttribute('data-hls-src');
      if (!src) return;

      // Safari supports HLS natively
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
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
