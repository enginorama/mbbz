# Architecture review — issue tracker

This file tracks architectural problems identified in the codebase, their priority, and
their status. Update statuses as work proceeds. `[ ]` = open, `[x]` = done.

## High priority

### A1. No concept of an "active connection"

The entire data path hangs off two module-scope global event buses
(`exStationInputBus`, `exStationOutputBus`) plus a parsed-packet bus. Transports and the
`CommandStation` client subscribe to these globals independently.

- Every transport does `outputBus.on(...)` (`useWebSocketTransport.ts`, `provideWebSerialTransport.ts`,
  `provideTauriSerialTransport.ts`, `provideUdpMulticastTransport.ts`).
- `CommandStation` emits to the same `outputBus` (`CommandStation.ts:294`).
- If two transports are connected at once, every command is written to both.
- `transportStatusStore.isConnected` is `some(connected)` — true if *any* transport is up.

**Status:** [x] done — see `Done` section below.

### 2. CommandStation is a global singleton, untestable

`useCommandStation()` returns `new CommandStation()` at module scope. Not a Pinia store, not
provided/injected, not tied to a connection, and talks to global buses.

- ~~Cannot be mocked in tests.~~ Now injectable via `provideCommandStation`/`useCommandStation`.
- Now decoupled from the transport layer — it takes the raw `ConnectionIo` surface via its
  constructor.
- Duplicate `RosterEntry` types: `CommandStation.getRosterEntries()` returns `{address,name}`,
  `useRosterStore` defines a different `{address,name,functionMap}` and is never populated.

**Status:** [x] done for testability/injection — the station is provided with the manager wired
in. The duplicate `RosterEntry` types and empty `roster` store remain open.

### 3. No single outbound choke point → response-correlation race

`CommandStation` serializes its own queries through a `Queue` and content-matches responses
via `sendAndWaitForResponse`. Other callers bypass the queue and `outputBus.emit` directly:
`CommandStationInfoCard.vue:42`, `logs.vue:38`, `exrail.vue`. A direct emit interleaving with a
queued query can corrupt correlation and cause spurious timeouts.

**Status:** [x] done — two outbound paths. **Queued**: every command that makes the station reply
(`<JR>/<JT>/<R>` reads, `<S>/<Q>` sensor list/values, `<JG>/<JI>` current, `<!Q>` pause-status,
`sendAndWaitForResponse`, `sendAndCollectResponses`) — even though some are only *refreshes* and
aren't awaited, they still elicit data and must stay serialized so responses stay ordered and the
station isn't flooded. **Immediate**: pure control with no reply (throttle via `useCab`, emergency
stop, pause/resume), which must never be blocked behind a slow correlated read. Correlation stays
safe because queued waits match on distinct packet content.

### 4. Two divergent parsing pipelines

- Serial & UDP use the streaming char-by-char `ExNativeNormalizer`.
- WebSocket emits raw `event.data` and relies on the whole-string regex `ExNativeTokenizer`
  (`/<(.*?)>/g`), which is not streaming-safe (split/multi-frame commands break it).
- `sendAndWaitForResponse` subscribes to the tokenized packet bus; the WebSocket path tokenizes
  per-frame — inconsistent boundary between transports.

**Status:** [x] done — all transports now feed one shared decoder (normalizer + tokenizer) owned by
the `CommandStation`, so streaming/WebSocket input is decoded identically regardless of transport.

### 5. Parser dispatch is a linear if-else with overlapping matching

`provideCommandStationStatusSync.ts` runs a chain of `if (parseX(...))` checks. Matching is
duplicated/overlapping (`parseSensorStatus` matches `Q`/`q` 1 param; `getSensorList` matches `Q`
3 params; `parseTrackPower` matches `p1`/`p0`). Two subsystems content-match the same global
input bus. No command registry/dispatcher.

**Status:** [x] done — decoding is now centralized. A `parseCommand` dispatcher (parser list +
discriminated `ParsedCommandResult` union) replaces the linear if/else chain in
`provideCommandStationStatusSync`, fixing the `0`/`false` truthiness bug. The `CommandStation`
correlation matchers were extracted into shared decoders (`parseCommandResponses.ts` —
`parseRosterAddressList`, `parseRosterEntry`, `parseTurnoutIdList`, `parseTurnoutEntry`,
`parseCvValue`, `parseSensorDefinition`), so the `Q` value (1-param) vs `Q` list (3-param)
collision now has two distinct named decoders instead of two ad-hoc matchers in separate places.

### 6. Inconsistent state architecture

State is spread across four mechanisms with no clear layering:

1. Module-scope `Symbol`-keyed event buses.
2. Module-scope singletons outside Pinia (`useConnectionLogger`, `useCommandStation`).
3. Pinia stores (`transportStatus`, `cabStates`, `commandStationStatus`, `roster`).
4. ~~provide/inject for transports.~~

