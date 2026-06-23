export class ExNativeNormalizer {
  private state: 'waiting_for_start' | 'parsing_command' = 'waiting_for_start';
  private currentCommandBuffer = '';

  constructor(private callback: (command: string) => void = () => {}) {}

  public parseChunk(data: string, callback: (command: string) => void = this.callback) {
    for (const char of data) {
      if (char === '<') {
        this.state = 'parsing_command';
        this.currentCommandBuffer = '<';
        continue;
      }

      if (this.state === 'parsing_command') {
        if (char === '\n' || char === '\r') {
          this.currentCommandBuffer += ' ';
          continue;
        }
        this.currentCommandBuffer += char;
        if (char === '>') {
          const command = this.currentCommandBuffer;
          this.currentCommandBuffer = '';
          this.state = 'waiting_for_start';
          callback(command);
        }
      }
    }
  }
}
