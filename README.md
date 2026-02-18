```
 ██╗    ██╗██╗  ██╗ ██████╗  █████╗ ███╗   ███╗██╗
 ██║    ██║██║  ██║██╔═══██╗██╔══██╗████╗ ████║██║
 ██║ █╗ ██║███████║██║   ██║███████║██╔████╔██║██║
 ██║███╗██║██╔══██║██║   ██║██╔══██║██║╚██╔╝██║██║
 ╚███╔███╔╝██║  ██║╚██████╔╝██║  ██║██║ ╚═╝ ██║██║
  ╚══╝╚══╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝
```

# whoami

> A dark, terminal-themed interactive portfolio by **Leminkozey**. No frameworks. No build tools. Just raw HTML, CSS & JavaScript.

[![Live Demo](https://img.shields.io/badge/demo-live-00ffc8?style=flat-square&logo=github)](https://leminkozey.me)

---

## Features

| Feature | Description |
|---------|-------------|
| **Boot Sequence** | Terminal-style boot animation on page load (press any key to skip) |
| **3D Hero** | Rotating wireframe icosahedron with particle field (Three.js) |
| **Interactive Terminal** | Type commands like `whoami`, `skills`, `projects`, `neofetch` |
| **Ghost Autocomplete** | Type 2+ characters and see inline suggestions, complete with Tab or Enter |
| **Typing Sound** | Mechanical keyboard click sound via Web Audio API (with mute toggle) |
| **GitHub Contributions** | Live contribution graph fetched from GitHub API |
| **Visitor Counter** | Cookie-based unique visitor count displayed in the header |
| **Easter Eggs** | Konami code, `sudo rm -rf /`, `matrix`, `winget moo`, 5x logo click, and more |
| **Scroll Animations** | Sections fade in as you scroll |
| **Responsive** | Works on mobile, tablet, and desktop |

## Tech Stack

```
HTML ──────── structure
CSS ────────── styling & animations
JS ─────────── interactivity & terminal logic
Three.js ────── 3D wireframe hero (via CDN)
Web Audio API ── typing sound effects
```

Zero dependencies. Zero build steps. Open `index.html` and go.

## Quick Start

```bash
git clone https://github.com/leminkozey/whoami.git
cd whoami
open index.html
```

## Terminal Commands

```
whoami       — who am I?
about        — learn more about me
skills       — technical skills
projects     — things I've built
contact      — get in touch
experience   — work & training
education    — where I'm learning
banner       — ASCII art
neofetch     — system info
clear        — clear terminal
```

**Hidden commands:** `sudo rm -rf /`, `hack`, `matrix`, `vim`, `coffee`, `ping`, `42`, `ls`, `cat readme.md`, `winget moo`, `exit`

## Easter Eggs

- **Konami Code** — press `↑↑↓↓←→` for Matrix rain
- **`matrix`** — type it in the terminal for a digital rain overlay
- **`sudo rm -rf /`** — go ahead, try it
- **`winget moo`** — have you mooed today?
- **`vim`** — good luck exiting
- **Logo click x5** — click the logo 5 times fast for a glitch surprise

## Project Structure

```
whoami/
├── index.html       # single page structure
├── css/
│   └── style.css    # dark terminal aesthetic
├── js/
│   └── script.js    # boot, terminal, 3D, easter eggs
├── assets/          # favicon, og-image, icons
├── server.js        # static file server + visitor counter API
└── README.md        # you are here
```

## About Me

17y old IT trainee (Fachinformatiker Anwendungsentwicklung) from Germany. I build self-hosted tools and web apps:

- **[Lemin-kanban](https://github.com/leminkozey/Lemin-kanban)** — Kanban board with Next.js, TypeScript, SQLite, MCP server
- **[Netzwerk-Manager](https://github.com/leminkozey/Netzwerk-Manager)** — Self-hosted network dashboard with WoL, SSH, Pi-hole
- **[OfflineWiki](https://github.com/leminkozey/OfflineWiki)** — Local Wikipedia archive with Kiwix & Docker

## License

MIT — do whatever you want with it.

---

<p align="center">
  <sub>built with raw HTML, CSS & JS — no frameworks were harmed</sub>
</p>
