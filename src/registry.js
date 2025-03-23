// Global registry

import { ReactiveCallback } from "./callback";
import { assert } from "./util";

// [obj, name listener, options]
let events = [];

// [obj, ReactiveCallback]
let callbacks = [];

export function regEvents() {
  return events;
}

export function regCallbacks() {
  return callbacks;
}

/**
 * 
 * @param {EventTarget} obj 
 * @param {*} name 
 * @param {*} listener 
 * @param {*} [options]
 */
export function regAddEvent(obj, name, listener, options) {
  obj.addEventListener(name, listener, options);
  events.push([obj, name, listener, options]);
}

/**
 * 
 * @param {*} obj 
 * @param {Function} fn 
 * @returns 
 */
export function regAddCallback(obj, fn) {
  assert(fn instanceof Function);

  const cb = new ReactiveCallback(fn);
  callbacks.push([obj, cb]);
  return cb;
}


export function regDetach(obj) {
  for (const item of events) {
    if (item[0] === obj) {
      item[0].removeEventListener(item[1], item[2], item[3]);
    }
  }
  
  for (const item of callbacks) {
    if (item[0] === obj) {
      item[1].stopped = true;
      item[1].callback = null;
      item[1].description = null;
      item[1].userCallback = null;
    }
  }

  events = events.filter(v => v[0] !== obj);
  callbacks = callbacks.filter(v => v[0] !== obj);
}
