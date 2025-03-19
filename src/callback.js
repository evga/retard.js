import { assert } from "./util.js";
import { stack } from "./stack.js";
import { stats, Aggregate } from "./stats.js";

export const StopSymbol = Symbol("stop");

export class ReactiveCallback {
  /**
   *
   * @param {Function} callback
   */
  constructor(callback) {
    assert(callback instanceof Function);

    this.callback = callback;
    this.description = null;
    this.userCallback = null;
    this.stopped = false;

    if (stats._enabled) {
      this.stats_execute = new Aggregate();
      // @ts-ignore
      stats.callbacks.push(this);
    }
  }

  stop() {
    this.stopped = true;
  }

  execute(...args) {
    const t0 = performance.now();

    if (this.stopped) return StopSymbol;

    stack.push(this);
    try {
      return this.callback(...args);
    } finally {
      stack.pop();
      if (this.stats_execute) this.stats_execute.update(performance.now() - t0);
    }
  }
}
