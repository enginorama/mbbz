export type WebSerialConfig = {
  port: SerialPort;
};

export type WebSerialConnectionStatus = 'connected' | 'disconnected';

export class ExWebSerial {
  private port: SerialPort | null = null;
  private outputStream: WritableStream<string> | null = null;
  private outputDone: Promise<void> | null = null;
  private inputDone: Promise<void> | null = null;
  private inputStream: ReadableStream<string> | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;

  public get isSupported() {
    return 'serial' in navigator;
  }

  private connected = false;

  private onDataCallback: (msg: string) => void;
  private onConnectionStatusChange: (status: WebSerialConnectionStatus) => void;

  constructor({
    onData,
    onConnectionStatusChange,
  }: {
    onData: (msg: string) => void;
    onConnectionStatusChange: (status: WebSerialConnectionStatus) => void;
  }) {
    this.onDataCallback = onData;
    this.onConnectionStatusChange = onConnectionStatusChange;
    if (this.isSupported) {
      navigator.serial.addEventListener('disconnect', (e) => {
        if (e.target === this.port) {
          this.setConnected(false);
          void this.close();
        }
      });
    }
  }

  public async open(config?: WebSerialConfig): Promise<boolean> {
    const autoConnectPort = config?.port;
    if (!this.isSupported) return false;
    if (this.connected) return true;
    try {
      this.port = autoConnectPort ?? (await navigator.serial.requestPort());
    } catch (e) {
      console.error('Web Serial port request error:', e);
      throw e;
    }

    await this.port.open({
      baudRate: 115200,
    });
    await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });

    const encoder = new TextEncoderStream();
    if (!this.port.writable) return false;
    this.outputDone = encoder.readable.pipeTo(this.port.writable);
    this.outputStream = encoder.writable;

    // To put the system into a known state and stop it from echoing back the characters that we send it,
    // we need to send a CTRL-C and turn off the echo
    await this.writeToStream('\x03', 'echo(false);\n');
    // Create an input stream and a reader to read the data. port.readable gets the readable stream
    // DCC++ commands are text, so we will pipe it through a text decoder.
    const decoder = new TextDecoderStream();
    if (!this.port.readable) return false;
    this.inputDone = (this.port.readable as unknown as ReadableStream<BufferSource>).pipeTo(
      decoder.writable,
    );
    this.inputStream = decoder.readable.pipeThrough(
      new TransformStream(new LineBreakTransformer()),
    );
    this.reader = this.inputStream.getReader();
    this.setConnected(true);
    void this.readLoop();
    return true;
  }

  public async close() {
    if (this.reader) {
      await this.reader.cancel();
      await this.inputDone?.catch(() => {});
      this.reader = null;
      this.inputDone = null;
    }

    if (this.outputStream) {
      await this.outputStream.getWriter().close();
      await this.outputDone;
      this.outputStream = null;
      this.outputDone = null;
    }

    await this.port?.close();
    this.port = null;
    this.setConnected(false);
  }

  public async writeToStream(...lines: Array<string>) {
    const writer = this.outputStream?.getWriter();
    if (!writer) return;
    for (const line of lines) {
      await writer.write(`${line}` + '\n');
    }
    writer.releaseLock();
  }

  public async readLoop() {
    while (this.reader) {
      const { value, done } = await this.reader.read();
      if (value) {
        this.onDataCallback(value);
      }
      if (done) {
        this.reader.releaseLock();
        break;
      }
    }
  }

  public async getPorts(): Promise<SerialPort[]> {
    if (!this.isSupported) return [];
    return await navigator.serial.getPorts();
  }

  private setConnected(connected: boolean) {
    this.connected = connected;
    const status: WebSerialConnectionStatus = connected ? 'connected' : 'disconnected';
    this.onConnectionStatusChange(status);
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
