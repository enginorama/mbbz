export type WebSerialConfig = {
  port: SerialPort;
};

export type WebSerialConnectionStatus = 'connected' | 'disconnected';

export class ExWebSerial {
  private port: SerialPort | null = null;
  private outputStream: WritableStream<string> | null = null;
  private outputDone: Promise<void> | null = null;
  private inputDone: Promise<void> | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;

  public static get isSupported() {
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
    if (ExWebSerial.isSupported) {
      navigator.serial.addEventListener('disconnect', this.handleDisconnect);
    }
  }

  public async open(config?: WebSerialConfig): Promise<boolean> {
    const autoConnectPort = config?.port;
    if (!ExWebSerial.isSupported) return false;
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
    try {
      await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
    } catch (e) {
      // Some implementations may not support setSignals; ignore failures
      console.warn('setSignals not supported or failed:', e);
    }

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
    this.reader = decoder.readable.getReader();
    this.setConnected(true);
    void this.readLoop();
    return true;
  }

  public async close() {
    if (this.reader) {
      try {
        await this.reader.cancel();
        await this.inputDone?.catch(() => {});
      } catch (e) {
        console.warn('Error cancelling reader:', e);
      }
      this.reader = null;
      this.inputDone = null;
    }

    if (this.outputStream) {
      try {
        const writer = this.outputStream.getWriter();
        await writer.close();
        writer.releaseLock();
        await this.outputDone;
      } catch (e) {
        console.warn('Error closing output stream:', e);
      }
      this.outputStream = null;
      this.outputDone = null;
    }

    try {
      await this.port?.close();
    } catch (e) {
      console.warn('Error closing port:', e);
    }
    this.port = null;
    if (ExWebSerial.isSupported) {
      try {
        navigator.serial.removeEventListener('disconnect', this.handleDisconnect);
      } catch {
        // ignore
      }
    }
    this.setConnected(false);
  }

  public async writeToStream(...lines: Array<string>) {
    const writer = this.outputStream?.getWriter();
    if (!writer) return;
    try {
      for (const line of lines) {
        await writer.write(`${line}` + '\n');
      }
    } catch (e) {
      console.warn('Error writing to stream:', e);
    } finally {
      try {
        writer.releaseLock();
      } catch {}
    }
  }

  public async readLoop() {
    while (this.reader) {
      const { value, done } = await this.reader.read();
      if (value) {
        this.onDataCallback(value);
      }
      if (done) {
        try {
          this.reader.releaseLock();
        } catch {}
        this.reader = null;
        break;
      }
    }
  }

  public async getPorts(): Promise<SerialPort[]> {
    if (!ExWebSerial.isSupported) return [];
    return await navigator.serial.getPorts();
  }

  private setConnected(connected: boolean) {
    this.connected = connected;
    const status: WebSerialConnectionStatus = connected ? 'connected' : 'disconnected';
    this.onConnectionStatusChange(status);
  }

  private handleDisconnect = (e: Event) => {
    if (e?.target === this.port) {
      this.setConnected(false);
      void this.close();
    }
  };
}
