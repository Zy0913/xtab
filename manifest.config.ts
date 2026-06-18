import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

export default defineManifest({
  manifest_version: 3,
  name: 'Tab',
  version: pkg.version,
  description: pkg.description,
  chrome_url_overrides: {
    newtab: 'src/newtab/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  icons: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  permissions: ['storage', 'bookmarks', 'unlimitedStorage', 'tabs', 'favicon'],
  host_permissions: [
    // Search suggest APIs — paths narrowed to the exact endpoints we hit so a
    // compromised extension can't blanket-fetch the host with cookies.
    'https://suggestqueries.google.com/complete/search*',
    'https://api.bing.com/osjson.aspx*',
    'https://www.baidu.com/sugrec*',
    'https://duckduckgo.com/ac/*',
    // Weather + geocoding.
    'https://api.open-meteo.com/*',
    'https://geocoding-api.open-meteo.com/*',
    // Favicons.
    'https://icons.duckduckgo.com/*',
    // Wallpapers.
    'https://images.unsplash.com/*',
    'https://wallhaven.cc/*',
    'https://w.wallhaven.cc/*',
    'https://th.wallhaven.cc/*',
  ],
  // Defense in depth: make MV3's safe default explicit and constrain
  // connect/img sources. img-src stays open to https: because favicons and
  // user wallpapers come from arbitrary origins; connect-src is https-only to
  // block accidental plaintext / non-http fetches.
  content_security_policy: {
    extension_pages:
      "script-src 'self'; object-src 'self'; base-uri 'self'; form-action 'self'; connect-src 'self' https:; img-src 'self' data: blob: chrome-extension: https:",
  },
})
