import { StopSymbol } from "./callback.js";
import { stack } from "./stack.js";
import { Aggregate, assert } from "./util.js";
import config from "./config.js";

let NEXT_ID = 1;

/** @type {ReactiveValue[]} */
export const values = [];

export class ReactiveValue {
  #id = NEXT_ID++;

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

    if (config.enableLog)
      console.debug(`NEW RV#${this.#id} = ${this.value}`);
  }

  capture() {
    if (stack.current) {
      this.callbacks.add(stack.current);

      if (config.enableLog)
        console.debug(`CAPTURE RV#${this.#id} <<< ${stack.current}`);
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

    this.capture();
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
    if (config.enableLog)
      console.debug(`CHANGED ${this.value}`);

    const t0 = performance.now();
    const toRemove = [];

    for (const cb of this.callbacks) {
      if (cb.execute() === StopSymbol) {
        toRemove.push(cb);

      }
    }

    for (const cb of toRemove) {
      this.callbacks.delete(cb);
      if (config.enableLog)
        console.debug(`LETGO ${cb}`);
      //console.log("removed callback", cb);
    }

    if (this.changedStats) {
      this.changedStats.update(performance.now() - t0);
    }
  }

  map(cb) {
    this.capture();
    if (Array.isArray(this.value)) {
      return this.value.map(cb);
    } else {
      throw new Error("no array");
    }
  }

  toString() {
    this.capture();
    return String(this.value);
  }
}

export function newValue(initialValue) {
  return new ReactiveValue(initialValue);
}
