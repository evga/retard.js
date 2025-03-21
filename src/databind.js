import { ReactiveCallback } from "./callback.js";
import { ReactiveValue } from "./value.js";
import { assert } from "./util.js";

/**
 * @param {HTMLInputElement} el
 * @param {ReactiveValue} rv
 */
function bindInputElement(el, rv) {
  const desc = () => `${el.tagName}[type=${el.type}].bind(${rv})`;

  if (el.matches('[type="checkbox"]')) {
    const setRV = () => rv.write(el.checked);
    const setEL = () => (el.checked = rv.read());
    el.addEventListener("change", setRV);
    const cb = new ReactiveCallback(setEL);
    cb.description = desc;
    cb.execute();
  } else {
    const setRV = () => rv.write(el.value);
    const setEL = () => (el.value = rv.read());
    el.addEventListener("input", setRV);
    const cb = new ReactiveCallback(setEL);
    cb.description = desc;
    cb.execute();
  }
}

/**
 * @param {HTMLSelectElement} el
 * @param {ReactiveValue} rv
 */
function bindSelectElement(el, rv) {
  const desc = () => `${el.tagName}.bind(${rv})`;

  if (el.multiple) {
    // TODO
  } else {
    // single
    const setRV = () => rv.write(el.value);
    const setEL = () => (el.value = rv.read());
    el.addEventListener("change", setRV);
    const cb = new ReactiveCallback(setEL);
    cb.description = desc;
    cb.execute();
  }
}

/**
 * @param {Element} el
 * @param {ReactiveValue} rv
 */
export function bindElement(el, rv) {
  assert(el instanceof Element);
  assert(rv instanceof ReactiveValue);

  if (el instanceof HTMLInputElement) bindInputElement(el, rv);
  else if (el instanceof HTMLSelectElement) bindSelectElement(el, rv);
}
