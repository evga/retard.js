import { StopSymbol } from "./callback.js";
import { stack } from "./stack.js";
import { Aggregate, stats } from "./stats.js";

export class ReactiveValue {
  /**
   *
   * @param {*} initialValue
   */
  constructor(initialValue) {
    this.initialValue = initialValue;
    this.value = initialValue;
    this.callbacks = new Set();
    this.resetBound = this.reset.bind(this);

    if (stats._enabled) {
      this.stats_reads = new Aggregate();
      this.stats_writes = new Aggregate();
      this.stats_changes = new Aggregate();
      // @ts-ignore
      stats.values.push(this);
    }
  }

  #capture() {
    const callback = stack.current;

    if (callback && !this.callbacks.has(callback)) {
      this.callbacks.add(callback);
    }
  }

  reset() {
    this.value = this.initialValue;
    this.changed();
  }

  read() {
    if (this.stats_reads) {
      this.stats_reads.counter();
    }

    this.#capture();
    return this.value;
  }

  write(newValue, { force = false } = {}) {
    if (stack.length > 0)
      throw new Error("infinite loop");

    if (this.stats_writes) {
      this.stats_writes.counter();
    }

    if (this.value !== newValue || force) {
      this.value = newValue;
      this.changed();
    }

    return this.value;
  }

  changed() {
    const t0 = performance.now();
    const toRemove = [];

    for (const cb of this.callbacks) {
      if (cb.execute() === StopSymbol) toRemove.push(cb);
    }

    for (const cb of toRemove) {
      this.callbacks.delete(cb);
      console.log("removed callback", cb);
    }

    if (this.stats_changes) {
      this.stats_changes.update(performance.now() - t0);
    }
  }

  toString() {
    this.#capture();
    return String(this.value);
  }
}
