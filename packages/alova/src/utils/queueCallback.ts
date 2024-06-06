export type CallbackFn = () => void;

export class QueueCallback {
  private callbackQueue: CallbackFn[] = [];

  private isProcessing = false;

  constructor(protected limit?: number) {}

  /**
   * Adds a callback function to the callback queue.
   * If a limit is set and the queue has reached its limit, the callback will not be added.
   * @param callback The callback function to be added to the queue.
   */
  queueCallback(callback: CallbackFn) {
    if (this.limit && this.callbackQueue.length >= this.limit) {
      return;
    }
    this.callbackQueue.push(callback);

    if (!this.isProcessing) {
      this.tryRunQueueCallback();
    }
  }

  /**
   * Tries to run the callbacks in the queue.
   * If there are callbacks in the queue, it removes the first callback and executes it.
   * This method is called recursively until there are no more callbacks in the queue.
   */
  async tryRunQueueCallback() {
    this.isProcessing = true;
    while (this.callbackQueue.length > 0) {
      const cb = this.callbackQueue.shift();
      try {
        await cb?.();
      } catch (err) {
        // TODO: maybe better?
        console.error(err);
      }
    }
    this.isProcessing = false;
  }
}
