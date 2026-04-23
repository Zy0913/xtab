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
  icons: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  permissions: ['storage', 'bookmarks'],
  host_permissions: [
    'https://suggestqueries.google.com/*',
    'https://api.bing.com/*',
    'https://www.baidu.com/sugrec*',
    'https://duckduckgo.com/ac/*',
    'https://api.open-meteo.com/*',
    'https://geocoding-api.open-meteo.com/*',
    'https://www.google.com/s2/favicons*',
    'https://nominatim.openstreetmap.org/*',
  ],
})
