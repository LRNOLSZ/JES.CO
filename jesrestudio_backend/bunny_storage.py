import base64
import hashlib
import time

import requests
from decouple import config
from django.core.files.storage import Storage

_BUNNY_API_KEY        = config('BUNNY_API_KEY',        default='')
_BUNNY_LIBRARY_ID     = config('BUNNY_LIBRARY_ID',      default='')
_BUNNY_CDN_URL        = config('BUNNY_CDN_URL',         default='')
_BUNNY_TOKEN_AUTH_KEY = config('BUNNY_TOKEN_AUTH_KEY',  default='')

BUNNY_CONFIGURED = all([_BUNNY_API_KEY, _BUNNY_LIBRARY_ID, _BUNNY_CDN_URL])

# Signing is opt-in by the presence of this key alone — without it, .url() falls back
# to today's permanent unsigned links, so shipping this code has zero effect until the
# key is actually set (locally or on Railway). See BUNNY_TOKEN_AUTH_KEY in the plan doc
# for where this comes from in Bunny's dashboard (Pull Zone/Library -> Security ->
# Token Authentication) and the rollout order (code first, key second, enable
# enforcement in Bunny's dashboard last, once a signed URL has been tested directly).
BUNNY_SIGNING_CONFIGURED = bool(_BUNNY_TOKEN_AUTH_KEY)

# 8-hour signed-URL window — matches this project's existing CourseSession expiry
# elsewhere (a comfortable full-viewing-session length), not an arbitrary number.
BUNNY_SIGNED_URL_TTL_SECONDS = 8 * 60 * 60


def _bunny_directory_token(directory_path, expires):
    """
    Bunny CDN 'Basic' token auth, directory mode: sign the *folder* path (trailing
    slash), not the exact file — HLS playback fetches many nested files (quality
    sub-playlists, .ts segments) that we don't individually control the URL for, so
    only a directory-scoped token can cover all of them with one signature.
    """
    hashable = f'{_BUNNY_TOKEN_AUTH_KEY}{directory_path}{expires}'
    digest = hashlib.md5(hashable.encode()).digest()
    token = base64.b64encode(digest).decode()
    return token.replace('+', '-').replace('/', '_').replace('=', '')


if BUNNY_CONFIGURED:
    class BunnyStreamStorage(Storage):
        def __init__(self):
            self.api_key    = _BUNNY_API_KEY
            self.library_id = _BUNNY_LIBRARY_ID
            _cdn = _BUNNY_CDN_URL.strip().rstrip('/')
            if not _cdn.startswith('http'):
                _cdn = f'https://{_cdn}'
            self.cdn_url = _cdn
            self.base_url   = f'https://video.bunnycdn.com/library/{self.library_id}'
            self._headers   = {'AccessKey': self.api_key, 'Content-Type': 'application/json'}

        def _save(self, name, content):
            title = name.split('/')[-1]
            create = requests.post(
                f'{self.base_url}/videos',
                json={'title': title},
                headers=self._headers,
                timeout=30,
            )
            create.raise_for_status()
            guid = create.json()['guid']

            # Stream file directly — avoids loading 5GB into memory
            upload = requests.put(
                f'{self.base_url}/videos/{guid}',
                data=content,
                headers={'AccessKey': self.api_key},
                timeout=3600,
            )
            upload.raise_for_status()
            return guid

        def url(self, name):
            if not BUNNY_SIGNING_CONFIGURED:
                return f'{self.cdn_url}/{name}/playlist.m3u8'

            expires = int(time.time()) + BUNNY_SIGNED_URL_TTL_SECONDS
            directory_path = f'/{name}/'
            token = _bunny_directory_token(directory_path, expires)
            return f'{self.cdn_url}/{name}/playlist.m3u8?token={token}&expires={expires}'

        def exists(self, name):
            return False

        def delete(self, name):
            try:
                requests.delete(
                    f'{self.base_url}/videos/{name}',
                    headers=self._headers,
                    timeout=30,
                )
            except requests.RequestException:
                pass

        def _open(self, name, mode='rb'):
            raise NotImplementedError('BunnyStreamStorage does not support reading files.')

        def get_available_name(self, name, max_length=None):
            return name

else:
    from django.core.files.storage import FileSystemStorage as BunnyStreamStorage