- Note: `ConnectionManager` and `CommandStation` are provided/injected and decoupled via the raw
  `ConnectionIo` surface (`send`/`onData`/`onReset`). `useCvStore` no longer depends on the station
  — its actions moved to the `useCvActions` composable. The global packet bus is gone entirely;
  `CommandStation` owns decoding + dispatch (`onPacket`/`onCommand`). `useConnectionLogger` remains
  a module singleton.

**Status:** [ ] open

## Lower priority

### 7. Transport-status keys are magic strings

`transportStatusStore.setStatus('webSocket'/'webSerial'/'tauriSerial'/'udpMulticast')` on a plain
`Record<string, ...>`. No enum/union type; a typo silently creates an untracked key.

**Status:** [x] done — `useTransportStatusStore` now keys on the existing `TransportId` union from
`types.ts` (`Partial<Record<TransportId, TransportStatus>>`) and `setStatus` accepts `TransportId`,
so a typo is a compile error instead of silently creating an untracked key. The status literal is
typed via a `TransportStatus` union.

### 8. Router history ignores Tauri

`main.ts` uses `createWebHistory` unless `VITE_GITHUB_PAGES` or `VITE_ELECTRON` is set. The Tauri
native build sets neither, so it gets `createWebHistory`, which typically breaks deep-links/refresh
on the custom `tauri://` protocol.

**Status:** [x] done — `main.ts` now uses `isTauri()` from `@tauri-apps/api/core` (the same detection
used by `tauriMdns.ts`/`tauriUdpMulticast.ts`) alongside the existing env flags, so the Tauri native
build gets `createWebHashHistory` instead of `createWebHistory`. Tauri v2 serves the SPA over the
custom `tauri://` protocol with no path rewriting, so hash history is required for deep-links/refresh.

### 9. Minor issues

- `new Queue(5)` — ctor param named `delayBetweenTasksMs`; this is a 5 ms delay, not a concurrency
  limit; misleading naming.
- Duplicated `toast.error` + `console.error` in every provider; some serial open errors silently swallowed.
- i18n is partial: `sensors.vue` uses `$t(...)`, most pages hardcode English.
- UDP provider carries a special case for a backend listener surviving a page reload — the transport
  lifecycle doesn't fit a clean connect/disconnect façade.

**Status:** [ ] open

## Proposed direction

1. Introduce a single **`Connection`** concept (one transport + the request/response pipeline);
   replace broadcast buses with routing through the active connection; make `CommandStation` take a connection.
2. Make `CommandStation` injectable (Pinia store or factory) instead of a module singleton.
3. Merge the two parsers behind one **stream decoder + command registry** shared by all transports.
4. Route every outbound command through the `Queue` (remove direct `outputBus.emit` from components).
5. Type transport keys as an enum/union; fix the status store.
6. Unify `RosterEntry`; fix router history for Tauri; name the `Queue` delay constant.

## Done

### CommandStation owns the protocol layer (`CommandStation.ts`)

- `CommandStation` now owns decoding and packet dispatch. Its constructor builds the shared
  `ExNativeNormalizer` + tokenizer over the raw `ConnectionIo` surface (`onData`/`onReset`) and
  exposes `onPacket(listener)` (all packets) and `onCommand(cmd, listener)` (scoped).
- `setupCabStateSync` and `provideCommandStationStatusSync` subscribe through it; both return
  unsubscribes wired into `App.vue`'s `onUnmounted`.
- Correlation matchers use the shared decoders (`parseCommandResponses.ts`).

### ConnectionIo decoupling

- `ConnectionManager` is now purely transport orchestration: single active connection,
  `connect(id)` disconnects any previous one, `send` writes to the active transport. It exposes a
  raw `ConnectionIo` (`send`/`onData`/`onReset`) and returns `{ manager, io }` from
  `provideConnectionManager`.
- `CommandStation` depends only on `ConnectionIo` — it never touches the transport layer.
- `provideCommandStation(station)` takes a pre-built instance (no default), keeping the provider
  free of connection-layer coupling.

### A1 — active-connection routing

Transports are pure `DccTransport` adapters (`types.ts`) registered with a central
`ConnectionManager`; only one connection is ever active/open. The old global event buses are gone
(`ExEventBus` deleted). `TransportId` (in `types.ts`) also lays groundwork for item 7 —
`useTransportStatusStore` still uses magic strings.

### Packet dispatch & dispatch robustness

- `dispatchPacket` snapshots listener sets before iterating, so listener add/remove during
  dispatch only affects the next packet (tested).
- The `ExNativeNormalizer` buffer is reset on transport connect/disconnect/switch (tested).