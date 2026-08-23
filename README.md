# mbbz

An interface for managing and controlling a [DCC-EX](https://dcc-ex.com/) command station.

mbbz talks to your DCC-EX command station over multiple transports and runs on
desktop, mobile and in the browser from the same codebase, using Tauri for native
packaging (Windows, Linux, macOS, Android, iOS) alongside a web build.

## What it does

A live control surface for your model-railway layout. It speaks the DCC-EX native
protocol (`<...>` command strings) and provides:

- **Cabs** — manage your locomotive roster (addresses & names) on the command station.
- **Throttle** — drive a loco: direction, speed, and all 29 function keys.
- **CVs** — read and write Configuration Variables, with an analyser that names and
  describes known CVs from a manufacturer database.
- **Sensors** — list, add and read block/occupancy sensors from the command station.
- **Turnouts** — manage your track switches (points).
- **EXRAIL** — work with EXRAIL automations on your layout.
- **Logs** — a live view of the raw serial protocol traffic (in/out).
- **Benchmark** — a latency/throughput test for the active connection.
- **Command-station dashboard** — a card overview of connection status and
  command-station info, with an mDNS scanner to discover stations on your network.

## Connections

Depending on the platform, different transports are available for talking to the
command station:

| Transport        | Browser (web) | Tauri desktop/mobile | Notes                                  |
|------------------|---------------|----------------------|----------------------------------------|
| **WebSocket**    | ✅             | ✅                    | Default endpoint `ws://dccex.local:2560`, DCC-EX subprotocol |
| **Serial**       | ✅ (Web Serial) | ✅ (native `serialport`) | Browser uses the Web Serial API; native uses a Rust `serialport` backend |
| **UDP multicast**| ❌             | ✅                    | Native only, via a Tauri Rust command |
| **mDNS discovery**| ❌            | ✅                    | Native only; scans `_dcc-ex`, `_withrottle`, `_http` and any other service types |

The capability of each transport is auto-detected and disabled where unsupported
(`isTauri()` / presence of `navigator.serial`). Multiple transports share a single
command-station abstraction, so features work the same regardless of how you connect.

The native (Tauri) backend is implemented in Rust in `src-tauri/` and exposes commands
for serial I/O (`list_serial_ports`, `open_serial_port`, …), mDNS discovery, and UDP
multicast. In the browser, serial is handled through the Web Serial API.

## Project layout

```
src/
  commandstation/     CommandStation client, roster, status sync
  connections/        Transports (websocket, serial, udpMulticast), event bus, logging
  ex-native/          DCC-EX protocol tokenizer + response parsers
  cabs/               Cab state + function/speed sync
  cvs/                CV table and CV analyser (with manufacturer database)
  sensors/            Sensor list & store
  pages/              UI pages (dashboard, throttle, cabs, cvs, sensors, turnouts, …)
  core/               Reusable UI components (shadcn-vue style)
src-tauri/            Tauri/Rust backend (serial, mDNS, UDP multicast)
```

## Technology

- [Vue 3](https://vuejs.org/) + [Vite](https://vite.dev/), TypeScript
- [Tauri 2](https://tauri.app/) (Rust backend) — native packaging for desktop & mobile
- [Pinia](https://pinia.vuejs.org/) with persisted state, [Vue Router](https://router.vuejs.org/),
  [VueUse](https://vueuse.org/), vue-i18n
- Tailwind CSS 4 + reka-ui (shadcn-style components)
- Vitest for tests; oxlint / eslint / oxfmt for linting and formatting

## Building and running

Prerequisites: Node.js 20+ (or 22+) and, for the native desktop/mobile builds, the
[Rust](https://www.rust-lang.org/) toolchain and platform prerequisites from the
[Tauri docs](https://v2.tauri.app/start/prerequisites/).

```sh
npm install

# Web (Vite dev server with HMR)
npm run dev

# Type-check
npm run typecheck

# Run unit tests
npm run test

# Lint / format
npm run lint
npm run format

# Production web build
npm run build

# Native desktop app (Tauri)
npm run tauri dev     # develop
npm run tauri build   # package
```

The web build is also deployable as a static site (the repo ships a GitHub Actions
workflow that publishes the web app to GitHub Pages on pushes to `main`).

## Documentation

Additional design notes live in `docs/`:

- `native-serial-transport.md` — the Tauri/Rust serial transport and its locking model.
- `web-serial-firefox-windows.md` — a Web Serial quirk on Firefox + Windows + CH340.
- `electron.md` — notes about an alternative Electron desktop build target.

## License

MIT — see [LICENSE](LICENSE).