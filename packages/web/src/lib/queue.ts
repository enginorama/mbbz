export class Queue {
  private queue: Array<() => Promise<unknown>> = [];

  public async add<T>(task: () => Promise<T>) {
    return new Promise<T>((resolve) => {
      this.queue.push(async () => {
        const result = await task();
        resolve(result);
        return result;
      });
      if (this.queue.length === 1) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    const task = this.queue[0];
    if (!task) {
      return;
    }
    await task();
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.queue.shift();
    this.processQueue();
  }
}
