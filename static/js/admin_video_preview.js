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
        // Bunny's signed URLs put ?token=...&expires=... on the manifest we hand
        // hls.js, but every nested file the manifest references (quality sub-
        // playlists, then .ts segments) is requested separately and doesn't carry
        // that query string forward — so only the first request is authenticated
        // and the rest 403 once Bunny's token enforcement is on. Re-attach it to
        // every request hls.js makes (same fix as VideoPlayer.jsx).
        var authQuery = src.indexOf('?') !== -1 ? src.split('?')[1] : '';
        function withAuth(url) {
          if (!authQuery || url.indexOf('token=') !== -1) return url;
          return url.indexOf('?') !== -1 ? url + '&' + authQuery : url + '?' + authQuery;
        }

        var hls = new window.Hls({
          xhrSetup: function (xhr, url) { xhr.open('GET', withAuth(url), true); },
          fetchSetup: function (context, initParams) { return new Request(withAuth(context.url), initParams); },
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        video.src = src; // best-effort fallback
      }
    });
  });
})();
