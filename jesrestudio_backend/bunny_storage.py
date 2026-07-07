import requests
from decouple import config
from django.core.files.storage import Storage

_BUNNY_API_KEY    = config('BUNNY_API_KEY',    default='')
_BUNNY_LIBRARY_ID = config('BUNNY_LIBRARY_ID', default='')
_BUNNY_CDN_URL    = config('BUNNY_CDN_URL',    default='')

BUNNY_CONFIGURED = all([_BUNNY_API_KEY, _BUNNY_LIBRARY_ID, _BUNNY_CDN_URL])


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
            return f'{self.cdn_url}/{name}/playlist.m3u8'

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
