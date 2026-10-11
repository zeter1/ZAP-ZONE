**Язык / Language:** [Русский](README.md) · **English**

# ZAP ZONE

ZAP ZONE is a browser-based 3D team FPS built with Three.js/WebGL. You and four allied AI bots fight five enemy bots. Matches are single-player and do not require other players to connect.

## Get started

Download https://github.com/zeter1/ZAP-ZONE/archive/refs/heads/main.zip and extract the whole folder. Open `index.html` in a desktop browser, or start a local server from the project folder:

```sh
python -m http.server 8000
```

Open http://localhost:8000. The game needs JavaScript, WebGL, a keyboard and mouse, and internet access to load Three.js from a CDN. Python is only needed for the optional server. Lower graphics quality if performance is poor.

## Controls

| Action | Input |
|---|---|
| Move / look | `WASD` / mouse |
| Run / crouch / jump | `Shift` / hold `X` / `Space` |
| Fire / scope | Left / right mouse button |
| Reload | `R` |
| Weapon / grenade | `1–9` / `0` |
| Previous weapon | `Q` |
| Mine / bomb | `F` / `G` |
| Pause | `Esc` |

## Features and development

The game includes team tactics, AI roles, weapon handling, ballistics, progression and deployable equipment. See the [architecture](docs/ARCHITECTURE.md), [documentation index](docs/README.md), [verification notes](README.md#проверка) and [change history](CHANGELOG.md). These detailed documents are currently in Russian.

Automated structure and browser boot checks do not prove the full interactive combat experience. Three.js is loaded externally; a fully offline setup requires a local copy of the library.

## Support and security

Report a bug at https://github.com/zeter1/ZAP-ZONE/issues/new?template=bug_report.yml. Include the browser/version, GPU/WebGL environment, graphics settings, weapon or AI scenario, exact steps and a short console excerpt without secrets. Use [SECURITY.md](SECURITY.md) for vulnerability disclosure.

## Developer contacts

- [zeter11@gmail.com](mailto:zeter11@gmail.com)
- [https://t.me/zeter1](https://t.me/zeter1)
- [https://www.linkedin.com/in/zeter/](https://www.linkedin.com/in/zeter/)
- [https://www.facebook.com/zeter1](https://www.facebook.com/zeter1)
- [https://vk.ru/zeter1](https://vk.ru/zeter1)
- [https://www.instagram.com/zeter1992/](https://www.instagram.com/zeter1992/)
- [https://tenchat.ru/zeter](https://tenchat.ru/zeter)
- [https://x.com/zeter1](https://x.com/zeter1)
- [https://www.threads.com/@zeter1992](https://www.threads.com/@zeter1992)
- [https://ok.ru/zeter1](https://ok.ru/zeter1)
- [https://t.me/zeterchat](https://t.me/zeterchat) — Telegram group: about me, projects and chat
