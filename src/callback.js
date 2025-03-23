import { assert, Aggregate } from "./util.js";
import { stack } from "./stack.js";
import config from "./config.js";

export const StopSymbol = Symbol("stop");

/** @type {ReactiveCallback[]} */
export const callbacks = [];

export class ReactiveCallback {
  stopped = false;
  description;

  /**
   * 
   * @param {Function} callback 
   */
  constructor(callback) {
    assert(callback instanceof Function);

    this.callback = callback;

    if (config.enableStats) {
      this.executeStats = new Aggregate();
      callbacks.push(this);
    }
  }

  execute(...args) {
    if (this.stopped)
      return StopSymbol;

    const t0 = performance.now();
    
    stack.push(this);
    try {
      return this.callback(...args);
    } finally {
      stack.pop();
      if (this.executeStats)
        this.executeStats.update(performance.now() - t0);
    }
  }
}

export function newCallback(callback) {
  return new ReactiveCallback(callback);
}
