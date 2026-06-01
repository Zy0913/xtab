# Tab

A minimal, macOS-style Chrome new tab extension. Built with React + Vite.

## Features

- Clean macOS aesthetic — frosted glass cards, SF system font, light/dark follows system
- Search across Google, Bing, Baidu, DuckDuckGo with autocomplete suggestions
- Large clock + date
- Customizable website shortcuts with auto-fetched favicons
- Weather via Open-Meteo (no API key needed)
- Simple todo list
- Chrome bookmarks tree
- **Drag & drop layout** — rearrange and resize every widget
- Wallpaper: built-in presets, custom upload, daily random from Unsplash
- Import/export config as JSON

All data stored locally via `chrome.storage.local` — no accounts, no cloud.

## Install (dev)

```bash
npm install
npm run build
```

Then in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `dist/` folder
4. Open a new tab

For hot-reloaded development:

```bash
npm run dev
```

Load the `dist/` folder once; subsequent rebuilds auto-refresh the new tab page.

## Keyboard shortcuts

| Key                       | Action                          |
| ------------------------- | ------------------------------- |
| `/`                       | Focus search                    |
| `e`                       | Toggle edit (layout) mode       |
| `Shift+T`                 | Add shortcut from open tabs     |
| `,`                       | Toggle settings drawer          |
| `?`                       | Toggle keyboard shortcut help   |
| `Esc`                     | Close dialog / blur input       |
| `↑` / `↓`                 | Move through search suggestions |
| `⌘↩ / Ctrl+↩` (in search) | Open results in a new tab       |

## Project structure

```
src/
├── newtab/           # Entry HTML + React root
├── components/
│   ├── layout/       # Dashboard grid, widget frame
│   ├── widgets/      # SearchBar, Clock, Shortcuts, Weather, Todo, Bookmarks
│   ├── settings/     # Settings drawer + sections
│   └── ui/           # Button, Dialog, Drawer, Input
├── store/            # Zustand stores + chrome.storage adapter
├── lib/              # Helpers (search, theme, wallpapers, …)
├── styles/           # Tailwind + CSS variables
└── types/            # Shared TS types
```

## License

MIT
