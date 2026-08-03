export class Queue {
  private queue: Array<() => Promise<unknown>> = [];
  private running = false;

  constructor(private delayBetweenTasksMs: number = 100) {}

  public add<T>(task: () => Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      if (!this.running) {
        this.running = true;
        void this.processQueue();
      }
    });
  }

  private async processQueue() {
    while (this.queue.length > 0) {
      const wrappedTask = this.queue[0];
      await wrappedTask();
      this.queue.shift();
      await new Promise((resolve) => setTimeout(resolve, this.delayBetweenTasksMs));
    }
    this.running = false;
  }
}
