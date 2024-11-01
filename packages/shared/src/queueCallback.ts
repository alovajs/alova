export type CallbackFn = () => void | Promise<void>;

export class QueueCallback {
  private callbackQueue: CallbackFn[] = [];

  private isProcessing = false;

  private interrupt = false;

  /**
   * @param [limit=null] no limit if set undefined or null
   * @param [initialProcessing=false]
   */
  constructor(
    protected limit?: number | null,
    initialProcessing = false
  ) {
    this.isProcessing = initialProcessing;
  }

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
    this.interrupt = false;
    while (this.callbackQueue.length > 0 && !this.interrupt) {
      const cb = this.callbackQueue.shift();
      await cb?.();
    }
    this.isProcessing = false;
  }

  /**
   * If set the param `state` to true, it will interrupt the current job (whether or not the current processing state is true)
   * If set the param `state` to false, then get on with the rest of the work
   */
  setProcessingState(state: boolean) {
    this.isProcessing = state;
    if (!state) {
      this.tryRunQueueCallback();
    } else {
      this.interrupt = true;
    }
  }
}
