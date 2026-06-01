---
name: testing-xtab-extension
description: End-to-end test the xtab Chrome newtab extension by loading dist/ as an unpacked extension and exercising widgets, keyboard shortcuts, and the Wallhaven service worker. Use when verifying any UI, shortcut, or wallpaper changes in xtab.
---

# Testing the xtab Chrome extension end-to-end

xtab is a Manifest V3 Chrome extension that overrides the new tab page. End-to-end tests must run against a real Chrome instance with the extension loaded — unit tests in `vitest` only cover logic, not the SW message bus, the manifest declaration, or the actual keyboard event delivery.

## Build and load

```bash
cd /home/ubuntu/repos/xtab
npm install            # if not already
npm run build          # produces dist/
```

Restart Chrome with `--load-extension=/home/ubuntu/repos/xtab/dist` appended (comma-separated to keep existing extensions like adblock):

```bash
# Save the original Chrome cmdline (from `pgrep -af 'chrome --disable-field'`) into a script,
# then add the xtab dist path to --load-extension and relaunch.
```

Open a fresh tab — the xtab page should appear. If the old tab still shows the default NTP, the extension was loaded _after_ that tab was created; close it and open a new one.

Verify the extension actually loaded at `chrome://extensions` (Developer mode ON). The "Tab" extension's **Details** page is also where you verify the manifest's `permissions` list — Chrome translates them into human labels (e.g., `geolocation` → "Detect your physical location").

## The omnibox-steals-keys problem (important)

On Chrome's NTP-like pages (including xtab), pressing bare letter keys with `xdotool` or the computer-use `key` action sends them to Chrome's **omnibox**, not to the page. This is a long-standing Chrome NTP behavior — the address bar auto-focuses and intercepts keystrokes for search-as-you-type. It is NOT a bug in the extension.

Workaround: dispatch keyboard events directly to the page over CDP. Chrome's remote debugging port is exposed at `http://localhost:29229`. Use Playwright's `connect_over_cdp` plus an `Input.dispatchKeyEvent` for keys that need shift state.

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp("http://localhost:29229")
    ctx = browser.contexts[0]
    newtab = next(pg for pg in ctx.pages if "newtab/index.html" in pg.url)
    newtab.bring_to_front()
    newtab.evaluate("() => document.body.focus()")
    cdp = ctx.new_cdp_session(newtab)

    # Plain key — page.keyboard.press works
    newtab.keyboard.press("e")

    # Shift+symbol — page.keyboard.press("?") sends shift=false; page.keyboard.press("Shift+/") sends key='/'
    # Use CDP directly to get the proper (key='?', shiftKey=true) combo:
    cdp.send("Input.dispatchKeyEvent", {"type": "keyDown", "key": "Shift", "code": "ShiftLeft", "modifiers": 8, "windowsVirtualKeyCode": 16})
    cdp.send("Input.dispatchKeyEvent", {"type": "keyDown", "key": "?", "code": "Slash", "modifiers": 8, "text": "?", "unmodifiedText": "/", "windowsVirtualKeyCode": 191})
    cdp.send("Input.dispatchKeyEvent", {"type": "keyUp", "key": "?", "code": "Slash", "modifiers": 8, "windowsVirtualKeyCode": 191})
    cdp.send("Input.dispatchKeyEvent", {"type": "keyUp", "key": "Shift", "code": "ShiftLeft", "windowsVirtualKeyCode": 16})
```

## DOM probes (preferred over screenshots for state checks)

Most runtime state can be probed via `newtab.evaluate()`. Stable selectors:

- Edit mode header: `button[aria-label="编辑布局"]` (off) vs `button[aria-label="完成编辑"]` (on). Easier: look for any button whose `aria-label` contains 编辑 or 完成.
- Search input focused: `document.activeElement?.tagName === 'INPUT'`.
- Keyboard help dialog: `document.querySelector('[role="dialog"][aria-label="键盘快捷键"]')`.
- Settings drawer: `document.querySelector('aside[aria-label="设置"]')` — note this stays in DOM even when closed (translates off-screen). Check `getComputedStyle(el).transform` to tell open vs closed.
- Wallpaper URL: look for a div with `style.backgroundImage` containing `url(`. After a random fetch the URL is a `blob:chrome-extension://…` (the extension caches Wallhaven images to blob URLs).

Clock test: sample `main.textContent` for `(\d{2}):(\d{2})(\d{2})` over ~5s. HH:MM must stay stable while seconds advance.

## Wallhaven SW test

The critical regression check for any change to the service worker. Open settings drawer (`button[aria-label="打开设置"]`), click a rank button (日榜/周榜/月榜/年榜), then click `button:has-text("随机排行榜")`. Wallpaper URL should change within ~10s. If it stays the same or a toast appears, the SW message handler didn't respond — check `chrome://extensions` → Details → "Inspect views: service worker" for errors.

## Recording tips

Maximize the window before recording:

```bash
sudo apt-get install -y wmctrl 2>/dev/null
wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
```

Annotate boundaries with `annotate_recording`:

- `setup`: when loading the extension or opening settings.
- `test_start`: one per assertion in 'It should …' form.
- `assertion`: `passed`/`failed`/`untested` with a one-line description of what was checked.

## Devin Secrets Needed

None. The extension's only external endpoints (Wallhaven, Open-Meteo, DuckDuckGo icons) are public.
