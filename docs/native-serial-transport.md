# Native serial transport (Tauri)

Alongside the browser Web Serial transport (`ExWebSerial.ts`), the app has a native
serial transport for running inside the Tauri shell, where `navigator.serial` isn't
available.

- Rust commands: `src-tauri/src/lib.rs` (`list_serial_ports`, `open_serial_port`,
  `close_serial_port`, `write_serial_port`)
- Frontend: `src/connections/transports/serial/ExTauriSerial.ts`,
  `useTauriSerial.ts`, `provideTauriSerialTransport.ts` — mirrors the shape of the
  Web Serial transport (`open`/`close`/`writeToStream`/`getAvailablePorts`).

## The locking gotcha

The port is shared between a background reader thread and the `write_serial_port`
command via a single `Arc<Mutex<Box<dyn SerialPort>>>`. Two things are load-bearing
here and easy to regress:

1. **One shared OS handle, not two.** An earlier version used `port.try_clone()` to
   give the reader thread its own handle. That caused intermittent multi-second
   stalls on our hardware (Windows, USB-serial adapter) — likely a driver-level quirk
   with two concurrently open handles to the same COM port. A single handle sidesteps
   it entirely.
2. **Never `.lock()`, always `.try_lock()` + a short sleep on contention/empty reads.**
   Both the reader loop and `write_serial_port` poll with `try_lock()` and back off
   with `thread::sleep(1ms)` when they don't get it. Naively holding a blocking `.lock()`
   in the reader (even with `try_clone()` removed) starves the writer — the reader's
   tight lock→read→unlock loop wins the re-acquire race almost every time, so
   `write_serial_port` can spin for its whole timeout. The 1ms sleep is what gives the
   other side a real chance to grab the lock. This applies to the "no data" case too,
   not just a failed `try_lock()` — skipping that sleep reproduces the starvation.

If you're touching this code and reliability regresses again (writes intermittently
timing out, or responses arriving many seconds late), check both of the above first.

## Line-based read batching

The reader thread doesn't forward every raw `read()` chunk to the frontend as its own
message. Our protocol is line-oriented (`<...>\n`), so incoming bytes are accumulated
into a `pending` buffer and only flushed once it contains a trailing `\n` — this avoids
ever forwarding a mid-line fragment (e.g. a lone `<` split across two physical reads)
without adding latency, since we flush the instant a line completes rather than on a
fixed timer.

A `PARTIAL_LINE_FLUSH_IDLE_MS` (10ms) idle fallback flushes whatever's pending even
without a trailing `\n` if no new bytes arrive for that long — this is only meant to
catch malformed/partial output (e.g. boot noise from a microcontroller resetting) so a
stray fragment can't get stuck in the buffer forever; it should essentially never
trigger during normal operation.

## Alternative: `tauri-plugin-serialplugin`

[s00d/tauri-plugin-serialplugin](https://github.com/s00d/tauri-plugin-serialplugin)
(`tauri-plugin-serialplugin` crate + `tauri-plugin-serialplugin-api` npm package) is a
much more full-featured, actively maintained serial plugin — port hotplug watching, AT
command sessions, CMUX, auto-reconnect, binary I/O, and more. It uses the same
`serialport` crate we do on desktop.

We benchmarked it during a debugging session and it performed reliably (same
try-lock/backoff pattern we ended up copying into our own code, see above). We didn't
adopt it outright since our needs are simple (open/write/watch/list), but if this
bespoke implementation ever needs more capability than it's worth maintaining
ourselves, or the locking bug above resurfaces in a way that's hard to track down,
this plugin is a validated drop-in option worth reaching for instead of continuing to
hand-roll it.
