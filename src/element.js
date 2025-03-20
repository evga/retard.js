import { bindElement } from "./databind.js";
import { assert } from "./util.js";
import { ReactiveContainer } from "./container.js";

export class ReactiveElement {
  /**
   * @param {Element} element
   * @param {Array} childArray
   */
  constructor(element, childArray) {
    assert(element instanceof Element);
    assert(Array.isArray(childArray));
    
    this.container = new ReactiveContainer(element, childArray);
  }

  get element() {
    return this.container.element;
  }

  attr(obj) {
    assert(typeof obj === "object");

    for (const key in obj) {
      this.element.setAttribute(key, obj[key]);
    }

    return this;
  }

  bind(rv) {
    bindElement(this.element, rv);
    return this;
  }

  on(eventName, listener) {
    this.element.addEventListener(eventName, listener);
    return this;
  }

  onclick(listener) {
    this.on("click", listener);
    return this;
  }
}

/**
 * @param {string} tagName
 * @param {object} [attributes]
 */
export function newElement(tagName, attributes) {
  assert(typeof tagName === "string");
  assert(tagName.length > 0);

  return function (...childs) {
    const el = document.createElement(tagName);
    const result = new ReactiveElement(el, childs);
    if (attributes) result.attr(attributes);
    return result;
  };
}

/**
 * @param {Element} existingElement
 */
export function wrapElement(existingElement) {
  return (...childs) => new ReactiveElement(existingElement, childs);
}
