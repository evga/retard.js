import { ReactiveValue } from "./value.js";
import { assert } from "./util.js";
import { regAddCallback, regAddEvent } from "./registry.js";

/**
 * @param {HTMLInputElement} el
 * @param {ReactiveValue} rv
 */
function bindInputElement(el, rv) {
  const desc = `${el.tagName}[type=${el.type}].bind(${rv.value})`;

  if (el.matches('[type="checkbox"]')) {
    const setRV = () => rv.write(el.checked);
    const setEL = () => (el.checked = rv.read());
    regAddEvent(el, "change", setRV);
    const cb = regAddCallback(el, setEL);
    cb.desc = desc;
    cb.execute();
  } else {
    const setRV = () => rv.write(el.value);
    const setEL = () => (el.value = rv.read());
    regAddEvent(el, "input", setRV);
    const cb = regAddCallback(el, setEL);
    cb.desc = desc;
    cb.execute();
  }
}

/**
 * @param {HTMLSelectElement} el
 * @param {ReactiveValue} rv
 */
function bindSelectElement(el, rv) {
  const desc = `${el.tagName}.bind(${rv.value})`;

  if (el.multiple) {
    // TODO
  } else {
    // single
    const setRV = () => rv.write(el.value);
    const setEL = () => (el.value = rv.read());
    regAddEvent(el, "change", setRV);
    
    const cb = regAddCallback(el, setEL);
    cb.desc = desc;
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
