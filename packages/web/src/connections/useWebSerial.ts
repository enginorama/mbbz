import { ref } from 'vue';

export type WebSerialConfig = {
  port: SerialPort;
};

export function useWebSerial(callback: (msg: string) => void) {
  let port: SerialPort | null = null;
  let outputStream: WritableStream<string> | null = null;
  let outputDone: Promise<void> | null = null;
  let inputDone: Promise<void> | null = null;
  let inputStream: ReadableStream<string> | null = null;
  let reader: ReadableStreamDefaultReader<string> | null = null;

  const connected = ref(false);
  const isSupported = ref(false);

  if ('serial' in navigator) {
    isSupported.value = true;
    navigator.serial.addEventListener('disconnect', (e) => {
      if (e.target === port) {
        connected.value = false;
        void close();
      }
    });
  }

  return { open, close, getPorts, writeToStream, connected, isSupported };

  async function open(config?: WebSerialConfig): Promise<boolean> {
    const autoConnectPort = config?.port;
    if (!isSupported.value) return false;
    if (connected.value) return true;
    try {
      port = autoConnectPort ?? (await navigator.serial.requestPort());
    } catch (e) {
      console.error('Web Serial port request error:', e);
      throw e;
    }

    await port.open({
      baudRate: 115200,
    });
    await port.setSignals({ dataTerminalReady: false, requestToSend: false });

    const encoder = new TextEncoderStream();
    if (!port.writable) return false;
    outputDone = encoder.readable.pipeTo(port.writable);
    outputStream = encoder.writable;

    // To put the system into a known state and stop it from echoing back the characters that we send it,
    // we need to send a CTRL-C and turn off the echo
    await writeToStream('\x03', 'echo(false);');

    // Create an input stream and a reader to read the data. port.readable gets the readable stream
    // DCC++ commands are text, so we will pipe it through a text decoder.
    const decoder = new TextDecoderStream();
    if (!port.readable) return false;
    inputDone = (port.readable as unknown as ReadableStream<BufferSource>).pipeTo(decoder.writable);
    inputStream = decoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer())); // added this line to pump through transformer
    reader = inputStream.getReader();
    connected.value = true;
    void readLoop();
    return true;
  }

  async function close() {
    if (reader) {
      await reader.cancel(); // .cancel is asynchronous so must use await to wait for it to finish
      await inputDone?.catch(() => {});
      reader = null;
      inputDone = null;
    }

    // Close the output stream.
    if (outputStream) {
      await outputStream.getWriter().close();
      await outputDone; // have to wait for  the azync calls to finish and outputDone to close
      outputStream = null;
      outputDone = null;
    }
    // Close the serial port.
    await port?.close();
    port = null;
    connected.value = false;
  }

  async function writeToStream(...lines: Array<string>) {
    const writer = outputStream?.getWriter();
    if (!writer) return;
    for (const line of lines) {
      await writer.write(`${line}` + '\n');
      if (line === '\x03' || line === 'echo(false);') {
        // noop
      } else {
        // whatever
      }
    }
    writer.releaseLock();
  }

  async function readLoop() {
    while (reader) {
      const { value, done } = await reader.read();
      if (value) {
        callback(value);
      }
      if (done) {
        reader.releaseLock();
        break;
      }
    }
  }

  async function getPorts(): Promise<SerialPort[]> {
    if (!isSupported.value) return [];
    return await navigator.serial.getPorts();
  }
}

class LineBreakTransformer implements Transformer<string, string> {
  private container = '';

  public transform(chunk: string, controller: TransformStreamDefaultController<string>) {
    // Handle incoming chunk
    this.container += chunk; // add new data to the container
    const lines = this.container.split('\n'); // look for line breaks and if it finds any
    this.container = lines.pop() ?? ''; // split them into an array
    lines.forEach((line) => controller.enqueue(line)); // iterate parsed lines and send them
  }

  public flush(controller: TransformStreamDefaultController<string>) {
    // When the stream is closed, flush any remaining data
    controller.enqueue(this.container);
  }
}
