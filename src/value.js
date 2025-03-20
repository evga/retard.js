import { StopSymbol } from "./callback.js";
import { stack } from "./internal.js";
import { Aggregate } from "./util.js";
import config from "./config.js";

/** @type {ReactiveValue[]} */
export const values = [];

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

    if (config.enableStats) {
      this.readStats = new Aggregate();
      this.writeStats = new Aggregate();
      this.changedStats = new Aggregate();
      // @ts-ignore
      values.push(this);
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
    if (this.readStats) {
      this.readStats.counter();
    }

    this.#capture();
    return this.value;
  }

  write(newValue, { force = false } = {}) {
    if (stack.length > 0)
      throw new Error("write used inside a reactive callback");

    if (this.writeStats) {
      this.writeStats.counter();
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

    if (this.changedStats) {
      this.changedStats.update(performance.now() - t0);
    }
  }

  toString() {
    this.#capture();
    return String(this.value);
  }
}

export function newValue(initialValue) {
  return new ReactiveValue(initialValue);
}
