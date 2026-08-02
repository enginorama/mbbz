# Web Serial on Firefox + Windows + CH340

Symptom: on Windows, Firefox's WebSerial (`ExWebSerial.ts`) can write to a CH340-based
device fine but never receives anything — `reader.read()` resolves immediately with
`{ value: undefined, done: true }` on the very first read, with no `disconnect` event
and no app code closing the port. Reproduces in a bare, framework-free HTML page, so
it isn't caused by anything in this repo. Chrome/Edge and Firefox on Linux are both
unaffected.

Root cause: a Windows Update-pushed CH340 driver regression (version `3.9.2024.9`,
pushed ~December 2024) that spuriously closes the port right after it's opened under
certain conditions. Firefox's WebSerial backend hits this; Chrome's apparently doesn't
(or works around it).

Fix: install the CH341SER driver from
[wch-ic.com/downloads/CH341SER_EXE.html](https://www.wch-ic.com/downloads/CH341SER_EXE.html),
which installs version `4.0.2026.2` — confirmed working. If a future driver update
regresses this again, rolling back to any pre-`3.9` build is the documented fallback.
