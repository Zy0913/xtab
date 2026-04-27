import { writeFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = resolve(__dirname, '..', 'dist')

// Allowed topRange values per wallhaven API: 1d, 3d, 1w, 1M, 3M, 6M, 1y.
// Frontend exposes 1d / 1w / 1M / 1y; if narrower windows yield zero results
// (common at off-hours), we widen to the next bucket transparently.
const bgCode = `var VALID_TOP_RANGES = ['1d', '3d', '1w', '1M', '3M', '6M', '1y'];
var FALLBACK_CHAIN = { '1d': '1w', '1w': '1M', '1M': '1y', '1y': null };
var MAX_PAGE_SAMPLE = 20;
var REQUEST_TIMEOUT_MS = 10000;

function buildBaseUrl(topRange) {
  return 'https://wallhaven.cc/api/v1/search'
    + '?categories=111'
    + '&purity=100'
    + '&sorting=toplist'
    + '&order=desc'
    + '&topRange=' + topRange
    + '&atleast=1920x1080'
    + '&ratios=16x9,16x10,21x9';
}

function fetchJson(url, signal) {
  return fetch(url, { signal: signal }).then(function (res) {
    if (res.status === 429) {
      var err = new Error('rate-limited');
      err.code = 'RATE_LIMITED';
      throw err;
    }
    if (!res.ok) throw new Error('Wallhaven API: ' + res.status);
    return res.json();
  });
}

function pickRandomFromList(list) {
  var pool = list.filter(function (x) {
    return x && typeof x.path === 'string' && x.path;
  });
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function fetchByStrategy(strategy, signal) {
  var base = buildBaseUrl(strategy);
  return fetchJson(base + '&page=1', signal).then(function (firstPage) {
    var meta = (firstPage && firstPage.meta) || {};
    var total = typeof meta.total === 'number' ? meta.total : (firstPage.data || []).length;
    if (!total) return { strategy: strategy, json: null };

    var lastPage = meta.last_page || 1;
    var upper = Math.max(1, Math.min(lastPage, MAX_PAGE_SAMPLE));
    var page = Math.floor(Math.random() * upper) + 1;
    if (page === 1) return { strategy: strategy, json: firstPage };
    return fetchJson(base + '&page=' + page, signal).then(function (json) {
      return { strategy: strategy, json: json };
    });
  });
}

// Try requested strategy first; if it yields nothing, widen along the chain.
function fetchWithFallback(strategy, signal) {
  return fetchByStrategy(strategy, signal).then(function (result) {
    if (result.json) return result;
    var next = FALLBACK_CHAIN[result.strategy];
    if (!next) return result;
    console.warn('Wallhaven: empty result for ' + result.strategy + ', fallback to ' + next);
    return fetchWithFallback(next, signal);
  });
}

function toFriendlyError(err) {
  if (!err) return 'unknown';
  if (err.name === 'AbortError') return '请求超时，请稍后再试';
  if (err.code === 'RATE_LIMITED') return '请求过于频繁，请稍后再试';
  return err.message || 'unknown';
}

chrome.runtime.onMessage.addListener(function (m, _s, r) {
  if (!m || m.type !== 'fetch-wallhaven') return;

  var requested = m.strategy && VALID_TOP_RANGES.indexOf(m.strategy) >= 0
    ? m.strategy
    : '1M';

  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, REQUEST_TIMEOUT_MS);

  fetchWithFallback(requested, ctrl.signal)
    .then(function (result) {
      var pick = result.json ? pickRandomFromList(result.json.data || []) : null;
      if (!pick) {
        r({ error: '当前条件下暂无符合的壁纸' });
        return;
      }
      var thumb = (pick.thumbs && (pick.thumbs.large || pick.thumbs.original || pick.thumbs.small)) || pick.path;
      r({
        id: pick.id,
        url: pick.path,
        thumb: thumb,
        resolution: pick.resolution || (pick.dimension_x + 'x' + pick.dimension_y),
        requestedStrategy: requested,
        actualStrategy: result.strategy,
      });
    })
    .catch(function (err) {
      console.error('Wallhaven fetch error:', err);
      r({ error: toFriendlyError(err) });
    })
    .finally(function () { clearTimeout(timer); });

  return true;
});
`

writeFileSync(resolve(dist, 'background.js'), bgCode)

const manifestPath = resolve(dist, 'manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
manifest.background = { service_worker: 'background.js' }
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
console.log('postbuild: background.js added to manifest')
