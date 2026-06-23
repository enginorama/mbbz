# Electron

The app builds as both a GitHub Pages web app and an Electron desktop app from the same Vue source. Two separate Vite configs handle the different targets:

- `vite.config.ts` — web build, `base: '/mbbz/'`, deployed via GitHub Actions
- `electron.vite.config.ts` — Electron build, `base: './'`, outputs to `out/`

Shared plugin config (Vue, Tailwind, VueRouter, VueI18n) lives in `vite.config.shared.ts`.

## Project structure

```
electron/
  main.ts      # main process: window creation, app lifecycle
  preload.ts   # contextBridge IPC bridge (renderer ↔ main)
out/
  main/        # compiled main process
  preload/     # compiled preload
  renderer/    # compiled renderer (HTML/CSS/JS)
release/       # electron-builder output (installers, unpacked)
```

## Scripts

| Script | Description |
|---|---|
| `npm run electron:dev` | Dev mode with HMR (Linux/container) |
| `npm run electron:build` | Compile all three processes |
| `npm run electron:preview` | Preview the compiled build |
| `npm run electron:package` | Build + package with electron-builder |

## Devcontainer setup

The devcontainer (`mcr.microsoft.com/devcontainers/typescript-node:24`) needs additional system packages for Electron's Chromium runtime. These are installed automatically via `postCreateCommand`:

```
libgtk-3-0  libgbm1  libnss3  libnspr4
libatk1.0-0  libatk-bridge2.0-0  libcups2  libdrm2
libxcomposite1  libxdamage1  libxrandr2  libxfixes3
libxext6  libx11-xcb1  libxss1  libxtst6
libasound2  libpango-1.0-0  libgdk-pixbuf-xlib-2.0-0  libgl1
```

`postCreateCommand` also chmods `chrome-sandbox` to `4755` owned by root, which is required for the SUID sandbox.

`runArgs: ["--shm-size=512m"]` is set in `devcontainer.json` because the default 64 MB `/dev/shm` is too small for Chromium's shared memory IPC — font rendering crashes with ENOSPC otherwise.

`electron:dev` passes `--no-sandbox` because Linux kernel user namespaces are not permitted inside the container.

## Windows dev with HMR

The Vite dev server running in the container is accessible from Windows at `localhost:5173` via WSL2's built-in port forwarding. This enables a hybrid workflow:

1. **Container:** `npm run dev` — starts the Vite renderer dev server
2. **Container:** `electron-vite build && electron-builder --win --dir` — builds an unpacked Windows exe (no Wine needed)
3. **Windows:** launch `release\win-unpacked\mbbz.exe` with `ELECTRON_RENDERER_URL=http://localhost:5173` set

Renderer HMR works normally. Main process changes require a rebuild and exe restart.

### Running from the WSL filesystem

The exe can be launched directly from `\\wsl$\...` without copying to a native Windows path. `main.ts` detects UNC paths at startup and applies `--disable-gpu-sandbox` to work around the Windows restriction that blocks the GPU process from launching off a network path:

```ts
if (process.platform === 'win32' && process.execPath.startsWith('\\\\')) {
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}
```
