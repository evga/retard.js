import { assert, Aggregate } from "./util.js";
import { stack } from "./stack.js";
import config from "./config.js";

let NEXT_ID = 1;

export const StopSymbol = Symbol("stop");

///** @type {ReactiveCallback[]} */
//export const callbacks = [];

export class ReactiveCallback {
  #id = NEXT_ID++;
  desc;

  /**
   * @param {Function} fn 
   */
  constructor(fn) {
    assert(fn instanceof Function);

    this.fn = fn;

    if (config.enableStats) {
      this.executeStats = new Aggregate();
      //callbacks.push(this);
    }

    if (config.enableLog)
      console.debug(`NEW RC#${this.#id} = ${fn}`);
  }

  execute(...args) {
    if (typeof this.fn !== 'function')
      return StopSymbol;

    const t0 = performance.now();

    if (config.enableLog)
      console.debug(`EXECUTE ${this}`);

    stack.push(this);
    try {
      return this.fn(...args);
    } finally {
      stack.pop();
      if (this.executeStats)
        this.executeStats.update(performance.now() - t0);
    }
  }

  toString() {
    return `CB#${this.#id} ${this.desc ?? this.fn}`;
  }
}

export function newCallback(callback) {
  return new ReactiveCallback(callback);
}
