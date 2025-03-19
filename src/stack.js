import { assert } from "./util.js";
import { ReactiveCallback } from "./callback.js";

export class ReactiveStack {
  #stack = [];
  #balance = 0;

  constructor() { }

  /**
   *
   * @param {ReactiveCallback} callback
   */
  push(callback) {
    assert(callback instanceof ReactiveCallback);
    this.#balance++;
    this.#stack.push(callback);
  }

  /**
   *
   * @returns {ReactiveCallback}
   */
  pop() {
    assert(this.#balance - 1 >= 0, "unbalanced stack");

    this.#balance--;
    return this.#stack.pop();
  }

  get length() {
    return this.#stack.length;
  }

  /**
   * @returns {ReactiveCallback}
   */
  get current() {
    return this.#stack[this.#stack.length - 1];
  }
}

export const stack = new ReactiveStack();
